import { invoke, Channel } from "@tauri-apps/api/core";
import type { ChannelChunk } from "./types";

export async function streamEchoData(
  payloadSize: number,
  chunkCount: number,
  onChunk: (chunk: ChannelChunk) => void,
): Promise<void> {
  const channel = new Channel<ChannelChunk>();
  channel.onmessage = onChunk;
  await invoke("echo_channel", { channel, payloadSize, chunkCount });
}
