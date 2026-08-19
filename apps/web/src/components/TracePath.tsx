import type {
  ItemTrace,
  Subsystem
} from "../types";

const subsystems: Array<{
  id: Subsystem;
  label: string;
}> = [
  {
    id: "vision",
    label: "Vision"
  },
  {
    id: "routing",
    label: "Routing"
  },
  {
    id: "robot-controller",
    label: "Robot"
  },
  {
    id: "stow",
    label: "Stow"
  },
  {
    id: "inventory",
    label: "Inventory"
  }
];

interface Props {
  trace: ItemTrace;
}

export function TracePath({ trace }: Props) {
  const active = new Set(
    trace.events.map((event) => event.subsystem)
  );

  return (
    <div className="trace-path">
      {subsystems.map((subsystem, index) => (
        <div
          className="trace-path-segment"
          key={subsystem.id}
        >
          <div
            className={
              active.has(subsystem.id)
                ? "trace-node active"
                : "trace-node"
            }
          >
            <div className="trace-dot" />
            <span>{subsystem.label}</span>
          </div>

          {index < subsystems.length - 1 && (
            <div className="trace-line" />
          )}
        </div>
      ))}
    </div>
  );
}
