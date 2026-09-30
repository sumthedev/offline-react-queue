import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

import { MemoryStorage } from "../src/storage/MemoryStorage";
import { useOfflineQueue } from "../src/react/useOfflineQueue";
import type { Operation } from "../src/core/Operation";

describe("useOfflineQueue", () => {
    let storage: MemoryStorage;

    const createOperation = (id: string): Operation => ({
        id,
        type: "UPDATE_FILE",
        payload: {
            fileId: "file-1",
            content: "Hello"
        },
        createdAt: Date.now(),
        retryCount: 0,
        status: "pending"
    });

    beforeEach(() => {
        storage = new MemoryStorage();
    });

    it("should load queued operations", async () => {
        await storage.add(createOperation("1"));
        await storage.add(createOperation("2"));

        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler: async () => { }
            })
        );

        await waitFor(() => {
            expect(result.current.operations).toHaveLength(2);
        });

        expect(result.current.pendingCount).toBe(2);
    });

    it("should sync operations and refresh the queue", async () => {
        await storage.add(createOperation("1"));

        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler: async () => { }
            })
        );

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        await result.current.sync();

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(0);
        });

        expect(result.current.operations).toHaveLength(0);
    });

    it("should add an operation to the queue", async () => {
        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler: async () => { }
            })
        );

        const operation = createOperation("1");

        await result.current.add(operation);

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        expect(result.current.operations[0]).toEqual(operation);
    });

    it("should automatically sync when the browser comes back online", async () => {
        await storage.add(createOperation("1"));

        const syncHandler = async () => { };

        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler
            })
        );

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        window.dispatchEvent(new Event("online"));

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(0);
        });

        expect(result.current.operations).toHaveLength(0);
    });

    it("should automatically sync when the browser comes back online", async () => {
        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: true
        });

        await storage.add(createOperation("1"));

        const syncHandler = async () => { };

        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler
            })
        );

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        window.dispatchEvent(new Event("online"));

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(0);
        });

        expect(result.current.operations).toHaveLength(0);
    });
    it("should keep failed operations in the queue", async () => {
        await storage.add(createOperation("1"));

        const syncHandler = async () => {
            throw new Error("Sync failed");
        };

        const { result } = renderHook(() =>
            useOfflineQueue({
                storage,
                syncHandler
            })
        );

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        Object.defineProperty(navigator, "onLine", {
            configurable: true,
            value: true
        });

        await result.current.sync();

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        expect(result.current.operations[0]?.retryCount).toBe(1);
        expect(result.current.operations[0]?.status).toBe("pending");
    });

    it("should mark an operation as failed after maximum retries", async () => {
  await storage.add(createOperation("1"));

  const syncHandler = async () => {
    throw new Error("Sync failed");
  };

  const { result } = renderHook(() =>
    useOfflineQueue({
      storage,
      syncHandler
    })
  );

  await waitFor(() => {
    expect(result.current.pendingCount).toBe(1);
  });

  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value: true
  });

  await result.current.sync();
  await result.current.sync();
  await result.current.sync();

  await waitFor(() => {
    expect(result.current.operations[0]?.status).toBe("failed");
  });

  expect(result.current.operations[0]?.retryCount).toBe(3);
});
});