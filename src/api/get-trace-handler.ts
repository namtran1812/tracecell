import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import { DynamoTraceStore } from "../aws/dynamo-store.js";

const tableName = process.env.TRACE_TABLE_NAME;

if (!tableName) {
  throw new Error("TRACE_TABLE_NAME is required");
}

const store = new DynamoTraceStore(tableName);

function response(
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const traceId =
    event.pathParameters?.traceId?.trim();

  if (!traceId) {
    return response(400, {
      error: "traceId is required"
    });
  }

  try {
    const trace = await store.getTrace(traceId);

    if (!trace) {
      return response(404, {
        error: "trace not found",
        traceId
      });
    }

    return response(200, trace);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "failed to retrieve trace",
        traceId,
        error:
          error instanceof Error
            ? error.message
            : String(error)
      })
    );

    return response(500, {
      error: "internal server error"
    });
  }
}
