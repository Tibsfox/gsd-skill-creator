/**
 * CliChat -- Terminal-styled chat interface for GSD-OS.
 *
 * Main container component that manages chat state, renders messages,
 * handles IPC event subscriptions for streaming responses, and displays
 * the READY. boot sequence on Claude connection. All message content
 * is rendered via textContent (never innerHTML) for XSS prevention.
 */

import { ChatInput } from "./ChatInput";
import { StreamingText } from "./StreamingText";
import type { ChatDeltaPayload, ServiceStateChangePayload } from "../ipc/types";

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  tokenUsage?: { input: number; output: number };
}

export interface CliChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  currentStreamText: string;
  connectionStatus: "disconnected" | "connecting" | "ready" | "error";
}

interface ChatStartPayload {
  conversation_id: string;
  model: string;
  timestamp: string;
}

interface ChatCompletePayload {
  conversation_id: string;
  stop_reason: string;
  usage: { input_tokens: number; output_tokens: number };
}

// ============================================================================
// Component
// ============================================================================

export class CliChat {
  private container: HTMLElement;
  private wrapper: HTMLElement | null = null;
  private messagesEl: HTMLElement | null = null;
  private streamingContainer: HTMLElement | null = null;
  private chatInput: ChatInput | null = null;
  private streamingText: StreamingText | null = null;
  private unsubscribers: Array<() => void> = [];

  public state: CliChatState = {
    messages: [],
    isStreaming: false,
    currentStreamText: "",
    connectionStatus: "disconnected",
  };

  constructor(opts: { container: HTMLElement }) {
    this.container = opts.container;
  }

  mount(): void {
    // Create main wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.className = "cli-chat";

    // Messages area
    this.messagesEl = document.createElement("div");
    this.messagesEl.className = "cli-chat__messages";

    // Streaming text container (lives inside messages area)
    this.streamingContainer = document.createElement("div");
    this.streamingContainer.className = "cli-chat__streaming-container";
    this.streamingContainer.style.display = "none";

    this.streamingText = new StreamingText({
      container: this.streamingContainer,
    });
    this.streamingText.mount();

    this.messagesEl.appendChild(this.streamingContainer);

    // Chat input
    this.chatInput = new ChatInput({
      container: this.wrapper,
      onSubmit: (text: string) => this.addUserMessage(text),
    });

    this.wrapper.appendChild(this.messagesEl);
    this.chatInput.mount();

    this.container.appendChild(this.wrapper);

    // Subscribe to IPC events (wrap in try/catch for test environment)
    this.subscribeToIpcEvents();
  }

  destroy(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.chatInput?.destroy();
    this.streamingText?.destroy();
    this.wrapper?.remove();
    this.wrapper = null;
    this.messagesEl = null;
    this.streamingContainer = null;
    this.chatInput = null;
    this.streamingText = null;
  }

  // ============================================================================
  // IPC Event Handlers (exposed for testing)
  // ============================================================================

  handleServiceStatus(payload: { service_id: string; status: string }): void {
    if (payload.service_id === "claude" && payload.status === "online") {
      this.state.connectionStatus = "ready";
      this.renderReadySequence();
    }
  }

  handleChatStart(payload: ChatStartPayload): void {
    this.state.isStreaming = true;
    this.state.currentStreamText = "";

    this.streamingText?.reset();
    if (this.streamingContainer) {
      this.streamingContainer.style.display = "block";
    }

    this.chatInput?.setDisabled(true);
    this.chatInput?.setPlaceholder("Claude is responding...");
  }

  handleChatDelta(payload: ChatDeltaPayload): void {
    this.state.currentStreamText += payload.delta;
    this.streamingText?.appendDelta(payload.delta);
  }

  handleChatComplete(payload: ChatCompletePayload): void {
    const fullText = this.streamingText?.getText() ?? this.state.currentStreamText;
    this.streamingText?.finalize();

    // Create assistant message
    const message: ChatMessage = {
      id: this.generateId(),
      role: "assistant",
      content: fullText,
      timestamp: new Date().toISOString(),
      tokenUsage: {
        input: payload.usage.input_tokens,
        output: payload.usage.output_tokens,
      },
    };
    this.state.messages.push(message);
    this.renderMessage(message);

    // Hide streaming container and reset
    if (this.streamingContainer) {
      this.streamingContainer.style.display = "none";
    }
    this.streamingText?.reset();

    this.state.isStreaming = false;
    this.state.currentStreamText = "";

    this.chatInput?.setDisabled(false);
    this.chatInput?.setPlaceholder("");
  }

  addUserMessage(text: string): void {
    const message: ChatMessage = {
      id: this.generateId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    this.state.messages.push(message);
    this.renderMessage(message);

    // Send via IPC (wrap in try/catch for test environment)
    this.sendMessage(text);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private renderReadySequence(): void {
    const lines = ["GSD-OS v0.1.0", "Claude connected.", "READY."];
    for (const line of lines) {
      const sysMsg: ChatMessage = {
        id: this.generateId(),
        role: "system",
        content: line,
        timestamp: new Date().toISOString(),
      };
      this.state.messages.push(sysMsg);
      this.renderMessage(sysMsg);
    }
  }

  private renderMessage(msg: ChatMessage): void {
    if (!this.messagesEl) return;

    const el = document.createElement("div");

    switch (msg.role) {
      case "system":
        el.className = "cli-chat__system";
        break;
      case "user":
        el.className = "cli-chat__user";
        break;
      case "assistant":
        el.className = "cli-chat__assistant";
        break;
    }

    // CRITICAL: textContent only, never innerHTML -- XSS prevention
    el.textContent = msg.content;

    // Insert before the streaming container (keeps streaming area at bottom)
    if (this.streamingContainer) {
      this.messagesEl.insertBefore(el, this.streamingContainer);
    } else {
      this.messagesEl.appendChild(el);
    }
  }

  private async subscribeToIpcEvents(): Promise<void> {
    try {
      const { onChatDelta, onChatError, onServiceStateChange } = await import(
        "../ipc/events"
      );

      const unsubDelta = await onChatDelta((payload) => {
        this.handleChatDelta(payload);
      });
      this.unsubscribers.push(unsubDelta);

      const unsubError = await onChatError((payload) => {
        // Error handling will be wired in Plan 377-02/Phase 383
        console.error("[CliChat] Error:", payload.error);
      });
      this.unsubscribers.push(unsubError);

      const unsubService = await onServiceStateChange(
        (payload: ServiceStateChangePayload) => {
          this.handleServiceStatus({
            service_id: payload.service_id,
            status: payload.to_status,
          });
        },
      );
      this.unsubscribers.push(unsubService);
    } catch {
      // Not running in Tauri runtime (test environment) -- IPC not available
    }
  }

  private async sendMessage(text: string): Promise<void> {
    try {
      const { sendChatMessage } = await import("../ipc/commands");
      await sendChatMessage(text);
    } catch {
      // Not running in Tauri runtime (test environment)
    }
  }

  private generateId(): string {
    try {
      return crypto.randomUUID();
    } catch {
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
  }
}
