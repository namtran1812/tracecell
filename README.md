# TraceCell

TraceCell is an open-source observability platform for distributed robotic systems.

It reconstructs an item's end-to-end lifecycle by correlating telemetry from independent robotic subsystems.

## Current subsystems

- Vision
- Routing
- Robot controller
- Stow
- Inventory

## Run

    npm install
    npm run build
    npm test
    npm run dev

## Target AWS stack

- React
- TypeScript
- AWS Lambda
- Amazon EventBridge
- Amazon SQS
- DynamoDB
- S3
- API Gateway
- CloudWatch
- OpenTelemetry
- AWS CDK

## Roadmap

1. Deterministic trace correlation
2. Asynchronous event delivery
3. EventBridge/SQS-compatible interfaces
4. Lambda correlation and enrichment
5. S3 raw telemetry storage
6. DynamoDB materialized traces
7. React investigation console
8. Dynamic server-side filtering
9. Reproducible performance benchmarks
10. AWS deployment and observability
