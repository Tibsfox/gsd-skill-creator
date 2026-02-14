export { greet, echoCommand } from "./commands";
export { onEchoResponse } from "./events";
export { streamEchoData } from "./channels";
export { runIpcBenchmark } from "./benchmark";
export type { BenchmarkReport } from "./benchmark";
export type {
  GreetResponse,
  EchoPayload,
  ChannelChunk,
  BenchmarkResult,
} from "./types";
