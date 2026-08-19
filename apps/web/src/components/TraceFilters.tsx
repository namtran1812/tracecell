import type {
  Subsystem,
  TraceStatus
} from "../types";

export interface Filters {
  itemId: string;
  robotId: string;
  workcellId: string;
  subsystem: Subsystem | "";
  status: TraceStatus | "";
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  onReset: () => void;
}

export function TraceFilters({
  filters,
  onChange,
  onApply,
  onReset
}: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">
            Fleet investigation
          </div>

          <h2>
            Filter traces
          </h2>
        </div>
      </div>

      <div className="filter-grid">
        <input
          placeholder="ITEM-000001"
          value={filters.itemId}
          onChange={(event) =>
            onChange({
              ...filters,
              itemId:
                event.target.value
            })
          }
        />

        <input
          placeholder="ROBOT-017"
          value={filters.robotId}
          onChange={(event) =>
            onChange({
              ...filters,
              robotId:
                event.target.value
            })
          }
        />

        <input
          placeholder="CELL-04"
          value={
            filters.workcellId
          }
          onChange={(event) =>
            onChange({
              ...filters,
              workcellId:
                event.target.value
            })
          }
        />

        <select
          value={
            filters.subsystem
          }
          onChange={(event) =>
            onChange({
              ...filters,
              subsystem:
                event.target.value as
                  | Subsystem
                  | ""
            })
          }
        >
          <option value="">
            All subsystems
          </option>
          <option value="vision">
            Vision
          </option>
          <option value="routing">
            Routing
          </option>
          <option value="robot-controller">
            Robot controller
          </option>
          <option value="stow">
            Stow
          </option>
          <option value="inventory">
            Inventory
          </option>
        </select>

        <select
          value={filters.status}
          onChange={(event) =>
            onChange({
              ...filters,
              status:
                event.target.value as
                  | TraceStatus
                  | ""
            })
          }
        >
          <option value="">
            All statuses
          </option>
          <option value="COMPLETED">
            Completed
          </option>
          <option value="FAILED">
            Failed
          </option>
          <option value="IN_PROGRESS">
            In progress
          </option>
        </select>

        <div className="filter-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onReset}
          >
            Reset
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={onApply}
          >
            Apply filters
          </button>
        </div>
      </div>
    </section>
  );
}
