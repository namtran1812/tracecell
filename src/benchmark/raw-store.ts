import type {
  TraceEvent
} from "../events/types.js";

export class RawEventStore {
  constructor(
    private readonly events:
      TraceEvent[]
  ) {}

  getTraceEvents(
    traceId: string
  ): TraceEvent[] {
    /*
     * Intentionally represents the baseline
     * request-time reconstruction path.
     *
     * This implementation scans raw telemetry
     * for every investigation request.
     */
    return this.events.filter(
      (event) =>
        event.traceId ===
        traceId
    );
  }
}
