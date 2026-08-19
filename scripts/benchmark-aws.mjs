import {
  mkdir,
  writeFile
} from "node:fs/promises";

import {
  performance
} from "node:perf_hooks";

const apiUrl =
  process.env.TRACE_API_URL
    ?.replace(/\/$/, "");

const traceCount =
  Number(
    process.env.TRACECELL_AWS_TRACE_COUNT ??
      "1000"
  );

const requestCount =
  Number(
    process.env.TRACECELL_AWS_REQUEST_COUNT ??
      "250"
  );

const warmupCount =
  Number(
    process.env.TRACECELL_AWS_WARMUP_COUNT ??
      "20"
  );

if (!apiUrl) {
  throw new Error(
    "TRACE_API_URL is required"
  );
}

function percentile(
  values,
  percentileValue
) {
  const sorted =
    [...values].sort(
      (a, b) => a - b
    );

  if (
    sorted.length === 0
  ) {
    return 0;
  }

  const index =
    Math.min(
      sorted.length - 1,
      Math.ceil(
        percentileValue /
          100 *
          sorted.length
      ) - 1
    );

  return sorted[index];
}

function stats(values) {
  const total =
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    );

  return {
    count:
      values.length,
    minMs:
      Math.min(...values),
    maxMs:
      Math.max(...values),
    meanMs:
      total /
      values.length,
    p50Ms:
      percentile(
        values,
        50
      ),
    p95Ms:
      percentile(
        values,
        95
      ),
    p99Ms:
      percentile(
        values,
        99
      )
  };
}

function improvement(
  baseline,
  optimized
) {
  if (
    baseline === 0
  ) {
    return 0;
  }

  return (
    (baseline -
      optimized) /
    baseline *
    100
  );
}

function traceIdFor(
  requestIndex
) {
  const index =
    (
      requestIndex *
      7919
    ) %
      traceCount +
    1;

  return (
    "TRACE-" +
    String(index).padStart(
      8,
      "0"
    )
  );
}

async function request(
  path
) {
  const started =
    performance.now();

  const response =
    await fetch(
      `${apiUrl}${path}`,
      {
        headers: {
          accept:
            "application/json"
        }
      }
    );

  const elapsed =
    performance.now() -
    started;

  if (
    !response.ok
  ) {
    const body =
      await response.text();

    throw new Error(
      `${response.status} ${path}: ${body}`
    );
  }

  await response.arrayBuffer();

  return elapsed;
}

async function warmup() {
  console.log(
    `Warming both paths with ${warmupCount} requests...`
  );

  for (
    let index = 0;
    index < warmupCount;
    index++
  ) {
    const traceId =
      traceIdFor(index);

    await request(
      `/traces/${traceId}`
    );

    await request(
      `/benchmark/raw/${traceId}`
    );
  }
}

async function measure(
  name,
  pathFactory
) {
  const latencies = [];

  console.log(
    `Measuring ${name}: ${requestCount} requests`
  );

  const suiteStarted =
    performance.now();

  for (
    let index = 0;
    index < requestCount;
    index++
  ) {
    const traceId =
      traceIdFor(
        index +
          warmupCount
      );

    const latency =
      await request(
        pathFactory(
          traceId
        )
      );

    latencies.push(
      latency
    );
  }

  const suiteElapsed =
    performance.now() -
    suiteStarted;

  return {
    latency:
      stats(latencies),

    throughputRequestsPerSecond:
      requestCount /
      (
        suiteElapsed /
        1000
      )
  };
}

await warmup();

const materialized =
  await measure(
    "DynamoDB materialized path",
    (traceId) =>
      `/traces/${traceId}`
  );

const raw =
  await measure(
    "S3 raw reconstruction path",
    (traceId) =>
      `/benchmark/raw/${traceId}`
  );

const result = {
  measuredAt:
    new Date().toISOString(),

  environment: {
    apiUrl,
    traceCount,
    rawEventCount:
      traceCount * 10,
    requestCount,
    warmupCount,
    node:
      process.version,
    platform:
      process.platform,
    arch:
      process.arch
  },

  materialized,

  raw,

  improvement: {
    p50Percent:
      improvement(
        raw.latency.p50Ms,
        materialized.latency.p50Ms
      ),

    p95Percent:
      improvement(
        raw.latency.p95Ms,
        materialized.latency.p95Ms
      ),

    p99Percent:
      improvement(
        raw.latency.p99Ms,
        materialized.latency.p99Ms
      )
  }
};

console.log("");
console.log(
  "===== REAL AWS BENCHMARK ====="
);

console.log(
  JSON.stringify(
    result,
    null,
    2
  )
);

await mkdir(
  "benchmarks/results",
  {
    recursive: true
  }
);

await writeFile(
  "benchmarks/results/latest.json",
  JSON.stringify(
    result,
    null,
    2
  ) + "\n"
);

console.log("");
console.log(
  "Saved benchmarks/results/latest.json"
);
