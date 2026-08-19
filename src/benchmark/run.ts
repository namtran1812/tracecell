import {
  performance
} from "node:perf_hooks";

import {
  calculateLatencyStats
} from "./stats.js";

import {
  generateDataset
} from "./generator.js";

import {
  RawEventStore
} from "./raw-store.js";

import {
  MaterializedTraceStore
} from "./materialized-store.js";

import {
  correlateEvents
} from "../correlator/correlate.js";

interface BenchmarkResult {
  dataset: {
    traces: number;
    events: number;
  };

  requests: number;

  raw: {
    latency:
      ReturnType<
        typeof calculateLatencyStats
      >;
    throughputRequestsPerSecond:
      number;
  };

  materialized: {
    latency:
      ReturnType<
        typeof calculateLatencyStats
      >;
    throughputRequestsPerSecond:
      number;
  };

  improvement: {
    p50Percent: number;
    p95Percent: number;
    p99Percent: number;
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number
): number {
  if (!value) {
    return fallback;
  }

  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      `invalid positive integer: ${value}`
    );
  }

  return parsed;
}

function improvement(
  baseline: number,
  optimized: number
): number {
  if (baseline === 0) {
    return 0;
  }

  return (
    ((baseline - optimized) /
      baseline) *
    100
  );
}

const traceCount =
  parsePositiveInteger(
    process.env.TRACECELL_TRACE_COUNT,
    100_000
  );

const requestCount =
  parsePositiveInteger(
    process.env.TRACECELL_REQUEST_COUNT,
    2_000
  );

console.log(
  `Generating ${traceCount.toLocaleString()} traces...`
);

const generationStart =
  performance.now();

const dataset =
  generateDataset(traceCount);

const generationEnd =
  performance.now();

console.log(
  `Generated ${dataset.events.length.toLocaleString()} events in ${(
    generationEnd -
    generationStart
  ).toFixed(2)} ms`
);

const rawStore =
  new RawEventStore(
    dataset.events
  );

const materializedStore =
  new MaterializedTraceStore(
    dataset.traces
  );

const queryTraceIds =
  Array.from(
    {
      length: requestCount
    },
    (_, index) => {
      const traceIndex =
        (index * 7919) %
        traceCount;

      return dataset.traces[
        traceIndex
      ].traceId;
    }
  );

const rawLatencies: number[] =
  [];

const materializedLatencies:
  number[] = [];

const rawStart =
  performance.now();

for (
  const traceId
  of queryTraceIds
) {
  const start =
    performance.now();

  const events =
    rawStore.getTraceEvents(
      traceId
    );

  const trace =
    correlateEvents(events);

  if (
    trace.traceId !==
    traceId
  ) {
    throw new Error(
      "raw reconstruction returned incorrect trace"
    );
  }

  rawLatencies.push(
    performance.now() -
      start
  );
}

const rawEnd =
  performance.now();

const materializedStart =
  performance.now();

for (
  const traceId
  of queryTraceIds
) {
  const start =
    performance.now();

  const trace =
    materializedStore.getTrace(
      traceId
    );

  if (!trace) {
    throw new Error(
      `missing materialized trace ${traceId}`
    );
  }

  materializedLatencies.push(
    performance.now() -
      start
  );
}

const materializedEnd =
  performance.now();

const rawStats =
  calculateLatencyStats(
    rawLatencies
  );

const materializedStats =
  calculateLatencyStats(
    materializedLatencies
  );

const rawSeconds =
  (rawEnd -
    rawStart) /
  1000;

const materializedSeconds =
  (materializedEnd -
    materializedStart) /
  1000;

const result:
  BenchmarkResult = {
    dataset: {
      traces:
        dataset.traces.length,
      events:
        dataset.events.length
    },

    requests:
      requestCount,

    raw: {
      latency:
        rawStats,
      throughputRequestsPerSecond:
        requestCount /
        rawSeconds
    },

    materialized: {
      latency:
        materializedStats,
      throughputRequestsPerSecond:
        requestCount /
        materializedSeconds
    },

    improvement: {
      p50Percent:
        improvement(
          rawStats.p50Ms,
          materializedStats.p50Ms
        ),

      p95Percent:
        improvement(
          rawStats.p95Ms,
          materializedStats.p95Ms
        ),

      p99Percent:
        improvement(
          rawStats.p99Ms,
          materializedStats.p99Ms
        )
    }
  };

console.log("");
console.log(
  "===== TRACECELL BENCHMARK ====="
);

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);
