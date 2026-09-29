export class RetryManager {
  constructor(private readonly maxRetries = 3) {}

  canRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }
}