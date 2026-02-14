import type { TerminalHandle } from "../terminal/terminal-emulator";
import type { TmuxTerminalConfig } from "./types";
import { DEFAULT_SESSION_NAME } from "./types";
import { tmuxEnsureSession } from "./tmux-bridge";
import { ptyOpen, ptyWrite, ptyResize, ptyPause, ptyResume, ptyClose } from "../terminal/pty-bridge";
import { FlowController } from "../terminal/flow-control";
import { DEFAULT_TERMINAL_CONFIG } from "../terminal/types";
import type { FlowState } from "../terminal/types";

export interface TmuxTerminalHandle extends TerminalHandle {
  /** The tmux session name this terminal is attached to */
  sessionName: string;
  /** Detach from tmux session (session keeps running) */
  detach: () => Promise<void>;
}

/**
 * Create a terminal that attaches to a tmux session.
 *
 * 1. Calls tmuxEnsureSession() to create/find the gsd session
 * 2. Opens PTY with `tmux attach-session -t gsd` as the shell command
 * 3. Closing the terminal sends detach (Ctrl-B D) before closing PTY
 *    so the tmux session survives
 *
 * @param container - DOM element to mount xterm.js into
 * @param sessionId - Unique PTY session identifier
 * @param config - Optional tmux terminal configuration
 */
export async function createTmuxTerminal(
  container: HTMLElement,
  sessionId: string,
  config?: Partial<TmuxTerminalConfig>,
): Promise<TmuxTerminalHandle> {
  // TODO: implement
  throw new Error("Not implemented");
}
