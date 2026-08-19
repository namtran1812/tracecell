import type {
  ItemTrace
} from "../events/types.js";

export class MaterializedTraceStore {
  private readonly traces =
    new Map<string, ItemTrace>();

  constructor(
    traces: ItemTrace[]
  ) {
    for (const trace of traces) {
      this.traces.set(
        trace.traceId,
        trace
      );
    }
  }

  getTrace(
    traceId: string
  ): ItemTrace | undefined {
    return this.traces.get(
      traceId
    );
  }
}
