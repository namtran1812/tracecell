import type { ItemTrace } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000";

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
