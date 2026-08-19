import type {
  ItemTrace
} from "../events/types.js";

export type FaultScenario =
  | "slow-stow"
  | "robot-failure"
  | "missing-inventory";

function cloneTrace(
  trace: ItemTrace
): ItemTrace {
  return JSON.parse(
    JSON.stringify(trace)
  ) as ItemTrace;
}

export function injectFault(
  source: ItemTrace,
  scenario: FaultScenario
): ItemTrace {
  const trace =
    cloneTrace(source);

  if (
    scenario ===
    "slow-stow"
  ) {
    const stowEvents =
      trace.events.filter(
        (event) =>
          event.subsystem ===
          "stow"
      );

    if (
      stowEvents.length === 0
    ) {
      throw new Error(
        "trace contains no stow events"
      );
    }

    const first =
      Date.parse(
        stowEvents[0]
          .timestamp
      );

    stowEvents.forEach(
      (event, index) => {
        event.timestamp =
          new Date(
            first +
              index *
                750
          ).toISOString();
      }
    );

    return trace;
  }

  if (
    scenario ===
    "robot-failure"
  ) {
    const robotEvent =
      trace.events.find(
        (event) =>
          event.subsystem ===
          "robot-controller"
      );

    if (!robotEvent) {
      throw new Error(
        "trace contains no robot-controller event"
      );
    }

    robotEvent.eventType =
      "ROBOT_MOTION_FAILED";

    robotEvent.metadata = {
      ...(robotEvent.metadata ??
        {}),

      faultCode:
        "MOTOR_STALL",

      injected: true
    };

    return trace;
  }

  trace.events =
    trace.events.filter(
      (event) =>
        event.subsystem !==
        "inventory"
    );

  return trace;
}
