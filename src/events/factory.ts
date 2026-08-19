import type { Subsystem, TraceEvent } from "./types.js";

interface EventInput {
  sequence: number;
  traceId: string;
  itemId: string;
  subsystem: Subsystem;
  eventType: string;
  timestampMs: number;
  robotId?: string;
  workcellId?: string;
  containerId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export function createEvent(input: EventInput): TraceEvent {
  return {
    eventId: `${input.traceId}-${String(input.sequence).padStart(4, "0")}`,
    traceId: input.traceId,
    itemId: input.itemId,
    subsystem: input.subsystem,
    eventType: input.eventType,
    timestamp: new Date(input.timestampMs).toISOString(),
    robotId: input.robotId,
    workcellId: input.workcellId,
    containerId: input.containerId,
    durationMs: input.durationMs,
    metadata: input.metadata
  };
}
