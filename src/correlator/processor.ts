import { correlateEvents } from "./correlate.js";

import type { EventEnvelope } from "../event-bus/types.js";
import type { TraceStore } from "../store/trace-store.js";

export class TraceProcessor {
  constructor(private readonly store: TraceStore) {}

  async process(envelope: EventEnvelope): Promise<void> {
    const inserted = await this.store.putEvent(envelope.detail);

    /*
     * Event buses and queues generally provide at-least-once delivery.
     * Repeated delivery of the same event therefore must not corrupt
     * a materialized trace.
     */
    if (!inserted) {
      return;
    }

    const events = await this.store.getEvents(
      envelope.detail.traceId
    );

    const trace = correlateEvents(events);

    await this.store.putTrace(trace);
  }
}
