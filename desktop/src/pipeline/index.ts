/**
 * Pipeline barrel -- exports all integration wiring modules.
 *
 * @module pipeline
 * @since Phase 383
 */

export { ChatPipeline, createChatPipeline } from "./chat-pipeline";
export type {
  ChatRendererPort,
  MagicFilterPort,
  ChatPipelineConfig,
} from "./chat-pipeline";

export { LedBridge, createLedBridge } from "./led-bridge";
export type { LedPanelPort, LedBridgeConfig } from "./led-bridge";

export { StagingBridge, createStagingBridge } from "./staging-bridge";
export type {
  StagingIntakeCompletePayload,
  StagingBridgeConfig,
} from "./staging-bridge";

export { BootstrapFlow, createBootstrapFlow } from "./bootstrap-flow";
export type {
  BootstrapStage,
  BootstrapFlowConfig,
  IpcCommandsPort,
} from "./bootstrap-flow";

export { ErrorRecoveryManager, createErrorRecovery } from "./error-recovery";
export type {
  ServiceFailedPayload,
  ErrorRecoveryConfig,
} from "./error-recovery";

export { PersistenceManager, createPersistenceManager } from "./persistence-manager";
export type {
  PersistenceConfig,
  ConversationSnapshot,
} from "./persistence-manager";
