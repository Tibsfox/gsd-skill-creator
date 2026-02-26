import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders input element with monospace font", () => {
    const input = new ChatInput({
      container,
      onSubmit: vi.fn(),
    });
    input.mount();

    const el = container.querySelector("input");
    expect(el).not.toBeNull();
  });

  it("calls onSubmit with text on Enter", () => {
    const onSubmit = vi.fn();
    const chatInput = new ChatInput({ container, onSubmit });
    chatInput.mount();

    chatInput.setValue("hello");
    const el = container.querySelector("input")!;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSubmit).toHaveBeenCalledWith("hello");
  });

  it("clears input after submit", () => {
    const chatInput = new ChatInput({ container, onSubmit: vi.fn() });
    chatInput.mount();

    chatInput.setValue("hello");
    const el = container.querySelector("input")!;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(chatInput.getValue()).toBe("");
  });

  it("does not submit empty input", () => {
    const onSubmit = vi.fn();
    const chatInput = new ChatInput({ container, onSubmit });
    chatInput.mount();

    const el = container.querySelector("input")!;
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables input when disabled prop is true", () => {
    const chatInput = new ChatInput({
      container,
      onSubmit: vi.fn(),
      disabled: true,
    });
    chatInput.mount();

    const el = container.querySelector("input") as HTMLInputElement;
    expect(el.disabled).toBe(true);
  });

  it("shows placeholder text", () => {
    const chatInput = new ChatInput({
      container,
      onSubmit: vi.fn(),
      placeholder: "Claude is responding...",
    });
    chatInput.mount();

    const el = container.querySelector("input") as HTMLInputElement;
    expect(el.placeholder).toBe("Claude is responding...");
  });

  it("shows blinking cursor element when focused", () => {
    const chatInput = new ChatInput({ container, onSubmit: vi.fn() });
    chatInput.mount();

    const el = container.querySelector("input")!;
    el.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

    const cursor = container.querySelector(".cli-chat__cursor");
    expect(cursor).not.toBeNull();
    // Cursor should not have the hidden class when focused
    expect(cursor!.classList.contains("cli-chat__cursor--hidden")).toBe(false);
  });
});
