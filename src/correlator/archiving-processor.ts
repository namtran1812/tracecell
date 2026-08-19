import { correlateEvents } from "./correlate.js";

import type { RawEventArchive } from "../archive/types.js";
import type { EventEnvelope } from "../event-bus/types.js";
import type { TraceStore } from "../store/trace-store.js";

export class ArchivingTraceProcessor {
  constructor(
    private readonly store: TraceStore,
    private readonly archive: RawEventArchive
  ) {}

  async process(envelope: EventEnvelope): Promise<void> {
    /*
     * Archive first so that the raw event stream remains the durable
     * source of truth even if materialization fails afterward.
     */
    await this.archive.putEvent(envelope.detail);

    const inserted = await this.store.putEvent(
      envelope.detail
    );

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
