import { beforeEach, describe, expect, it, vi } from "vitest";
import { Queue } from "../src/core/Queue";
import { SyncEngine } from "../src/core/SyncEngine";
import { MemoryStorage } from "../src/storage/MemoryStorage";
import { NetworkMonitor } from "../src/network/NetworkMonitor";

describe("SyncEngine", () => {
  let queue: Queue;
  let networkMonitor: NetworkMonitor;

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
  });

  it("should sync queued operations when online", async () => {
    const syncHandler = vi.fn().mockResolvedValue(undefined);

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler
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
      syncHandler
    );

    await queue.add(createOperation("1"));

    vi.spyOn(networkMonitor, "isOnline").mockReturnValue(false);

    await engine.sync();

    expect(syncHandler).not.toHaveBeenCalled();
    expect(await queue.getSize()).toBe(1);
  });

  it("should keep the operation if syncing fails", async () => {
    const syncHandler = vi
      .fn()
      .mockRejectedValue(new Error("Sync failed"));

    const engine = new SyncEngine(
      queue,
      networkMonitor,
      syncHandler
    );

    await queue.add(createOperation("1"));

    await expect(engine.sync()).rejects.toThrow("Sync failed");

    expect(await queue.getSize()).toBe(1);
  });
  it("should sync when the browser comes back online", async () => {
  const syncHandler = vi.fn().mockResolvedValue(undefined);

  const engine = new SyncEngine(
    queue,
    networkMonitor,
    syncHandler
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
    syncHandler
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
});