import {
  DynamoDBClient,
  ScanCommand,
  type AttributeValue
} from "@aws-sdk/client-dynamodb";

import type {
  ItemTrace,
  Subsystem,
  TraceStatus
} from "../../events/types.js";

import type {
  TraceQuery,
  TraceQueryResult
} from "./types.js";

export class DynamoTraceQueryStore {
  constructor(
    private readonly tableName: string,
    private readonly client = new DynamoDBClient({})
  ) {}

  async query(
    query: TraceQuery
  ): Promise<TraceQueryResult> {
    let exclusiveStartKey:
      | Record<string, AttributeValue>
      | undefined;

    if (query.cursor) {
      try {
        exclusiveStartKey = JSON.parse(
          Buffer.from(
            query.cursor,
            "base64"
          ).toString("utf8")
        ) as Record<string, AttributeValue>;
      } catch {
        throw new Error("invalid cursor");
      }
    }

    const response = await this.client.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression:
          "#type = :traceType",
        ExpressionAttributeNames: {
          "#type": "type"
        },
        ExpressionAttributeValues: {
          ":traceType": { S: "TRACE" }
        },
        ExclusiveStartKey:
          exclusiveStartKey,
        Limit: Math.max(
          query.limit * 5,
          50
        )
      })
    );

    let traces = (response.Items ?? [])
      .map((item) => item.payload?.S)
      .filter(
        (payload): payload is string =>
          Boolean(payload)
      )
      .map(
        (payload) =>
          JSON.parse(payload) as ItemTrace
      );

    traces = traces.filter((trace) =>
      matches(trace, query)
    );

    traces.sort(
      (a, b) =>
        new Date(b.startedAt).getTime() -
        new Date(a.startedAt).getTime()
    );

    traces = traces.slice(0, query.limit);

    return {
      traces,
      nextCursor:
        response.LastEvaluatedKey
          ? Buffer.from(
              JSON.stringify(
                response.LastEvaluatedKey
              ),
              "utf8"
            ).toString("base64")
          : undefined
    };
  }
}

function matches(
  trace: ItemTrace,
  query: TraceQuery
): boolean {
  if (
    query.itemId &&
    trace.itemId !== query.itemId
  ) {
    return false;
  }

  if (
    query.status &&
    trace.status !== query.status
  ) {
    return false;
  }

  if (
    query.robotId &&
    !trace.events.some(
      (event) =>
        event.robotId === query.robotId
    )
  ) {
    return false;
  }

  if (
    query.workcellId &&
    !trace.events.some(
      (event) =>
        event.workcellId ===
        query.workcellId
    )
  ) {
    return false;
  }

  if (
    query.subsystem &&
    !trace.events.some(
      (event) =>
        event.subsystem ===
        query.subsystem
    )
  ) {
    return false;
  }

  return true;
}

export function parseSubsystem(
  value?: string
): Subsystem | undefined {
  if (!value) {
    return undefined;
  }

  const allowed: Subsystem[] = [
    "vision",
    "routing",
    "robot-controller",
    "stow",
    "inventory"
  ];

  return allowed.includes(
    value as Subsystem
  )
    ? (value as Subsystem)
    : undefined;
}

export function parseStatus(
  value?: string
): TraceStatus | undefined {
  if (!value) {
    return undefined;
  }

  const allowed: TraceStatus[] = [
    "IN_PROGRESS",
    "COMPLETED",
    "FAILED"
  ];

  return allowed.includes(
    value as TraceStatus
  )
    ? (value as TraceStatus)
    : undefined;
}
