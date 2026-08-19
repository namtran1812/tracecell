import assert from "node:assert/strict";
import test from "node:test";

import { InMemoryRawEventArchive } from "../../src/archive/in-memory-archive.js";
import { reconstructFromArchive } from "../../src/archive/reconstruct.js";

import { ArchivingTraceProcessor } from "../../src/correlator/archiving-processor.js";

import { createEnvelope } from "../../src/event-bus/envelope.js";

import { runSimulation } from "../../src/simulators/run.js";

import { InMemoryTraceStore } from "../../src/store/in-memory.js";

const context = {
  itemId: "ITEM-000001",
  traceId: "TRACE-000001",
  robotId: "ROBOT-017",
  workcellId: "CELL-04",
  containerId: "BIN-0291",
  startMs: Date.UTC(2026, 7, 19, 16, 0, 0)
};

test("archives every raw telemetry event", async () => {
  const archive = new InMemoryRawEventArchive();

  const events = runSimulation(context);

  for (const event of events) {
    await archive.putEvent(event);
  }

  const archived = await archive.getEvents(
    context.traceId
  );

  assert.equal(archived.length, 10);
});

test("raw archive is idempotent under duplicate delivery", async () => {
  const archive = new InMemoryRawEventArchive();

  const event = runSimulation(context)[0];

  await archive.putEvent(event);
  await archive.putEvent(event);
  await archive.putEvent(event);

  const archived = await archive.getEvents(
    context.traceId
  );

  assert.equal(archived.length, 1);
});

test("reconstructs complete trace using only raw archive", async () => {
  const archive = new InMemoryRawEventArchive();

  const events = [
    ...runSimulation(context)
  ].reverse();

  for (const event of events) {
    await archive.putEvent(event);
  }

  const trace = await reconstructFromArchive(
    archive,
    context.traceId
  );

  assert.ok(trace);
  assert.equal(trace.status, "COMPLETED");
  assert.equal(trace.events.length, 10);
  assert.equal(trace.itemId, context.itemId);
});

test("processor maintains archive and materialized trace", async () => {
  const archive = new InMemoryRawEventArchive();
  const store = new InMemoryTraceStore();

  const processor = new ArchivingTraceProcessor(
    store,
    archive
  );

  const events = runSimulation(context);

  for (const event of events) {
    await processor.process(createEnvelope(event));
  }

  const materialized = await store.getTrace(
    context.traceId
  );

  const reconstructed = await reconstructFromArchive(
    archive,
    context.traceId
  );

  assert.ok(materialized);
  assert.ok(reconstructed);

  assert.equal(materialized.status, "COMPLETED");
  assert.equal(reconstructed.status, "COMPLETED");

  assert.deepEqual(
    materialized.events.map((event) => event.eventId),
    reconstructed.events.map((event) => event.eventId)
  );
});
