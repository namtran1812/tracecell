import {
  analyzeTrace
} from "../analysis";

import type {
  ItemTrace
} from "../types";

interface Props {
  trace: ItemTrace;
}

function formatMs(
  milliseconds: number
) {
  if (
    milliseconds >= 1000
  ) {
    return `${(
      milliseconds / 1000
    ).toFixed(2)} s`;
  }

  return `${milliseconds} ms`;
}

export function RootCausePanel({
  trace
}: Props) {
  const analysis =
    analyzeTrace(trace);

  const maxLatency =
    Math.max(
      ...analysis.subsystems.map(
        (subsystem) =>
          subsystem.latencyMs
      ),
      1
    );

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <div className="eyebrow">
            Root-cause analysis
          </div>

          <h2>
            System health
          </h2>
        </div>

        <span
          className={
            analysis.healthy
              ? "health-badge healthy"
              : "health-badge degraded"
          }
        >
          {analysis.healthy
            ? "Healthy"
            : "Degraded"}
        </span>
      </div>

      <div className="analysis-summary">
        <div>
          <span>
            End-to-end
          </span>

          <strong>
            {formatMs(
              analysis.totalLatencyMs
            )}
          </strong>
        </div>

        <div>
          <span>
            Findings
          </span>

          <strong>
            {
              analysis
                .findings
                .length
            }
          </strong>
        </div>

        <div>
          <span>
            Bottleneck
          </span>

          <strong>
            {analysis
              .bottleneck
              ?.subsystem ??
              "—"}
          </strong>
        </div>

        <div>
          <span>
            Bottleneck latency
          </span>

          <strong>
            {analysis
              .bottleneck
              ? formatMs(
                  analysis
                    .bottleneck
                    .latencyMs
                )
              : "—"}
          </strong>
        </div>
      </div>

      <div className="analysis-layout">
        <div>
          <div className="eyebrow analysis-heading">
            Subsystem latency
          </div>

          <div className="latency-list">
            {analysis.subsystems.map(
              (subsystem) => (
                <div
                  className="latency-row"
                  key={
                    subsystem.subsystem
                  }
                >
                  <div className="latency-label">
                    <strong>
                      {
                        subsystem.subsystem
                      }
                    </strong>

                    <span>
                      {formatMs(
                        subsystem.latencyMs
                      )}
                    </span>
                  </div>

                  <div className="latency-track">
                    <div
                      className="latency-fill"
                      style={{
                        width:
                          `${
                            (
                              subsystem
                                .latencyMs /
                              maxLatency
                            ) *
                            100
                          }%`
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div>
          <div className="eyebrow analysis-heading">
            Findings
          </div>

          {analysis.findings.length ===
          0 ? (
            <div className="healthy-state">
              No SLO or failure
              violations detected.
            </div>
          ) : (
            <div className="finding-list">
              {analysis.findings.map(
                (
                  finding,
                  index
                ) => (
                  <div
                    className={
                      finding.severity ===
                      "CRITICAL"
                        ? "finding critical"
                        : "finding warning"
                    }
                    key={`${finding.category}-${index}`}
                  >
                    <div className="finding-top">
                      <strong>
                        {
                          finding.category
                        }
                      </strong>

                      <span>
                        {
                          finding.severity
                        }
                      </span>
                    </div>

                    <p>
                      {
                        finding.message
                      }
                    </p>

                    {finding.observedMs !==
                      undefined &&
                      finding.thresholdMs !==
                        undefined && (
                        <small>
                          Observed{" "}
                          {formatMs(
                            finding.observedMs
                          )}
                          {" · "}
                          Threshold{" "}
                          {formatMs(
                            finding.thresholdMs
                          )}
                        </small>
                      )}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
