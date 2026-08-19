import { useState } from "react";

import type { TraceEvent } from "../types";

interface Props {
  events: TraceEvent[];
}

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString(
    undefined,
    {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3
    }
  );
}

function labelEvent(eventType: string) {
  return eventType
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

export function EventTimeline({
  events
}: Props) {
  const [selected, setSelected] =
    useState<TraceEvent | null>(null);

  return (
    <div className="timeline-layout">
      <div className="timeline">
        {events.map((event) => (
          <button
            type="button"
            className={
              selected?.eventId === event.eventId
                ? "timeline-row selected"
                : "timeline-row"
            }
            key={event.eventId}
            onClick={() => setSelected(event)}
          >
            <span className="timeline-time">
              {formatTime(event.timestamp)}
            </span>

            <span className="timeline-subsystem">
              {event.subsystem}
            </span>

            <span className="timeline-event">
              {labelEvent(event.eventType)}
            </span>

            <span className="timeline-duration">
              {event.durationMs !== undefined
                ? `${event.durationMs} ms`
                : ""}
            </span>
          </button>
        ))}
      </div>

      <aside className="event-detail">
        {selected ? (
          <>
            <div className="eyebrow">
              Event details
            </div>

            <h3>{labelEvent(selected.eventType)}</h3>

            <dl>
              <dt>Event ID</dt>
              <dd>{selected.eventId}</dd>

              <dt>Subsystem</dt>
              <dd>{selected.subsystem}</dd>

              <dt>Timestamp</dt>
              <dd>{selected.timestamp}</dd>

              {selected.durationMs !== undefined && (
                <>
                  <dt>Duration</dt>
                  <dd>
                    {selected.durationMs} ms
                  </dd>
                </>
              )}

              {selected.robotId && (
                <>
                  <dt>Robot</dt>
                  <dd>{selected.robotId}</dd>
                </>
              )}

              {selected.workcellId && (
                <>
                  <dt>Workcell</dt>
                  <dd>
                    {selected.workcellId}
                  </dd>
                </>
              )}

              {selected.containerId && (
                <>
                  <dt>Container</dt>
                  <dd>
                    {selected.containerId}
                  </dd>
                </>
              )}
            </dl>

            {selected.metadata && (
              <>
                <div className="eyebrow metadata-title">
                  Metadata
                </div>

                <pre>
                  {JSON.stringify(
                    selected.metadata,
                    null,
                    2
                  )}
                </pre>
              </>
            )}
          </>
        ) : (
          <div className="event-detail-empty">
            Select an event to inspect its
            correlated telemetry.
          </div>
        )}
      </aside>
    </div>
  );
}
