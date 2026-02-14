import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
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
  const sessionName = config?.sessionName ?? DEFAULT_SESSION_NAME;
  const mergedConfig = {
    fontFamily: config?.fontFamily ?? DEFAULT_TERMINAL_CONFIG.fontFamily,
    fontSize: config?.fontSize ?? DEFAULT_TERMINAL_CONFIG.fontSize,
    scrollback: config?.scrollback ?? DEFAULT_TERMINAL_CONFIG.scrollback,
  };

  // 1. Ensure tmux session exists, get attach command args
  const attachCmd = await tmuxEnsureSession(sessionName);
  // attachCmd = ["tmux", "attach-session", "-t", "gsd"]
  const shell = attachCmd[0]; // "tmux"
  const args = attachCmd.slice(1); // ["attach-session", "-t", "gsd"]

  // 2. Create xterm.js Terminal
  const term = new Terminal({
    fontFamily: mergedConfig.fontFamily,
    fontSize: mergedConfig.fontSize,
    scrollback: mergedConfig.scrollback,
    allowProposedApi: true,
  });

  // Load addons
  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.loadAddon(new WebLinksAddon());
  term.open(container);

  // WebGL renderer with fallback to DOM
  try {
    term.loadAddon(new WebglAddon());
  } catch {
    // WebGL not available -- fall back to default DOM renderer
  }

  fitAddon.fit();

  // 3. Flow control
  const flow = new FlowController(
    term,
    () => { ptyPause(sessionId); },
    () => { ptyResume(sessionId); },
  );

  // 4. Open PTY with tmux attach command
  await ptyOpen(
    { id: sessionId, shell, args, cols: term.cols, rows: term.rows },
    (data: Uint8Array) => { flow.write(data); },
  );

  // 5. Wire input and resize
  const inputDisposable = term.onData((data: string) => {
    ptyWrite(sessionId, data);
  });
  const resizeDisposable = term.onResize(({ cols, rows }) => {
    ptyResize(sessionId, cols, rows);
  });

  // 6. Container resize observer (100ms debounce)
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => fitAddon.fit(), 100);
  });
  resizeObserver.observe(container);

  // 7. Detach function: send tmux detach key (Ctrl-B D)
  const detach = async (): Promise<void> => {
    // tmux prefix key (Ctrl-B) followed by 'd' for detach
    await ptyWrite(sessionId, "\x02d");
    // Small delay to let tmux process the detach
    await new Promise((resolve) => setTimeout(resolve, 100));
  };

  return {
    terminal: term,
    sessionName,
    getFlowState: () => flow.getState(),
    detach,
    dispose: async () => {
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      inputDisposable.dispose();
      resizeDisposable.dispose();
      // Detach from tmux first (session survives)
      await detach();
      // Then close the PTY
      await ptyClose(sessionId);
      term.dispose();
    },
  };
}
