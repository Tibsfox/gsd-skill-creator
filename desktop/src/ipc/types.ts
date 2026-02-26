export interface GreetResponse {
  message: string;
  timestamp: number;
}

export interface EchoPayload {
  status: string;
  detail: string;
}

export interface ChannelChunk {
  index: number;
  data: number[];
  size: number;
}

export interface BenchmarkResult {
  payload_size: number;
  round_trip_ms: number;
}

// ============================================================================
// GSD-OS IPC command response types (Phase 375-02)
// ============================================================================

/** Response from send_chat_message command. */
export interface ChatMessageResponse {
  conversation_id: string;
}

/** Service state entry from get_service_states command. */
export interface ServiceState {
  service_id: string;
  status: string;
  led_color: string;
}

/** Response from set_magic_level command. */
export interface MagicLevelResponse {
  level: number;
  previous_level: number;
}

/** Response from get_magic_level command. */
export interface MagicLevelState {
  level: number;
}

/** Response from get_conversation_history command. */
export interface ConversationHistory {
  messages: Array<{ role: string; content: string }>;
}

/** Response from start_service/stop_service/restart_service commands. */
export interface ServiceCommandResult {
  ok: boolean;
  error?: string;
}

/** Response from get_staging_status command. */
export interface StagingStatus {
  intake_count: number;
  processing_count: number;
  quarantine_count: number;
}

// ============================================================================
// GSD-OS IPC event payload types (Phase 375-02)
// ============================================================================

/** Payload for chat:delta events. */
export interface ChatDeltaPayload {
  conversation_id: string;
  delta: string;
  index: number;
}

/** Payload for service:state_change events. */
export interface ServiceStateChangePayload {
  service_id: string;
  from_status: string;
  to_status: string;
  led_color: string;
}

/** Payload for magic:level_changed events. */
export interface MagicLevelChangedPayload {
  level: number;
  previous_level: number;
  source: string;
}

/** Payload for chat:error events. */
export interface ChatErrorPayload {
  conversation_id: string;
  error: string;
  recoverable: boolean;
}

/** Payload for staging:quarantine events. */
export interface StagingQuarantinePayload {
  file_path: string;
  reason: string;
  detail: string;
}
