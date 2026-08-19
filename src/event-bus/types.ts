import type { TraceEvent } from "../events/types.js";

export interface EventEnvelope {
  id: string;
  source: string;
  detailType: "TraceCellEvent";
  time: string;
  detail: TraceEvent;
}

export type EventHandler = (event: EventEnvelope) => Promise<void>;

export interface EventBus {
  publish(event: EventEnvelope): Promise<void>;
  subscribe(handler: EventHandler): void;
}
