# TraceCell

Distributed observability and failure-investigation platform for robotic systems.

TraceCell correlates telemetry emitted by independent robotic subsystems into end-to-end item traces, allowing engineers and operators to reconstruct an item's path through a robotic workflow, identify latency bottlenecks, and investigate failures.

## What TraceCell does

A robotic machine may contain several independently operating subsystems:

- vision
- routing
- robot control
- stow
- inventory

Each subsystem sees only part of an item's journey.

TraceCell links those independent telemetry streams through correlation identifiers and reconstructs a complete chronological execution trace.

Example:

    Vision
      |
      v
    Routing
      |
      v
    Robot Controller
      |
      v
    Stow
      |
      v
    Inventory

              |
              v

        Trace correlation

              |
              v

    ITEM-000001
    TRACE-000001
    COMPLETED
    10 correlated events

## Architecture


```mermaid
flowchart TD
    V[Vision] --> EB[Amazon EventBridge]
    R[Routing] --> EB
    RC[Robot Controller] --> EB
    S[Stow] --> EB
    I[Inventory] --> EB


    EB --> Q[Amazon SQS]
    Q --> P[AWS Lambda Processor]


    P --> S3[Amazon S3<br/>Raw Telemetry]
    P --> DB[Amazon DynamoDB<br/>Materialized Traces]


    DB --> API[API Gateway]
    API --> RL[Read Lambda]
    RL --> UI[React Investigation Console]


    S3 --> HR[Historical Reconstruction]
    HR --> UI

### Event ingestion

Subsystems emit telemetry containing:

    eventId
    traceId
    itemId
    subsystem
    eventType
    timestamp

Optional physical-system identifiers include:

    robotId
    workcellId
    containerId

The processing layer tolerates:

- out-of-order event delivery
- duplicate delivery
- concurrent traces
- at-least-once queue semantics

`eventId` is used as the idempotency key.

### Raw telemetry path

Raw telemetry is archived to S3 and can independently reconstruct historical traces.

This supports:

- replay
- debugging
- historical recovery
- materialized-state validation

### Materialized investigation path

DynamoDB stores complete materialized item traces for latency-sensitive operator queries.

The React investigation console retrieves these traces through API Gateway and Lambda.

## Investigation console

The React console supports:

- trace lookup
- item-path visualization
- chronological event timeline
- robot, workcell, and container context
- event metadata inspection
- fleet-level filtering
- pagination
- subsystem filtering
- failure investigation
- root-cause analysis
- local deterministic failure demos

## Root-cause analysis

TraceCell analyzes a correlated trace for:

- subsystem latency SLO violations
- end-to-end trace latency violations
- failed or fault events
- subsystem bottlenecks
- missing telemetry

Example investigation:

    Trace
    TRACE-00000417

    Status
    DEGRADED

    Bottleneck
    stow

    Observed latency
    1500 ms

    SLO
    500 ms

    Finding
    SUBSYSTEM_LATENCY

The local demo supports deterministic scenarios:

    Healthy
    Slow stow
    Robot failure

No AWS account is required to explore these scenarios.

## AWS benchmark

TraceCell was deployed to AWS in `us-east-1` and benchmarked using:

- 1,000 materialized traces
- 10,000 raw telemetry events
- 20 warm-up requests
- 250 measured requests per path

Two deployed end-to-end HTTP paths were compared.

### Materialized path

    client
      |
      v
    API Gateway
      |
      v
    Lambda
      |
      v
    DynamoDB
      |
      v
    ItemTrace

### Historical reconstruction path

    client
      |
      v
    API Gateway
      |
      v
    Lambda
      |
      v
    S3
      |
      v
    raw TraceEvent[]
      |
      v
    reconstruction
      |
      v
    ItemTrace

Measured results:

| Metric | DynamoDB materialized | S3 reconstruction | Improvement |
|---|---:|---:|---:|
| p50 | 59.16 ms | 87.04 ms | 32.0% |
| p95 | 129.63 ms | 168.59 ms | 23.1% |
| p99 | 149.00 ms | 184.66 ms | 19.3% |

The benchmark result is stored in:

    benchmarks/results/latest.json

TraceCell also includes a separate 1,000,000-event local benchmark harness for architecture experiments. The AWS measurements above are the numbers used for external performance claims.

## Local development

Requirements:

- Node.js 22+
- npm

Install:

    npm ci
    npm ci --prefix apps/web
    npm ci --prefix infrastructure

Build the core project:

    npm run build

Run all tests:

    npm test

Build the React console:

    npm run build:web

Build infrastructure:

    npm run build:infra

## Run the investigation console

    npm --prefix apps/web run dev

Then open the Vite URL printed in the terminal.

Use:

    Launch local failure demo

to explore the deterministic healthy, slow-stow, and robot-failure scenarios without AWS.

## Benchmarks

Quick local benchmark:

    npm run benchmark:quick

Full 1M-event local benchmark:

    npm run benchmark

Real AWS benchmarking requires a deployed TraceCell stack and configured AWS credentials.

## Tests

TraceCell currently covers:

- deterministic trace correlation
- out-of-order delivery
- duplicate/idempotent processing
- concurrent trace isolation
- EventBridge-style envelopes
- SQS adapters
- raw archive reconstruction
- DynamoDB query behavior
- pagination
- benchmark correctness
- root-cause analysis
- deterministic fault injection

Run:

    npm test

## Technology

Frontend:

- React
- TypeScript
- Vite

Backend:

- TypeScript
- AWS Lambda
- API Gateway

Event infrastructure:

- Amazon EventBridge
- Amazon SQS

Storage:

- Amazon DynamoDB
- Amazon S3

Infrastructure:

- AWS CDK

Observability and analysis:

- structured telemetry
- trace correlation
- SLO analysis
- deterministic fault injection
- root-cause investigation

## Project principles

TraceCell follows several design rules:

1. Robotic subsystems remain independently observable.
2. Cross-system relationships use explicit correlation identifiers.
3. Event processing must tolerate out-of-order and duplicate delivery.
4. Raw telemetry remains independently reconstructable.
5. Interactive queries use optimized materialized state.
6. Performance claims require reproducible benchmarks.
7. Core behavior remains locally testable without AWS.

## Repository structure

    apps/web/
        React investigation console

    src/events/
        telemetry contracts

    src/simulators/
        robotic subsystem simulators

    src/event-bus/
        asynchronous event abstraction

    src/correlator/
        trace correlation and processing

    src/archive/
        raw event storage

    src/aws/
        AWS adapters and Lambda handlers

    src/api/
        investigation APIs

    src/analysis/
        root-cause and SLO analysis

    src/benchmark/
        benchmark harness

    infrastructure/
        AWS CDK stack

    benchmarks/
        benchmark methodology and results

    tests/
        automated tests

## Status

TraceCell is feature-complete for the current project scope.

Current milestones:

    Cross-subsystem correlation        ✓
    Async event processing             ✓
    Duplicate/idempotent handling      ✓
    EventBridge + SQS + Lambda         ✓
    DynamoDB materialization           ✓
    S3 historical archive              ✓
    React investigation console        ✓
    Filtering and pagination           ✓
    Million-event benchmark            ✓
    Real AWS benchmark                 ✓
    Root-cause analysis                ✓
    Local failure demo                 ✓
    CI                                 ✓

## License

Apache-2.0
