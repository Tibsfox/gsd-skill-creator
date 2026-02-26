/**
 * ErrorDisplay -- Terminal-styled error renderer with recovery guidance.
 *
 * Renders error messages in the chat area with red styling. Recoverable
 * errors include retry guidance; non-recoverable errors direct users to
 * check configuration. All text rendered via textContent for XSS safety.
 */

export interface ErrorPayload {
  conversation_id?: string;
  error: string;
  recoverable: boolean;
}

export class ErrorDisplay {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  show(payload: ErrorPayload): void {
    const el = document.createElement("div");
    el.className = "cli-chat__error";

    // Build error text with context
    let text = "";
    if (payload.conversation_id) {
      text += `[${payload.conversation_id}] `;
    }
    text += payload.error;

    // Add recovery guidance based on recoverability
    if (payload.recoverable) {
      text +=
        "\n  -> Will retry automatically. If the problem persists, check your connection.";
    } else {
      text +=
        "\n  -> Check your API key configuration. Run /gsd:debug for diagnostics.";
    }

    // CRITICAL: use textContent, not innerHTML -- XSS prevention
    el.textContent = text;
    el.style.whiteSpace = "pre-wrap";
    this.container.appendChild(el);
  }

  clear(): void {
    const errors = this.container.querySelectorAll(".cli-chat__error");
    errors.forEach((el) => el.remove());
  }

  destroy(): void {
    this.clear();
  }
}
