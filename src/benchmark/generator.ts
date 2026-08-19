import type {
  ItemTrace,
  TraceEvent
} from "../events/types.js";

import { correlateEvents } from "../correlator/correlate.js";
import { runSimulation } from "../simulators/run.js";

export interface GeneratedDataset {
  traces: ItemTrace[];
  events: TraceEvent[];
}

export function generateDataset(
  traceCount: number
): GeneratedDataset {
  const traces: ItemTrace[] = [];
  const events: TraceEvent[] = [];

  const baseTime = Date.UTC(
    2026,
    7,
    19,
    16,
    0,
    0
  );

  for (
    let index = 0;
    index < traceCount;
    index++
  ) {
    const itemNumber =
      String(index + 1).padStart(
        8,
        "0"
      );

    const robotNumber =
      String(index % 250).padStart(
        3,
        "0"
      );

    const cellNumber =
      String(index % 50).padStart(
        2,
        "0"
      );

    const binNumber =
      String(index % 5000).padStart(
        4,
        "0"
      );

    const context = {
      itemId: `ITEM-${itemNumber}`,
      traceId: `TRACE-${itemNumber}`,
      robotId: `ROBOT-${robotNumber}`,
      workcellId: `CELL-${cellNumber}`,
      containerId: `BIN-${binNumber}`,
      startMs:
        baseTime +
        index * 10
    };

    const traceEvents =
      runSimulation(context);

    events.push(
      ...traceEvents
    );

    traces.push(
      correlateEvents(
        traceEvents
      )
    );
  }

  return {
    traces,
    events
  };
}
