/**
 * ConversationStore — Private local-only store for session logs and conversation memory.
 *
 * VISIBILITY: ALWAYS PRIVATE. This data never leaves the local machine.
 * Storage: .gitignored local files + local SQLite/PostgreSQL.
 *
 * Problem solved: Currently, resuming context requires scanning .jsonl session
 * logs manually — slow, unstructured, and context-window expensive.
 * This store indexes conversation data for fast retrieval.
 *
 * Storage locations (all gitignored):
 *   .local/conversations/         — SQLite database + conversation chunks
 *   .local/conversations/index.db — Full-text search index (FTS5)
 *   .local/conversations/chunks/  — Verbatim conversation chunks as files
 *
 * The store supports two retrieval modes:
 *   1. Keyword/FTS search — fast text search across all sessions
 *   2. Semantic search — via local Chroma collection (private, separate from public)
 *
 * HARD RULES:
 *   - NEVER synced to external databases
 *   - NEVER committed to git
 *   - NEVER included in public-visibility queries
 *   - Storage path MUST be in .gitignore
 *
 * @module memory/conversation-store
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { randomUUID } from 'node:crypto';

// ─── Types ───────────────────────────────────────────────────────────────────

/** A single conversation turn (human or assistant). */
export interface ConversationTurn {
  /** Unique turn ID. */
  id: string;

  /** The session this turn belongs to. */
  sessionId: string;

  /** Who said it. */
  role: 'human' | 'assistant' | 'system';

  /** The message content (verbatim). */
  content: string;

  /** When this turn occurred. */
  timestamp: Date;

  /** Tool calls made during this turn (assistant only). */
  toolCalls?: string[];

  /** Files read or modified during this turn. */
  filesAccessed?: string[];

  /** Tags extracted from content. */
  tags: string[];
}

/** A conversation session. */
export interface ConversationSession {
  /** Session UUID. */
  id: string;

  /** When the session started. */
  startedAt: Date;

  /** When the session ended (null if active). */
  endedAt: Date | null;

  /** Project being worked on. */
  project?: string;

  /** Branch at session start. */
  branch?: string;

  /** Number of turns. */
  turnCount: number;

  /** Brief summary (auto-generated or from handoff). */
  summary?: string;

  /** Key topics discussed. */
  topics: string[];
}

/** Result from conversation search. */
export interface ConversationSearchResult {
  /** The matching turn. */
  turn: ConversationTurn;

  /** Session metadata. */
  session: ConversationSession;

  /** Relevance score (0-1). */
  score: number;

  /** Snippet with match highlighted (for display). */
  snippet: string;
}

/** Configuration for the conversation store. */
export interface ConversationStoreConfig {
  /** Root directory for conversation storage. Default: .local/conversations/ */
  storePath: string;

  /** Maximum turns to keep per session before archiving. Default: unlimited. */
  maxTurnsPerSession?: number;

  /** Maximum sessions to keep in active index. Default: 100. */
  maxActiveSessions?: number;
}

// ─── ConversationStore ───────────────────────────────────────────────────────

/**
 * Private, local-only conversation memory.
 *
 * Indexes session logs for fast keyword search and retrieval.
 * All data stays on the local machine — never synced externally.
 */
export class ConversationStore {
  private readonly storePath: string;
  private readonly chunksDir: string;
  private readonly indexFile: string;
  private readonly maxActiveSessions: number;

  // In-memory index for fast search (loaded from disk on init)
  private sessions: Map<string, ConversationSession> = new Map();
  private turnIndex: Map<string, ConversationTurn[]> = new Map(); // sessionId → turns
  private initialized = false;

