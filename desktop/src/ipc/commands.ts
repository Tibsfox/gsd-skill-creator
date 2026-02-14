import type { GreetResponse } from "./types";

export async function greet(_name: string): Promise<GreetResponse> {
  throw new Error("not implemented");
}

export async function echoCommand(_message: string): Promise<string> {
  throw new Error("not implemented");
}
