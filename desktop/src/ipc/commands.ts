import { invoke } from "@tauri-apps/api/core";
import type {
  GreetResponse,
  ChatMessageResponse,
  ServiceState,
  MagicLevelResponse,
  MagicLevelState,
  ConversationHistory,
  ServiceCommandResult,
  StagingStatus,
} from "./types";

export async function greet(name: string): Promise<GreetResponse> {
  return invoke<GreetResponse>("greet", { name });
}

export async function echoCommand(message: string): Promise<string> {
  // echo_event emits an event on the Rust side and returns void.
  // echoCommand returns the message locally for convenience.
  await invoke("echo_event", { message });
  return message;
}

// ============================================================================
// GSD-OS IPC command wrappers (Phase 375-02)
// ============================================================================

/** Send a chat message. Returns the conversation ID. */
export async function sendChatMessage(
  message: string,
  conversationId?: string,
): Promise<ChatMessageResponse> {
  return invoke<ChatMessageResponse>("send_chat_message", {
    message,
    conversation_id: conversationId,
  });
}

/** Get the current state of all managed services. */
export async function getServiceStates(): Promise<ServiceState[]> {
  return invoke<ServiceState[]>("get_service_states");
}

/** Set the magic verbosity level (1-5). */
export async function setMagicLevel(level: number): Promise<MagicLevelResponse> {
  return invoke<MagicLevelResponse>("set_magic_level", { level });
}

/** Get the current magic verbosity level. */
export async function getMagicLevel(): Promise<MagicLevelState> {
  return invoke<MagicLevelState>("get_magic_level");
}

/** Get conversation history by ID. */
export async function getConversationHistory(
  conversationId: string,
): Promise<ConversationHistory> {
  return invoke<ConversationHistory>("get_conversation_history", {
    conversation_id: conversationId,
  });
}

/** Start a managed service. */
export async function startService(serviceId: string): Promise<ServiceCommandResult> {
  return invoke<ServiceCommandResult>("start_service", { service_id: serviceId });
}

/** Stop a managed service. */
export async function stopService(serviceId: string): Promise<ServiceCommandResult> {
  return invoke<ServiceCommandResult>("stop_service", { service_id: serviceId });
}

/** Restart a managed service. */
export async function restartService(serviceId: string): Promise<ServiceCommandResult> {
  return invoke<ServiceCommandResult>("restart_service", { service_id: serviceId });
}

/** Get staging intake status counts. */
export async function getStagingStatus(): Promise<StagingStatus> {
  return invoke<StagingStatus>("get_staging_status");
}
