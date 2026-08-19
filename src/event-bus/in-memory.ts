import type {
  EventBus,
  EventEnvelope,
  EventHandler
} from "./types.js";

interface InMemoryEventBusOptions {
  minDelayMs?: number;
  maxDelayMs?: number;
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers: EventHandler[] = [];

  private readonly minDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(options: InMemoryEventBusOptions = {}) {
    this.minDelayMs = options.minDelayMs ?? 0;
    this.maxDelayMs = options.maxDelayMs ?? 30;
  }

  subscribe(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  async publish(event: EventEnvelope): Promise<void> {
    const delay =
      this.minDelayMs +
      Math.floor(
        Math.random() *
          (this.maxDelayMs - this.minDelayMs + 1)
      );

    await new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
    });

    await Promise.all(
      this.handlers.map((handler) => handler(event))
    );
  }
}
