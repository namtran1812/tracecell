import type { TraceEvent } from "../events/types.js";
import type { SimulationContext } from "./context.js";

import { runSimulation } from "./run.js";

export function runMultiItemSimulation(
  contexts: SimulationContext[]
): TraceEvent[] {
  return contexts.flatMap((context) =>
    runSimulation(context)
  );
}
