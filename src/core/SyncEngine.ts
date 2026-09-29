import type { Operation } from "./Operation";
import type { Queue } from "./Queue";
import type { NetworkMonitor } from "../network/NetworkMonitor";

export type SyncHandler = (
  operation: Operation
) => Promise<void>;

export class SyncEngine {
  private isSyncing = false;

  constructor(
    private readonly queue: Queue,
    private readonly networkMonitor: NetworkMonitor,
    private readonly syncHandler: SyncHandler
  ) {}

  async sync(): Promise<void> {
    if (this.isSyncing) {
      return;
    }

    if (!this.networkMonitor.isOnline()) {
      return;
    }

    this.isSyncing = true;

    try {
      const operations = await this.queue.getAll();

      for (const operation of operations) {
        await this.syncHandler(operation);

        await this.queue.remove(operation.id);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  start(): () => void {
    return this.networkMonitor.onOnline(() => {
      void this.sync();
    });
  }
}