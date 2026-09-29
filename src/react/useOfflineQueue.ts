import { useCallback, useEffect, useState } from "react";
import type { Operation } from "../core/Operation";
import type { Queue } from "../core/Queue";
import type { SyncEngine } from "../core/SyncEngine";
import type { NetworkMonitor } from "../network/NetworkMonitor";

interface UseOfflineQueueOptions {
  queue: Queue;
  syncEngine: SyncEngine;
  networkMonitor: NetworkMonitor;
}

export function useOfflineQueue({
  queue,
  syncEngine,
  networkMonitor
}: UseOfflineQueueOptions) {
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
      void refresh();
    });

    return unsubscribe;
  }, [networkMonitor, refresh]);

  return {
    operations,
    pendingCount: operations.length,
    add,
    sync
  };
}