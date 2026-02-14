/** tmux session info returned from Rust backend */
export interface TmuxSessionInfo {
  name: string;
  created: string;
  attached: boolean;
  windows: number;
}

/** Configuration for tmux-aware terminal */
export interface TmuxTerminalConfig {
  /** tmux session name (default: "gsd") */
  sessionName?: string;
  /** Terminal font family */
  fontFamily?: string;
  /** Terminal font size */
  fontSize?: number;
  /** Scrollback buffer size */
  scrollback?: number;
}

/** Default tmux session name */
export const DEFAULT_SESSION_NAME = "gsd";
