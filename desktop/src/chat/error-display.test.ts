import { describe, it, expect, beforeEach } from "vitest";
import { ErrorDisplay } from "./error-display";

describe("ErrorDisplay", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders error message with red class", () => {
    const display = new ErrorDisplay(container);
    display.show({ error: "Connection lost", recoverable: true });

    const el = container.querySelector(".cli-chat__error");
    expect(el).not.toBeNull();
    expect(el!.textContent).toContain("Connection lost");
  });

  it("includes recovery guidance for recoverable errors", () => {
    const display = new ErrorDisplay(container);
    display.show({ error: "Timeout", recoverable: true });

    const el = container.querySelector(".cli-chat__error");
    expect(el!.textContent!.toLowerCase()).toMatch(/retry/);
  });

  it("shows different guidance for non-recoverable errors", () => {
    const display = new ErrorDisplay(container);
    display.show({ error: "Invalid API key", recoverable: false });

    const el = container.querySelector(".cli-chat__error");
    const text = el!.textContent!.toLowerCase();
    expect(text).toMatch(/check|configuration/);
  });

  it("renders error with conversation_id context", () => {
    const display = new ErrorDisplay(container);
    display.show({
      conversation_id: "abc-123",
      error: "Server error",
      recoverable: true,
    });

    const el = container.querySelector(".cli-chat__error");
    expect(el!.textContent).toContain("abc-123");
  });

  it("multiple errors render in sequence", () => {
    const display = new ErrorDisplay(container);
    display.show({ error: "Error 1", recoverable: true });
    display.show({ error: "Error 2", recoverable: false });

    const errors = container.querySelectorAll(".cli-chat__error");
    expect(errors.length).toBe(2);
  });

  it("error text is escaped (no HTML injection)", () => {
    const display = new ErrorDisplay(container);
    display.show({
      error: "<script>alert(1)</script>",
      recoverable: false,
    });

    const el = container.querySelector(".cli-chat__error");
    // textContent should contain literal angle brackets
    expect(el!.textContent).toContain("<script>");
    // No actual script element should exist
    expect(container.querySelector("script")).toBeNull();
  });

  it("clear() removes all error elements", () => {
    const display = new ErrorDisplay(container);
    display.show({ error: "Error 1", recoverable: true });
    display.show({ error: "Error 2", recoverable: false });

    display.clear();
    const errors = container.querySelectorAll(".cli-chat__error");
    expect(errors.length).toBe(0);
  });
});
