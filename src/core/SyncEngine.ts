import type { Operation } from "./Operation";
import type { Queue } from "./Queue";
import type { NetworkMonitor } from "../network/NetworkMonitor";
import type { RetryManager } from "./RetryManager";

export type SyncHandler = (
  operation: Operation
) => Promise<void>;

export class SyncEngine {
  private isSyncing = false;

  constructor(
    private readonly queue: Queue,
    private readonly networkMonitor: NetworkMonitor,
    private readonly syncHandler: SyncHandler,
    private readonly retryManager: RetryManager
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
        try {
          await this.syncHandler(operation);

          await this.queue.remove(operation.id);
        } catch (error) {
          const nextRetryCount = operation.retryCount + 1;

          if (this.retryManager.canRetry(nextRetryCount)) {
            await this.queue.update({
              ...operation,
              retryCount: nextRetryCount
            });
          } else {
            await this.queue.update({
              ...operation,
              retryCount: nextRetryCount,
              status: "failed"
            });
          }
        }
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