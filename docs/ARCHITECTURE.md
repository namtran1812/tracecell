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
