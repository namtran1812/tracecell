export type TraceStatus =
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export type Subsystem =
  | "vision"
  | "routing"
  | "robot-controller"
  | "stow"
  | "inventory";

export interface TraceEvent {
  eventId: string;
  traceId: string;
  itemId: string;
  subsystem: Subsystem;
  eventType: string;
  timestamp: string;
  robotId?: string;
  workcellId?: string;
  containerId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

export interface ItemTrace {
  traceId: string;
  itemId: string;
  status: TraceStatus;
  startedAt: string;
  completedAt?: string;
  events: TraceEvent[];
}
