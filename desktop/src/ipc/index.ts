export { greet, echoCommand } from "./commands";
export {
  sendChatMessage,
  getServiceStates,
  setMagicLevel,
  getMagicLevel,
  getConversationHistory,
  startService,
  stopService,
  restartService,
  getStagingStatus,
} from "./commands";
export { onEchoResponse } from "./events";
export {
  onChatDelta,
  onChatError,
  onServiceStateChange,
  onMagicLevelChanged,
  onStagingQuarantine,
} from "./events";
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
  ChatMessageResponse,
  ServiceState,
  MagicLevelResponse,
  MagicLevelState,
  ConversationHistory,
  ServiceCommandResult,
  StagingStatus,
  ChatDeltaPayload,
  ServiceStateChangePayload,
  MagicLevelChangedPayload,
  ChatErrorPayload,
  StagingQuarantinePayload,
} from "./types";
