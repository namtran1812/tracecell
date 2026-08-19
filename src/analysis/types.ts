import type {
  ItemTrace
} from "../events/types.js";

export type FailureSeverity =
  | "INFO"
  | "WARNING"
  | "CRITICAL";

export type FailureCategory =
  | "SUBSYSTEM_LATENCY"
  | "MISSING_EVENT"
  | "FAILED_EVENT"
  | "TRACE_TIMEOUT"
  | "OUT_OF_ORDER";

export interface TraceFinding {
  category: FailureCategory;
  severity: FailureSeverity;

  subsystem?: string;
  eventType?: string;

  message: string;

  observedMs?: number;
  thresholdMs?: number;
}

export interface SubsystemLatency {
  subsystem: string;

  eventCount: number;

  firstTimestamp: string;
  lastTimestamp: string;

  latencyMs: number;
}

export interface TraceAnalysis {
  traceId: string;

  healthy: boolean;

  totalLatencyMs: number;

  bottleneck?: SubsystemLatency;

  subsystems: SubsystemLatency[];

  findings: TraceFinding[];

  trace: ItemTrace;
}
