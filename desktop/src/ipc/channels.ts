import type { ChannelChunk } from "./types";

export async function streamEchoData(
  _payloadSize: number,
  _chunkCount: number,
  _onChunk: (chunk: ChannelChunk) => void,
): Promise<void> {
  throw new Error("not implemented");
}
