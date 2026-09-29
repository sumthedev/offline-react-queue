import type { Operation } from "./Operation";
import type { Queue } from "./Queue";
import type { NetworkMonitor } from "../network/NetworkMonitor";

export type SyncHandler = (
  operation: Operation
) => Promise<void>;

export class SyncEngine {
  constructor(
    private readonly queue: Queue,
    private readonly networkMonitor: NetworkMonitor,
    private readonly syncHandler: SyncHandler
  ) {}

  async sync(): Promise<void> {
    if (!this.networkMonitor.isOnline()) {
      return;
    }

    const operations = await this.queue.getAll();

    for (const operation of operations) {
      await this.syncHandler(operation);

      await this.queue.remove(operation.id);
    }
  }

  start(): () => void {
    return this.networkMonitor.onOnline(() => {
      void this.sync();
    });
  }
}