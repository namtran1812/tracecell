import { correlateEvents } from "./correlator/correlate.js";
import { runSimulation } from "./simulators/run.js";
import type { SimulationContext } from "./simulators/context.js";

const context: SimulationContext = {
  itemId: "ITEM-000001",
  traceId: "TRACE-000001",
  robotId: "ROBOT-017",
  workcellId: "CELL-04",
  containerId: "BIN-0291",
  startMs: Date.UTC(2026, 7, 19, 16, 0, 0)
};

const events = runSimulation(context);

const shuffled = [
  events[8],
  events[0],
  events[6],
  events[2],
  events[9],
  events[4],
  events[1],
  events[7],
  events[3],
  events[5]
];

const trace = correlateEvents(shuffled);

console.log(`Trace: ${trace.traceId}`);
console.log(`Item: ${trace.itemId}`);
console.log(`Status: ${trace.status}`);
console.log("");

for (const event of trace.events) {
  console.log(
    [
      event.timestamp,
      event.subsystem.padEnd(16),
      event.eventType.padEnd(28),
      event.robotId ?? "",
      event.containerId ?? ""
    ].join("  ")
  );
}
