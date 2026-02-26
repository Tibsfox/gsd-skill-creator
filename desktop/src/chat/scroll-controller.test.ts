import { describe, it, expect, beforeEach } from "vitest";
import { ScrollController } from "./scroll-controller";

function mockScrollable(
  el: HTMLElement,
  props: { scrollHeight: number; clientHeight: number; scrollTop: number },
): void {
  Object.defineProperty(el, "scrollHeight", {
    value: props.scrollHeight,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: props.clientHeight,
    configurable: true,
    writable: true,
  });
  el.scrollTop = props.scrollTop;
}

describe("ScrollController", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("auto-scrolls to bottom on new content when at bottom", () => {
    // User is at bottom: scrollTop = scrollHeight - clientHeight
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 300,
    });

    const sc = new ScrollController(container);
    sc.onNewContent();

    expect(container.scrollTop).toBe(300); // scrollHeight - clientHeight
  });

  it("preserves scroll position when user scrolled up", () => {
    // User is at top
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 0,
    });

    const sc = new ScrollController(container);
    sc.onNewContent();

    expect(container.scrollTop).toBe(0);
  });

  it("isAtBottom returns true within threshold", () => {
    // 10px from bottom, threshold is 50 (default)
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 290, // 500 - 200 - 290 = 10, within 50
    });

    const sc = new ScrollController(container);
    expect(sc.isAtBottom()).toBe(true);
  });

  it("isAtBottom returns false when far from bottom", () => {
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 0,
    });

    const sc = new ScrollController(container);
    expect(sc.isAtBottom()).toBe(false);
  });

  it("shows indicator when not at bottom and new content arrives", () => {
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 0,
    });

    const sc = new ScrollController(container);
    sc.onNewContent();

    expect(sc.indicatorVisible).toBe(true);
  });

  it("hides indicator when user scrolls to bottom", () => {
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 0,
    });

    const sc = new ScrollController(container);
    sc.onNewContent();
    expect(sc.indicatorVisible).toBe(true);

    sc.scrollToBottom();
    expect(sc.indicatorVisible).toBe(false);
  });

  it("scrollToBottom sets scrollTop and hides indicator", () => {
    mockScrollable(container, {
      scrollHeight: 500,
      clientHeight: 200,
      scrollTop: 0,
    });

    const sc = new ScrollController(container);
    sc.scrollToBottom();

    expect(container.scrollTop).toBe(300); // 500 - 200
    expect(sc.indicatorVisible).toBe(false);
  });

  it("creates indicator DOM element with correct class", () => {
    const sc = new ScrollController(container);

    const indicator = container.querySelector(".cli-chat__scroll-indicator");
    expect(indicator).not.toBeNull();
  });
});
