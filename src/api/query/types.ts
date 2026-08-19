import type { ItemTrace, Subsystem, TraceStatus } from "../../events/types.js";

export interface TraceQuery {
  itemId?: string;
  robotId?: string;
  workcellId?: string;
  subsystem?: Subsystem;
  status?: TraceStatus;
  limit: number;
  cursor?: string;
}

export interface TraceQueryResult {
  traces: ItemTrace[];
  nextCursor?: string;
}
