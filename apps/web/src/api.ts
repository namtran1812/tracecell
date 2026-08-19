import type {
  ItemTrace,
  Subsystem,
  TraceStatus
} from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000";

export interface TraceFilters {
  itemId?: string;
  robotId?: string;
  workcellId?: string;
  subsystem?: Subsystem | "";
  status?: TraceStatus | "";
  cursor?: string;
  limit?: number;
}

export interface TraceListResponse {
  traces: ItemTrace[];
  nextCursor?: string;
}

export async function fetchTrace(
  traceId: string
): Promise<ItemTrace> {
  const response = await fetch(
    `${API_BASE_URL}/traces/${encodeURIComponent(
      traceId
    )}`
  );

  if (response.status === 404) {
    throw new Error("Trace not found");
  }

  if (!response.ok) {
    throw new Error(
      `Request failed with ${response.status}`
    );
  }

  return response.json() as Promise<ItemTrace>;
}

export async function fetchTraces(
  filters: TraceFilters
): Promise<TraceListResponse> {
  const params =
    new URLSearchParams();

  if (filters.itemId) {
    params.set(
      "itemId",
      filters.itemId
    );
  }

  if (filters.robotId) {
    params.set(
      "robotId",
      filters.robotId
    );
  }

  if (filters.workcellId) {
    params.set(
      "workcellId",
      filters.workcellId
    );
  }

  if (filters.subsystem) {
    params.set(
      "subsystem",
      filters.subsystem
    );
  }

  if (filters.status) {
    params.set(
      "status",
      filters.status
    );
  }

  if (filters.cursor) {
    params.set(
      "cursor",
      filters.cursor
    );
  }

  params.set(
    "limit",
    String(filters.limit ?? 20)
  );

  const response = await fetch(
    `${API_BASE_URL}/traces?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(
      `Request failed with ${response.status}`
    );
  }

  return response.json() as Promise<TraceListResponse>;
}
