import type {
  SQSBatchResponse,
  SQSEvent
} from "aws-lambda";

import { TraceProcessor } from "../correlator/processor.js";
import { DynamoTraceStore } from "./dynamo-store.js";
import { parseSqsEvent } from "./sqs-adapter.js";

const tableName = process.env.TRACE_TABLE_NAME;

if (!tableName) {
  throw new Error("TRACE_TABLE_NAME is required");
}

const store = new DynamoTraceStore(tableName);
const processor = new TraceProcessor(store);

export async function handler(
  event: SQSEvent
): Promise<SQSBatchResponse> {
  const failures: SQSBatchResponse["batchItemFailures"] = [];

  for (const record of event.Records) {
    try {
      const parsed = parseSqsEvent({
        Records: [record]
      })[0];

      await processor.process(parsed.envelope);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "failed telemetry event",
          messageId: record.messageId,
          error:
            error instanceof Error
              ? error.message
              : String(error)
        })
      );

      failures.push({
        itemIdentifier: record.messageId
      });
    }
  }

  return {
    batchItemFailures: failures
  };
}
