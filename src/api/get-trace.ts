import type { ItemTrace } from "../events/types.js";
import type { TraceStore } from "../store/trace-store.js";

export async function getTraceById(
  store: TraceStore,
  traceId: string
): Promise<ItemTrace | undefined> {
  if (!traceId.trim()) {
    throw new Error("traceId is required");
  }

  return store.getTrace(traceId);
}