  constructor(config: ConversationStoreConfig) {
    this.storePath = config.storePath;
    this.chunksDir = join(config.storePath, 'chunks');
    this.indexFile = join(config.storePath, 'sessions.json');
    this.maxActiveSessions = config.maxActiveSessions ?? 100;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  /** Initialize the store — create directories and load existing index. */
  async init(): Promise<void> {
    if (this.initialized) return;

    await mkdir(this.storePath, { recursive: true });
    await mkdir(this.chunksDir, { recursive: true });

    // Load existing session index
    try {
      const data = await readFile(this.indexFile, 'utf-8');
      const parsed = JSON.parse(data) as ConversationSession[];
      for (const session of parsed) {
        session.startedAt = new Date(session.startedAt);
        session.endedAt = session.endedAt ? new Date(session.endedAt) : null;
        this.sessions.set(session.id, session);
      }
    } catch {
      // No existing index — fresh start
    }

    this.initialized = true;
  }

  // ─── Ingest ─────────────────────────────────────────────────────────────

  /**
   * Ingest a conversation turn.
   * Stores the turn and updates the session index.
   */
  async ingestTurn(turn: ConversationTurn): Promise<void> {
    await this.init();

    // Ensure session exists
    if (!this.sessions.has(turn.sessionId)) {
      this.sessions.set(turn.sessionId, {
        id: turn.sessionId,
        startedAt: turn.timestamp,
        endedAt: null,
        turnCount: 0,
        topics: [],
      });
    }

    // Add turn to in-memory index
    if (!this.turnIndex.has(turn.sessionId)) {
      this.turnIndex.set(turn.sessionId, []);
    }
    this.turnIndex.get(turn.sessionId)!.push(turn);

    // Update session metadata
    const session = this.sessions.get(turn.sessionId)!;
    session.turnCount++;

    // Persist turn to chunk file
    const chunkFile = join(this.chunksDir, `${turn.sessionId}.jsonl`);
    const line = JSON.stringify({
      id: turn.id,
      role: turn.role,
      content: turn.content,
      timestamp: turn.timestamp.toISOString(),
      toolCalls: turn.toolCalls,
      filesAccessed: turn.filesAccessed,
      tags: turn.tags,
    }) + '\n';
    await writeFile(chunkFile, line, { flag: 'a' });

    // Persist session index periodically (every 10 turns)
    if (session.turnCount % 10 === 0) {
      await this.saveSessionIndex();
    }
  }

  /**
   * Ingest a complete JSONL session log file (Claude Code format).
   * Parses the log, extracts turns, and indexes them.
   */
  async ingestSessionLog(logPath: string, sessionId?: string): Promise<ConversationSession> {
    await this.init();

    const sid = sessionId ?? randomUUID();
    const content = await readFile(logPath, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());

    let turnCount = 0;
    const topics: string[] = [];

    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        // Claude Code JSONL format: {type, message, ...}
        const role = entry.type === 'human' ? 'human'
          : entry.type === 'assistant' ? 'assistant'
          : 'system';

        const messageContent = typeof entry.message === 'string'
          ? entry.message
          : entry.message?.content ?? JSON.stringify(entry);

        if (!messageContent || messageContent.length < 2) continue;

        const turn: ConversationTurn = {
          id: `${sid}-${turnCount}`,
          sessionId: sid,
          role: role as ConversationTurn['role'],
          content: messageContent.slice(0, 10000), // Cap at 10K chars per turn
          timestamp: new Date(entry.timestamp ?? Date.now()),
          toolCalls: entry.tool_calls?.map((tc: { name: string }) => tc.name),
          filesAccessed: entry.files_accessed,
          tags: [],
        };

        await this.ingestTurn(turn);
        turnCount++;
      } catch {
        // Skip malformed lines
      }
    }

    const session = this.sessions.get(sid)!;
    session.endedAt = new Date();
    session.topics = topics;
    await this.saveSessionIndex();

