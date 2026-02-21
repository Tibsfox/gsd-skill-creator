import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressTracker } from "./progress-tracker";

describe("ProgressTracker", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("construction", () => {
    it("construction with no existing data yields empty progress", () => {
      const tracker = new ProgressTracker();
      expect(tracker.getAllProgress()).toEqual([]);
    });

    it("construction with custom storageKey uses that key", () => {
      const tracker = new ProgressTracker({ storageKey: "custom-key" });
      tracker.startPack("MATH-101");
      expect(localStorage.getItem("custom-key")).not.toBeNull();
      expect(localStorage.getItem("gsd-knowledge-progress")).toBeNull();
    });
  });

  describe("getProgress", () => {
    it("returns default not-started state for unknown pack", () => {
      const tracker = new ProgressTracker();
      const progress = tracker.getProgress("UNKNOWN-101");
      expect(progress.packId).toBe("UNKNOWN-101");
      expect(progress.state).toBe("not-started");
      expect(progress.startedAt).toBeNull();
      expect(progress.completedAt).toBeNull();
      expect(progress.favorited).toBe(false);
    });
  });

  describe("startPack", () => {
    it("transitions to in-progress with startedAt timestamp", () => {
      const tracker = new ProgressTracker();
      const before = new Date().toISOString();
      const result = tracker.startPack("MATH-101");
      const after = new Date().toISOString();

      expect(result.state).toBe("in-progress");
      expect(result.packId).toBe("MATH-101");
      expect(result.startedAt).not.toBeNull();
      expect(result.startedAt! >= before).toBe(true);
      expect(result.startedAt! <= after).toBe(true);
    });

    it("preserves existing startedAt when called again", () => {
      const tracker = new ProgressTracker();
      const first = tracker.startPack("MATH-101");
      const originalStart = first.startedAt;
      // Complete and re-start
      tracker.completePack("MATH-101");
      const restarted = tracker.startPack("MATH-101");
      expect(restarted.startedAt).toBe(originalStart);
    });
  });

  describe("completePack", () => {
    it("transitions to completed with completedAt timestamp", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("SCI-101");
      const before = new Date().toISOString();
      const result = tracker.completePack("SCI-101");
      const after = new Date().toISOString();

      expect(result.state).toBe("completed");
      expect(result.completedAt).not.toBeNull();
      expect(result.completedAt! >= before).toBe(true);
      expect(result.completedAt! <= after).toBe(true);
    });
  });

  describe("resetPack", () => {
    it("clears state back to not-started", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("MATH-101");
      tracker.completePack("MATH-101");
      const result = tracker.resetPack("MATH-101");

      expect(result.state).toBe("not-started");
      expect(result.startedAt).toBeNull();
      expect(result.completedAt).toBeNull();
    });

    it("preserves favorited flag when resetting", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("MATH-101");
      tracker.toggleFavorite("MATH-101");
      const result = tracker.resetPack("MATH-101");
      expect(result.favorited).toBe(true);
      expect(result.state).toBe("not-started");
    });
  });

  describe("toggleFavorite", () => {
    it("toggles favorited flag from false to true", () => {
      const tracker = new ProgressTracker();
      const result = tracker.toggleFavorite("MATH-101");
      expect(result.favorited).toBe(true);
    });

    it("toggles favorited flag from true back to false", () => {
      const tracker = new ProgressTracker();
      tracker.toggleFavorite("MATH-101");
      const result = tracker.toggleFavorite("MATH-101");
      expect(result.favorited).toBe(false);
    });
  });

  describe("getFavorites", () => {
    it("returns only favorited packs", () => {
      const tracker = new ProgressTracker();
      tracker.toggleFavorite("MATH-101");
      tracker.startPack("SCI-101");
      tracker.toggleFavorite("CODE-101");

      const favorites = tracker.getFavorites();
      expect(favorites).toHaveLength(2);
      const ids = favorites.map((p) => p.packId);
      expect(ids).toContain("MATH-101");
      expect(ids).toContain("CODE-101");
      expect(ids).not.toContain("SCI-101");
    });

    it("returns empty when no packs are favorited", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("MATH-101");
      expect(tracker.getFavorites()).toEqual([]);
    });
  });

  describe("getCompletedCount and getInProgressCount", () => {
    it("returns correct counts", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("MATH-101");
      tracker.startPack("SCI-101");
      tracker.completePack("SCI-101");
      tracker.startPack("CODE-101");
      tracker.completePack("CODE-101");

      expect(tracker.getCompletedCount()).toBe(2);
      expect(tracker.getInProgressCount()).toBe(1);
    });

    it("returns 0 for empty tracker", () => {
      const tracker = new ProgressTracker();
      expect(tracker.getCompletedCount()).toBe(0);
      expect(tracker.getInProgressCount()).toBe(0);
    });
  });

  describe("persistence", () => {
    it("progress persists across new ProgressTracker instances", () => {
      const tracker1 = new ProgressTracker();
      tracker1.startPack("MATH-101");
      tracker1.completePack("SCI-101");
      tracker1.toggleFavorite("MATH-101");

      const tracker2 = new ProgressTracker();
      const math = tracker2.getProgress("MATH-101");
      const sci = tracker2.getProgress("SCI-101");

      expect(math.state).toBe("in-progress");
      expect(math.favorited).toBe(true);
      expect(sci.state).toBe("completed");
    });

    it("custom storageKey isolates data from default key", () => {
      const tracker1 = new ProgressTracker({ storageKey: "custom-a" });
      tracker1.startPack("MATH-101");

      const tracker2 = new ProgressTracker({ storageKey: "custom-b" });
      const progress = tracker2.getProgress("MATH-101");
      expect(progress.state).toBe("not-started");
    });

    it("corrupt localStorage data is handled gracefully", () => {
      localStorage.setItem("gsd-knowledge-progress", "NOT VALID JSON {{{");
      const tracker = new ProgressTracker();
      expect(tracker.getAllProgress()).toEqual([]);
    });

    it("non-array localStorage data is handled gracefully", () => {
      localStorage.setItem("gsd-knowledge-progress", JSON.stringify({ not: "an array" }));
      const tracker = new ProgressTracker();
      expect(tracker.getAllProgress()).toEqual([]);
    });
  });

  describe("destroy", () => {
    it("clears in-memory progress", () => {
      const tracker = new ProgressTracker();
      tracker.startPack("MATH-101");
      tracker.destroy();
      expect(tracker.getAllProgress()).toEqual([]);
    });
  });
});
