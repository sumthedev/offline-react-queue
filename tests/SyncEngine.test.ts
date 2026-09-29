import { beforeEach, describe, expect, it, vi } from "vitest";
import { Queue } from "../src/core/Queue";
import { SyncEngine } from "../src/core/SyncEngine";
import { MemoryStorage } from "../src/storage/MemoryStorage";
import { NetworkMonitor } from "../src/network/NetworkMonitor";
import { RetryManager } from "../src/core/RetryManager";

describe("SyncEngine", () => {
  let queue: Queue;
  let networkMonitor: NetworkMonitor;
  let retryManager: RetryManager;

  const createOperation = (id: string) => ({
    id,
    type: "UPDATE_FILE",
    payload: {
      fileId: "file-1",
      content: "Hello"
    },
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending" as const
  });

  beforeEach(() => {
    queue = new Queue(new MemoryStorage());
    networkMonitor = new NetworkMonitor();
    retryManager = new RetryManager();
  });

  it("should sync queued operations when online", async () => {
    const syncHandler = vi.fn().mockResolvedValue(undefined);

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    );

    await queue.add(createOperation("1"));
    await queue.add(createOperation("2"));

    await engine.sync();

    expect(syncHandler).toHaveBeenCalledTimes(2);
    expect(await queue.getSize()).toBe(0);
  });

  it("should not sync when offline", async () => {
    const syncHandler = vi.fn().mockResolvedValue(undefined);

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    );

    await queue.add(createOperation("1"));

    vi.spyOn(networkMonitor, "isOnline").mockReturnValue(false);

    await engine.sync();

    expect(syncHandler).not.toHaveBeenCalled();
    expect(await queue.getSize()).toBe(1);
  });

  it("should increase retry count if syncing fails", async () => {
    const syncHandler = vi
      .fn()
      .mockRejectedValue(new Error("Sync failed"));

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    );

    await queue.add(createOperation("1"));

    await engine.sync();

    const operation = await queue.getById("1");

    expect(operation?.retryCount).toBe(1);
    expect(operation?.status).toBe("pending");
  });

  it("should sync when the browser comes back online", async () => {
    const syncHandler = vi.fn().mockResolvedValue(undefined);

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    );

    await queue.add(createOperation("1"));

    vi.spyOn(networkMonitor, "isOnline").mockReturnValue(true);

    const stop = engine.start();

    window.dispatchEvent(new Event("online"));

    await vi.waitFor(() => {
      expect(syncHandler).toHaveBeenCalledTimes(1);
    });

    expect(await queue.getSize()).toBe(0);

    stop();
  });

  it("should not run multiple sync processes at the same time", async () => {
    let resolveSync: (() => void) | undefined;

    const syncHandler = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSync = resolve;
        })
    );

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler,
      retryManager
    );

    await queue.add(createOperation("1"));

    vi.spyOn(networkMonitor, "isOnline").mockReturnValue(true);

    const firstSync = engine.sync();
    const secondSync = engine.sync();

    await vi.waitFor(() => {
      expect(syncHandler).toHaveBeenCalledTimes(1);
    });

    expect(syncHandler).toHaveBeenCalledTimes(1);

    resolveSync?.();

    await firstSync;
    await secondSync;

    expect(await queue.getSize()).toBe(0);
  });
  it("should mark operation as failed after maximum retries", async () => {
  const syncHandler = vi
    .fn()
    .mockRejectedValue(new Error("Sync failed"));

  const retryManager = new RetryManager(3);

  const engine = new SyncEngine(
    queue,
    networkMonitor,
    syncHandler,
    retryManager
  );

  await queue.add(createOperation("1"));

  await engine.sync();
  await engine.sync();
  await engine.sync();

  const operation = await queue.getById("1");

  expect(operation?.retryCount).toBe(3);
  expect(operation?.status).toBe("failed");
});
});

