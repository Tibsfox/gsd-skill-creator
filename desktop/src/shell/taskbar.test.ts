import { describe, it, expect, vi } from "vitest";
import { createTaskbar } from "./taskbar";
import type { TaskbarEntry, ProcessIndicator } from "./types";

function makeEntry(overrides: Partial<TaskbarEntry> = {}): TaskbarEntry {
  return {
    windowId: "win-1",
    type: "dashboard",
    title: "Dashboard",
    minimized: false,
    focused: false,
    ...overrides,
  };
}

function makeIndicator(overrides: Partial<ProcessIndicator> = {}): ProcessIndicator {
  return {
    id: "claude",
    label: "Claude",
    status: "running",
    ...overrides,
  };
}

describe("createTaskbar", () => {
  it("returns element, updateEntries, updateIndicators, destroy", () => {
    const handle = createTaskbar(vi.fn());
    expect(handle.element).toBeInstanceOf(HTMLDivElement);
    expect(typeof handle.updateEntries).toBe("function");
    expect(typeof handle.updateIndicators).toBe("function");
    expect(typeof handle.destroy).toBe("function");
  });

  it("taskbar element has correct CSS class", () => {
    const handle = createTaskbar(vi.fn());
    expect(handle.element.classList.contains("shell-taskbar")).toBe(true);
  });

  it("taskbar has three sections: left, center, right", () => {
    const handle = createTaskbar(vi.fn());
    const left = handle.element.querySelector(".shell-taskbar__left");
    const center = handle.element.querySelector(".shell-taskbar__center");
    const right = handle.element.querySelector(".shell-taskbar__right");
    expect(left).not.toBeNull();
    expect(center).not.toBeNull();
    expect(right).not.toBeNull();
  });

  it("updateEntries renders window entry buttons", () => {
    const handle = createTaskbar(vi.fn());
    const entries = [
      makeEntry({ windowId: "w1", title: "Win 1" }),
      makeEntry({ windowId: "w2", title: "Win 2" }),
      makeEntry({ windowId: "w3", title: "Win 3" }),
    ];
    handle.updateEntries(entries);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    const buttons = center.querySelectorAll("button");
    expect(buttons).toHaveLength(3);
  });

  it("entry button shows window title", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([makeEntry({ title: "My Window" })]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    const button = center.querySelector("button")!;
    expect(button.textContent).toContain("My Window");
  });

  it("focused entry has active CSS class", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([makeEntry({ focused: true })]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    const button = center.querySelector("button")!;
    expect(button.classList.contains("shell-taskbar__entry--active")).toBe(true);
  });

  it("minimized entry has minimized CSS class", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([makeEntry({ minimized: true })]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    const button = center.querySelector("button")!;
    expect(button.classList.contains("shell-taskbar__entry--minimized")).toBe(true);
  });

  it("clicking entry button calls onClick with windowId", () => {
    const spy = vi.fn();
    const handle = createTaskbar(spy);
    handle.updateEntries([makeEntry({ windowId: "win-42" })]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    const button = center.querySelector("button")!;
    button.click();
    expect(spy).toHaveBeenCalledWith("win-42");
  });

  it("updateEntries replaces previous entries", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([
      makeEntry({ windowId: "w1" }),
      makeEntry({ windowId: "w2" }),
      makeEntry({ windowId: "w3" }),
    ]);
    handle.updateEntries([makeEntry({ windowId: "w4" })]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    expect(center.querySelectorAll("button")).toHaveLength(1);
  });

  it("updateIndicators renders process indicator dots", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateIndicators([
      makeIndicator({ id: "claude" }),
      makeIndicator({ id: "watcher" }),
      makeIndicator({ id: "terminal" }),
    ]);
    const right = handle.element.querySelector(".shell-taskbar__right")!;
    const indicators = right.querySelectorAll(".shell-indicator");
    expect(indicators).toHaveLength(3);
  });

  it("indicator shows label text", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateIndicators([makeIndicator({ label: "Claude" })]);
    const right = handle.element.querySelector(".shell-taskbar__right")!;
    const indicator = right.querySelector(".shell-indicator")!;
    expect(indicator.textContent).toContain("Claude");
  });

  it("indicator has status-based CSS class", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateIndicators([
      makeIndicator({ id: "a", status: "running" }),
      makeIndicator({ id: "b", status: "stopped" }),
    ]);
    const right = handle.element.querySelector(".shell-taskbar__right")!;
    const indicators = right.querySelectorAll(".shell-indicator");
    expect(indicators[0].classList.contains("shell-indicator--running")).toBe(true);
    expect(indicators[1].classList.contains("shell-indicator--stopped")).toBe(true);
  });

  it("updateIndicators replaces previous indicators", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateIndicators([
      makeIndicator({ id: "a" }),
      makeIndicator({ id: "b" }),
      makeIndicator({ id: "c" }),
    ]);
    handle.updateIndicators([makeIndicator({ id: "d" })]);
    const right = handle.element.querySelector(".shell-taskbar__right")!;
    expect(right.querySelectorAll(".shell-indicator")).toHaveLength(1);
  });

  it("destroy empties the taskbar", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([makeEntry()]);
    handle.updateIndicators([makeIndicator()]);
    handle.destroy();
    expect(handle.element.children.length).toBe(0);
  });

  it("destroy removes click listeners", () => {
    const spy = vi.fn();
    const handle = createTaskbar(spy);
    handle.destroy();
    handle.updateEntries([makeEntry({ windowId: "win-1" })]);
    const center = handle.element.querySelector(".shell-taskbar__center");
    // After destroy, updateEntries should not render (or clicks should not fire)
    // Since destroy empties and marks destroyed, entries won't render
    const button = center?.querySelector("button");
    if (button) {
      button.click();
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it("empty entries shows no buttons", () => {
    const handle = createTaskbar(vi.fn());
    handle.updateEntries([]);
    const center = handle.element.querySelector(".shell-taskbar__center")!;
    expect(center.querySelectorAll("button")).toHaveLength(0);
  });

  it("taskbar left section has system menu placeholder button", () => {
    const handle = createTaskbar(vi.fn());
    const left = handle.element.querySelector(".shell-taskbar__left")!;
    const btn = left.querySelector(".shell-taskbar__menu-btn");
    expect(btn).not.toBeNull();
    expect(btn!.textContent).toContain("\u2261");
  });
});
