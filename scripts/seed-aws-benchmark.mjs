import {
  DynamoDBClient,
  PutItemCommand
} from "@aws-sdk/client-dynamodb";

import {
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import {
  generateDataset
} from "../dist/src/benchmark/generator.js";

const tableName =
  process.env.TRACE_TABLE_NAME;

const bucketName =
  process.env.RAW_EVENT_BUCKET_NAME;

const traceCount =
  Number(
    process.env.TRACECELL_AWS_TRACE_COUNT ??
      "1000"
  );

const concurrency =
  Number(
    process.env.TRACECELL_SEED_CONCURRENCY ??
      "25"
  );

if (!tableName) {
  throw new Error(
    "TRACE_TABLE_NAME is required"
  );
}

if (!bucketName) {
  throw new Error(
    "RAW_EVENT_BUCKET_NAME is required"
  );
}

if (
  !Number.isInteger(traceCount) ||
  traceCount <= 0
) {
  throw new Error(
    "TRACECELL_AWS_TRACE_COUNT must be a positive integer"
  );
}

const dynamo =
  new DynamoDBClient({});

const s3 =
  new S3Client({});

console.log(
  `Generating ${traceCount.toLocaleString()} AWS benchmark traces...`
);

const dataset =
  generateDataset(traceCount);

let completed = 0;

async function writeTrace(index) {
  const trace =
    dataset.traces[index];

  const events =
    dataset.events.slice(
      index * 10,
      index * 10 + 10
    );

  await Promise.all([
    dynamo.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          pk: {
            S:
              `TRACE#${trace.traceId}`
          },
          sk: {
            S: "MATERIALIZED"
          },
          type: {
            S: "TRACE"
          },
          payload: {
            S:
              JSON.stringify(trace)
          }
        }
      })
    ),

    s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key:
          `benchmark/raw/${trace.traceId}.json`,
        Body:
          JSON.stringify(events),
        ContentType:
          "application/json",
        Metadata: {
          traceid:
            trace.traceId,
          itemid:
            trace.itemId
        }
      })
    )
  ]);

  completed++;

  if (
    completed % 100 === 0 ||
    completed === traceCount
  ) {
    console.log(
      `Seeded ${completed}/${traceCount}`
    );
  }
}

for (
  let offset = 0;
  offset < traceCount;
  offset += concurrency
) {
  const batch = [];

  for (
    let index = offset;
    index <
    Math.min(
      offset + concurrency,
      traceCount
    );
    index++
  ) {
    batch.push(
      writeTrace(index)
    );
  }

  await Promise.all(batch);
}

console.log("");
console.log(
  "AWS benchmark seed complete."
);

console.log(
  `Materialized traces: ${traceCount.toLocaleString()}`
);

console.log(
  `Raw telemetry events: ${(traceCount * 10).toLocaleString()}`
);
