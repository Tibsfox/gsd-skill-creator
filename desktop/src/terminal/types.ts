/** Parameters for opening a PTY session */
export interface PtyOpenParams {
  id: string;
  shell?: string;
  cols: number;
  rows: number;
}

/** Flow control state */
export interface FlowState {
  paused: boolean;
  pendingCallbacks: number;
  written: number;
}

/** Terminal configuration */
export interface TerminalConfig {
  fontFamily: string;
  fontSize: number;
  cols?: number;
  rows?: number;
  scrollback?: number;
}

/** Default terminal configuration */
export const DEFAULT_TERMINAL_CONFIG: TerminalConfig = {
  fontFamily: '"IBM Plex Mono", "Courier New", monospace',
  fontSize: 14,
  scrollback: 5000,
};

/** Flow control constants */
export const CALLBACK_BYTE_LIMIT = 100_000;
export const HIGH_WATERMARK = 5;
export const LOW_WATERMARK = 2;
