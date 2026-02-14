import { invoke } from "@tauri-apps/api/core";
import type { ClaudeSessionInfo } from "./types";

/** Start a new Claude Code session in a tmux window */
export async function claudeStart(projectDir?: string): Promise<ClaudeSessionInfo> {
  return invoke<ClaudeSessionInfo>("claude_start", {
    projectDir: projectDir ?? null,
  });
}

/** Stop a running Claude Code session */
export async function claudeStop(id: string): Promise<void> {
  return invoke("claude_stop", { id });
}

/** List all tracked Claude sessions */
export async function claudeList(): Promise<ClaudeSessionInfo[]> {
  return invoke<ClaudeSessionInfo[]>("claude_list");
}

/** Get status of a specific Claude session */
export async function claudeStatus(id: string): Promise<ClaudeSessionInfo> {
  return invoke<ClaudeSessionInfo>("claude_status", { id });
}