    return session;
  }

  /** End a session (set endedAt, save index). */
  async endSession(sessionId: string, summary?: string): Promise<void> {
    await this.init();
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endedAt = new Date();
      if (summary) session.summary = summary;
      await this.saveSessionIndex();
    }
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  /**
   * Search across all conversation history.
   * Uses keyword matching on the in-memory index + on-disk chunk files.
   *
   * @param query — search text
   * @param limit — max results (default 20)
   * @param sessionFilter — limit to specific session(s)
   * @returns ranked search results
   */
  async search(
    query: string,
    limit = 20,
    sessionFilter?: string[]
  ): Promise<ConversationSearchResult[]> {
    await this.init();

    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 2);
    const results: ConversationSearchResult[] = [];

    // Search in-memory index first
    const sessionsToSearch = sessionFilter
      ? sessionFilter.filter(id => this.turnIndex.has(id))
      : Array.from(this.turnIndex.keys());

    for (const sessionId of sessionsToSearch) {
      const turns = this.turnIndex.get(sessionId) ?? [];
      const session = this.sessions.get(sessionId);
      if (!session) continue;

      for (const turn of turns) {
        const contentLower = turn.content.toLowerCase();

        // Score: exact phrase match > all terms present > partial terms
        let score = 0;
        if (contentLower.includes(queryLower)) {
          score = 1.0;
        } else {
          const hits = queryTerms.filter(t => contentLower.includes(t));
          score = queryTerms.length > 0 ? hits.length / queryTerms.length : 0;
        }

        if (score > 0) {
          // Extract snippet around first match
          const matchIdx = contentLower.indexOf(queryTerms[0] ?? queryLower);
          const start = Math.max(0, matchIdx - 80);
          const end = Math.min(turn.content.length, matchIdx + 200);
          const snippet = (start > 0 ? '...' : '') +
            turn.content.slice(start, end) +
            (end < turn.content.length ? '...' : '');

          results.push({ turn, session, score, snippet });
        }
      }
    }

    // If in-memory didn't have enough, search chunk files on disk
    if (results.length < limit) {
      await this.searchChunkFiles(queryLower, queryTerms, results, limit, sessionFilter);
    }

    // Sort by score descending, then by recency
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.turn.timestamp.getTime() - a.turn.timestamp.getTime();
    });

    return results.slice(0, limit);
  }

  /**
   * Get recent conversation context — the last N turns across sessions.
   * Useful for "what was I working on?" type queries.
   */
  async getRecentContext(turnCount = 50): Promise<ConversationTurn[]> {
    await this.init();

    const allTurns: ConversationTurn[] = [];
    for (const turns of this.turnIndex.values()) {
      allTurns.push(...turns);
    }

    // Sort by timestamp descending, take the most recent
    allTurns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return allTurns.slice(0, turnCount);
  }

  /**
   * Get all turns for a specific session.
   */
  async getSessionTurns(sessionId: string): Promise<ConversationTurn[]> {
    await this.init();

    // Try in-memory first
    if (this.turnIndex.has(sessionId)) {
      return this.turnIndex.get(sessionId)!;
    }

    // Fall back to chunk file
    return this.loadSessionFromDisk(sessionId);
  }

  /**
   * List all sessions, most recent first.
   */
  async listSessions(): Promise<ConversationSession[]> {
    await this.init();
    const sessions = Array.from(this.sessions.values());
    sessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return sessions;
  }

  /** Get stats about the conversation store. */
  async getStats(): Promise<{
    totalSessions: number;
    totalTurns: number;
    oldestSession: Date | null;
    newestSession: Date | null;
    diskUsageBytes: number;
  }> {
    await this.init();

    let totalTurns = 0;
    for (const turns of this.turnIndex.values()) {
      totalTurns += turns.length;
    }

    let oldest: Date | null = null;
    let newest: Date | null = null;
    for (const session of this.sessions.values()) {
      if (!oldest || session.startedAt < oldest) oldest = session.startedAt;
      if (!newest || session.startedAt > newest) newest = session.startedAt;
    }

    // Estimate disk usage
    let diskUsageBytes = 0;
    try {
      const files = await readdir(this.chunksDir);
      for (const f of files) {
        const s = await stat(join(this.chunksDir, f));
        diskUsageBytes += s.size;
      }
    } catch {
      // Directory may not exist yet
    }

    return {
      totalSessions: this.sessions.size,
      totalTurns,
      oldestSession: oldest,
      newestSession: newest,
      diskUsageBytes,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async saveSessionIndex(): Promise<void> {
    const sessions = Array.from(this.sessions.values());
    await writeFile(this.indexFile, JSON.stringify(sessions, null, 2));
  }

  private async loadSessionFromDisk(sessionId: string): Promise<ConversationTurn[]> {
    const chunkFile = join(this.chunksDir, `${sessionId}.jsonl`);
    const turns: ConversationTurn[] = [];

    try {
      const content = await readFile(chunkFile, 'utf-8');
      for (const line of content.trim().split('\n')) {
        try {
          const data = JSON.parse(line);
          turns.push({
            id: data.id,
            sessionId,
            role: data.role,
            content: data.content,
            timestamp: new Date(data.timestamp),
            toolCalls: data.toolCalls,
            filesAccessed: data.filesAccessed,
            tags: data.tags ?? [],
          });
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // File doesn't exist
    }

    // Cache in memory for subsequent queries
    if (turns.length > 0) {
      this.turnIndex.set(sessionId, turns);
    }

    return turns;
  }

  private async searchChunkFiles(
    queryLower: string,
    queryTerms: string[],
    results: ConversationSearchResult[],
    limit: number,
    sessionFilter?: string[]
  ): Promise<void> {
    try {
      const files = await readdir(this.chunksDir);
      for (const file of files) {
        if (!file.endsWith('.jsonl')) continue;
        const sessionId = basename(file, '.jsonl');

        // Skip if already searched in memory or filtered out
        if (this.turnIndex.has(sessionId)) continue;
        if (sessionFilter && !sessionFilter.includes(sessionId)) continue;
        if (results.length >= limit) break;

        const turns = await this.loadSessionFromDisk(sessionId);
        const session = this.sessions.get(sessionId);
        if (!session) continue;

        for (const turn of turns) {
          if (results.length >= limit) break;
          const contentLower = turn.content.toLowerCase();
          let score = 0;
          if (contentLower.includes(queryLower)) {
            score = 1.0;
          } else {
            const hits = queryTerms.filter(t => contentLower.includes(t));
            score = queryTerms.length > 0 ? hits.length / queryTerms.length : 0;
          }
          if (score > 0) {
            const matchIdx = contentLower.indexOf(queryTerms[0] ?? queryLower);
            const start = Math.max(0, matchIdx - 80);
            const end = Math.min(turn.content.length, matchIdx + 200);
            const snippet = (start > 0 ? '...' : '') +
              turn.content.slice(start, end) +
              (end < turn.content.length ? '...' : '');
            results.push({ turn, session, score, snippet });
          }
        }
      }
    } catch {
      // Chunks directory may not exist
    }
  }
}
