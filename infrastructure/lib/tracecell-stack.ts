import * as path from "node:path";

import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";

export class TraceCellStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const rawEventBucket = new s3.Bucket(
      this,
      "RawEventBucket",
      {
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess:
          s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: "archive-old-telemetry",
            enabled: true,
            transitions: [
              {
                storageClass:
                  s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter:
                  cdk.Duration.days(30)
              }
            ]
          }
        ]
      }
    );

    const traceTable = new dynamodb.Table(
      this,
      "TraceTable",
      {
        partitionKey: {
          name: "pk",
          type: dynamodb.AttributeType.STRING
        },
        sortKey: {
          name: "sk",
          type: dynamodb.AttributeType.STRING
        },
        billingMode:
          dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy:
          cdk.RemovalPolicy.DESTROY
      }
    );

    const deadLetterQueue =
      new sqs.Queue(
        this,
        "TelemetryDeadLetterQueue",
        {
          retentionPeriod:
            cdk.Duration.days(14)
        }
      );

    const telemetryQueue =
      new sqs.Queue(
        this,
        "TelemetryQueue",
        {
          visibilityTimeout:
            cdk.Duration.seconds(60),
          deadLetterQueue: {
            queue: deadLetterQueue,
            maxReceiveCount: 5
          }
        }
      );

    const eventBus =
      new events.EventBus(
        this,
        "TelemetryEventBus",
        {
          eventBusName:
            "tracecell-telemetry"
        }
      );

    const telemetryRule =
      new events.Rule(
        this,
        "TelemetryRule",
        {
          eventBus,
          eventPattern: {
            source: [
              "tracecell.vision",
              "tracecell.routing",
              "tracecell.robot-controller",
              "tracecell.stow",
              "tracecell.inventory"
            ],
            detailType: [
              "TraceCellEvent"
            ]
          }
        }
      );

    telemetryRule.addTarget(
      new targets.SqsQueue(
        telemetryQueue
      )
    );

    const processor =
      new lambdaNodejs.NodejsFunction(
        this,
        "TraceProcessorFunction",
        {
          runtime:
            lambda.Runtime.NODEJS_22_X,
          entry: path.join(
            process.cwd(),
            "../src/aws/lambda-handler.ts"
          ),
          projectRoot: path.join(
            process.cwd(),
            ".."
          ),
          depsLockFilePath: path.join(
            process.cwd(),
            "../package-lock.json"
          ),
          handler: "handler",
          timeout:
            cdk.Duration.seconds(30),
          memorySize: 512,
          environment: {
            TRACE_TABLE_NAME:
              traceTable.tableName,
            RAW_EVENT_BUCKET_NAME:
              rawEventBucket.bucketName
          },
          bundling: {
            minify: true,
            sourceMap: true,
            target: "node22"
          }
        }
      );

    traceTable.grantReadWriteData(
      processor
    );

    rawEventBucket.grantReadWrite(
      processor
    );

    processor.addEventSource(
      new lambdaEventSources.SqsEventSource(
        telemetryQueue,
        {
          batchSize: 10,
          reportBatchItemFailures: true
        }
      )
    );

    const traceApiFunction =
      new lambdaNodejs.NodejsFunction(
        this,
        "TraceApiFunction",
        {
          runtime:
            lambda.Runtime.NODEJS_22_X,
          entry: path.join(
            process.cwd(),
            "../src/api/get-trace-handler.ts"
          ),
          projectRoot: path.join(
            process.cwd(),
            ".."
          ),
          depsLockFilePath: path.join(
            process.cwd(),
            "../package-lock.json"
          ),
          handler: "handler",
          timeout:
            cdk.Duration.seconds(10),
          memorySize: 256,
          environment: {
            TRACE_TABLE_NAME:
              traceTable.tableName
          },
          bundling: {
            minify: true,
            sourceMap: true,
            target: "node22"
          }
        }
      );

    traceTable.grantReadData(
      traceApiFunction
    );

    const listTracesFunction =
      new lambdaNodejs.NodejsFunction(
        this,
        "ListTracesFunction",
        {
          runtime:
            lambda.Runtime.NODEJS_22_X,
          entry: path.join(
            process.cwd(),
            "../src/api/list-traces-handler.ts"
          ),
          projectRoot: path.join(
            process.cwd(),
            ".."
          ),
          depsLockFilePath: path.join(
            process.cwd(),
            "../package-lock.json"
          ),
          handler: "handler",
          timeout:
            cdk.Duration.seconds(10),
          memorySize: 256,
          environment: {
            TRACE_TABLE_NAME:
              traceTable.tableName
          },
          bundling: {
            minify: true,
            sourceMap: true,
            target: "node22"
          }
        }
      );

    traceTable.grantReadData(
      listTracesFunction
    );

    const rawTraceFunction =
      new lambdaNodejs.NodejsFunction(
        this,
        "RawTraceBenchmarkFunction",
        {
          runtime:
            lambda.Runtime.NODEJS_22_X,
          entry: path.join(
            process.cwd(),
            "../src/api/benchmark/get-raw-trace-handler.ts"
          ),
          projectRoot: path.join(
            process.cwd(),
            ".."
          ),
          depsLockFilePath: path.join(
            process.cwd(),
            "../package-lock.json"
          ),
          handler: "handler",
          timeout:
            cdk.Duration.seconds(10),
          memorySize: 256,
          environment: {
            RAW_EVENT_BUCKET_NAME:
              rawEventBucket.bucketName
          },
          bundling: {
            minify: true,
            sourceMap: true,
            target: "node22"
          }
        }
      );

    rawEventBucket.grantRead(
      rawTraceFunction
    );

    const traceApi =
      new apigwv2.HttpApi(
        this,
        "TraceApi",
        {
          corsPreflight: {
            allowOrigins: ["*"],
            allowHeaders: [
              "content-type"
            ],
            allowMethods: [
              apigwv2.CorsHttpMethod.GET
            ]
          }
        }
      );

    traceApi.addRoutes({
      path: "/traces/{traceId}",
      methods: [
        apigwv2.HttpMethod.GET
      ],
      integration:
        new integrations.HttpLambdaIntegration(
          "GetTraceIntegration",
          traceApiFunction
        )
    });

    traceApi.addRoutes({
      path: "/traces",
      methods: [
        apigwv2.HttpMethod.GET
      ],
      integration:
        new integrations.HttpLambdaIntegration(
          "ListTracesIntegration",
          listTracesFunction
        )
    });

    traceApi.addRoutes({
      path:
        "/benchmark/raw/{traceId}",
      methods: [
        apigwv2.HttpMethod.GET
      ],
      integration:
        new integrations.HttpLambdaIntegration(
          "GetRawTraceBenchmarkIntegration",
          rawTraceFunction
        )
    });

    new cdk.CfnOutput(
      this,
      "TraceApiUrl",
      {
        value:
          traceApi.apiEndpoint
      }
    );

    new cdk.CfnOutput(
      this,
      "TraceTableName",
      {
        value:
          traceTable.tableName
      }
    );

    new cdk.CfnOutput(
      this,
      "RawEventBucketName",
      {
        value:
          rawEventBucket.bucketName
      }
    );

    new cdk.CfnOutput(
      this,
      "TelemetryEventBusName",
      {
        value:
          eventBus.eventBusName
      }
    );

    new cdk.CfnOutput(
      this,
      "TelemetryQueueUrl",
      {
        value:
          telemetryQueue.queueUrl
      }
    );
  }
}
