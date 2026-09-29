import type { Operation } from "../core/Operation";

export interface StorageAdapter {
  add<T>(operation: Operation<T>): Promise<void>;

  getAll(): Promise<Operation[]>;

  getById(id: string): Promise<Operation | undefined>;

  remove(id: string): Promise<void>;

  update<T>(operation: Operation<T>): Promise<void>;

  clear(): Promise<void>;
}