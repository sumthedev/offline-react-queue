import { useCallback, useEffect, useRef, useState } from "react";
import type { Operation } from "../core/Operation";
import { Queue } from "../core/Queue";
import { SyncEngine } from "../core/SyncEngine";
import { RetryManager } from "../core/RetryManager";
import { IndexedDBStorage } from "../storage/IndexedDBStorage";
import type { StorageAdapter } from "../storage/StorageAdapter";
import { NetworkMonitor } from "../network/NetworkMonitor";

interface UseOfflineQueueOptions {
  syncHandler: (operation: Operation) => Promise<void>;
  storage?: StorageAdapter;
}

export function useOfflineQueue({
  syncHandler,
  storage
}: UseOfflineQueueOptions) {
  const queue = useRef(
    new Queue(storage ?? new IndexedDBStorage())
  ).current;

  const networkMonitor = useRef(new NetworkMonitor()).current;
  const retryManager = useRef(new RetryManager()).current;

  const syncEngine = useRef(
    new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    )
  ).current;

  const [operations, setOperations] = useState<Operation[]>([]);

  const refresh = useCallback(async () => {
    const allOperations = await queue.getAll();

    setOperations(allOperations);
  }, [queue]);

  const add = useCallback(
    async (operation: Operation) => {
      await queue.add(operation);

      await refresh();
    },
    [queue, refresh]
  );

  const sync = useCallback(async () => {
    await syncEngine.sync();

    await refresh();
  }, [syncEngine, refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const unsubscribe = networkMonitor.onOnline(() => {
      void sync();
    });

    return unsubscribe;
  }, [networkMonitor, sync]);

  return {
    operations,
    pendingCount: operations.length,
    add,
    sync
  };
}