import assert from "node:assert/strict";
import test from "node:test";

import { correlateEvents } from "../../src/correlator/correlate.js";
import { runSimulation } from "../../src/simulators/run.js";
import { queryTracesInMemory } from "../../src/api/query/in-memory-query.js";

function makeTrace(
  index: number,
  overrides: Partial<{
    robotId: string;
    workcellId: string;
  }> = {}
) {
  const context = {
    itemId: `ITEM-${String(index).padStart(6, "0")}`,
    traceId: `TRACE-${String(index).padStart(6, "0")}`,
    robotId:
      overrides.robotId ??
      `ROBOT-${String(index).padStart(3, "0")}`,
    workcellId:
      overrides.workcellId ??
      `CELL-${String(index).padStart(2, "0")}`,
    containerId:
      `BIN-${String(index).padStart(4, "0")}`,
    startMs:
      Date.UTC(2026, 7, 19, 16, 0, 0) +
      index * 1000
  };

  return correlateEvents(
    runSimulation(context)
  );
}

test("filters by robot", () => {
  const traces = [
    makeTrace(1, {
      robotId: "ROBOT-TARGET"
    }),
    makeTrace(2),
    makeTrace(3)
  ];

  const result =
    queryTracesInMemory(
      traces,
      {
        robotId: "ROBOT-TARGET",
        limit: 20
      }
    );

  assert.equal(
    result.traces.length,
    1
  );

  assert.equal(
    result.traces[0].itemId,
    "ITEM-000001"
  );
});

test("filters by subsystem", () => {
  const traces = [
    makeTrace(1),
    makeTrace(2)
  ];

  const result =
    queryTracesInMemory(
      traces,
      {
        subsystem: "stow",
        limit: 20
      }
    );

  assert.equal(
    result.traces.length,
    2
  );
});

test("paginates query results", () => {
  const traces = Array.from(
    { length: 5 },
    (_, index) =>
      makeTrace(index + 1)
  );

  const first =
    queryTracesInMemory(
      traces,
      {
        limit: 2
      }
    );

  assert.equal(
    first.traces.length,
    2
  );

  assert.ok(first.nextCursor);

  const second =
    queryTracesInMemory(
      traces,
      {
        limit: 2,
        cursor: first.nextCursor
      }
    );

  assert.equal(
    second.traces.length,
    2
  );

  assert.notEqual(
    first.traces[0].traceId,
    second.traces[0].traceId
  );
});
