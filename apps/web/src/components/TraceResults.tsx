import type { ItemTrace } from "../types";

interface Props {
  traces: ItemTrace[];
  onSelect: (
    trace: ItemTrace
  ) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

function duration(
  trace: ItemTrace
) {
  if (!trace.completedAt) {
    return "—";
  }

  return `${
    new Date(
      trace.completedAt
    ).getTime() -
    new Date(
      trace.startedAt
    ).getTime()
  } ms`;
}

export function TraceResults({
  traces,
  onSelect,
  loading,
  hasMore,
  onLoadMore
}: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">
            Query results
          </div>

          <h2>
            Recent traces
          </h2>
        </div>

        <span className="hint">
          {traces.length} loaded
        </span>
      </div>

      <div className="results-table">
        {traces.map((trace) => (
          <button
            type="button"
            className="result-row"
            key={trace.traceId}
            onClick={() =>
              onSelect(trace)
            }
          >
            <span>
              <strong>
                {trace.itemId}
              </strong>

              <small>
                {trace.traceId}
              </small>
            </span>

            <span>
              {trace.status}
            </span>

            <span>
              {trace.events.length}
              {" events"}
            </span>

            <span>
              {duration(trace)}
            </span>
          </button>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          className="load-more"
          disabled={loading}
          onClick={onLoadMore}
        >
          {loading
            ? "Loading..."
            : "Load more"}
        </button>
      )}
    </section>
  );
}
