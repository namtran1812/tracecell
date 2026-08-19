import { EventTypes } from "../events/event-types.js";
import { createEvent } from "../events/factory.js";
import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

export function simulateRouting(ctx: SimulationContext): TraceEvent[] {
  return [
    createEvent({
      sequence: 3,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "routing",
      eventType: EventTypes.ROUTE_REQUESTED,
      timestampMs: ctx.startMs + 55
    }),
    createEvent({
      sequence: 4,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "routing",
      eventType: EventTypes.ROUTE_ASSIGNED,
      timestampMs: ctx.startMs + 71,
      robotId: ctx.robotId,
      workcellId: ctx.workcellId,
      containerId: ctx.containerId,
      durationMs: 16
    })
  ];
}
