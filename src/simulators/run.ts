import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";
import { simulateVision } from "./vision.js";
import { simulateRouting } from "./routing.js";
import { simulateRobotController } from "./robot-controller.js";
import { simulateStow } from "./stow.js";
import { simulateInventory } from "./inventory.js";

export function runSimulation(ctx: SimulationContext): TraceEvent[] {
  return [
    ...simulateVision(ctx),
    ...simulateRouting(ctx),
    ...simulateRobotController(ctx),
    ...simulateStow(ctx),
    ...simulateInventory(ctx)
  ];
}
