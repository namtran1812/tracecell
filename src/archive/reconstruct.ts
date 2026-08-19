import { correlateEvents } from "../correlator/correlate.js";

import type { ItemTrace } from "../events/types.js";
import type { RawEventArchive } from "./types.js";

export async function reconstructFromArchive(
  archive: RawEventArchive,
  traceId: string
): Promise<ItemTrace | undefined> {
  const events = await archive.getEvents(traceId);

  if (events.length === 0) {
    return undefined;
  }

  return correlateEvents(events);
}
