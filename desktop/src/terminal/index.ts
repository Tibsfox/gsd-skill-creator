// Terminal module public API
export { createTerminal } from "./terminal-emulator";
export type { TerminalHandle } from "./terminal-emulator";
export type { TerminalConfig, PtyOpenParams, FlowState } from "./types";
export {
  DEFAULT_TERMINAL_CONFIG,
  HIGH_WATERMARK,
  LOW_WATERMARK,
  CALLBACK_BYTE_LIMIT,
} from "./types";
export { FlowController } from "./flow-control";
export type { TerminalWriter } from "./flow-control";
export {
  ptyOpen,
  ptyWrite,
  ptyResize,
  ptyPause,
  ptyResume,
  ptyClose,
} from "./pty-bridge";
