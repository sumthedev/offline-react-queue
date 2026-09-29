export interface Operation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed";
}