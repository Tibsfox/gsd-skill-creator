import { describe, it, expect, vi, beforeEach } from "vitest";
import { enableDrag, enableResize } from "./drag-resize";
import type { WindowBounds } from "./types";
import { MIN_WINDOW_WIDTH, MIN_WINDOW_HEIGHT } from "./types";

// Polyfill PointerEvent if jsdom does not provide it
if (typeof PointerEvent === "undefined") {
  (globalThis as any).PointerEvent = class extends MouseEvent {
    pointerId: number;
    constructor(type: string, init?: PointerEventInit) {
      super(type, init);
      this.pointerId = init?.pointerId ?? 0;
    }
  };
}

describe("drag-resize", () => {
  let container: HTMLDivElement;
  let handle: HTMLDivElement;
  let frame: HTMLDivElement;

  beforeEach(() => {
    // Mock pointer capture methods
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.releasePointerCapture = vi.fn();

    container = document.createElement("div");
    document.body.appendChild(container);

    handle = document.createElement("div");
    container.appendChild(handle);

    frame = document.createElement("div");
    frame.style.left = "10px";
    frame.style.top = "20px";
    frame.style.width = "640px";
    frame.style.height = "480px";
    container.appendChild(frame);
  });

  describe("enableDrag", () => {
    const initialBounds: WindowBounds = {
      x: 10,
      y: 20,
      width: 640,
      height: 480,
    };

    it("returns cleanup function", () => {
      const cleanup = enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        vi.fn(),
      );
      expect(typeof cleanup).toBe("function");
    });

    it("drag updates position based on pointer delta", () => {
      const onUpdate = vi.fn();
      enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      // Start drag at (100, 100)
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );

      // Move to (150, 130) -- delta is (50, 30)
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 150,
          clientY: 130,
          bubbles: true,
        }),
      );

      expect(onUpdate).toHaveBeenCalledWith({
        x: 60,
        y: 50,
        width: 640,
        height: 480,
      });
    });

    it("drag does not change size", () => {
      const onUpdate = vi.fn();
      enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }),
      );

      const updatedBounds = onUpdate.mock.calls[0][0] as WindowBounds;
      expect(updatedBounds.width).toBe(640);
      expect(updatedBounds.height).toBe(480);
    });

    it("pointerup ends drag", () => {
      const onUpdate = vi.fn();
      enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true }),
      );

      onUpdate.mockClear();

      // Further move should NOT trigger update
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 300,
          clientY: 300,
          bubbles: true,
        }),
      );

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("drag calls setPointerCapture", () => {
      enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        vi.fn(),
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 100,
          pointerId: 1,
          bubbles: true,
        }),
      );

      expect(handle.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it("cleanup removes listeners", () => {
      const onUpdate = vi.fn();
      const cleanup = enableDrag(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      cleanup();

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 100,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        }),
      );

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe("enableResize", () => {
    const initialBounds: WindowBounds = {
      x: 10,
      y: 20,
      width: 640,
      height: 480,
    };

    it("returns cleanup function", () => {
      const cleanup = enableResize(
        handle,
        () => frame,
        () => initialBounds,
        vi.fn(),
      );
      expect(typeof cleanup).toBe("function");
    });

    it("resize updates width and height based on pointer delta", () => {
      const onUpdate = vi.fn();
      enableResize(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      // Start resize at (650, 500)
      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 650,
          clientY: 500,
          bubbles: true,
        }),
      );

      // Move to (700, 550) -- delta is (50, 50)
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 700,
          clientY: 550,
          bubbles: true,
        }),
      );

      expect(onUpdate).toHaveBeenCalledWith({
        x: 10,
        y: 20,
        width: 690,
        height: 530,
      });
    });

    it("resize does not change position", () => {
      const onUpdate = vi.fn();
      enableResize(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 650,
          clientY: 500,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 700,
          clientY: 550,
          bubbles: true,
        }),
      );

      const updatedBounds = onUpdate.mock.calls[0][0] as WindowBounds;
      expect(updatedBounds.x).toBe(10);
      expect(updatedBounds.y).toBe(20);
    });

    it("resize clamps to minimum dimensions", () => {
      const onUpdate = vi.fn();
      enableResize(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 650,
          clientY: 500,
          bubbles: true,
        }),
      );

      // Move far left/up to make window smaller than minimums
      // Delta: -600, -400 => width: 640-600=40, height: 480-400=80
      // Should clamp to MIN_WINDOW_WIDTH=200, MIN_WINDOW_HEIGHT=150
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 50,
          clientY: 100,
          bubbles: true,
        }),
      );

      const updatedBounds = onUpdate.mock.calls[0][0] as WindowBounds;
      expect(updatedBounds.width).toBe(MIN_WINDOW_WIDTH);
      expect(updatedBounds.height).toBe(MIN_WINDOW_HEIGHT);
    });

    it("pointerup ends resize", () => {
      const onUpdate = vi.fn();
      enableResize(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 650,
          clientY: 500,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointerup", { bubbles: true }),
      );

      onUpdate.mockClear();

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 800,
          clientY: 800,
          bubbles: true,
        }),
      );

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("cleanup removes listeners", () => {
      const onUpdate = vi.fn();
      const cleanup = enableResize(
        handle,
        () => frame,
        () => initialBounds,
        onUpdate,
      );

      cleanup();

      handle.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 650,
          clientY: 500,
          bubbles: true,
        }),
      );

      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 700,
          clientY: 550,
          bubbles: true,
        }),
      );

      expect(onUpdate).not.toHaveBeenCalled();
    });
  });
});
