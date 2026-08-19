import { EventTypes } from "../events/event-types.js";
import { createEvent } from "../events/factory.js";
import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

export function simulateVision(ctx: SimulationContext): TraceEvent[] {
  return [
    createEvent({
      sequence: 1,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "vision",
      eventType: EventTypes.ITEM_DETECTED,
      timestampMs: ctx.startMs,
      workcellId: ctx.workcellId
    }),
    createEvent({
      sequence: 2,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "vision",
      eventType: EventTypes.CLASSIFICATION_COMPLETED,
      timestampMs: ctx.startMs + 42,
      workcellId: ctx.workcellId,
      durationMs: 42,
      metadata: {
        classification: "small-box",
        confidence: 0.97
      }
    })
  ];
}
