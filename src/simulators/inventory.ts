import { EventTypes } from "../events/event-types.js";
import { createEvent } from "../events/factory.js";
import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

export function simulateInventory(ctx: SimulationContext): TraceEvent[] {
  return [
    createEvent({
      sequence: 9,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "inventory",
      eventType: EventTypes.INVENTORY_UPDATE_STARTED,
      timestampMs: ctx.startMs + 1830,
      containerId: ctx.containerId
    }),
    createEvent({
      sequence: 10,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "inventory",
      eventType: EventTypes.INVENTORY_UPDATED,
      timestampMs: ctx.startMs + 1895,
      containerId: ctx.containerId,
      durationMs: 65
    })
  ];
}
