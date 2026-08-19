import type {
  ItemTrace,
  TraceEvent
} from "../events/types.js";

export interface TraceStore {
  putEvent(event: TraceEvent): Promise<boolean>;

  getEvents(traceId: string): Promise<TraceEvent[]>;

  putTrace(trace: ItemTrace): Promise<void>;

  getTrace(traceId: string): Promise<ItemTrace | undefined>;
}
