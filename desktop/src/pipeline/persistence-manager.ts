/**
 * PersistenceManager -- Manages magic level state and conversation
 * history across GSD-OS restarts.
 *
 * Magic level defaults to 3 (per MAGIC-09) when no config file exists.
 * Conversation persistence is backed by the Rust API client (Phase 376).
 *
 * @module pipeline/persistence-manager
 * @since Phase 383
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationSnapshot {
  id: string;
  messages: Array<{ role: string; content: string }>;
  token_usage?: { total_input: number; total_output: number };
}

export interface PersistenceConfig {
  setMagicLevel: (
    level: number,
  ) => Promise<{ level: number; previous_level: number }>;
  getMagicLevel: () => Promise<{ level: number }>;
  getConversationHistory: (
    conversationId: string,
  ) => Promise<{ messages: Array<{ role: string; content: string }> }>;
  saveConversation?: (snapshot: ConversationSnapshot) => Promise<void>;
  listConversations?: () => Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

export class PersistenceManager {
  private ipc: PersistenceConfig;
  private _currentLevel = 3; // Default per MAGIC-09

  constructor(config: PersistenceConfig) {
    this.ipc = config;
  }

  /** Current magic level (in-memory cache). */
  get currentMagicLevel(): number {
    return this._currentLevel;
  }

  /**
   * Load the magic level from the backend config.
   * Returns 3 if config is missing or corrupt (MAGIC-09 default).
   */
  async loadMagicLevel(): Promise<number> {
    try {
      const result = await this.ipc.getMagicLevel();
      this._currentLevel = result.level;
      return result.level;
    } catch {
      // Default to level 3 if config missing or corrupt (MAGIC-09)
      this._currentLevel = 3;
      return 3;
    }
  }

  /** Save the magic level to backend config. Updates immediately. */
  async saveMagicLevel(level: number): Promise<void> {
    const result = await this.ipc.setMagicLevel(level);
    this._currentLevel = result.level;
  }

  /**
   * Load a conversation snapshot from the backend.
   * Returns null if conversation not found.
   */
  async loadConversation(
    conversationId: string,
  ): Promise<ConversationSnapshot | null> {
    try {
      const history = await this.ipc.getConversationHistory(conversationId);
      return {
        id: conversationId,
        messages: history.messages,
      };
    } catch {
      return null;
    }
  }

  /** Save a conversation snapshot to the backend. */
  async saveConversation(snapshot: ConversationSnapshot): Promise<void> {
    if (this.ipc.saveConversation) {
      await this.ipc.saveConversation(snapshot);
    }
    // If no saveConversation method, conversation persistence is handled
    // by the Rust backend automatically during send_chat_message (Phase 376)
  }

  /** List all saved conversation IDs. */
  async listConversations(): Promise<string[]> {
    if (this.ipc.listConversations) {
      return this.ipc.listConversations();
    }
    return [];
  }
}

export function createPersistenceManager(
  config: PersistenceConfig,
): PersistenceManager {
  return new PersistenceManager(config);
}
