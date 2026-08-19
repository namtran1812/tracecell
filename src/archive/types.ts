import type { TraceEvent } from "../events/types.js";

export interface RawEventArchive {
  putEvent(event: TraceEvent): Promise<void>;
  getEvents(traceId: string): Promise<TraceEvent[]>;
}
