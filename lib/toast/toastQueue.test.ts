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
