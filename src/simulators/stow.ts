import { EventTypes } from "../events/event-types.js";
import { createEvent } from "../events/factory.js";
import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

export function simulateStow(ctx: SimulationContext): TraceEvent[] {
  return [
    createEvent({
      sequence: 7,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "stow",
      eventType: EventTypes.STOW_STARTED,
      timestampMs: ctx.startMs + 1120,
      robotId: ctx.robotId,
      workcellId: ctx.workcellId,
      containerId: ctx.containerId
    }),
    createEvent({
      sequence: 8,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "stow",
      eventType: EventTypes.STOW_COMPLETED,
      timestampMs: ctx.startMs + 1800,
      robotId: ctx.robotId,
      workcellId: ctx.workcellId,
      containerId: ctx.containerId,
      durationMs: 680
    })
  ];
}
