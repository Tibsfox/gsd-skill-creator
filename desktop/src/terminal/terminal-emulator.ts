import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { FlowController } from "./flow-control";
import {
  ptyOpen,
  ptyWrite,
  ptyResize,
  ptyPause,
  ptyResume,
  ptyClose,
} from "./pty-bridge";
import { DEFAULT_TERMINAL_CONFIG } from "./types";
import type { TerminalConfig, FlowState } from "./types";

/** Handle returned by createTerminal for lifecycle management */
export interface TerminalHandle {
  /** The underlying xterm.js Terminal instance */
  terminal: Terminal;
  /** Current flow control state */
  getFlowState: () => FlowState;
  /** Clean up: close PTY session and dispose terminal */
  dispose: () => Promise<void>;
}

/**
 * Create a terminal emulator wired to a Rust PTY backend.
 *
 * Sets up xterm.js with addons (fit, webgl, web-links), opens a PTY session,
 * wires input forwarding (user keystrokes -> PTY), output rendering (PTY ->
 * xterm.js via FlowController), and resize propagation.
 *
 * @param container - DOM element to mount the terminal into
 * @param sessionId - Unique identifier for this PTY session
 * @param config - Optional terminal configuration overrides
 */
export async function createTerminal(
  container: HTMLElement,
  sessionId: string,
  config?: Partial<TerminalConfig>,
): Promise<TerminalHandle> {
  const mergedConfig = { ...DEFAULT_TERMINAL_CONFIG, ...config };

  // Create xterm.js Terminal
  const term = new Terminal({
    fontFamily: mergedConfig.fontFamily,
    fontSize: mergedConfig.fontSize,
    cols: mergedConfig.cols,
    rows: mergedConfig.rows,
    scrollback: mergedConfig.scrollback,
    allowProposedApi: true, // Required for some addons
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

  // Fit terminal to container
  fitAddon.fit();

  // Flow control: pause/resume PTY reads based on rendering backpressure
  const flow = new FlowController(
    term,
    () => {
      ptyPause(sessionId);
    },
    () => {
      ptyResume(sessionId);
    },
  );

  // Open PTY session -- spawns shell and starts streaming output
  await ptyOpen(
    { id: sessionId, cols: term.cols, rows: term.rows },
    (data: Uint8Array) => {
      flow.write(data);
    },
  );

  // Forward user input to PTY
  const inputDisposable = term.onData((data: string) => {
    ptyWrite(sessionId, data);
  });

  // Forward resize to PTY
  const resizeDisposable = term.onResize(({ cols, rows }) => {
    ptyResize(sessionId, cols, rows);
  });

  // Container resize observer for auto-fit (100ms debounce)
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => fitAddon.fit(), 100);
  });
  resizeObserver.observe(container);

  return {
    terminal: term,
    getFlowState: () => flow.getState(),
    dispose: async () => {
      resizeObserver.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      inputDisposable.dispose();
      resizeDisposable.dispose();
      await ptyClose(sessionId);
      term.dispose();
    },
  };
}
