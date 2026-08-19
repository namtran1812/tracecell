# Architecture

TraceCell models robotic subsystems as independent telemetry producers.

Every event contains stable correlation identifiers:

- eventId
- traceId
- itemId
- subsystem
- eventType
- timestamp

Optional identifiers include:

- robotId
- workcellId
- containerId

The correlator reconstructs a complete chronological item trace and must tolerate out-of-order event delivery.

Target architecture:

    Simulators
        |
    EventBridge
        |
       SQS
        |
      Lambda
      /    \
     S3   DynamoDB
             |
        API Gateway
             |
           React

S3 retains raw telemetry.

DynamoDB stores materialized item traces optimized for interactive investigation.

## Asynchronous delivery

TraceCell does not assume telemetry arrives in chronological order.

The local event bus intentionally introduces randomized delivery latency:

    subsystem
        |
        v
     EventBus
        |
        v
  TraceProcessor
        |
        +---- deduplicate by eventId
        |
        +---- load known trace events
        |
        +---- correlate chronologically
        |
        v
   materialized trace

This mirrors important properties of the future AWS architecture.

### At-least-once delivery

Queue-based distributed systems may deliver the same event more than once.

TraceCell therefore treats eventId as an idempotency key.

Repeated delivery does not create duplicate events inside the item trace.

### Multiple traces

Events belonging to different traceId values may be processed concurrently.

The TraceStore keeps their state isolated.

## EventBridge-compatible envelope

Local events are wrapped as:

    id
    source
    detailType
    time
    detail

This preserves a clean boundary between robotic subsystem events and the
transport mechanism.

A later milestone will replace the local EventBus implementation with
EventBridge and SQS while retaining the same application-level contracts.

## Raw telemetry archive

Milestone 4 introduces an immutable historical telemetry path.

Each event processed by Lambda is written to S3 before the materialized
DynamoDB trace is updated.

The architecture now has two representations of system state:

    EventBridge
        |
       SQS
        |
      Lambda
       /  \
      /    \
     v      v
    S3    DynamoDB
    |        |
    |        +--> optimized materialized trace
    |
    +--> raw source-of-truth telemetry

### S3 object layout

Raw telemetry is partitioned by event date and trace identifier:

    events/
      year=YYYY/
        month=MM/
          day=DD/
            trace=TRACE-ID/
              TIMESTAMP-EVENT-ID.json

The date partitions prepare the archive for future analytical workloads.

### Materialized path

DynamoDB remains the latency-sensitive investigation path.

A trace can be returned without reconstructing its complete event history
during every request.

### Historical path

The raw S3 archive can independently reconstruct an item trace.

This provides:

- historical recovery
- replay
- debugging
- validation of materialized state
- future offline analytics

### Benchmark motivation

A later milestone will benchmark two approaches:

    request
       |
       +--> S3 raw events --> reconstruction
       |
       +--> DynamoDB materialized trace

The measured latency difference between these paths will determine the
project's performance claims.

## Investigation API

Milestone 5 introduces the latency-sensitive read path used by the
investigation console.

    React
      |
      v
 API Gateway
      |
      v
 Read Lambda
      |
      v
  DynamoDB
      |
      v
 materialized trace

The read path intentionally avoids the raw S3 archive.

S3 remains the historical source of truth while DynamoDB serves
interactive operator queries.

Current endpoint:

    GET /traces/{traceId}

A successful response returns the complete materialized ItemTrace.

Future milestones will add:

- item-based lookup
- robot filtering
- workcell filtering
- subsystem filtering
- status filtering
- time ranges
- pagination
- near-real-time refresh

## React investigation console

The first frontend supports:

- trace lookup
- item and trace summary
- end-to-end subsystem path
- chronological event timeline
- robot/workcell/container context
- event-level metadata inspection

The UI is designed as an investigation surface rather than a generic
analytics dashboard.

## Fleet-level investigation

Milestone 6 expands TraceCell from single-trace lookup into fleet-level
investigation.

The API now supports:

    GET /traces

Query parameters:

    itemId
    robotId
    workcellId
    subsystem
    status
    limit
    cursor

The UI supports the same filters and paginated result loading.

### Pagination

The API returns an opaque cursor.

Clients do not depend on DynamoDB key structure.

This keeps the storage implementation private and allows the backend to
change without breaking the React client.

### Operational workflow

An operator can now:

1. filter by robot or workcell
2. isolate failed or in-progress traces
3. identify affected items
4. open a specific trace
5. inspect the correlated event timeline
6. inspect subsystem-specific metadata

This moves TraceCell from a single-item demo toward a real investigation
tool.

## Performance benchmark

Milestone 7 introduces reproducible investigation-query benchmarks.

Two data-access strategies are compared.

### Raw reconstruction

For each request:

    traceId
       |
       v
 raw telemetry collection
       |
       v
 scan matching events
       |
       v
 chronological correlation
       |
       v
 ItemTrace

This models a system that performs expensive reconstruction during every
interactive investigation.

### Materialized trace retrieval

For each request:

    traceId
       |
       v
 materialized trace index
       |
       v
 ItemTrace

This models TraceCell's DynamoDB investigation path.

### Default workload

The default local benchmark creates:

    100,000 traces
           x
        10 events
           =
    1,000,000 telemetry events

It then performs 2,000 deterministic trace lookups through each path.

The benchmark reports:

- p50 latency
- p95 latency
- p99 latency
- mean latency
- throughput
- percentage improvement

These numbers are intentionally measured rather than hard-coded.

Production AWS benchmarks will later include network latency, Lambda
execution, S3/DynamoDB access, and cold-start effects.
