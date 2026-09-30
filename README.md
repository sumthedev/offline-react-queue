# react-offline-queue

An offline-first operation queue for React applications with persistent storage, automatic synchronization, and retry support.

## Features

- Queue operations while offline
- Persistent storage with IndexedDB
- In-memory storage for testing and custom use cases
- Detect browser online/offline status
- Automatically synchronize when the browser comes back online
- Retry failed operations
- Simple React hook
- TypeScript support
- Tested with Vitest

## Installation

```bash
npm install react-offline-queue
```

## Basic Usage

```tsx
import { useOfflineQueue } from "react-offline-queue";

function MyComponent() {
  const { add, sync, pendingCount } = useOfflineQueue({
    syncHandler: async (operation) => {
      await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(operation)
      });
    }
  });

  const updateFile = async () => {
    await add({
      id: crypto.randomUUID(),
      type: "UPDATE_FILE",
      payload: {
        fileId: "file-1",
        content: "Hello World"
      },
      createdAt: Date.now(),
      retryCount: 0,
      status: "pending"
    });
  };

  return (
    <div>
      <p>Pending operations: {pendingCount}</p>

      <button onClick={updateFile}>
        Update File
      </button>

      <button onClick={sync}>
        Sync
      </button>
    </div>
  );
}
```

## How It Works

Operations are added to a local queue before being synchronized with your server.

```text
User Action
    ↓
Add Operation
    ↓
Local Queue
    ↓
IndexedDB
    ↓
Internet Available?
    │
    ├── No ──→ Wait
    │
    └── Yes
          ↓
      Sync Engine
          ↓
      Sync Handler
          ↓
      Server
```

When the browser comes back online, the queue automatically attempts to synchronize pending operations.

## Operation

An operation has the following structure:

```ts
interface Operation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
}
```

Example:

```ts
const operation = {
  id: "operation-1",
  type: "UPDATE_FILE",
  payload: {
    fileId: "file-1",
    content: "Hello"
  },
  createdAt: Date.now(),
  retryCount: 0,
  status: "pending"
};
```

## Custom Storage

By default, `useOfflineQueue` uses IndexedDB.

You can provide your own storage adapter when needed.

```tsx
import {
  MemoryStorage,
  useOfflineQueue
} from "react-offline-queue";

const storage = new MemoryStorage();

const { add, sync } = useOfflineQueue({
  storage,

  syncHandler: async (operation) => {
    // Synchronize operation with your server
  }
});
```

Custom storage implementations can follow the `StorageAdapter` interface:

```ts
interface StorageAdapter {
  add<T>(operation: Operation<T>): Promise<void>;
  getAll(): Promise<Operation[]>;
  getById(id: string): Promise<Operation | undefined>;
  remove(id: string): Promise<void>;
  update<T>(operation: Operation<T>): Promise<void>;
  clear(): Promise<void>;
}
```

## Retry Behavior

Failed synchronization attempts are retried automatically.

The default retry limit is **3 attempts**.

```text
Attempt 1
   ↓
Failed → retryCount: 1

Attempt 2
   ↓
Failed → retryCount: 2

Attempt 3
   ↓
Failed → status: "failed"
```

Successful operations are removed from the queue.

## Public API

### `useOfflineQueue`

```ts
useOfflineQueue(options)
```

Options:

```ts
interface UseOfflineQueueOptions {
  syncHandler: (operation: Operation) => Promise<void>;
  storage?: StorageAdapter;
}
```

Returns:

```ts
interface UseOfflineQueueResult {
  operations: Operation[];
  pendingCount: number;
  add: (operation: Operation) => Promise<void>;
  sync: () => Promise<void>;
}
```

### `Queue`

Low-level queue abstraction for managing operations.

### `SyncEngine`

Handles synchronization between queued operations and your server.

### `RetryManager`

Controls retry behavior for failed synchronization attempts.

### `IndexedDBStorage`

Persistent browser storage using IndexedDB.

### `MemoryStorage`

In-memory storage implementation useful for testing.

### `NetworkMonitor`

Monitors browser online/offline events.

## TypeScript

The package includes TypeScript declarations out of the box.

```ts
import type {
  Operation,
  StorageAdapter,
  UseOfflineQueueOptions,
  UseOfflineQueueResult
} from "react-offline-queue";
```

## Development

Clone the repository and install dependencies:

```bash
npm install
```

Build the package:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Status

This project is currently under active development.

The current version focuses on the core offline queue, persistent storage, synchronization, retry handling, and React integration.

Future versions may include more advanced synchronization and conflict-resolution capabilities.

## License

MIT