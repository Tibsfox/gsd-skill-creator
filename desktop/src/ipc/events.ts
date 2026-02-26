import { listen } from "@tauri-apps/api/event";
import type {
  EchoPayload,
  ChatDeltaPayload,
  ChatErrorPayload,
  ServiceStateChangePayload,
  MagicLevelChangedPayload,
  StagingQuarantinePayload,
} from "./types";

export async function onEchoResponse(
  callback: (payload: EchoPayload) => void,
): Promise<() => void> {
  return listen<EchoPayload>("echo-response", (event) => {
    callback(event.payload);
  });
}

// ============================================================================
// GSD-OS IPC event listeners (Phase 375-02)
// ============================================================================

/** Listen for streaming chat text deltas. */
export async function onChatDelta(
  callback: (payload: ChatDeltaPayload) => void,
): Promise<() => void> {
  return listen<ChatDeltaPayload>("chat:delta", (event) => {
    callback(event.payload);
  });
}

/** Listen for chat errors. */
export async function onChatError(
  callback: (payload: ChatErrorPayload) => void,
): Promise<() => void> {
  return listen<ChatErrorPayload>("chat:error", (event) => {
    callback(event.payload);
  });
}

/** Listen for service state transitions. */
export async function onServiceStateChange(
  callback: (payload: ServiceStateChangePayload) => void,
): Promise<() => void> {
  return listen<ServiceStateChangePayload>("service:state_change", (event) => {
    callback(event.payload);
  });
}

/** Listen for magic level changes. */
export async function onMagicLevelChanged(
  callback: (payload: MagicLevelChangedPayload) => void,
): Promise<() => void> {
  return listen<MagicLevelChangedPayload>("magic:level_changed", (event) => {
    callback(event.payload);
  });
}

/** Listen for staging quarantine events. */
export async function onStagingQuarantine(
  callback: (payload: StagingQuarantinePayload) => void,
): Promise<() => void> {
  return listen<StagingQuarantinePayload>("staging:quarantine", (event) => {
    callback(event.payload);
  });
}
