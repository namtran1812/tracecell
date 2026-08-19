import {
  demoScenarioLabels,
  type DemoScenario
} from "../demo/scenarios";

interface Props {
  active: DemoScenario;
  onChange: (scenario: DemoScenario) => void;
  onExit: () => void;
}

const scenarios = Object.keys(
  demoScenarioLabels
) as DemoScenario[];

export function DemoScenarioPicker({
  active,
  onChange,
  onExit
}: Props) {
  return (
    <section className="demo-bar">
      <div>
        <div className="eyebrow">Local demo mode</div>

        <strong>
          Failure investigation scenarios
        </strong>
      </div>

      <div className="demo-controls">
        {scenarios.map((scenario) => (
          <button
            key={scenario}
            type="button"
            className={
              scenario === active
                ? "demo-button active"
                : "demo-button"
            }
            onClick={() => onChange(scenario)}
          >
            {demoScenarioLabels[scenario]}
          </button>
        ))}

        <button
          type="button"
          className="demo-button exit"
          onClick={onExit}
        >
          Exit demo
        </button>
      </div>
    </section>
  );
}
