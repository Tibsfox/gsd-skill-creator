/** Status of a Claude Code session (mirrors Rust ClaudeStatus) */
export type ClaudeStatus = "active" | "paused" | "idle" | "starting" | "stopped";

/** Information about a Claude Code session */
export interface ClaudeSessionInfo {
  id: string;
  tmux_window: string;
  status: ClaudeStatus;
  started_at: number;
  last_activity: number;
  project_dir: string | null;
}

/** Status change event from Rust monitor */
export interface ClaudeStatusEvent {
  id: string;
  status: ClaudeStatus;
  timestamp: number;
}

/** Callback for session status changes */
export type StatusCallback = (event: ClaudeStatusEvent) => void;
