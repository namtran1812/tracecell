import type { ItemTrace, TraceEvent } from "../types";

export type DemoScenario =
  | "healthy"
  | "slow-stow"
  | "robot-failure";

const BASE_TIME = Date.parse("2026-08-19T16:00:00.000Z");

function timestamp(offsetMs: number): string {
  return new Date(BASE_TIME + offsetMs).toISOString();
}

function event(
  eventId: string,
  subsystem: string,
  eventType: string,
  offsetMs: number,
  durationMs?: number
): TraceEvent {
  return {
    eventId,
    traceId: "DEMO-TRACE-001",
    itemId: "DEMO-ITEM-001",
    subsystem,
    eventType,
    timestamp: timestamp(offsetMs),
    workcellId: "CELL-DEMO-01",
    ...(durationMs === undefined ? {} : { durationMs })
  };
}

function makeTrace(events: TraceEvent[]): ItemTrace {
  const ordered = [...events].sort(
    (a, b) =>
      Date.parse(a.timestamp) -
      Date.parse(b.timestamp)
  );

  return {
    traceId: "DEMO-TRACE-001",
    itemId: "DEMO-ITEM-001",
    status: "COMPLETED",
    startedAt: ordered[0].timestamp,
    completedAt: ordered[ordered.length - 1].timestamp,
    events: ordered
  };
}

const healthyEvents: TraceEvent[] = [
  event("DEMO-001", "vision", "ITEM_DETECTED", 0),
  event("DEMO-002", "vision", "CLASSIFICATION_COMPLETED", 45, 45),

  event("DEMO-003", "routing", "ROUTE_REQUESTED", 90),
  event("DEMO-004", "routing", "ROUTE_SELECTED", 160, 70),

  event("DEMO-005", "robot-controller", "MOVE_STARTED", 220),
  event("DEMO-006", "robot-controller", "MOVE_COMPLETED", 570, 350),

  event("DEMO-007", "stow", "STOW_STARTED", 620),
  event("DEMO-008", "stow", "STOW_COMPLETED", 910, 290)
];

const slowStowEvents: TraceEvent[] = [
  event("DEMO-001", "vision", "ITEM_DETECTED", 0),
  event("DEMO-002", "vision", "CLASSIFICATION_COMPLETED", 45, 45),

  event("DEMO-003", "routing", "ROUTE_REQUESTED", 90),
  event("DEMO-004", "routing", "ROUTE_SELECTED", 160, 70),

  event("DEMO-005", "robot-controller", "MOVE_STARTED", 220),
  event("DEMO-006", "robot-controller", "MOVE_COMPLETED", 570, 350),

  event("DEMO-007", "stow", "STOW_STARTED", 620),
  event("DEMO-008", "stow", "STOW_COMPLETED", 2120, 1500)
];

const robotFailureEvents: TraceEvent[] = [
  event("DEMO-001", "vision", "ITEM_DETECTED", 0),
  event("DEMO-002", "vision", "CLASSIFICATION_COMPLETED", 45, 45),

  event("DEMO-003", "routing", "ROUTE_REQUESTED", 90),
  event("DEMO-004", "routing", "ROUTE_SELECTED", 160, 70),

  event("DEMO-005", "robot-controller", "MOVE_STARTED", 220),
  event("DEMO-006", "robot-controller", "MOTION_FAILED", 480, 260)
];

export const demoScenarios: Record<DemoScenario, ItemTrace> = {
  healthy: makeTrace(healthyEvents),
  "slow-stow": makeTrace(slowStowEvents),
  "robot-failure": makeTrace(robotFailureEvents)
};

export const demoScenarioLabels: Record<DemoScenario, string> = {
  healthy: "Healthy",
  "slow-stow": "Slow stow",
  "robot-failure": "Robot failure"
};
