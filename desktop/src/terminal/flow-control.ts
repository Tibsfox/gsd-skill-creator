import { CALLBACK_BYTE_LIMIT, HIGH_WATERMARK, LOW_WATERMARK } from "./types";
import type { FlowState } from "./types";

/** Minimal Terminal interface for flow control (avoids importing full xterm.js) */
export interface TerminalWriter {
  write(data: Uint8Array | string, callback?: () => void): void;
}

export class FlowController {
  private written = 0;
  private pendingCallbacks = 0;
  private paused = false;

  constructor(
    private term: TerminalWriter,
    private onPause: () => void,
    private onResume: () => void,
  ) {}

  /** Write a chunk received from PTY via Channel. Manages watermark-based backpressure. */
  write(data: Uint8Array): void {
    this.written += data.length;

    if (this.written > CALLBACK_BYTE_LIMIT) {
      this.pendingCallbacks++;
      this.written = 0;

      this.term.write(data, () => {
        this.pendingCallbacks = Math.max(this.pendingCallbacks - 1, 0);
        if (this.paused && this.pendingCallbacks < LOW_WATERMARK) {
          this.paused = false;
          this.onResume();
        }
      });

      if (!this.paused && this.pendingCallbacks > HIGH_WATERMARK) {
        this.paused = true;
        this.onPause();
      }
    } else {
      this.term.write(data);
    }
  }

  /** Get current flow control state for diagnostics */
  getState(): FlowState {
    return {
      paused: this.paused,
      pendingCallbacks: this.pendingCallbacks,
      written: this.written,
    };
  }
}
