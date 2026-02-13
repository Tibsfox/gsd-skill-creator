/**
 * tmux session detection and command building for Wetty.
 *
 * Detects active tmux sessions and builds the --command string
 * that Wetty uses to attach to or create tmux sessions.
 *
 * @module terminal/session
 */

import { execSync } from 'node:child_process';

/**
 * List active tmux session names.
 *
 * Runs `tmux list-sessions -F '#{session_name}'` and returns
 * an array of session names. Returns empty array if tmux is
 * not installed or no sessions exist.
 */
export function listTmuxSessions(): string[] {
  try {
    const output = execSync('tmux list-sessions -F "#{session_name}"', {
      encoding: 'utf-8',
      timeout: 5000,
    });
    return output
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  } catch {
    return [];
  }
}

/**
 * Build the shell command string for Wetty's --command flag.
 *
 * Returns a compound command that attaches to an existing session
 * or creates a new one: `tmux attach -t {name} || tmux new -s {name}`.
 * This is executed each time a browser tab connects to Wetty, so it
 * handles both cases (session exists or not) at runtime.
 *
 * @param sessionName - The tmux session name to target
 */
export function buildSessionCommand(sessionName: string): string {
  return `tmux attach -t ${sessionName} || tmux new -s ${sessionName}`;
}
