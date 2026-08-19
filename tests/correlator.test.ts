import assert from "node:assert/strict";
import test from "node:test";
import { correlateEvents } from "../src/correlator/correlate.js";
import { EventTypes } from "../src/events/event-types.js";
import { runSimulation } from "../src/simulators/run.js";

const context = {
  itemId: "ITEM-000001",
  traceId: "TRACE-000001",
  robotId: "ROBOT-017",
  workcellId: "CELL-04",
  containerId: "BIN-0291",
  startMs: Date.UTC(2026, 7, 19, 16, 0, 0)
};

test("correlates events into one completed item trace", () => {
  const trace = correlateEvents(runSimulation(context));

  assert.equal(trace.traceId, context.traceId);
  assert.equal(trace.itemId, context.itemId);
  assert.equal(trace.status, "COMPLETED");
  assert.equal(trace.events.length, 10);
  assert.equal(trace.events[0].eventType, EventTypes.ITEM_DETECTED);
  assert.equal(trace.events.at(-1)?.eventType, EventTypes.INVENTORY_UPDATED);
});

test("reconstructs time order from shuffled delivery", () => {
  const trace = correlateEvents([...runSimulation(context)].reverse());

  for (let i = 1; i < trace.events.length; i++) {
    const previous = new Date(trace.events[i - 1].timestamp).getTime();
    const current = new Date(trace.events[i].timestamp).getTime();
    assert.ok(previous <= current);
  }
});

test("rejects mixed trace IDs", () => {
  const events = runSimulation(context);

  events[5] = {
    ...events[5],
    traceId: "TRACE-DIFFERENT"
  };

  assert.throws(
    () => correlateEvents(events),
    /multiple trace IDs/
  );
});
