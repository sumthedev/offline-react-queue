import type { Operation } from "../core/Operation";
import type { StorageAdapter } from "./StorageAdapter";

export class MemoryStorage implements StorageAdapter {
  private operations: Operation[] = [];

  async add<T>(operation: Operation<T>): Promise<void> {
    this.operations.push(operation);
  }

  async getAll(): Promise<Operation[]> {
    return [...this.operations];
  }

  async getById(id: string): Promise<Operation | undefined> {
    return this.operations.find((operation) => operation.id === id);
  }

  async remove(id: string): Promise<void> {
    this.operations = this.operations.filter(
      (operation) => operation.id !== id
    );
  }

  async update<T>(operation: Operation<T>): Promise<void> {
    const index = this.operations.findIndex(
      (existing) => existing.id === operation.id
    );

    if (index !== -1) {
      this.operations[index] = operation;
    }
  }

  async clear(): Promise<void> {
    this.operations = [];
  }
}