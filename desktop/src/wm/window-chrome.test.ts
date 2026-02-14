import { describe, it, expect, vi } from "vitest";
import { createWindowChrome } from "./window-chrome";
import type { WindowBounds } from "./types";

const defaultBounds: WindowBounds = {
  x: 100,
  y: 200,
  width: 640,
  height: 480,
};

describe("createWindowChrome", () => {
  it("returns frame, titlebar, content, resizeHandle elements", () => {
    const onGadget = vi.fn();
    const chrome = createWindowChrome("Test Window", defaultBounds, onGadget);

    expect(chrome.frame).toBeInstanceOf(HTMLDivElement);
    expect(chrome.titlebar).toBeInstanceOf(HTMLDivElement);
    expect(chrome.content).toBeInstanceOf(HTMLDivElement);
    expect(chrome.resizeHandle).toBeInstanceOf(HTMLDivElement);
    expect(chrome.frame.contains(chrome.titlebar)).toBe(true);
    expect(chrome.frame.contains(chrome.content)).toBe(true);
  });

  it("frame has correct CSS class", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.frame.classList.contains("wm-frame")).toBe(true);
  });

  it("titlebar has correct CSS class", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.titlebar.classList.contains("wm-titlebar")).toBe(true);
  });

  it("frame is positioned at bounds.x, bounds.y", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.frame.style.left).toBe("100px");
    expect(chrome.frame.style.top).toBe("200px");
  });

  it("frame has correct width and height", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.frame.style.width).toBe("640px");
    expect(chrome.frame.style.height).toBe("480px");
  });

  it("titlebar contains close gadget button", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    const closeBtn = chrome.titlebar.querySelector('[data-gadget="close"]');
    expect(closeBtn).not.toBeNull();
    expect(closeBtn).toBeInstanceOf(HTMLButtonElement);
  });

  it("titlebar contains depth gadget button", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    const depthBtn = chrome.titlebar.querySelector('[data-gadget="depth"]');
    expect(depthBtn).not.toBeNull();
    expect(depthBtn).toBeInstanceOf(HTMLButtonElement);
  });

  it("titlebar contains zoom gadget button", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    const zoomBtn = chrome.titlebar.querySelector('[data-gadget="zoom"]');
    expect(zoomBtn).not.toBeNull();
    expect(zoomBtn).toBeInstanceOf(HTMLButtonElement);
  });

  it("titlebar displays title text", () => {
    const chrome = createWindowChrome("My App Window", defaultBounds, vi.fn());
    expect(chrome.titlebar.textContent).toContain("My App Window");
  });

  it("close gadget is on the left, depth and zoom on the right", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    const children = Array.from(chrome.titlebar.children);

    // Close button should be in the first child (left container)
    const closeBtn = chrome.titlebar.querySelector('[data-gadget="close"]');
    const depthBtn = chrome.titlebar.querySelector('[data-gadget="depth"]');
    const zoomBtn = chrome.titlebar.querySelector('[data-gadget="zoom"]');

    // Find which container each gadget is in
    const closeContainer = closeBtn!.closest("[data-section]") ?? closeBtn!.parentElement;
    const depthContainer = depthBtn!.closest("[data-section]") ?? depthBtn!.parentElement;

    // Close should be in an earlier sibling than depth/zoom
    const closeIndex = children.indexOf(closeContainer as Element);
    const depthIndex = children.indexOf(depthContainer as Element);

    expect(closeIndex).toBeLessThan(depthIndex);

    // Depth and zoom should be in the same container (right side)
    expect(depthBtn!.parentElement).toBe(zoomBtn!.parentElement);
  });

  it("clicking close gadget calls onGadget('close')", () => {
    const onGadget = vi.fn();
    const chrome = createWindowChrome("Test", defaultBounds, onGadget);
    const closeBtn = chrome.titlebar.querySelector(
      '[data-gadget="close"]',
    ) as HTMLButtonElement;

    closeBtn.click();

    expect(onGadget).toHaveBeenCalledWith("close");
  });

  it("clicking depth gadget calls onGadget('depth')", () => {
    const onGadget = vi.fn();
    const chrome = createWindowChrome("Test", defaultBounds, onGadget);
    const depthBtn = chrome.titlebar.querySelector(
      '[data-gadget="depth"]',
    ) as HTMLButtonElement;

    depthBtn.click();

    expect(onGadget).toHaveBeenCalledWith("depth");
  });

  it("clicking zoom gadget calls onGadget('zoom')", () => {
    const onGadget = vi.fn();
    const chrome = createWindowChrome("Test", defaultBounds, onGadget);
    const zoomBtn = chrome.titlebar.querySelector(
      '[data-gadget="zoom"]',
    ) as HTMLButtonElement;

    zoomBtn.click();

    expect(onGadget).toHaveBeenCalledWith("zoom");
  });

  it("setTitle updates title text", () => {
    const chrome = createWindowChrome("Old Title", defaultBounds, vi.fn());
    chrome.setTitle("New Title");
    expect(chrome.titlebar.textContent).toContain("New Title");
  });

  it("setActive(true) adds active class", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    chrome.setActive(true);
    expect(chrome.frame.classList.contains("wm-frame--active")).toBe(true);
  });

  it("setActive(false) removes active class and adds inactive", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    chrome.setActive(true);
    chrome.setActive(false);
    expect(chrome.frame.classList.contains("wm-frame--inactive")).toBe(true);
    expect(chrome.frame.classList.contains("wm-frame--active")).toBe(false);
  });

  it("resizeHandle has correct CSS class", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.resizeHandle.classList.contains("wm-resize-handle")).toBe(
      true,
    );
  });

  it("content area has correct CSS class", () => {
    const chrome = createWindowChrome("Test", defaultBounds, vi.fn());
    expect(chrome.content.classList.contains("wm-content")).toBe(true);
  });
});
