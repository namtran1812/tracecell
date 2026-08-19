import type { ItemTrace } from "../../events/types.js";
import type {
  TraceQuery,
  TraceQueryResult
} from "./types.js";

export function queryTracesInMemory(
  traces: ItemTrace[],
  query: TraceQuery
): TraceQueryResult {
  let filtered = [...traces];

  if (query.itemId) {
    filtered = filtered.filter(
      (trace) => trace.itemId === query.itemId
    );
  }

  if (query.status) {
    filtered = filtered.filter(
      (trace) => trace.status === query.status
    );
  }

  if (query.robotId) {
    filtered = filtered.filter((trace) =>
      trace.events.some(
        (event) => event.robotId === query.robotId
      )
    );
  }

  if (query.workcellId) {
    filtered = filtered.filter((trace) =>
      trace.events.some(
        (event) => event.workcellId === query.workcellId
      )
    );
  }

  if (query.subsystem) {
    filtered = filtered.filter((trace) =>
      trace.events.some(
        (event) => event.subsystem === query.subsystem
      )
    );
  }

  filtered.sort(
    (a, b) =>
      new Date(b.startedAt).getTime() -
      new Date(a.startedAt).getTime()
  );

  const offset = query.cursor
    ? Number(Buffer.from(query.cursor, "base64").toString("utf8"))
    : 0;

  const safeOffset = Number.isFinite(offset) ? offset : 0;

  const page = filtered.slice(
    safeOffset,
    safeOffset + query.limit
  );

  const nextOffset = safeOffset + page.length;

  return {
    traces: page,
    nextCursor:
      nextOffset < filtered.length
        ? Buffer.from(String(nextOffset), "utf8").toString("base64")
        : undefined
  };
}
