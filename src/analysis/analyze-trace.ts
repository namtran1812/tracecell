import type {
  TraceEvent
} from "../events/types.js";

import type {
  ItemTrace
} from "../events/types.js";

import type {
  SubsystemLatency,
  TraceAnalysis,
  TraceFinding
} from "./types.js";

const DEFAULT_SUBSYSTEM_SLO_MS =
  500;

const DEFAULT_TRACE_SLO_MS =
  3000;

function timestampMs(
  timestamp: string
): number {
  const value =
    Date.parse(timestamp);

  if (
    Number.isNaN(value)
  ) {
    throw new Error(
      `invalid timestamp: ${timestamp}`
    );
  }

  return value;
}

function calculateSubsystems(
  events: TraceEvent[]
): SubsystemLatency[] {
  const grouped =
    new Map<
      string,
      TraceEvent[]
    >();

  for (
    const event of events
  ) {
    const existing =
      grouped.get(
        event.subsystem
      ) ?? [];

    existing.push(event);

    grouped.set(
      event.subsystem,
      existing
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
            (left, right) =>
              timestampMs(
                left.timestamp
              ) -
              timestampMs(
                right.timestamp
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
      (left, right) =>
        right.latencyMs -
        left.latencyMs
    );
}

function findFailedEvents(
  events: TraceEvent[]
): TraceFinding[] {
  const findings:
    TraceFinding[] = [];

  for (
    const event of events
  ) {
    const normalized =
      event.eventType
        .toUpperCase();

    if (
      normalized.includes(
        "FAILED"
      ) ||
      normalized.includes(
        "ERROR"
      ) ||
      normalized.includes(
        "FAULT"
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

  return findings;
}

export function analyzeTrace(
  trace: ItemTrace,
  options?: {
    subsystemSloMs?: number;
    traceSloMs?: number;
  }
): TraceAnalysis {
  const subsystemSloMs =
    options
      ?.subsystemSloMs ??
    DEFAULT_SUBSYSTEM_SLO_MS;

  const traceSloMs =
    options
      ?.traceSloMs ??
    DEFAULT_TRACE_SLO_MS;

  const events =
    [...trace.events].sort(
      (left, right) =>
        timestampMs(
          left.timestamp
        ) -
        timestampMs(
          right.timestamp
        )
    );

  if (
    events.length === 0
  ) {
    return {
      traceId:
        trace.traceId,

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
            "trace contains no telemetry events"
        }
      ],

      trace
    };
  }

  const totalLatencyMs =
    timestampMs(
      events[
        events.length - 1
      ].timestamp
    ) -
    timestampMs(
      events[0].timestamp
    );

  const subsystems =
    calculateSubsystems(
      events
    );

  const findings:
    TraceFinding[] =
    findFailedEvents(events);

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
          `${subsystem.subsystem} exceeded its ${subsystemSloMs} ms latency SLO`
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
        `trace exceeded its ${traceSloMs} ms end-to-end SLO`
    });
  }

  const bottleneck =
    subsystems.length > 0
      ? subsystems[0]
      : undefined;

  return {
    traceId:
      trace.traceId,

    healthy:
      findings.length === 0,

    totalLatencyMs,

    bottleneck,

    subsystems,

    findings,

    trace
  };
}
