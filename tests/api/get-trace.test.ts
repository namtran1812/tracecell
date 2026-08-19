import assert from "node:assert/strict";
import test from "node:test";

import { getTraceById } from "../../src/api/get-trace.js";
import { correlateEvents } from "../../src/correlator/correlate.js";
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

test("retrieves a materialized trace", async () => {
  const store = new InMemoryTraceStore();

  const trace = correlateEvents(
    runSimulation(context)
  );

  await store.putTrace(trace);

  const result = await getTraceById(
    store,
    context.traceId
  );

  assert.ok(result);
  assert.equal(result.traceId, context.traceId);
  assert.equal(result.status, "COMPLETED");
});

test("returns undefined for an unknown trace", async () => {
  const store = new InMemoryTraceStore();

  const result = await getTraceById(
    store,
    "TRACE-DOES-NOT-EXIST"
  );

  assert.equal(result, undefined);
});

test("rejects empty trace IDs", async () => {
  const store = new InMemoryTraceStore();

  await assert.rejects(
    () => getTraceById(store, "   "),
    /traceId is required/
  );
});
