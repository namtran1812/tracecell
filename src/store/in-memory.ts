import type {
  ItemTrace,
  TraceEvent
} from "../events/types.js";

import type { TraceStore } from "./trace-store.js";

export class InMemoryTraceStore implements TraceStore {
  private readonly events = new Map<
    string,
    Map<string, TraceEvent>
  >();

  private readonly traces = new Map<string, ItemTrace>();

  async putEvent(event: TraceEvent): Promise<boolean> {
    let traceEvents = this.events.get(event.traceId);

    if (!traceEvents) {
      traceEvents = new Map<string, TraceEvent>();
      this.events.set(event.traceId, traceEvents);
    }

    if (traceEvents.has(event.eventId)) {
      return false;
    }

    traceEvents.set(event.eventId, event);

    return true;
  }

  async getEvents(traceId: string): Promise<TraceEvent[]> {
    return [...(this.events.get(traceId)?.values() ?? [])];
  }

  async putTrace(trace: ItemTrace): Promise<void> {
    this.traces.set(trace.traceId, trace);
  }

  async getTrace(
    traceId: string
  ): Promise<ItemTrace | undefined> {
    return this.traces.get(traceId);
  }
}
