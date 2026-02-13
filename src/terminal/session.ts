/**
 * tmux session detection and command building for Wetty.
 *
 * Detects active tmux sessions and builds the --command string
 * that Wetty uses to attach to or create tmux sessions.
 *
 * @module terminal/session
 */

/**
 * List active tmux session names.
 *
 * Runs `tmux list-sessions -F '#{session_name}'` and returns
 * an array of session names. Returns empty array if tmux is
 * not installed or no sessions exist.
 */
export function listTmuxSessions(): string[] {
  throw new Error('not implemented');
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
  throw new Error('not implemented');
}
