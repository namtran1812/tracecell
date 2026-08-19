import { createEnvelope } from "./event-bus/envelope.js";
import { InMemoryEventBus } from "./event-bus/in-memory.js";

import { TraceProcessor } from "./correlator/processor.js";

import { runMultiItemSimulation } from "./simulators/multi-item.js";
import type { SimulationContext } from "./simulators/context.js";

import { InMemoryTraceStore } from "./store/in-memory.js";

const contexts: SimulationContext[] = [
  {
    itemId: "ITEM-000001",
    traceId: "TRACE-000001",
    robotId: "ROBOT-017",
    workcellId: "CELL-04",
    containerId: "BIN-0291",
    startMs: Date.UTC(2026, 7, 19, 16, 0, 0)
  },
  {
    itemId: "ITEM-000002",
    traceId: "TRACE-000002",
    robotId: "ROBOT-021",
    workcellId: "CELL-07",
    containerId: "BIN-0418",
    startMs: Date.UTC(2026, 7, 19, 16, 0, 1)
  },
  {
    itemId: "ITEM-000003",
    traceId: "TRACE-000003",
    robotId: "ROBOT-004",
    workcellId: "CELL-02",
    containerId: "BIN-0105",
    startMs: Date.UTC(2026, 7, 19, 16, 0, 2)
  }
];

const store = new InMemoryTraceStore();

const processor = new TraceProcessor(store);

const bus = new InMemoryEventBus({
  minDelayMs: 1,
  maxDelayMs: 50
});

bus.subscribe((event) => processor.process(event));

const events = runMultiItemSimulation(contexts);

/*
 * Reverse producer order and allow randomized bus latency.
 * Arrival order should have no effect on trace correctness.
 */
const outOfOrderEvents = [...events].reverse();

await Promise.all(
  outOfOrderEvents.map((event) =>
    bus.publish(createEnvelope(event))
  )
);

/*
 * Deliberately redeliver events to simulate at-least-once
 * queue semantics.
 */
await Promise.all(
  events.slice(0, 5).map((event) =>
    bus.publish(createEnvelope(event))
  )
);

for (const context of contexts) {
  const trace = await store.getTrace(context.traceId);

  if (!trace) {
    throw new Error(`missing trace ${context.traceId}`);
  }

  console.log(
    [
      trace.traceId,
      trace.itemId,
      trace.status,
      `${trace.events.length} events`
    ].join("  ")
  );
}
