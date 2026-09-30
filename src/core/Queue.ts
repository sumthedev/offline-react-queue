import type { Operation } from "./Operation.js";
import type { StorageAdapter } from "../storage/StorageAdapter.js";

export class Queue {
  constructor(private readonly storage: StorageAdapter) {}

  async add<T>(operation: Operation<T>): Promise<void> {
    await this.storage.add(operation);
  }

  async getAll(): Promise<Operation[]> {
    return this.storage.getAll();
  }

  async getById(id: string): Promise<Operation | undefined> {
    return this.storage.getById(id);
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(id);
  }

  async update<T>(operation: Operation<T>): Promise<void> {
    await this.storage.update(operation);
  }

  async clear(): Promise<void> {
    await this.storage.clear();
  }

  async getSize(): Promise<number> {
    const operations = await this.storage.getAll();

    return operations.length;
  }
}