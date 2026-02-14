import type { EchoPayload } from "./types";

export async function onEchoResponse(
  _callback: (payload: EchoPayload) => void,
): Promise<() => void> {
  throw new Error("not implemented");
}
