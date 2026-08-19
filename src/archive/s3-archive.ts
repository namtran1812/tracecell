import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

import type { TraceEvent } from "../events/types.js";
import type { RawEventArchive } from "./types.js";

export class S3RawEventArchive implements RawEventArchive {
  constructor(
    private readonly bucketName: string,
    private readonly client = new S3Client({})
  ) {}

  async putEvent(event: TraceEvent): Promise<void> {
    const timestamp = new Date(event.timestamp);

    const year = timestamp.getUTCFullYear();
    const month = String(
      timestamp.getUTCMonth() + 1
    ).padStart(2, "0");

    const day = String(
      timestamp.getUTCDate()
    ).padStart(2, "0");

    const key = [
      "events",
      `year=${year}`,
      `month=${month}`,
      `day=${day}`,
      `trace=${event.traceId}`,
      `${event.timestamp}-${event.eventId}.json`
    ].join("/");

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: JSON.stringify(event),
        ContentType: "application/json"
      })
    );
  }

  async getEvents(traceId: string): Promise<TraceEvent[]> {
    /*
     * This intentionally implements the slow historical path.
     *
     * The production investigation path will use DynamoDB materialized
     * traces. S3 exists as immutable source-of-truth telemetry that can
     * reconstruct historical state.
     *
     * A later analytics milestone can add a trace index or Athena for
     * efficient large-scale historical discovery.
     */
    let continuationToken: string | undefined;

    const events: TraceEvent[] = [];

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: "events/",
          ContinuationToken: continuationToken
        })
      );

      for (const object of response.Contents ?? []) {
        if (
          !object.Key ||
          !object.Key.includes(`trace=${traceId}/`)
        ) {
          continue;
        }

        const result = await this.client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: object.Key
          })
        );

        if (!result.Body) {
          continue;
        }

        const payload = await result.Body.transformToString();

        events.push(JSON.parse(payload) as TraceEvent);
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return events;
  }
}
