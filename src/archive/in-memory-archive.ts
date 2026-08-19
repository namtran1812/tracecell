import type { TraceEvent } from "../events/types.js";
import type { RawEventArchive } from "./types.js";

export class InMemoryRawEventArchive
  implements RawEventArchive
{
  private readonly events = new Map<string, TraceEvent>();

  async putEvent(event: TraceEvent): Promise<void> {
    /*
     * eventId is globally stable for a telemetry event.
     * Repeated at-least-once delivery therefore overwrites the
     * same logical raw event instead of duplicating it.
     */
    this.events.set(event.eventId, event);
  }

  async getEvents(traceId: string): Promise<TraceEvent[]> {
    return [...this.events.values()].filter(
      (event) => event.traceId === traceId
    );
  }
}
