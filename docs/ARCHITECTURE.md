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
