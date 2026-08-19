import {
  FormEvent,
  useMemo,
  useState
} from "react";

import { fetchTrace, fetchTraces } from "./api";
import { EventTimeline } from "./components/EventTimeline";
import { TracePath } from "./components/TracePath";
import {
  TraceFilters,
  type Filters
} from "./components/TraceFilters";
import { TraceResults } from "./components/TraceResults";
import { RootCausePanel } from "./components/RootCausePanel";
import { DemoScenarioPicker } from "./components/DemoScenarioPicker";
import {
  demoScenarios,
  type DemoScenario
} from "./demo/scenarios";
import type { ItemTrace } from "./types";

function duration(trace: ItemTrace) {
  if (!trace.completedAt) {
    return "In progress";
  }

  const milliseconds =
    new Date(trace.completedAt).getTime() -
    new Date(trace.startedAt).getTime();

  return `${(
    milliseconds / 1000
  ).toFixed(3)} s`;
}

export default function App() {
  const [demoScenario, setDemoScenario] =
    useState<DemoScenario | null>(null);

  const [query, setQuery] =
    useState("TRACE-000001");

  const [trace, setTrace] =
    useState<ItemTrace | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const [filters, setFilters] =
    useState<Filters>({
      itemId: "",
      robotId: "",
      workcellId: "",
      subsystem: "",
      status: ""
    });

  const [results, setResults] =
    useState<ItemTrace[]>([]);

  const [cursor, setCursor] =
    useState<string | undefined>();

  const [queryLoading, setQueryLoading] =
    useState(false);

  const displayedTrace =
    demoScenario === null
      ? trace
      : demoScenarios[demoScenario];

  const details = useMemo(() => {
    if (!displayedTrace) {
      return null;
    }

    return {
      robotId:
        displayedTrace.events.find(
          (event) => event.robotId
        )?.robotId ?? "—",

      workcellId:
        displayedTrace.events.find(
          (event) => event.workcellId
        )?.workcellId ?? "—",

      containerId:
        displayedTrace.events.find(
          (event) => event.containerId
        )?.containerId ?? "—"
    };
  }, [displayedTrace]);

  async function applyFilters(
    append = false
  ) {
    setQueryLoading(true);
    setError(null);

    try {
      const response =
        await fetchTraces({
          ...filters,
          cursor:
            append
              ? cursor
              : undefined,
          limit: 20
        });

      setResults((current) =>
        append
          ? [
              ...current,
              ...response.traces
            ]
          : response.traces
      );

      setCursor(
        response.nextCursor
      );
    } catch (queryError) {
      setError(
        queryError instanceof Error
          ? queryError.message
          : "Unable to query traces"
      );
    } finally {
      setQueryLoading(false);
    }
  }

  function resetFilters() {
    setFilters({
      itemId: "",
      robotId: "",
      workcellId: "",
      subsystem: "",
      status: ""
    });

    setResults([]);
    setCursor(undefined);
  }

  async function search(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchTrace(
        query.trim()
      );

      setTrace(result);
    } catch (searchError) {
      setTrace(null);

      setError(
        searchError instanceof Error
          ? searchError.message
          : "Unable to retrieve trace"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {demoScenario === null && (
        <button
          type="button"
          className="launch-demo"
          onClick={() =>
            setDemoScenario("healthy")
          }
        >
          Launch local failure demo
        </button>
      )}
      <header className="topbar">
        <div>
          <span className="logo-mark">
            TC
          </span>

          <span className="logo">
            TraceCell
          </span>
        </div>

        <span className="live-indicator">
          <span />
          Observability
        </span>
      </header>

      <section className="hero">
        <div className="eyebrow">
          Robotic system investigation
        </div>

        <h1>
          Follow an item across the machine.
        </h1>

        <p>
          Correlate telemetry from independent
          robotic subsystems into one
          end-to-end execution trace.
        </p>

        <form
          className="search"
          onSubmit={search}
        >
          <input
            aria-label="Trace ID"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="TRACE-000001"
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Searching..."
              : "Investigate"}
          </button>
        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}
      </section>

      <section className="workspace">
        <TraceFilters
          filters={filters}
          onChange={setFilters}
          onApply={() =>
            void applyFilters(false)
          }
          onReset={resetFilters}
        />

        {results.length > 0 && (
          <TraceResults
            traces={results}
            loading={queryLoading}
            hasMore={Boolean(cursor)}
            onLoadMore={() =>
              void applyFilters(true)
            }
            onSelect={(selected) =>
              setTrace(selected)
            }
          />
        )}
      </section>

      {displayedTrace && details && (
        <section className="workspace">
          <div className="summary-card">
            <div>
              <div className="eyebrow">
                Item trace
              </div>

              <h2>{displayedTrace.itemId}</h2>

              <div className="trace-id">
                {displayedTrace.traceId}
              </div>
            </div>

            <div className="summary-metrics">
              <div>
                <span>Status</span>
                <strong
                  className={
                    displayedTrace.status ===
                    "COMPLETED"
                      ? "status completed"
                      : trace.status ===
                          "FAILED"
                        ? "status failed"
                        : "status"
                  }
                >
                  {displayedTrace.status}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {duration(displayedTrace)}
                </strong>
              </div>

              <div>
                <span>Events</span>
                <strong>
                  {displayedTrace.events.length}
                </strong>
              </div>
            </div>
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">
                  System path
                </div>

                <h2>
                  Cross-subsystem journey
                </h2>
              </div>
            </div>

            <TracePath trace={displayedTrace} />
          </section>

          <div className="detail-grid">
            <div className="detail-card">
              <span>Robot</span>
              <strong>
                {details.robotId}
              </strong>
            </div>

            <div className="detail-card">
              <span>Workcell</span>
              <strong>
                {details.workcellId}
              </strong>
            </div>

            <div className="detail-card">
              <span>Container</span>
              <strong>
                {details.containerId}
              </strong>
            </div>
          </div>

          {demoScenario !== null && (
            <DemoScenarioPicker
              active={demoScenario}
              onChange={setDemoScenario}
              onExit={() =>
                setDemoScenario(null)
              }
            />
          )}

          <RootCausePanel
            trace={displayedTrace}
          />

          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">
                  Correlated telemetry
                </div>

                <h2>
                  Event timeline
                </h2>
              </div>

              <span className="hint">
                Select an event for details
              </span>
            </div>

            <EventTimeline
              events={displayedTrace.events}
            />
          </section>
        </section>
      )}
    </main>
  );
}
