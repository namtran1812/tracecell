import { EventTypes } from "../events/event-types.js";
import { createEvent } from "../events/factory.js";
import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

export function simulateRobotController(ctx: SimulationContext): TraceEvent[] {
  return [
    createEvent({
      sequence: 5,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "robot-controller",
      eventType: EventTypes.ROBOT_DISPATCHED,
      timestampMs: ctx.startMs + 90,
      robotId: ctx.robotId,
      workcellId: ctx.workcellId
    }),
    createEvent({
      sequence: 6,
      traceId: ctx.traceId,
      itemId: ctx.itemId,
      subsystem: "robot-controller",
      eventType: EventTypes.ROBOT_ARRIVED,
      timestampMs: ctx.startMs + 1040,
      robotId: ctx.robotId,
      workcellId: ctx.workcellId,
      durationMs: 950
    })
  ];
}
