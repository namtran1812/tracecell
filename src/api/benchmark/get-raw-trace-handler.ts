import {
  GetObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  performance
} from "node:perf_hooks";

import {
  correlateEvents
} from "../../correlator/correlate.js";

import type {
  TraceEvent
} from "../../events/types.js";

const bucketName =
  process.env.RAW_EVENT_BUCKET_NAME;

if (!bucketName) {
  throw new Error(
    "RAW_EVENT_BUCKET_NAME is required"
  );
}

const s3 = new S3Client({});

function response(
  statusCode: number,
  body: unknown,
  serverTimingMs?: number
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type":
        "application/json",
      "access-control-allow-origin":
        "*",
      ...(serverTimingMs === undefined
        ? {}
        : {
            "server-timing":
              `tracecell;dur=${serverTimingMs.toFixed(
                3
              )}`
          })
    },
    body: JSON.stringify(body)
  };
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const traceId =
    event.pathParameters
      ?.traceId
      ?.trim();

  if (!traceId) {
    return response(
      400,
      {
        error:
          "traceId is required"
      }
    );
  }

  const started =
    performance.now();

  try {
    const result =
      await s3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key:
            `benchmark/raw/${traceId}.json`
        })
      );

    if (!result.Body) {
      return response(
        404,
        {
          error:
            "raw trace not found",
          traceId
        }
      );
    }

    const payload =
      await result.Body.transformToString();

    const events =
      JSON.parse(
        payload
      ) as TraceEvent[];

    const trace =
      correlateEvents(events);

    const durationMs =
      performance.now() -
      started;

    return response(
      200,
      trace,
      durationMs
    );
  } catch (error) {
    const name =
      error instanceof Error
        ? error.name
        : "";

    if (
      name === "NoSuchKey"
    ) {
      return response(
        404,
        {
          error:
            "raw trace not found",
          traceId
        }
      );
    }

    console.error(
      JSON.stringify({
        level: "error",
        message:
          "failed raw trace reconstruction",
        traceId,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      })
    );

    return response(
      500,
      {
        error:
          "internal server error"
      }
    );
  }
}
