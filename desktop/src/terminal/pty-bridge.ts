import { invoke, Channel } from "@tauri-apps/api/core";
import type { PtyOpenParams } from "./types";

/**
 * Open a PTY session. Spawns a shell process on the Rust backend
 * and streams output via Tauri Channel as binary Uint8Array chunks.
 *
 * @param params - Session id, optional shell path, initial cols/rows
 * @param onData - Callback for each PTY output chunk (Uint8Array)
 */
export async function ptyOpen(
  params: PtyOpenParams,
  onData: (data: Uint8Array) => void,
): Promise<void> {
  const channel = new Channel<Uint8Array>();
  channel.onmessage = (raw: Uint8Array | number[]) => {
    // Normalize: Tauri sends number[] for small payloads (<1024 bytes)
    // and Uint8Array for larger payloads. Always convert to Uint8Array.
    const data = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
    onData(data);
  };
  await invoke("pty_open", {
    id: params.id,
    shell: params.shell ?? null,
    args: params.args ?? null,
    cols: params.cols,
    rows: params.rows,
    onData: channel,
  });
}

/** Send user input to the PTY session */
export async function ptyWrite(id: string, data: string): Promise<void> {
  await invoke("pty_write", { id, data });
}

/** Resize the PTY to new dimensions */
export async function ptyResize(id: string, cols: number, rows: number): Promise<void> {
  await invoke("pty_resize", { id, cols, rows });
}

/** Flow control: pause PTY output (reader thread blocks) */
export async function ptyPause(id: string): Promise<void> {
  await invoke("pty_pause", { id });
}

/** Flow control: resume PTY output (reader thread unblocks) */
export async function ptyResume(id: string): Promise<void> {
  await invoke("pty_resume", { id });
}

/** Close and clean up the PTY session */
export async function ptyClose(id: string): Promise<void> {
  await invoke("pty_close", { id });
}
