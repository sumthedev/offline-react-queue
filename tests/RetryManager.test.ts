import { describe, expect, it } from "vitest";
import { RetryManager } from "../src/core/RetryManager";

describe("RetryManager", () => {
  it("should allow retries below the maximum", () => {
    const retryManager = new RetryManager(3);

    expect(retryManager.canRetry(0)).toBe(true);
    expect(retryManager.canRetry(1)).toBe(true);
    expect(retryManager.canRetry(2)).toBe(true);
  });

  it("should not allow retries at the maximum", () => {
    const retryManager = new RetryManager(3);

    expect(retryManager.canRetry(3)).toBe(false);
  });

  it("should use 3 retries by default", () => {
    const retryManager = new RetryManager();

    expect(retryManager.canRetry(0)).toBe(true);
    expect(retryManager.canRetry(2)).toBe(true);
    expect(retryManager.canRetry(3)).toBe(false);
  });
});