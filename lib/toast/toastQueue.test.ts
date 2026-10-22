import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  DEFAULT_DURATIONS,
  DEFAULT_PRIORITIES,
  DEDUPE_WINDOW_MS,
  ToastQueue,
} from "./toastQueue";

describe("DEFAULT_DURATIONS", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("defines a positive duration for every toast type", () => {
    expect(Object.keys(DEFAULT_DURATIONS).sort()).toEqual(["error", "info", "success"]);
    for (const value of Object.values(DEFAULT_DURATIONS)) {
      expect(value).toBeGreaterThan(0);
    }
  });

  it("keeps errors on screen longer than success and info", () => {
    expect(DEFAULT_DURATIONS.error).toBeGreaterThan(DEFAULT_DURATIONS.success);
    expect(DEFAULT_DURATIONS.error).toBeGreaterThan(DEFAULT_DURATIONS.info);
  });

  it("is applied to new toasts and auto-dismisses after that duration", () => {
    const queue = new ToastQueue();
    queue.error("e");
    queue.info("i");
    const durations = Object.fromEntries(queue.getVisible().map((t) => [t.type, t.duration]));
    expect(durations).toEqual({
      error: DEFAULT_DURATIONS.error,
      info: DEFAULT_DURATIONS.info,
    });

    vi.advanceTimersByTime(DEFAULT_DURATIONS.info);
    expect(queue.getVisible().map((t) => t.type)).toEqual(["error"]);
    vi.advanceTimersByTime(DEFAULT_DURATIONS.error - DEFAULT_DURATIONS.info);
    expect(queue.getVisible()).toHaveLength(0);
  });

  it("is overridden by an explicit duration option", () => {
    const queue = new ToastQueue();
    queue.success("s", { duration: 123 });
    expect(queue.getVisible()[0].duration).toBe(123);
  });
});

describe("DEFAULT_PRIORITIES", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("defines a priority for every toast type", () => {
    expect(DEFAULT_PRIORITIES).toEqual({ info: 0, success: 1, error: 2 });
  });

  it("ranks error above success above info", () => {
    expect(DEFAULT_PRIORITIES.error).toBeGreaterThan(DEFAULT_PRIORITIES.success);
    expect(DEFAULT_PRIORITIES.success).toBeGreaterThan(DEFAULT_PRIORITIES.info);
  });

  it("is applied to new toasts and orders the visible stack", () => {
    const queue = new ToastQueue();
    queue.info("i");
    queue.success("s");
    queue.error("e");
    expect(queue.getVisible().map((t) => [t.type, t.priority])).toEqual([
      ["error", DEFAULT_PRIORITIES.error],
      ["success", DEFAULT_PRIORITIES.success],
      ["info", DEFAULT_PRIORITIES.info],
    ]);
  });

  it("drops the lowest-priority toast first on overflow, never an error", () => {
    const queue = new ToastQueue(2);
    queue.error("e");
    queue.info("i");
    queue.success("s");
    expect(queue.getVisible().map((t) => t.type)).toEqual(["error", "success"]);
  });

  it("is overridden by an explicit priority option", () => {
    const queue = new ToastQueue();
    queue.info("i", { priority: 9 });
    expect(queue.getVisible()[0].priority).toBe(9);
  });
});
