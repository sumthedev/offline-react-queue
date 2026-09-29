import { Operation } from "./Operation";


export class Queue {
  private operations: Operation[] = [];

  add<T>(operation: Operation<T>): void {
    this.operations.push(operation);
  }

  getAll(): Operation[] {
    return [...this.operations];
  }

  remove(id: string): void {
    this.operations = this.operations.filter(
      (operation) => operation.id !== id
    );
  }

  clear(): void {
    this.operations = [];
  }

  get size(): number {
    return this.operations.length;
  }
}