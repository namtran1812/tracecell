import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateLatencyStats
} from "../src/benchmark/stats.js";

import {
  generateDataset
} from "../src/benchmark/generator.js";

import {
  RawEventStore
} from "../src/benchmark/raw-store.js";

import {
  MaterializedTraceStore
} from "../src/benchmark/materialized-store.js";

import {
  correlateEvents
} from "../src/correlator/correlate.js";

test(
  "calculates latency percentiles",
  () => {
    const stats =
      calculateLatencyStats([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ]);

    assert.equal(
      stats.count,
      10
    );

    assert.equal(
      stats.p50Ms,
      5
    );

    assert.equal(
      stats.p95Ms,
      10
    );

    assert.equal(
      stats.p99Ms,
      10
    );
  }
);

test(
  "generates deterministic large datasets",
  () => {
    const dataset =
      generateDataset(100);

    assert.equal(
      dataset.traces.length,
      100
    );

    assert.equal(
      dataset.events.length,
      1000
    );

    assert.equal(
      dataset.traces[0].traceId,
      "TRACE-00000001"
    );

    assert.equal(
      dataset.traces[99].traceId,
      "TRACE-00000100"
    );
  }
);

test(
  "raw and materialized paths return the same trace",
  () => {
    const dataset =
      generateDataset(25);

    const raw =
      new RawEventStore(
        dataset.events
      );

    const materialized =
      new MaterializedTraceStore(
        dataset.traces
      );

    const traceId =
      "TRACE-00000017";

    const rawTrace =
      correlateEvents(
        raw.getTraceEvents(
          traceId
        )
      );

    const optimizedTrace =
      materialized.getTrace(
        traceId
      );

    assert.ok(
      optimizedTrace
    );

    assert.deepEqual(
      rawTrace,
      optimizedTrace
    );
  }
);
