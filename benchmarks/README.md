# TraceCell Benchmarks

TraceCell benchmarks the cost of reconstructing an investigation trace from
raw telemetry versus reading a pre-materialized trace.

## Baseline

For every request:

1. scan raw telemetry
2. select matching trace events
3. sort events
4. reconstruct the ItemTrace

## Optimized path

For every request:

1. look up a pre-materialized ItemTrace by traceId

This models the architectural distinction between:

- historical/raw telemetry
- latency-sensitive operational investigation

## Default benchmark

The default benchmark generates:

- 100,000 traces
- 1,000,000 telemetry events
- 2,000 investigation queries

Run:

    npm run benchmark

## Custom scale

Example:

    TRACECELL_TRACE_COUNT=200000 \
    TRACECELL_REQUEST_COUNT=5000 \
    npm run benchmark

## Metrics

The benchmark reports:

- event count
- trace count
- request count
- p50 latency
- p95 latency
- p99 latency
- mean latency
- request throughput
- percentage latency improvement

Do not copy benchmark results between machines.

Resume or documentation claims should come from reproducible runs on a
specified environment.
