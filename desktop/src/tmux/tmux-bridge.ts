import { invoke } from "@tauri-apps/api/core";
import type { TmuxSessionInfo } from "./types";

/** Check if tmux is installed on the system */
export async function tmuxHasTmux(): Promise<boolean> {
  return invoke<boolean>("tmux_has_tmux");
}

/** List all tmux sessions */
export async function tmuxListSessions(): Promise<TmuxSessionInfo[]> {
  return invoke<TmuxSessionInfo[]>("tmux_list_sessions");
}

/**
 * Ensure a tmux session exists (create if needed).
 * Returns the shell command args to attach to the session.
 * These args are passed to ptyOpen as the shell parameter.
 */
export async function tmuxEnsureSession(name: string): Promise<string[]> {
  return invoke<string[]>("tmux_ensure_session", { name });
}
