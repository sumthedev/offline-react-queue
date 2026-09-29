import { describe, expect, it, vi } from "vitest";
import { NetworkMonitor } from "../src/network/NetworkMonitor";

describe("NetworkMonitor", () => {
  it("should return the current online status", () => {
    const monitor = new NetworkMonitor();

    expect(typeof monitor.isOnline()).toBe("boolean");
  });

  it("should listen for online events", () => {
    const monitor = new NetworkMonitor();
    const callback = vi.fn();

    const unsubscribe = monitor.onOnline(callback);

    window.dispatchEvent(new Event("online"));

    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    window.dispatchEvent(new Event("online"));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should listen for offline events", () => {
    const monitor = new NetworkMonitor();
    const callback = vi.fn();

    const unsubscribe = monitor.onOffline(callback);

    window.dispatchEvent(new Event("offline"));

    expect(callback).toHaveBeenCalledTimes(1);

    unsubscribe();

    window.dispatchEvent(new Event("offline"));

    expect(callback).toHaveBeenCalledTimes(1);
  });
});