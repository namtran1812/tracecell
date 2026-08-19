export interface LatencyStats {
  count: number;
  minMs: number;
  maxMs: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
}

function percentile(
  values: number[],
  percentileValue: number
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  const index = Math.min(
    sorted.length - 1,
    Math.ceil(
      (percentileValue / 100) *
        sorted.length
    ) - 1
  );

  return sorted[index];
}

export function calculateLatencyStats(
  values: number[]
): LatencyStats {
  if (values.length === 0) {
    return {
      count: 0,
      minMs: 0,
      maxMs: 0,
      meanMs: 0,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0
    };
  }

  const total = values.reduce(
    (sum, value) => sum + value,
    0
  );

  return {
    count: values.length,
    minMs: Math.min(...values),
    maxMs: Math.max(...values),
    meanMs: total / values.length,
    p50Ms: percentile(values, 50),
    p95Ms: percentile(values, 95),
    p99Ms: percentile(values, 99)
  };
}
