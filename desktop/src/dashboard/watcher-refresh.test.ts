import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { WatcherEventBatch } from "../ipc/watcher";
import type { DashboardPage } from "./types";

// Mock the watcher module so we can capture the onFileChanged callback
const mockUnlisten = vi.fn();
let capturedCallback: ((batch: WatcherEventBatch) => void) | null = null;

vi.mock("../ipc/watcher", () => ({
  onFileChanged: vi.fn(async (cb: (batch: WatcherEventBatch) => void) => {
    capturedCallback = cb;
    return mockUnlisten;
  }),
}));

import { WatcherRefresh } from "./watcher-refresh";
import type { WatcherRefreshOptions } from "./watcher-refresh";

function makeBatch(...paths: string[]): WatcherEventBatch {
  return {
    events: paths.map((p) => ({ path: p, kind: "modify" as const })),
    count: paths.length,
  };
}

describe("WatcherRefresh.fileToPage", () => {
  it("maps STATE.md to state", () => {
    expect(WatcherRefresh.fileToPage("STATE.md")).toBe("state");
  });

  it("maps ROADMAP.md to roadmap", () => {
    expect(WatcherRefresh.fileToPage("ROADMAP.md")).toBe("roadmap");
  });

  it("maps REQUIREMENTS.md to requirements", () => {
    expect(WatcherRefresh.fileToPage("REQUIREMENTS.md")).toBe("requirements");
  });

  it("maps MILESTONES.md to milestones", () => {
    expect(WatcherRefresh.fileToPage("MILESTONES.md")).toBe("milestones");
  });

  it("maps PROJECT.md to index", () => {
    expect(WatcherRefresh.fileToPage("PROJECT.md")).toBe("index");
  });

  it("maps phases/ paths to roadmap", () => {
    expect(
      WatcherRefresh.fileToPage("phases/166-foo/166-01-PLAN.md"),
    ).toBe("roadmap");
  });

  it("maps phase SUMMARY files to roadmap", () => {
    expect(
      WatcherRefresh.fileToPage("phases/166-foo/166-01-SUMMARY.md"),
    ).toBe("roadmap");
  });

  it("maps config.json to all", () => {
    expect(WatcherRefresh.fileToPage("config.json")).toBe("all");
  });

  it("returns undefined for unrelated files", () => {
    expect(WatcherRefresh.fileToPage("random.txt")).toBeUndefined();
  });

  it("maps milestones/ directory to milestones", () => {
    expect(
      WatcherRefresh.fileToPage("milestones/v1.20-ROADMAP.md"),
    ).toBe("milestones");
  });

  it("maps console/ directory to console", () => {
    expect(
      WatcherRefresh.fileToPage("console/messages.jsonl"),
    ).toBe("console");
  });
});

describe("WatcherRefresh lifecycle", () => {
  let options: WatcherRefreshOptions;

  beforeEach(() => {
    capturedCallback = null;
    mockUnlisten.mockReset();
    options = {
      invalidateCache: vi.fn(),
      reloadCurrentPage: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("starts as not active", () => {
    const wr = new WatcherRefresh(options);
    expect(wr.isActive).toBe(false);
  });

  it("becomes active after start()", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();
    expect(wr.isActive).toBe(true);
  });

  it("becomes inactive after stop()", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();
    wr.stop();
    expect(wr.isActive).toBe(false);
  });

  it("calls unlisten on stop()", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();
    wr.stop();
    expect(mockUnlisten).toHaveBeenCalled();
  });
});

describe("WatcherRefresh event handling", () => {
  let options: WatcherRefreshOptions;

  beforeEach(() => {
    vi.useFakeTimers();
    capturedCallback = null;
    mockUnlisten.mockReset();
    options = {
      invalidateCache: vi.fn(),
      reloadCurrentPage: vi.fn().mockResolvedValue(undefined),
      debounceMs: 300,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invalidates specific page on STATE.md change", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("STATE.md"));
    await vi.advanceTimersByTimeAsync(300);

    expect(options.invalidateCache).toHaveBeenCalledWith("state");
  });

  it("invalidates roadmap on ROADMAP.md change", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("ROADMAP.md"));
    await vi.advanceTimersByTimeAsync(300);

    expect(options.invalidateCache).toHaveBeenCalledWith("roadmap");
  });

  it("invalidates all on config.json change", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("config.json"));
    await vi.advanceTimersByTimeAsync(300);

    expect(options.invalidateCache).toHaveBeenCalledWith();
  });

  it("calls reloadCurrentPage after invalidation", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("STATE.md"));
    await vi.advanceTimersByTimeAsync(300);

    expect(options.reloadCurrentPage).toHaveBeenCalled();
  });

  it("fires onRefresh callback when refresh is triggered", async () => {
    const onRefresh = vi.fn();
    const wr = new WatcherRefresh({ ...options, onRefresh });
    await wr.start();

    capturedCallback!(makeBatch("STATE.md"));
    await vi.advanceTimersByTimeAsync(300);

    expect(onRefresh).toHaveBeenCalled();
  });
});

describe("WatcherRefresh debouncing", () => {
  let options: WatcherRefreshOptions;

  beforeEach(() => {
    vi.useFakeTimers();
    capturedCallback = null;
    mockUnlisten.mockReset();
    options = {
      invalidateCache: vi.fn(),
      reloadCurrentPage: vi.fn().mockResolvedValue(undefined),
      debounceMs: 300,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debounces multiple rapid events into one flush", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("STATE.md"));
    capturedCallback!(makeBatch("ROADMAP.md"));
    capturedCallback!(makeBatch("REQUIREMENTS.md"));
    await vi.advanceTimersByTimeAsync(300);

    // Only one reloadCurrentPage call despite 3 events
    expect(options.reloadCurrentPage).toHaveBeenCalledTimes(1);
  });

  it("does not fire before debounce window expires", async () => {
    const wr = new WatcherRefresh(options);
    await wr.start();

    capturedCallback!(makeBatch("STATE.md"));
    await vi.advanceTimersByTimeAsync(100);

    expect(options.invalidateCache).not.toHaveBeenCalled();
    expect(options.reloadCurrentPage).not.toHaveBeenCalled();
  });
});
