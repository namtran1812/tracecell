import assert from "node:assert/strict";
import test from "node:test";

import {
  analyzeTrace
} from "../../src/analysis/analyze-trace.js";

import {
  injectFault
} from "../../src/analysis/fault-injection.js";

import {
  correlateEvents
} from "../../src/correlator/correlate.js";

import {
  generateDataset
} from "../../src/benchmark/generator.js";

function sampleTrace() {
  const dataset =
    generateDataset(1);

  return correlateEvents(
    dataset.events
  );
}

test(
  "healthy trace produces no findings",
  () => {
    const analysis =
      analyzeTrace(
        sampleTrace(),
        {
          subsystemSloMs:
            1000,
          traceSloMs:
            5000
        }
      );

    assert.equal(
      analysis.healthy,
      true
    );

    assert.equal(
      analysis.findings.length,
      0
    );

    assert.ok(
      analysis.totalLatencyMs >
        0
    );

    assert.ok(
      analysis.bottleneck
    );
  }
);

test(
  "identifies slow subsystem",
  () => {
    const trace =
      injectFault(
        sampleTrace(),
        "slow-stow"
      );

    const analysis =
      analyzeTrace(
        trace,
        {
          subsystemSloMs:
            500,
          traceSloMs:
            10000
        }
      );

    const finding =
      analysis.findings.find(
        (candidate) =>
          candidate.category ===
          "SUBSYSTEM_LATENCY"
      );

    assert.ok(finding);

    assert.equal(
      finding.subsystem,
      "stow"
    );
  }
);

test(
  "detects robot failure event",
  () => {
    const trace =
      injectFault(
        sampleTrace(),
        "robot-failure"
      );

    const analysis =
      analyzeTrace(trace);

    const failure =
      analysis.findings.find(
        (candidate) =>
          candidate.category ===
          "FAILED_EVENT"
      );

    assert.ok(failure);

    assert.equal(
      failure.subsystem,
      "robot-controller"
    );

    assert.equal(
      failure.severity,
      "CRITICAL"
    );
  }
);

test(
  "detects end-to-end SLO violation",
  () => {
    const analysis =
      analyzeTrace(
        sampleTrace(),
        {
          traceSloMs: 100
        }
      );

    assert.ok(
      analysis.findings.some(
        (finding) =>
          finding.category ===
          "TRACE_TIMEOUT"
      )
    );
  }
);

test(
  "fault injection does not mutate source trace",
  () => {
    const original =
      sampleTrace();

    const originalJson =
      JSON.stringify(
        original
      );

    injectFault(
      original,
      "robot-failure"
    );

    assert.equal(
      JSON.stringify(
        original
      ),
      originalJson
    );
  }
);
