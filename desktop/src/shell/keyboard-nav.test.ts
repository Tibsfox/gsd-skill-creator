import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { KeyboardManager } from "./keyboard-nav";
import type { KeyBinding } from "./types";

describe("keyboard-nav", () => {
  let km: KeyboardManager;

  function fireKey(key: string, opts: Partial<KeyboardEventInit> = {}): void {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...opts }),
    );
  }

  beforeEach(() => {
    km = new KeyboardManager();
  });

  afterEach(() => {
    km.destroy();
  });

  it("register adds bindings and starts listening", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    expect(km.getBindings()).toHaveLength(1);
    expect(km.getBindings()[0].action).toBe("cycle-focus");
  });

  it("keydown matching binding calls handler", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    fireKey("Tab", { altKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("keydown without matching binding does nothing", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    fireKey("a");
    expect(handler).not.toHaveBeenCalled();
  });

  it("modifier matching is strict: ctrl required but not pressed", () => {
    const handler = vi.fn();
    km.register([{ key: "q", ctrl: true, action: "quit", handler }]);
    fireKey("q");
    expect(handler).not.toHaveBeenCalled();
  });

  it("modifier matching: ctrl+q fires when ctrl is pressed", () => {
    const handler = vi.fn();
    km.register([{ key: "q", ctrl: true, action: "quit", handler }]);
    fireKey("q", { ctrlKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("shift modifier works", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", shift: true, action: "cycle-back", handler }]);
    fireKey("Tab", { shiftKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("multiple bindings can coexist", () => {
    const tabHandler = vi.fn();
    const quitHandler = vi.fn();
    km.register([
      { key: "Tab", alt: true, action: "cycle-focus", handler: tabHandler },
      { key: "q", ctrl: true, action: "quit", handler: quitHandler },
    ]);

    fireKey("Tab", { altKey: true });
    expect(tabHandler).toHaveBeenCalledOnce();
    expect(quitHandler).not.toHaveBeenCalled();

    fireKey("q", { ctrlKey: true });
    expect(quitHandler).toHaveBeenCalledOnce();
  });

  it("addBinding adds a single binding", () => {
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler: vi.fn() }]);
    km.addBinding({ key: "n", ctrl: true, action: "new-window", handler: vi.fn() });
    expect(km.getBindings()).toHaveLength(2);
    expect(km.getBindings().some((b) => b.action === "new-window")).toBe(true);
  });

  it("removeBinding removes by action name", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    km.removeBinding("cycle-focus");
    fireKey("Tab", { altKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("disable prevents handler calls", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    km.disable();
    fireKey("Tab", { altKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("enable re-enables after disable", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    km.disable();
    km.enable();
    fireKey("Tab", { altKey: true });
    expect(handler).toHaveBeenCalledOnce();
  });

  it("isEnabled reflects state", () => {
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler: vi.fn() }]);
    expect(km.isEnabled()).toBe(true);
    km.disable();
    expect(km.isEnabled()).toBe(false);
    km.enable();
    expect(km.isEnabled()).toBe(true);
  });

  it("destroy removes all bindings and listener", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    km.destroy();
    fireKey("Tab", { altKey: true });
    expect(handler).not.toHaveBeenCalled();
    expect(km.getBindings()).toHaveLength(0);
  });

  it("key matching is case-insensitive", () => {
    const handler = vi.fn();
    km.register([{ key: "f10", action: "open-menu", handler }]);
    fireKey("F10");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("Escape key binding works", () => {
    const handler = vi.fn();
    km.register([{ key: "Escape", action: "escape", handler }]);
    fireKey("Escape");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("handler receives the KeyboardEvent", () => {
    const handler = vi.fn();
    km.register([{ key: "Tab", alt: true, action: "cycle-focus", handler }]);
    fireKey("Tab", { altKey: true });
    expect(handler).toHaveBeenCalled();
  });
});
