import type {
  ItemTrace,
  TraceEvent
} from "./types";

export interface SubsystemLatency {
  subsystem: string;
  eventCount: number;
  firstTimestamp: string;
  lastTimestamp: string;
  latencyMs: number;
}

export interface TraceFinding {
  category:
    | "SUBSYSTEM_LATENCY"
    | "MISSING_EVENT"
    | "FAILED_EVENT"
    | "TRACE_TIMEOUT";

  severity:
    | "INFO"
    | "WARNING"
    | "CRITICAL";

  subsystem?: string;
  eventType?: string;

  message: string;

  observedMs?: number;
  thresholdMs?: number;
}

export interface TraceAnalysis {
  healthy: boolean;
  totalLatencyMs: number;
  bottleneck?: SubsystemLatency;
  subsystems: SubsystemLatency[];
  findings: TraceFinding[];
}

function timestampMs(
  timestamp: string
): number {
  return Date.parse(timestamp);
}

function subsystemLatencies(
  events: TraceEvent[]
): SubsystemLatency[] {
  const grouped =
    new Map<
      string,
      TraceEvent[]
    >();

  for (const event of events) {
    const current =
      grouped.get(
        event.subsystem
      ) ?? [];

    current.push(event);

    grouped.set(
      event.subsystem,
      current
    );
  }

  return Array.from(
    grouped.entries()
  )
    .map(
      ([
        subsystem,
        subsystemEvents
      ]) => {
        const ordered =
          [...subsystemEvents].sort(
            (a, b) =>
              timestampMs(
                a.timestamp
              ) -
              timestampMs(
                b.timestamp
              )
          );

        const first =
          ordered[0];

        const last =
          ordered[
            ordered.length - 1
          ];

        return {
          subsystem,
          eventCount:
            ordered.length,
          firstTimestamp:
            first.timestamp,
          lastTimestamp:
            last.timestamp,
          latencyMs:
            timestampMs(
              last.timestamp
            ) -
            timestampMs(
              first.timestamp
            )
        };
      }
    )
    .sort(
      (a, b) =>
        b.latencyMs -
        a.latencyMs
    );
}

export function analyzeTrace(
  trace: ItemTrace,
  subsystemSloMs = 500,
  traceSloMs = 3000
): TraceAnalysis {
  const ordered =
    [...trace.events].sort(
      (a, b) =>
        timestampMs(
          a.timestamp
        ) -
        timestampMs(
          b.timestamp
        )
    );

  if (
    ordered.length === 0
  ) {
    return {
      healthy: false,
      totalLatencyMs: 0,
      subsystems: [],
      findings: [
        {
          category:
            "MISSING_EVENT",
          severity:
            "CRITICAL",
          message:
            "Trace contains no telemetry events"
        }
      ]
    };
  }

  const totalLatencyMs =
    timestampMs(
      ordered[
        ordered.length - 1
      ].timestamp
    ) -
    timestampMs(
      ordered[0].timestamp
    );

  const subsystems =
    subsystemLatencies(
      ordered
    );

  const findings:
    TraceFinding[] = [];

  for (
    const event
      of ordered
  ) {
    const type =
      event.eventType
        .toUpperCase();

    if (
      type.includes(
        "FAILED"
      ) ||
      type.includes(
        "FAULT"
      ) ||
      type.includes(
        "ERROR"
      )
    ) {
      findings.push({
        category:
          "FAILED_EVENT",
        severity:
          "CRITICAL",
        subsystem:
          event.subsystem,
        eventType:
          event.eventType,
        message:
          `${event.subsystem} emitted ${event.eventType}`
      });
    }
  }

  for (
    const subsystem
      of subsystems
  ) {
    if (
      subsystem.latencyMs >
      subsystemSloMs
    ) {
      findings.push({
        category:
          "SUBSYSTEM_LATENCY",
        severity:
          "WARNING",
        subsystem:
          subsystem.subsystem,
        observedMs:
          subsystem.latencyMs,
        thresholdMs:
          subsystemSloMs,
        message:
          `${subsystem.subsystem} exceeded ${subsystemSloMs} ms latency SLO`
      });
    }
  }

  if (
    totalLatencyMs >
    traceSloMs
  ) {
    findings.push({
      category:
        "TRACE_TIMEOUT",
      severity:
        "CRITICAL",
      observedMs:
        totalLatencyMs,
      thresholdMs:
        traceSloMs,
      message:
        `End-to-end trace exceeded ${traceSloMs} ms SLO`
    });
  }

  return {
    healthy:
      findings.length === 0,
    totalLatencyMs,
    bottleneck:
      subsystems[0],
    subsystems,
    findings
  };
}
