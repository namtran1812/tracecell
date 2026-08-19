import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class TraceCellStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const traceTable = new dynamodb.Table(this, "TraceTable", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const deadLetterQueue = new sqs.Queue(
      this,
      "TelemetryDeadLetterQueue",
      {
        retentionPeriod: cdk.Duration.days(14)
      }
    );

    const telemetryQueue = new sqs.Queue(
      this,
      "TelemetryQueue",
      {
        visibilityTimeout: cdk.Duration.seconds(60),
        deadLetterQueue: {
          queue: deadLetterQueue,
          maxReceiveCount: 5
        }
      }
    );

    const eventBus = new events.EventBus(
      this,
      "TelemetryEventBus",
      {
        eventBusName: "tracecell-telemetry"
      }
    );

    const telemetryRule = new events.Rule(
      this,
      "TelemetryRule",
      {
        eventBus,
        eventPattern: {
          source: [{ prefix: "tracecell." }],
          detailType: ["TraceCellEvent"]
        }
      }
    );

    telemetryRule.addTarget(
      new targets.SqsQueue(telemetryQueue)
    );

    const processor = new lambda.Function(
      this,
      "TraceProcessorFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        handler: "lambda-handler.handler",
        code: lambda.Code.fromAsset("../dist/src/aws"),
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        environment: {
          TRACE_TABLE_NAME: traceTable.tableName
        },
        logRetention: logs.RetentionDays.ONE_WEEK
      }
    );

    traceTable.grantReadWriteData(processor);

    processor.addEventSource(
      new lambdaEventSources.SqsEventSource(
        telemetryQueue,
        {
          batchSize: 10,
          reportBatchItemFailures: true
        }
      )
    );
  }
}
