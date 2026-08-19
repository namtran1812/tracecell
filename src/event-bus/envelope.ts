import type { TraceEvent } from "../events/types.js";
import type { EventEnvelope } from "./types.js";

export function createEnvelope(event: TraceEvent): EventEnvelope {
  return {
    id: event.eventId,
    source: `tracecell.${event.subsystem}`,
    detailType: "TraceCellEvent",
    time: event.timestamp,
    detail: event
  };
}
