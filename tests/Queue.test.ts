import { describe, expect, it } from "vitest";
import { Queue } from "../src/core/Queue";

describe("Queue", () => {
  it("should add an operation", () => {
    const queue = new Queue();

    queue.add({
      id: "1",
      type: "UPDATE_FILE",
      payload: {
        fileId: "file-1",
        content: "Hello"
      },
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    expect(queue.size).toBe(1);
  });

  it("should return all operations", () => {
    const queue = new Queue();

    queue.add({
      id: "1",
      type: "UPDATE_FILE",
      payload: {},
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    queue.add({
      id: "2",
      type: "DELETE_FILE",
      payload: {},
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    expect(queue.getAll()).toHaveLength(2);
  });

  it("should remove an operation", () => {
    const queue = new Queue();

    queue.add({
      id: "1",
      type: "UPDATE_FILE",
      payload: {},
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    queue.remove("1");

    expect(queue.size).toBe(0);
  });

  it("should clear all operations", () => {
    const queue = new Queue();

    queue.add({
      id: "1",
      type: "UPDATE_FILE",
      payload: {},
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    queue.add({
      id: "2",
      type: "DELETE_FILE",
      payload: {},
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });

    queue.clear();

    expect(queue.size).toBe(0);
  });
});