import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSystemMenu, type SystemMenuHandle } from "./system-menu";
import type { MenuSection } from "./types";

describe("system-menu", () => {
  let handle: SystemMenuHandle;

  function makeSections(): MenuSection[] {
    return [
      {
        title: "Windows",
        items: [
          { id: "win-1", label: "Dashboard", action: vi.fn() },
          { id: "win-2", label: "Terminal", action: vi.fn() },
        ],
      },
      {
        title: "Application",
        items: [{ id: "quit", label: "Quit", shortcut: "Ctrl+Q", action: vi.fn() }],
      },
    ];
  }

  beforeEach(() => {
    handle = createSystemMenu();
    document.body.appendChild(handle.element);
  });

  afterEach(() => {
    handle.destroy();
    handle.element.remove();
  });

  it("createSystemMenu returns handle with all methods", () => {
    expect(handle.element).toBeInstanceOf(HTMLDivElement);
    expect(typeof handle.show).toBe("function");
    expect(typeof handle.showAnchored).toBe("function");
    expect(typeof handle.hide).toBe("function");
    expect(typeof handle.updateSections).toBe("function");
    expect(typeof handle.isVisible).toBe("function");
    expect(typeof handle.destroy).toBe("function");
  });

  it("menu is hidden by default", () => {
    expect(handle.isVisible()).toBe(false);
    expect(handle.element.style.display).toBe("none");
  });

  it("show makes menu visible at position", () => {
    handle.show(100, 200);
    expect(handle.isVisible()).toBe(true);
    expect(handle.element.style.left).toBe("100px");
    expect(handle.element.style.top).toBe("200px");
  });

  it("hide makes menu invisible", () => {
    handle.show(0, 0);
    handle.hide();
    expect(handle.isVisible()).toBe(false);
  });

  it("showAnchored positions menu above anchor element", () => {
    const anchor = document.createElement("div");
    anchor.getBoundingClientRect = () => ({
      top: 300,
      left: 50,
      bottom: 332,
      right: 150,
      width: 100,
      height: 32,
      x: 50,
      y: 300,
      toJSON: () => {},
    });
    document.body.appendChild(anchor);

    handle.showAnchored(anchor);
    expect(handle.isVisible()).toBe(true);
    expect(handle.element.style.left).toBe("50px");

    anchor.remove();
  });

  it("updateSections renders section headers and items", () => {
    const sections = makeSections();
    handle.updateSections(sections);

    const headers = handle.element.querySelectorAll(".shell-menu__section-title");
    expect(headers.length).toBe(2);

    const items = handle.element.querySelectorAll(".shell-menu__item");
    expect(items.length).toBe(3);
  });

  it("section header is visible", () => {
    handle.updateSections(makeSections());
    const header = handle.element.querySelector(".shell-menu__section-title");
    expect(header).not.toBeNull();
    expect(header!.textContent).toBe("Windows");
  });

  it("menu items show label", () => {
    handle.updateSections(makeSections());
    const items = handle.element.querySelectorAll(".shell-menu__item");
    expect(items[0].textContent).toContain("Dashboard");
    expect(items[1].textContent).toContain("Terminal");
    expect(items[2].textContent).toContain("Quit");
  });

  it("menu items show shortcut hint", () => {
    handle.updateSections(makeSections());
    const shortcut = handle.element.querySelector(".shell-menu__shortcut");
    expect(shortcut).not.toBeNull();
    expect(shortcut!.textContent).toBe("Ctrl+Q");
  });

  it("clicking a menu item calls its action", () => {
    const spy = vi.fn();
    handle.updateSections([
      {
        title: "Test",
        items: [{ id: "test", label: "Test Item", action: spy }],
      },
    ]);
    handle.show(0, 0);

    const item = handle.element.querySelector(".shell-menu__item") as HTMLElement;
    item.click();
    expect(spy).toHaveBeenCalledOnce();
  });

  it("clicking a menu item closes the menu", () => {
    handle.updateSections([
      {
        title: "Test",
        items: [{ id: "test", label: "Click Me", action: vi.fn() }],
      },
    ]);
    handle.show(0, 0);

    const item = handle.element.querySelector(".shell-menu__item") as HTMLElement;
    item.click();
    expect(handle.isVisible()).toBe(false);
  });

  it("clicking outside the menu closes it", () => {
    handle.show(0, 0);
    expect(handle.isVisible()).toBe(true);

    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    expect(handle.isVisible()).toBe(false);
  });

  it("pressing Escape closes the menu", () => {
    handle.show(0, 0);
    expect(handle.isVisible()).toBe(true);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handle.isVisible()).toBe(false);
  });

  it("disabled items are not clickable", () => {
    const spy = vi.fn();
    handle.updateSections([
      {
        title: "Test",
        items: [{ id: "disabled", label: "Disabled", action: spy, disabled: true }],
      },
    ]);
    handle.show(0, 0);

    const item = handle.element.querySelector(".shell-menu__item") as HTMLElement;
    expect(item.classList.contains("shell-menu__item--disabled")).toBe(true);
    item.click();
    expect(spy).not.toHaveBeenCalled();
    expect(handle.isVisible()).toBe(true);
  });

  it("separator items render a divider", () => {
    handle.updateSections([
      {
        title: "Test",
        items: [
          { id: "a", label: "A", action: vi.fn() },
          { id: "sep", label: "", action: vi.fn(), separator: true },
          { id: "b", label: "B", action: vi.fn() },
        ],
      },
    ]);

    const sep = handle.element.querySelector(".shell-menu__separator");
    expect(sep).not.toBeNull();
  });

  it("destroy removes global listeners", () => {
    handle.destroy();
    // Should not throw or have side effects after destroy
    handle.show(0, 0);
    document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  });

  it("multiple show/hide cycles work", () => {
    handle.show(10, 20);
    expect(handle.isVisible()).toBe(true);
    handle.hide();
    expect(handle.isVisible()).toBe(false);
    handle.show(30, 40);
    expect(handle.isVisible()).toBe(true);
    handle.hide();
    expect(handle.isVisible()).toBe(false);
  });

  it("updateSections clears previous content", () => {
    handle.updateSections([
      {
        title: "Test",
        items: [
          { id: "a", label: "A", action: vi.fn() },
          { id: "b", label: "B", action: vi.fn() },
          { id: "c", label: "C", action: vi.fn() },
        ],
      },
    ]);
    expect(handle.element.querySelectorAll(".shell-menu__item").length).toBe(3);

    handle.updateSections([
      {
        title: "Test",
        items: [{ id: "d", label: "D", action: vi.fn() }],
      },
    ]);
    expect(handle.element.querySelectorAll(".shell-menu__item").length).toBe(1);
  });
});
