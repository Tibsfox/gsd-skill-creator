import { invoke } from "@tauri-apps/api/core";
import type { GreetResponse } from "./types";

export async function greet(name: string): Promise<GreetResponse> {
  return invoke<GreetResponse>("greet", { name });
}

export async function echoCommand(message: string): Promise<string> {
  // echo_event emits an event on the Rust side and returns void.
  // echoCommand returns the message locally for convenience.
  await invoke("echo_event", { message });
  return message;
}
