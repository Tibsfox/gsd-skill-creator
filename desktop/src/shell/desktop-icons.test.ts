import { describe, it, expect, vi } from "vitest";
import type { DesktopIconDef } from "./types";
import { createDesktopIcons } from "./desktop-icons";

function makeDefs(): DesktopIconDef[] {
  const types = ["dashboard", "terminal", "console", "staging", "settings"] as const;
  return types.map((type) => ({
    type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
    bitmap: [0xff, 0x81, 0x81, 0x81, 0x81, 0x81, 0x81, 0xff] as const,
    defaultBounds: { x: 20, y: 20, width: 640, height: 480 },
  }));
}

describe("desktop-icons", () => {
  it("createDesktopIcons returns element and destroy", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    expect(handle.element).toBeInstanceOf(HTMLDivElement);
    expect(typeof handle.destroy).toBe("function");
  });

  it("renders one icon per definition", () => {
    const defs = makeDefs();
    const handle = createDesktopIcons(defs, () => {});
    expect(handle.element.children).toHaveLength(5);
  });

  it("each icon has correct CSS class", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    for (const child of handle.element.children) {
      expect(child.classList.contains("shell-desktop-icon")).toBe(true);
    }
  });

  it("each icon displays the label text", () => {
    const defs = makeDefs();
    const handle = createDesktopIcons(defs, () => {});
    for (let i = 0; i < defs.length; i++) {
      expect(handle.element.children[i].textContent).toContain(defs[i].label);
    }
  });

  it("each icon has a pixel-art canvas", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    for (const child of handle.element.children) {
      const canvas = child.querySelector("canvas");
      expect(canvas).not.toBeNull();
    }
  });

  it("pixel-art canvas is 8x8 logical pixels", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    const canvas = handle.element.querySelector("canvas")!;
    expect(canvas.width).toBe(8);
    expect(canvas.height).toBe(8);
  });

  it("pixel-art canvas has CSS scaling", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    const canvas = handle.element.querySelector("canvas")!;
    expect(canvas.style.width).toBeTruthy();
    expect(canvas.style.height).toBeTruthy();
  });

  it("double-clicking an icon calls onActivate with the type", () => {
    const spy = vi.fn();
    const defs = makeDefs();
    const handle = createDesktopIcons(defs, spy);
    const first = handle.element.children[0] as HTMLElement;
    first.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(spy).toHaveBeenCalledWith("dashboard");
  });

  it("single click does NOT trigger onActivate", () => {
    const spy = vi.fn();
    const handle = createDesktopIcons(makeDefs(), spy);
    const first = handle.element.children[0] as HTMLElement;
    first.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it("destroy removes all listeners", () => {
    const spy = vi.fn();
    const handle = createDesktopIcons(makeDefs(), spy);
    const first = handle.element.children[0] as HTMLElement;
    handle.destroy();
    first.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it("destroy empties the container", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    handle.destroy();
    expect(handle.element.children).toHaveLength(0);
  });

  it("icons are arranged in a column layout", () => {
    const handle = createDesktopIcons(makeDefs(), () => {});
    expect(handle.element.classList.contains("shell-icon-column")).toBe(true);
    expect(handle.element.style.display).toBe("flex");
    expect(handle.element.style.flexDirection).toBe("column");
  });
});
