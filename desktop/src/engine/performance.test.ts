import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FrameTimeMeasurer } from "./performance.js";

describe("FrameTimeMeasurer", () => {
  let measurer: FrameTimeMeasurer;
  let nowSpy: ReturnType<typeof vi.spyOn>;
  let callCount: number;

  beforeEach(() => {
    measurer = new FrameTimeMeasurer();
    callCount = 0;
    nowSpy = vi.spyOn(performance, "now");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("starts with averageMs of 0", () => {
      expect(measurer.averageMs).toBe(0);
    });

    it("starts with maxMs of 0", () => {
      expect(measurer.maxMs).toBe(0);
    });
  });

  describe("measure", () => {
    it("calls the render function", () => {
      const renderFn = vi.fn();
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1);
      measurer.measure(renderFn);
      expect(renderFn).toHaveBeenCalledOnce();
    });

    it("returns elapsed time in ms", () => {
      nowSpy.mockReturnValueOnce(100).mockReturnValueOnce(105);
      const elapsed = measurer.measure(() => {});
      expect(elapsed).toBe(5);
    });

    it("records the elapsed time as a sample", () => {
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(3);
      measurer.measure(() => {});
      expect(measurer.averageMs).toBe(3);
    });
  });

  describe("rolling window", () => {
    it("keeps at most 60 samples", () => {
      // Add 65 samples
      for (let i = 0; i < 65; i++) {
        nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1);
        measurer.measure(() => {});
      }
      // Average should still be 1 (all samples are 1ms)
      expect(measurer.averageMs).toBe(1);
    });

    it("discards oldest samples when window is exceeded", () => {
      // Add 60 samples of 1ms
      for (let i = 0; i < 60; i++) {
        nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1);
        measurer.measure(() => {});
      }
      expect(measurer.averageMs).toBe(1);

      // Add 10 samples of 10ms -- these should push out old 1ms samples
      for (let i = 0; i < 10; i++) {
        nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(10);
        measurer.measure(() => {});
      }
      // Average should be (50 * 1 + 10 * 10) / 60 = 150 / 60 = 2.5
      expect(measurer.averageMs).toBe(2.5);
    });
  });

  describe("averageMs", () => {
    it("returns accurate average of recorded samples", () => {
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2) // 2ms
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(4) // 4ms
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(6); // 6ms
      measurer.measure(() => {});
      measurer.measure(() => {});
      measurer.measure(() => {});
      expect(measurer.averageMs).toBe(4); // (2 + 4 + 6) / 3
    });
  });

  describe("maxMs", () => {
    it("returns maximum sample value", () => {
      nowSpy
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(2) // 2ms
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(8) // 8ms
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(3); // 3ms
      measurer.measure(() => {});
      measurer.measure(() => {});
      measurer.measure(() => {});
      expect(measurer.maxMs).toBe(8);
    });
  });

  describe("withinBudget", () => {
    it("returns true when averageMs < 2.0", () => {
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(1);
      measurer.measure(() => {});
      expect(measurer.withinBudget).toBe(true);
    });

    it("returns false when averageMs >= 2.0", () => {
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(3);
      measurer.measure(() => {});
      expect(measurer.withinBudget).toBe(false);
    });

    it("returns false when averageMs is exactly 2.0", () => {
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(2);
      measurer.measure(() => {});
      expect(measurer.withinBudget).toBe(false);
    });
  });

  describe("reset", () => {
    it("clears all samples", () => {
      nowSpy.mockReturnValueOnce(0).mockReturnValueOnce(5);
      measurer.measure(() => {});
      expect(measurer.averageMs).toBe(5);

      measurer.reset();
      expect(measurer.averageMs).toBe(0);
      expect(measurer.maxMs).toBe(0);
    });
  });
});
