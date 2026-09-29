import { describe, expect, it } from "vitest";
import { Queue } from "../src/core/Queue";
import { MemoryStorage } from "../src/storage/MemoryStorage";

describe("Queue", () => {
  const createQueue = () => {
    const storage = new MemoryStorage();

    return new Queue(storage);
  };

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

  it("should add an operation", async () => {
    const queue = createQueue();

    await queue.add(createOperation("1"));

    expect(await queue.getSize()).toBe(1);
  });

  it("should return all operations", async () => {
    const queue = createQueue();

    await queue.add(createOperation("1"));
    await queue.add(createOperation("2"));

    const operations = await queue.getAll();

    expect(operations).toHaveLength(2);
  });

  it("should remove an operation", async () => {
    const queue = createQueue();

    await queue.add(createOperation("1"));
    await queue.remove("1");

    expect(await queue.getSize()).toBe(0);
  });

  it("should clear all operations", async () => {
    const queue = createQueue();

    await queue.add(createOperation("1"));
    await queue.add(createOperation("2"));

    await queue.clear();

    expect(await queue.getSize()).toBe(0);
  });
});