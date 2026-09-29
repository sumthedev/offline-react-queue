import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Queue } from "../src/core/Queue";
import { MemoryStorage } from "../src/storage/MemoryStorage";
import { NetworkMonitor } from "../src/network/NetworkMonitor";
import { SyncEngine } from "../src/core/SyncEngine";
import { RetryManager } from "../src/core/RetryManager";
import { useOfflineQueue } from "../src/react/useOfflineQueue";

describe("useOfflineQueue", () => {
    let queue: Queue;
    let syncEngine: SyncEngine;
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
        const retryManager = new RetryManager();

        syncEngine = new SyncEngine(
            queue,
            networkMonitor,
            async () => {},
            retryManager
        );
    });

    it("should load queued operations", async () => {
        await queue.add(createOperation("1"));
        await queue.add(createOperation("2"));

        const { result } = renderHook(() =>
            useOfflineQueue({
                queue,
                syncEngine,
                networkMonitor
            })
        );

        await waitFor(() => {
            expect(result.current.operations).toHaveLength(2);
        });

        expect(result.current.pendingCount).toBe(2);
    });

    it("should sync operations and refresh the queue", async () => {
        const operation = createOperation("1");

        await queue.add(operation);

        const { result } = renderHook(() =>
            useOfflineQueue({
                queue,
                syncEngine,
                networkMonitor
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
                queue,
                syncEngine,
                networkMonitor
            })
        );

        const operation = createOperation("1");

        await result.current.add(operation);

        await waitFor(() => {
            expect(result.current.pendingCount).toBe(1);
        });

        expect(result.current.operations[0]).toEqual(operation);
    });
    it("should refresh when the browser comes back online", async () => {
    const operation = createOperation("1");

    await queue.add(operation);

    const { result } = renderHook(() =>
        useOfflineQueue({
            queue,
            syncEngine,
            networkMonitor
        })
    );

    await waitFor(() => {
        expect(result.current.pendingCount).toBe(1);
    });

    // Simulate the operation being synced externally
    await queue.remove("1");

    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
        expect(result.current.pendingCount).toBe(0);
    });

    expect(result.current.operations).toHaveLength(0);
});
});