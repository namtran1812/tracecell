import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2
} from "aws-lambda";

import {
  DynamoTraceQueryStore,
  parseStatus,
  parseSubsystem
} from "./query/dynamo-query-store.js";

const tableName =
  process.env.TRACE_TABLE_NAME;

if (!tableName) {
  throw new Error(
    "TRACE_TABLE_NAME is required"
  );
}

const store =
  new DynamoTraceQueryStore(tableName);

function response(
  statusCode: number,
  body: unknown
): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      "content-type":
        "application/json",
      "access-control-allow-origin": "*"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  try {
    const params =
      event.queryStringParameters ?? {};

    const rawLimit = Number(
      params.limit ?? "20"
    );

    const limit =
      Number.isFinite(rawLimit) &&
      rawLimit > 0
        ? Math.min(rawLimit, 100)
        : 20;

    const subsystem =
      parseSubsystem(params.subsystem);

    if (
      params.subsystem &&
      !subsystem
    ) {
      return response(400, {
        error: "invalid subsystem"
      });
    }

    const status =
      parseStatus(params.status);

    if (
      params.status &&
      !status
    ) {
      return response(400, {
        error: "invalid status"
      });
    }

    const result = await store.query({
      itemId: params.itemId,
      robotId: params.robotId,
      workcellId: params.workcellId,
      subsystem,
      status,
      limit,
      cursor: params.cursor
    });

    return response(200, result);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message:
          "failed to query traces",
        error:
          error instanceof Error
            ? error.message
            : String(error)
      })
    );

    return response(500, {
      error:
        "internal server error"
    });
  }
}
