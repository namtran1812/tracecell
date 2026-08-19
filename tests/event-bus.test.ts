import assert from "node:assert/strict";
import test from "node:test";

import { TraceProcessor } from "../src/correlator/processor.js";

import { createEnvelope } from "../src/event-bus/envelope.js";
import { InMemoryEventBus } from "../src/event-bus/in-memory.js";

import { runSimulation } from "../src/simulators/run.js";

import { InMemoryTraceStore } from "../src/store/in-memory.js";

const context = {
  itemId: "ITEM-000001",
  traceId: "TRACE-000001",
  robotId: "ROBOT-017",
  workcellId: "CELL-04",
  containerId: "BIN-0291",
  startMs: Date.UTC(2026, 7, 19, 16, 0, 0)
};

test("processes asynchronously delivered events", async () => {
  const store = new InMemoryTraceStore();
  const processor = new TraceProcessor(store);

  const bus = new InMemoryEventBus({
    minDelayMs: 1,
    maxDelayMs: 15
  });

  bus.subscribe((event) => processor.process(event));

  const events = [...runSimulation(context)].reverse();

  await Promise.all(
    events.map((event) =>
      bus.publish(createEnvelope(event))
    )
  );

  const trace = await store.getTrace(context.traceId);

  assert.ok(trace);
  assert.equal(trace.status, "COMPLETED");
  assert.equal(trace.events.length, 10);
});

test("duplicate delivery is idempotent", async () => {
  const store = new InMemoryTraceStore();
  const processor = new TraceProcessor(store);

  const events = runSimulation(context);

  for (const event of events) {
    const envelope = createEnvelope(event);

    await processor.process(envelope);
    await processor.process(envelope);
  }

  const trace = await store.getTrace(context.traceId);

  assert.ok(trace);
  assert.equal(trace.events.length, 10);

  const eventIds = new Set(
    trace.events.map((event) => event.eventId)
  );

  assert.equal(eventIds.size, 10);
});

test("isolates concurrent item traces", async () => {
  const store = new InMemoryTraceStore();
  const processor = new TraceProcessor(store);

  const secondContext = {
    ...context,
    itemId: "ITEM-000002",
    traceId: "TRACE-000002",
    robotId: "ROBOT-009"
  };

  const events = [
    ...runSimulation(context),
    ...runSimulation(secondContext)
  ];

  await Promise.all(
    [...events]
      .reverse()
      .map((event) =>
        processor.process(createEnvelope(event))
      )
  );

  const first = await store.getTrace("TRACE-000001");
  const second = await store.getTrace("TRACE-000002");

  assert.ok(first);
  assert.ok(second);

  assert.equal(first.itemId, "ITEM-000001");
  assert.equal(second.itemId, "ITEM-000002");

  assert.equal(first.events.length, 10);
  assert.equal(second.events.length, 10);
});

test("event envelope resembles EventBridge semantics", () => {
  const event = runSimulation(context)[0];

  const envelope = createEnvelope(event);

  assert.equal(envelope.id, event.eventId);
  assert.equal(envelope.detail, event);
  assert.equal(envelope.detailType, "TraceCellEvent");
  assert.equal(envelope.source, "tracecell.vision");
});
