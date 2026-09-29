import { beforeEach, describe, expect, it } from "vitest";
import "fake-indexeddb/auto";

import { IndexedDBStorage } from "../src/storage/IndexedDBStorage";

describe("IndexedDBStorage", () => {
  let storage: IndexedDBStorage;

  beforeEach(() => {
    storage = new IndexedDBStorage(
      `test-db-${Date.now()}-${Math.random()}`
    );
  });

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

  it("should add and retrieve an operation", async () => {
    const operation = createOperation("1");

    await storage.add(operation);

    const result = await storage.getById("1");

    expect(result).toEqual(operation);
  });

  it("should return all operations", async () => {
    await storage.add(createOperation("1"));
    await storage.add(createOperation("2"));

    const operations = await storage.getAll();

    expect(operations).toHaveLength(2);
  });

  it("should update an operation", async () => {
    await storage.add(createOperation("1"));

    const updated = {
      ...createOperation("1"),
      status: "failed" as const,
      retryCount: 1
    };

    await storage.update(updated);

    const result = await storage.getById("1");

    expect(result).toEqual(updated);
  });

  it("should remove an operation", async () => {
    await storage.add(createOperation("1"));

    await storage.remove("1");

    const result = await storage.getById("1");

    expect(result).toBeUndefined();
  });

  it("should clear all operations", async () => {
    await storage.add(createOperation("1"));
    await storage.add(createOperation("2"));

    await storage.clear();

    const operations = await storage.getAll();

    expect(operations).toHaveLength(0);
  });
});