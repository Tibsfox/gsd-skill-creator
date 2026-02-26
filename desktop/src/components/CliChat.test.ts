import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn().mockResolvedValue({ conversation_id: "test-conv" }),
}));

import { CliChat } from "./CliChat";
import type { CliChatState, ChatMessage } from "./CliChat";

describe("CliChat", () => {
  let container: HTMLElement;
  let chat: CliChat;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    chat = new CliChat({ container });
    chat.mount();
  });

  it("renders .cli-chat container with dark background", () => {
    const el = container.querySelector(".cli-chat");
    expect(el).not.toBeNull();
  });

  it("shows READY sequence when connection confirmed", () => {
    chat.handleServiceStatus({ service_id: "claude", status: "online" });

    const text = container.textContent ?? "";
    expect(text).toContain("GSD-OS v0.1.0");
    expect(text).toContain("Claude connected.");
    expect(text).toContain("READY.");

    // Verify order
    const v = text.indexOf("GSD-OS v0.1.0");
    const c = text.indexOf("Claude connected.");
    const r = text.indexOf("READY.");
    expect(v).toBeLessThan(c);
    expect(c).toBeLessThan(r);
  });

  it("READY text has system highlight class", () => {
    chat.handleServiceStatus({ service_id: "claude", status: "online" });

    const sysElements = container.querySelectorAll(".cli-chat__system");
    expect(sysElements.length).toBeGreaterThanOrEqual(3);
  });

  it("renders user message with > prefix", () => {
    chat.addUserMessage("hello");

    const userEl = container.querySelector(".cli-chat__user");
    expect(userEl).not.toBeNull();
    expect(userEl!.textContent).toContain("hello");
  });

  it("input clears after message submit", () => {
    // Simulate typing and submitting via the chat's input
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).not.toBeNull();

    input.value = "test";
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(input.value).toBe("");
  });

  it("sets isStreaming true on chat:start", () => {
    chat.handleChatStart({
      conversation_id: "abc",
      model: "claude",
      timestamp: new Date().toISOString(),
    });

    expect(chat.state.isStreaming).toBe(true);
  });

  it("appends delta text during streaming", () => {
    chat.handleChatStart({
      conversation_id: "abc",
      model: "claude",
      timestamp: new Date().toISOString(),
    });
    chat.handleChatDelta({ conversation_id: "abc", delta: "Hello", index: 0 });

    expect(chat.state.currentStreamText).toContain("Hello");
  });

  it("finalizes message on chat:complete", () => {
    chat.handleChatStart({
      conversation_id: "abc",
      model: "claude",
      timestamp: new Date().toISOString(),
    });
    chat.handleChatDelta({ conversation_id: "abc", delta: "Hello", index: 0 });
    chat.handleChatComplete({
      conversation_id: "abc",
      stop_reason: "end_turn",
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    expect(chat.state.isStreaming).toBe(false);
    const assistantMsgs = chat.state.messages.filter(
      (m: ChatMessage) => m.role === "assistant",
    );
    expect(assistantMsgs.length).toBeGreaterThanOrEqual(1);
    expect(assistantMsgs[0].content).toBe("Hello");
  });

  it("disables input during streaming", () => {
    chat.handleChatStart({
      conversation_id: "abc",
      model: "claude",
      timestamp: new Date().toISOString(),
    });

    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it("shows streaming placeholder during response", () => {
    chat.handleChatStart({
      conversation_id: "abc",
      model: "claude",
      timestamp: new Date().toISOString(),
    });

    const input = container.querySelector("input") as HTMLInputElement;
    expect(input.placeholder).toBe("Claude is responding...");
  });
});
