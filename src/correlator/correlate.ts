import { EventTypes } from "../events/event-types.js";
import type { ItemTrace, TraceEvent } from "../events/types.js";

export function correlateEvents(events: TraceEvent[]): ItemTrace {
  if (events.length === 0) {
    throw new Error("cannot correlate an empty event collection");
  }

  const traceIds = new Set(events.map((event) => event.traceId));
  const itemIds = new Set(events.map((event) => event.itemId));

  if (traceIds.size !== 1) {
    throw new Error("events contain multiple trace IDs");
  }

  if (itemIds.size !== 1) {
    throw new Error("events contain multiple item IDs");
  }

  const ordered = [...events].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
  );

  const failed = ordered.some(
    (event) =>
      event.eventType === EventTypes.STOW_FAILED ||
      event.eventType === EventTypes.INVENTORY_MISMATCH
  );

  const completed = ordered.some(
    (event) => event.eventType === EventTypes.INVENTORY_UPDATED
  );

  const first = ordered[0];
  const last = ordered[ordered.length - 1];

  return {
    traceId: first.traceId,
    itemId: first.itemId,
    status: failed ? "FAILED" : completed ? "COMPLETED" : "IN_PROGRESS",
    startedAt: first.timestamp,
    completedAt: completed ? last.timestamp : undefined,
    events: ordered
  };
}
