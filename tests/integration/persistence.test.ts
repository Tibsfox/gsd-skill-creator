import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PersistenceManager,
  type PersistenceConfig,
  type ConversationSnapshot,
} from "../../desktop/src/pipeline/persistence-manager.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockPersistenceIpc(
  overrides?: Partial<PersistenceConfig>,
): PersistenceConfig {
  // In-memory stores for persistence simulation
  let storedLevel = 3;
  const conversations = new Map<string, ConversationSnapshot>();

  const base: PersistenceConfig = {
    setMagicLevel: vi.fn(async (level: number) => {
      const previous = storedLevel;
      storedLevel = level;
      return { level, previous_level: previous };
    }),
    getMagicLevel: vi.fn(async () => ({ level: storedLevel })),
    getConversationHistory: vi.fn(async (conversationId: string) => {
      const conv = conversations.get(conversationId);
      if (!conv) throw new Error("Conversation not found");
      return { messages: conv.messages };
    }),
    saveConversation: vi.fn(async (snapshot: ConversationSnapshot) => {
      conversations.set(snapshot.id, snapshot);
    }),
    listConversations: vi.fn(async () => Array.from(conversations.keys())),
  };

  return { ...base, ...overrides };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PersistenceManager (magic level and conversation persistence)", () => {
  let ipc: PersistenceConfig;
  let persistence: PersistenceManager;

  beforeEach(() => {
    ipc = createMockPersistenceIpc();
    persistence = new PersistenceManager(ipc);
  });

  it("magic level change mid-session updates immediately (INTEG-05)", async () => {
    // Load initial level (default 3)
    const initial = await persistence.loadMagicLevel();
    expect(initial).toBe(3);

    // Change to level 1
    await persistence.saveMagicLevel(1);
    expect(persistence.currentMagicLevel).toBe(1);

    // IPC was called
    expect(ipc.setMagicLevel).toHaveBeenCalledWith(1);
  });

  it("magic level persists to config file", async () => {
    // Save level 4
    await persistence.saveMagicLevel(4);
    expect(ipc.setMagicLevel).toHaveBeenCalledWith(4);

    // Create new instance (simulating restart)
    const persistence2 = new PersistenceManager(ipc);
    const loaded = await persistence2.loadMagicLevel();

    expect(loaded).toBe(4);
    expect(persistence2.currentMagicLevel).toBe(4);
  });

  it("conversation history survives restart (INTEG-07)", async () => {
    const snapshot: ConversationSnapshot = {
      id: "conv-001",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "How are you?" },
      ],
      token_usage: { total_input: 100, total_output: 50 },
    };

    // Save conversation
    await persistence.saveConversation(snapshot);

    // Create new instance (simulating restart)
    const persistence2 = new PersistenceManager(ipc);
    const loaded = await persistence2.loadConversation("conv-001");

    expect(loaded).not.toBeNull();
    expect(loaded!.id).toBe("conv-001");
    expect(loaded!.messages).toEqual(snapshot.messages);
  });

  it("conversation list on startup returns saved conversations", async () => {
    // Save 3 conversations
    await persistence.saveConversation({
      id: "conv-001",
      messages: [{ role: "user", content: "First" }],
    });
    await persistence.saveConversation({
      id: "conv-002",
      messages: [{ role: "user", content: "Second" }],
    });
    await persistence.saveConversation({
      id: "conv-003",
      messages: [{ role: "user", content: "Third" }],
    });

    const list = await persistence.listConversations();

    expect(list).toHaveLength(3);
    expect(list).toContain("conv-001");
    expect(list).toContain("conv-002");
    expect(list).toContain("conv-003");
  });

  it("default magic level on fresh start is 3 (MAGIC-09)", async () => {
    // Mock getMagicLevel to throw (no config file)
    ipc.getMagicLevel = vi.fn(async () => {
      throw new Error("Config file not found");
    });

    const freshPersistence = new PersistenceManager(ipc);
    const level = await freshPersistence.loadMagicLevel();

    expect(level).toBe(3);
    expect(freshPersistence.currentMagicLevel).toBe(3);
  });

  it("bootstrap idempotency: no duplicate state on second run (INTEG-08)", async () => {
    // First run: save level and conversation
    await persistence.saveMagicLevel(4);
    await persistence.saveConversation({
      id: "conv-001",
      messages: [{ role: "user", content: "Hello" }],
    });

    // Second run: create fresh manager, load existing state
    const persistence2 = new PersistenceManager(ipc);
    const level = await persistence2.loadMagicLevel();
    const conv = await persistence2.loadConversation("conv-001");

    // State loaded correctly without duplication
    expect(level).toBe(4);
    expect(conv?.messages).toHaveLength(1);

    // Save same conversation again (idempotent)
    await persistence2.saveConversation({
      id: "conv-001",
      messages: [{ role: "user", content: "Hello" }],
    });

    const list = await persistence2.listConversations();
    // Still only 1 conversation (not duplicated)
    expect(list.filter((id) => id === "conv-001")).toHaveLength(1);
  });
});
