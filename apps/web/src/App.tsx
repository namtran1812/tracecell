import {
  FormEvent,
  useMemo,
  useState
} from "react";

import { fetchTrace } from "./api";
import { EventTimeline } from "./components/EventTimeline";
import { TracePath } from "./components/TracePath";
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
  const [query, setQuery] =
    useState("TRACE-000001");

  const [trace, setTrace] =
    useState<ItemTrace | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const details = useMemo(() => {
    if (!trace) {
      return null;
    }

    return {
      robotId:
        trace.events.find(
          (event) => event.robotId
        )?.robotId ?? "—",

      workcellId:
        trace.events.find(
          (event) => event.workcellId
        )?.workcellId ?? "—",

      containerId:
        trace.events.find(
          (event) => event.containerId
        )?.containerId ?? "—"
    };
  }, [trace]);

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

      {trace && details && (
        <section className="workspace">
          <div className="summary-card">
            <div>
              <div className="eyebrow">
                Item trace
              </div>

              <h2>{trace.itemId}</h2>

              <div className="trace-id">
                {trace.traceId}
              </div>
            </div>

            <div className="summary-metrics">
              <div>
                <span>Status</span>
                <strong
                  className={
                    trace.status ===
                    "COMPLETED"
                      ? "status completed"
                      : trace.status ===
                          "FAILED"
                        ? "status failed"
                        : "status"
                  }
                >
                  {trace.status}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {duration(trace)}
                </strong>
              </div>

              <div>
                <span>Events</span>
                <strong>
                  {trace.events.length}
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

            <TracePath trace={trace} />
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
              events={trace.events}
            />
          </section>
        </section>
      )}
    </main>
  );
}
