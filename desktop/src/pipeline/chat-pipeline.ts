/**
 * ChatPipeline -- Wires API Client IPC events through the Magic Filter
 * to the CLI Chat renderer.
 *
 * Uses port interfaces for full testability without Tauri runtime.
 * The `handleEvent()` method is called both by Tauri listeners (in
 * production) and directly by tests.
 *
 * @module pipeline/chat-pipeline
 * @since Phase 383
 */

import type {
  ChatDeltaPayload,
  ChatErrorPayload,
} from "../ipc/types";

// ---------------------------------------------------------------------------
// Port interfaces (implemented by Phase 377 ChatRenderer, Phase 379 MagicFilter)
// ---------------------------------------------------------------------------

export interface ChatRendererPort {
  appendDelta(delta: string): void;
  appendMessage(role: string, content: string): void;
  showError(error: string, recoverable: boolean): void;
  showRetry(attempt: number, maxAttempts: number): void;
  setInputEnabled(enabled: boolean): void;
  showReady(): void;
}

export interface MagicFilterPort {
  getLevel(): number;
  setLevel(level: number): void;
  shouldRender(eventType: string): boolean;
}

export interface ChatPipelineConfig {
  magicFilter: MagicFilterPort;
  chatRenderer: ChatRendererPort;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class ChatPipeline {
  private magicFilter: MagicFilterPort;
  private chatRenderer: ChatRendererPort;
  private unsubscribers: Array<() => void> = [];
  private destroyed = false;

  constructor(config: ChatPipelineConfig) {
    this.magicFilter = config.magicFilter;
    this.chatRenderer = config.chatRenderer;
  }

  /**
   * Handle an IPC event synchronously. Routes through magic filter and
   * forwards to the chat renderer. Called by Tauri listeners internally
   * and directly by tests.
   */
  handleEvent(eventType: string, payload: unknown): void {
    if (this.destroyed) return;

    const p = payload as Record<string, unknown>;

    switch (eventType) {
      case "chat:start":
        this.chatRenderer.setInputEnabled(false);
        break;

      case "chat:delta":
        if (this.magicFilter.shouldRender("chat:delta")) {
          this.chatRenderer.appendDelta((p as ChatDeltaPayload).delta);
        }
        break;

      case "chat:complete":
        this.chatRenderer.setInputEnabled(true);
        break;

      case "chat:error":
        this.chatRenderer.showError(
          (p as ChatErrorPayload).error,
          (p as ChatErrorPayload).recoverable,
        );
        break;

      case "chat:retry":
        this.chatRenderer.showRetry(
          p.attempt as number,
          p.max_attempts as number,
        );
        break;

      default:
        // Non-chat events: respect magic filter
        if (this.magicFilter.shouldRender(eventType)) {
          this.chatRenderer.appendMessage("system", String(p.message ?? ""));
        }
        break;
    }
  }

  /**
   * Start listening to Tauri IPC events. Requires Tauri runtime.
   * For testing, use `handleEvent()` directly instead.
   */
  async start(): Promise<void> {
    const { onChatDelta, onChatError, onMagicLevelChanged } = await import(
      "../ipc/events"
    );
    const { listen } = await import("@tauri-apps/api/event");

    const unsubStart = await listen<{ conversation_id: string }>(
      "chat:start",
      (event) => this.handleEvent("chat:start", event.payload),
    );
    this.unsubscribers.push(unsubStart);

    const unsubDelta = await onChatDelta((payload: ChatDeltaPayload) => {
      this.handleEvent("chat:delta", payload);
    });
    this.unsubscribers.push(unsubDelta);

    const unsubComplete = await listen<{
      conversation_id: string;
      stop_reason: string;
    }>("chat:complete", (event) =>
      this.handleEvent("chat:complete", event.payload),
    );
    this.unsubscribers.push(unsubComplete);

    const unsubError = await onChatError((payload: ChatErrorPayload) => {
      this.handleEvent("chat:error", payload);
    });
    this.unsubscribers.push(unsubError);

    const unsubRetry = await listen<{
      attempt: number;
      max_attempts: number;
      delay_ms: number;
    }>("chat:retry", (event) =>
      this.handleEvent("chat:retry", event.payload),
    );
    this.unsubscribers.push(unsubRetry);

    const unsubMagic = await onMagicLevelChanged((payload) => {
      this.magicFilter.setLevel(payload.level);
    });
    this.unsubscribers.push(unsubMagic);
  }

  /** Unsubscribe from all IPC listeners and mark pipeline as destroyed. */
  destroy(): void {
    this.destroyed = true;
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }
}

export function createChatPipeline(config: ChatPipelineConfig): ChatPipeline {
  return new ChatPipeline(config);
}
