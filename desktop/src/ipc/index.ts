export { greet, echoCommand } from "./commands";
export { onEchoResponse } from "./events";
export { streamEchoData } from "./channels";
export { runIpcBenchmark } from "./benchmark";
export {
  startWatcher,
  stopWatcher,
  watcherStatus,
  onFileChanged,
  onWatcherError,
} from "./watcher";
export type { BenchmarkReport } from "./benchmark";
export type { FileChangeEvent, WatcherEventBatch } from "./watcher";
export type {
  GreetResponse,
  EchoPayload,
  ChannelChunk,
  BenchmarkResult,
} from "./types";
