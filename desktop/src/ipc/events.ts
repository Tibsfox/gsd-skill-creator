import { listen } from "@tauri-apps/api/event";
import type { EchoPayload } from "./types";

export async function onEchoResponse(
  callback: (payload: EchoPayload) => void,
): Promise<() => void> {
  return listen<EchoPayload>("echo-response", (event) => {
    callback(event.payload);
  });
}
