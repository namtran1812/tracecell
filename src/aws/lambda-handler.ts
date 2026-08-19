import type {
  SQSBatchResponse,
  SQSEvent
} from "aws-lambda";

import { ArchivingTraceProcessor } from "../correlator/archiving-processor.js";
import { S3RawEventArchive } from "../archive/s3-archive.js";
import { DynamoTraceStore } from "./dynamo-store.js";
import { parseSqsEvent } from "./sqs-adapter.js";

const tableName = process.env.TRACE_TABLE_NAME;
const archiveBucketName =
  process.env.RAW_EVENT_BUCKET_NAME;

if (!tableName) {
  throw new Error("TRACE_TABLE_NAME is required");
}

if (!archiveBucketName) {
  throw new Error("RAW_EVENT_BUCKET_NAME is required");
}

const store = new DynamoTraceStore(tableName);

const archive = new S3RawEventArchive(
  archiveBucketName
);

const processor = new ArchivingTraceProcessor(
  store,
  archive
);

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
