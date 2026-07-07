/**
 * PostgreSQL Memory Store — LOD 400 tier.
 *
 * The authoritative structured store for memories and conversation logs.
 * Uses pgvector for embedding similarity search alongside standard SQL
 * for relational queries, temporal filtering, and graph traversal.
 *
 * Two table groups:
 *   1. Memory tables (gsd_memory.memories, gsd_memory.memory_relations)
 *      — Structured memory records with embeddings and relations
 *   2. Conversation tables (gsd_memory.conversations, gsd_memory.conversation_turns)
 *      — Private local-only conversation logs for searchable session history
 *
 * VISIBILITY ENFORCEMENT:
 *   - All data in this store is LOCAL ONLY by default
 *   - Only 'public' visibility memories can be synced to external databases
 *   - Conversation data is ALWAYS private — never synced externally
 *   - The sync method enforces visibility filtering at the query level
 *
 * @module memory/pg-store
 */

import { LodLevel } from '../lod/types.js';
import { loadPgEnv } from '../scribe/pg-runtime/env-loader.js';
import type {
  MemoryRecord,
  MemoryType,
  MemoryStore,
  MemoryQuery,
  MemoryResult,
  MemoryRelation,
  RelationType,
  MemoryVisibility,
  TemporalClass,
  MemoryScope,
} from './types.js';
import { isStorageAllowed, temporalRelevance } from './types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** PostgreSQL connection configuration. */
export interface PgStoreConfig {
  /** Connection string. Default: postgresql://localhost:5432/tibsfox */
  connectionString?: string;

  /** Host. Default: localhost */
  host?: string;

  /** Port. Default: 5432 */
  port?: number;

  /** Database name. Default: tibsfox */
  database?: string;

  /** Schema for memory tables. Default: gsd_memory */
  schema?: string;

  /** Username. */
  user?: string;

  /** Password. */
  password?: string;

  /** Whether to run migrations on init. Default: true */
  autoMigrate?: boolean;
}

/** Row shape from gsd_memory.memories table. */
interface MemoryRow {
  id: string;
  type: MemoryType;
  name: string;
  description: string;
  content: string;
  scope: MemoryScope;
  visibility: MemoryVisibility;
  temporal_class: TemporalClass;
  domains: string[];
  project: string | null;
  branch: string | null;
  worktree: string | null;
  mission: string | null;
  phase: string | null;
  tags: string[];
  confidence: number;
  valid_from: Date;
  valid_to: Date | null;
  created_at: Date;
  updated_at: Date;
  last_accessed: Date;
  access_count: number;
  source_file: string | null;
  source_session: string | null;
  related_to: string[];
  embedding: number[] | null;
}

/** Row shape from gsd_memory.conversation_turns table. */
interface ConversationTurnRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: Date;
  tool_calls: string[] | null;
  files_accessed: string[] | null;
  tags: string[];
}

/**
 * Minimal embedder used to vectorize conversation turns at store time (PG-5).
 * `EmbeddingService` is the intended production implementation (it satisfies
 * this structurally); tests pass a stub. No production caller wires an embedder
 * yet — turns are embedded only once a conversation source is wired to a
 * PgStore constructed with one (a separate ConversationStore follow-up).
 */
export interface TurnEmbedder {
  embed(text: string): Promise<{ embedding: number[] }>;
}

// ─── SQL Migrations ──────────────────────────────────────────────────────────

const MIGRATIONS = [
  // Enable pgvector extension
  `CREATE EXTENSION IF NOT EXISTS vector;`,

  // Memory tables
  `CREATE TABLE IF NOT EXISTS gsd_memory.memories (
    id              UUID PRIMARY KEY,
    type            TEXT NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL,
    content         TEXT NOT NULL,

    -- Provenance
    scope           TEXT NOT NULL DEFAULT 'project',
    visibility      TEXT NOT NULL DEFAULT 'internal',
    temporal_class  TEXT NOT NULL DEFAULT 'seasonal',
    domains         TEXT[] NOT NULL DEFAULT '{}',
    project         TEXT,
    branch          TEXT,
    worktree        TEXT,
    mission         TEXT,
    phase           TEXT,

    -- Classification
    tags            TEXT[] NOT NULL DEFAULT '{}',
    confidence      REAL NOT NULL DEFAULT 1.0,

    -- Temporal
    valid_from      TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed   TIMESTAMPTZ NOT NULL DEFAULT now(),
    access_count    INT NOT NULL DEFAULT 0,

    -- Source
    source_file     TEXT,
    source_session  TEXT,
    related_to      UUID[] NOT NULL DEFAULT '{}',

    -- Embedding (384-dim for BGE-small-en)
    embedding       vector(384)
  );`,

  // Memory indexes
  `CREATE INDEX IF NOT EXISTS idx_memories_type ON gsd_memory.memories (type);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_scope ON gsd_memory.memories (scope);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_visibility ON gsd_memory.memories (visibility);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_temporal ON gsd_memory.memories (valid_from, valid_to);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_tags ON gsd_memory.memories USING gin (tags);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_project ON gsd_memory.memories (project);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_branch ON gsd_memory.memories (branch);`,
  `CREATE INDEX IF NOT EXISTS idx_memories_fulltext ON gsd_memory.memories
    USING gin (to_tsvector('english', name || ' ' || description || ' ' || content));`,

  // pgvector index — HNSW for cosine similarity. HNSW needs no training data,
  // so it builds correctly even on an empty table (unlike IVFFlat, whose
  // centroids degenerate when the index is created before any rows exist), and
  // gives better recall/latency at this scale with no per-query probe tuning.
  // Requires pgvector >= 0.5. (PG-4)
  //
  // NB: `CREATE INDEX IF NOT EXISTS` resolves the existence check against the
  // TARGET table's schema. A bare `pg_indexes WHERE indexname = ...` guard does
  // not — index names collide across schemas, so a same-named index in another
  // schema would make the guard skip creation here silently.
  `CREATE INDEX IF NOT EXISTS idx_memories_embedding ON gsd_memory.memories
    USING hnsw (embedding vector_cosine_ops);`,

  // Memory relations
  `CREATE TABLE IF NOT EXISTS gsd_memory.memory_relations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id  UUID NOT NULL REFERENCES gsd_memory.memories(id) ON DELETE CASCADE,
    predicate   TEXT NOT NULL,
    object_id   UUID NOT NULL REFERENCES gsd_memory.memories(id) ON DELETE CASCADE,
    valid_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_to    TIMESTAMPTZ,
    confidence  REAL NOT NULL DEFAULT 1.0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );`,

  `CREATE INDEX IF NOT EXISTS idx_relations_subject ON gsd_memory.memory_relations (subject_id);`,
  `CREATE INDEX IF NOT EXISTS idx_relations_object ON gsd_memory.memory_relations (object_id);`,
  `CREATE INDEX IF NOT EXISTS idx_relations_predicate ON gsd_memory.memory_relations (predicate);`,

  // Conversation sessions (PRIVATE — never synced externally)
  `CREATE TABLE IF NOT EXISTS gsd_memory.conversation_sessions (
    id          UUID PRIMARY KEY,
    started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at    TIMESTAMPTZ,
    project     TEXT,
    branch      TEXT,
    turn_count  INT NOT NULL DEFAULT 0,
    summary     TEXT,
    topics      TEXT[] NOT NULL DEFAULT '{}'
  );`,

  // Conversation turns (PRIVATE — never synced externally)
  `CREATE TABLE IF NOT EXISTS gsd_memory.conversation_turns (
    id              TEXT PRIMARY KEY,
    session_id      UUID NOT NULL REFERENCES gsd_memory.conversation_sessions(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,
    content         TEXT NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT now(),
    tool_calls      TEXT[],
    files_accessed  TEXT[],
    tags            TEXT[] NOT NULL DEFAULT '{}',
    embedding       vector(384)
  );`,

  `CREATE INDEX IF NOT EXISTS idx_turns_session ON gsd_memory.conversation_turns (session_id);`,
  `CREATE INDEX IF NOT EXISTS idx_turns_role ON gsd_memory.conversation_turns (role);`,
  `CREATE INDEX IF NOT EXISTS idx_turns_timestamp ON gsd_memory.conversation_turns (timestamp);`,
  `CREATE INDEX IF NOT EXISTS idx_turns_fulltext ON gsd_memory.conversation_turns
    USING gin (to_tsvector('english', content));`,
];

/**
 * Target schema version. Bump when appending migrations; the applier records
 * this once the full set applies cleanly and skips re-running when the DB is
 * already at (or past) this version. (PG-3)
 */
const SCHEMA_VERSION = 1;

// ─── PgStore ─────────────────────────────────────────────────────────────────

/**
 * PostgreSQL memory store — LOD 400 tier.
 *
 * Implements the MemoryStore interface for structured persistence with:
 *   - pgvector embedding similarity search
 *   - Full-text search (tsvector)
 *   - Temporal validity filtering
 *   - Visibility-enforced queries
 *   - Conversation log storage (private)
 *   - Relation graph with recursive CTE traversal
 */
export class PgStore implements MemoryStore {
  readonly lod = LodLevel.FABRICATION; // LOD 400

  private readonly config: Required<Omit<PgStoreConfig, 'connectionString'>> & {
    connectionString: string | undefined;
  };
  private pool: any = null; // pg.Pool — dynamically imported
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  /** Optional embedder for conversation turns (PG-5); undefined = no vectors. */
  private readonly embedder?: TurnEmbedder;

  constructor(config: PgStoreConfig = {}, embedder?: TurnEmbedder) {
    this.embedder = embedder;
    // Resolve credentials via the canonical loader — RH_POSTGRES_URL from
    // process.env or the repo .env — unless the caller pinned a connection
    // string or an explicit host. Without this the store defaulted to
    // foxy@localhost with an empty password and never reached the real
    // database (PG-2). A connection string, when present, takes precedence
    // over the discrete host/user/password fields in init().
    let connectionString = config.connectionString;
    if (!connectionString && !config.host) {
      const env = loadPgEnv();
      if (env.ok) connectionString = env.url;
    }
    this.config = {
      connectionString,
      host: config.host ?? 'localhost',
      port: config.port ?? 5432,
      database: config.database ?? 'tibsfox',
      schema: config.schema ?? 'gsd_memory',
      user: config.user ?? process.env.PGUSER ?? 'foxy',
      password: config.password ?? process.env.PGPASSWORD ?? '',
      autoMigrate: config.autoMigrate ?? true,
    };
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  /** Check if pg module is available. */
  async isAvailable(): Promise<boolean> {
    try {
      await import('pg');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Initialize the connection pool and apply migrations.
   *
   * A connection failure (pg module missing, DB unreachable) degrades
   * gracefully: the store stays inactive and its methods no-op, mirroring the
   * optional Chroma tier. But once connected, a schema/migration failure — e.g.
   * `CREATE EXTENSION` denied or a table create rejected — is surfaced by
   * throwing: a connected-but-broken schema must fail loudly rather than
   * silently drop writes. (PG-3)
   */
  async init(): Promise<void> {
    if (this.initialized) return;
    // Memoize so concurrent callers — e.g. two awaited LOD-400 store()s racing
    // before the first init resolves — share one init instead of each building
    // a pool and re-running migrations. Cleared when it settles so a failed
    // init can be retried by a later call.
    if (!this.initPromise) {
      this.initPromise = this.doInit().finally(() => {
        this.initPromise = null;
      });
    }
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    if (this.initialized) return;

    // ── Connect: a failure here degrades gracefully (tier stays inactive). ──
    try {
      const pg = await import('pg');
      const base = this.config.connectionString
        ? { connectionString: this.config.connectionString }
        : {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
          };
      this.pool = new pg.default.Pool({
        ...base,
        // Bound the connect wait so an awaited LOD-400 write can't hang for the
        // full OS TCP timeout when the host is unreachable.
        connectionTimeoutMillis: 10_000,
        application_name: 'gsd-skill-creator/pg-store',
        // Bound the pool for a SHARED database: this is a low-throughput memory
        // tier behind a single CLI/gateway process, so a small ceiling keeps it a
        // good citizen against other consumers of the shared cluster. (PG-6)
        max: 5,
        // Server-side per-statement cap so a runaway or blocked query can't hold a
        // pooled connection open indefinitely (memory queries are ms-scale). (PG-6)
        statement_timeout: 30_000,
      });
      // Absorb idle-client errors (DB restart, dropped TCP) — pg re-emits them
      // as a Pool 'error' event, which crashes the process if unhandled. This
      // matters most under the long-lived `gateway --pg` server.
      this.pool.on('error', (err: Error) => {
        console.error('PgStore: idle pool client error:', err.message);
      });
      await this.pool.query('SELECT 1');
    } catch (err) {
      console.error('PgStore: PostgreSQL not available:', (err as Error).message);
      await this.disposePool();
      return;
    }

    // ── Migrate: a failure here is loud (surface it, don't drop writes). ──
    try {
      await this.pool.query(`CREATE SCHEMA IF NOT EXISTS ${this.config.schema}`);
      if (this.config.autoMigrate) await this.applyMigrations();
    } catch (err) {
      await this.disposePool();
      throw new Error(
        `PgStore: schema initialization failed (${(err as Error).message}). ` +
          `The database is reachable but its schema could not be prepared; ` +
          `refusing to run in a state that would silently drop writes.`,
      );
    }

    this.initialized = true;
  }

  /**
   * Apply schema migrations, version-checked and failing loudly on real errors.
   * Reads the recorded `schema_version` and skips when the DB is already at (or
   * past) SCHEMA_VERSION; otherwise runs the full DDL set and records the
   * version. Only "already exists" errors are treated as benign. (PG-3)
   */
  private async applyMigrations(): Promise<void> {
    const s = this.config.schema;
    // Run the whole migration on a dedicated client with statement_timeout
    // disabled: an HNSW index build over a populated table can legitimately
    // exceed the pool's per-statement cap (PG-6), and DDL must not be killed
    // mid-flight. release(true) destroys the client afterward so the disabled
    // timeout never leaks back to a pooled borrower.
    const client = await this.pool.connect();
    try {
      await client.query('SET statement_timeout = 0');
      // schema_version must exist before we can read the applied version.
      await client.query(
        `CREATE TABLE IF NOT EXISTS ${s}.schema_version (` +
          `version INT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
      );
      const { rows } = await client.query(
        `SELECT COALESCE(MAX(version), 0)::int AS v FROM ${s}.schema_version`,
      );
      if ((rows[0]?.v ?? 0) >= SCHEMA_VERSION) return; // already up to date

      for (const sql of MIGRATIONS) {
        try {
          await client.query(sql);
        } catch (err: any) {
          // Idempotent DDL (e.g. the vector extension) can report "already
          // exists"; anything else is a real failure that must surface.
          if (err?.message?.includes('already exists')) continue;
          throw new Error(`migration to v${SCHEMA_VERSION} failed: ${err?.message ?? err}`);
        }
      }

      await client.query(
        `INSERT INTO ${s}.schema_version (version) VALUES ($1) ON CONFLICT (version) DO NOTHING`,
        [SCHEMA_VERSION],
      );
    } finally {
      client.release(true);
    }
  }

  /** Best-effort pool teardown used on the init failure paths. */
  private async disposePool(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.end();
      } catch {
        /* ignore teardown errors */
      }
      this.pool = null;
    }
    this.initialized = false;
  }

  /** Close the connection pool. */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.initialized = false;
    }
  }

  // ─── MemoryStore Interface ──────────────────────────────────────────────

  async store(record: MemoryRecord): Promise<void> {
    if (!await this.ensureReady()) return;

    // Enforce visibility — never store private data if target is external
    const sql = `
      INSERT INTO gsd_memory.memories (
        id, type, name, description, content,
        scope, visibility, temporal_class, domains, project, branch, worktree, mission, phase,
        tags, confidence, valid_from, valid_to,
        created_at, updated_at, last_accessed, access_count,
        source_file, source_session, related_to
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22,
        $23, $24, $25
      ) ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        content = EXCLUDED.content,
        updated_at = now(),
        last_accessed = now(),
        access_count = gsd_memory.memories.access_count + 1
    `;

    const p = record.provenance;
    await this.pool.query(sql, [
      record.id, record.type, record.name, record.description, record.content,
      p.scope, p.visibility, record.temporalClass, p.domains, p.project ?? null,
      p.branch ?? null, p.worktree ?? null, p.mission ?? null, p.phase ?? null,
      record.tags, record.confidence, record.validFrom, record.validTo,
      record.createdAt, record.updatedAt, record.lastAccessed, record.accessCount,
      record.sourceFile ?? null, record.sourceSession ?? null, record.relatedTo,
    ]);
  }

  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    if (!await this.ensureReady()) return [];

    const conditions: string[] = ['1=1'];
    const params: any[] = [];
    let paramIdx = 1;

    // Visibility filter (HARD RULE)
    if (q.visibility) {
      const allowed = visibilityLevels(q.visibility);
      conditions.push(`visibility = ANY($${paramIdx})`);
      params.push(allowed);
      paramIdx++;
    }

    // Type filter
    if (q.type) {
      conditions.push(`type = $${paramIdx}`);
      params.push(q.type);
      paramIdx++;
    }

    // Scope filter
    if (q.scope) {
      conditions.push(`scope = $${paramIdx}`);
      params.push(q.scope);
      paramIdx++;
    }

    // Tags filter
    if (q.tags && q.tags.length > 0) {
      conditions.push(`tags && $${paramIdx}`);
      params.push(q.tags);
      paramIdx++;
    }

    // Temporal validity
    if (q.asOf) {
      conditions.push(`valid_from <= $${paramIdx} AND (valid_to IS NULL OR valid_to > $${paramIdx})`);
      params.push(q.asOf);
      paramIdx++;
    } else {
      // Default: only active memories
      conditions.push(`valid_to IS NULL`);
    }

    // Full-text search
    const searchParam = `$${paramIdx}`;
    params.push(q.text);
    paramIdx++;

    const limit = q.limit ?? 20;

    const sql = `
      SELECT *,
        ts_rank_cd(
          to_tsvector('english', name || ' ' || description || ' ' || content),
          plainto_tsquery('english', ${searchParam})
        ) AS text_rank
      FROM gsd_memory.memories
      WHERE ${conditions.join(' AND ')}
        AND (
          to_tsvector('english', name || ' ' || description || ' ' || content)
          @@ plainto_tsquery('english', ${searchParam})
          OR name ILIKE '%' || ${searchParam} || '%'
          OR description ILIKE '%' || ${searchParam} || '%'
        )
      ORDER BY text_rank DESC, last_accessed DESC
      LIMIT ${limit}
    `;

    const result = await this.pool.query(sql, params);
    return result.rows.map((row: MemoryRow) => this.rowToResult(row));
  }

  async get(id: string): Promise<MemoryRecord | null> {
    if (!await this.ensureReady()) return null;

    // Update access tracking
    const sql = `
      UPDATE gsd_memory.memories
      SET last_accessed = now(), access_count = access_count + 1
      WHERE id = $1
      RETURNING *
    `;
    const result = await this.pool.query(sql, [id]);
    if (result.rows.length === 0) return null;
    return this.rowToRecord(result.rows[0]);
  }

  async remove(id: string): Promise<boolean> {
    if (!await this.ensureReady()) return false;
    const result = await this.pool.query('DELETE FROM gsd_memory.memories WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  async has(id: string): Promise<boolean> {
    if (!await this.ensureReady()) return false;
    const result = await this.pool.query('SELECT 1 FROM gsd_memory.memories WHERE id = $1', [id]);
    return result.rows.length > 0;
  }

  async count(): Promise<number> {
    if (!await this.ensureReady()) return 0;
    const result = await this.pool.query('SELECT count(*) FROM gsd_memory.memories');
    return parseInt(result.rows[0].count, 10);
  }

  // ─── Semantic Search (pgvector) ─────────────────────────────────────────

  /**
   * Search by embedding similarity using pgvector cosine distance.
   *
   * @param embedding — 384-dim query vector
   * @param limit — max results
   * @param visibility — visibility filter (default: all)
   */
  async searchByEmbedding(
    embedding: number[],
    limit = 10,
    visibility?: MemoryVisibility,
  ): Promise<MemoryResult[]> {
    if (!await this.ensureReady()) return [];

    const visFilter = visibility
      ? `AND visibility = ANY($3)`
      : '';
    const params: any[] = [`[${embedding.join(',')}]`, limit];
    if (visibility) params.push(visibilityLevels(visibility));

    const sql = `
      SELECT *,
        1 - (embedding <=> $1::vector) AS similarity
      FROM gsd_memory.memories
      WHERE embedding IS NOT NULL
        AND valid_to IS NULL
        ${visFilter}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;

    const result = await this.pool.query(sql, params);
    return result.rows.map((row: MemoryRow & { similarity: number }) => ({
      record: this.rowToRecord(row),
      score: row.similarity,
      sourceLod: LodLevel.FABRICATION,
      tokenEstimate: Math.ceil(row.content.length / 4),
    }));
  }

  /**
   * Store an embedding for an existing memory.
   */
  async storeEmbedding(id: string, embedding: number[]): Promise<void> {
    if (!await this.ensureReady()) return;
    await this.pool.query(
      `UPDATE gsd_memory.memories SET embedding = $2::vector WHERE id = $1`,
      [id, `[${embedding.join(',')}]`],
    );
  }

  // ─── Relations ──────────────────────────────────────────────────────────

  /** Create a relation between two memories. */
  async createRelation(
    subjectId: string,
    predicate: RelationType,
    objectId: string,
    confidence = 1.0,
  ): Promise<MemoryRelation | null> {
    if (!await this.ensureReady()) return null;

    const sql = `
      INSERT INTO gsd_memory.memory_relations (subject_id, predicate, object_id, confidence)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await this.pool.query(sql, [subjectId, predicate, objectId, confidence]);
    const row = result.rows[0];
    return {
      id: row.id,
      subjectId: row.subject_id,
      predicate: row.predicate,
      objectId: row.object_id,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      confidence: row.confidence,
      createdAt: row.created_at,
    };
  }

  /** Get all relations for a memory (as subject or object). */
  async getRelations(memoryId: string): Promise<MemoryRelation[]> {
    if (!await this.ensureReady()) return [];

    const sql = `
      SELECT * FROM gsd_memory.memory_relations
      WHERE (subject_id = $1 OR object_id = $1)
        AND valid_to IS NULL
      ORDER BY created_at DESC
    `;
    const result = await this.pool.query(sql, [memoryId]);
    return result.rows.map((row: any) => ({
      id: row.id,
      subjectId: row.subject_id,
      predicate: row.predicate,
      objectId: row.object_id,
      validFrom: row.valid_from,
      validTo: row.valid_to,
      confidence: row.confidence,
      createdAt: row.created_at,
    }));
  }

  /**
   * Graph traversal — find related memories up to N hops away.
   * Uses recursive CTE for efficient graph walking.
   */
  async traverseGraph(startId: string, maxHops = 2): Promise<MemoryRecord[]> {
    if (!await this.ensureReady()) return [];

    const sql = `
      WITH RECURSIVE graph AS (
        SELECT object_id AS id, 1 AS depth
        FROM gsd_memory.memory_relations
        WHERE subject_id = $1 AND valid_to IS NULL
        UNION
        SELECT subject_id AS id, 1 AS depth
        FROM gsd_memory.memory_relations
        WHERE object_id = $1 AND valid_to IS NULL
        UNION
        SELECT
          CASE WHEN r.subject_id = g.id THEN r.object_id ELSE r.subject_id END,
          g.depth + 1
        FROM gsd_memory.memory_relations r
        JOIN graph g ON (r.subject_id = g.id OR r.object_id = g.id)
        WHERE g.depth < $2 AND r.valid_to IS NULL
      )
      SELECT DISTINCT m.*
      FROM graph g
      JOIN gsd_memory.memories m ON m.id = g.id
      WHERE m.id != $1 AND m.valid_to IS NULL
      ORDER BY m.last_accessed DESC
      LIMIT 50
    `;

    const result = await this.pool.query(sql, [startId, maxHops]);
    return result.rows.map((row: MemoryRow) => this.rowToRecord(row));
  }

  // ─── Conversation Logs (PRIVATE) ────────────────────────────────────────

  /** Store a conversation session. */
  async storeSession(session: {
    id: string;
    startedAt: Date;
    endedAt?: Date;
    project?: string;
    branch?: string;
    summary?: string;
    topics?: string[];
  }): Promise<void> {
    if (!await this.ensureReady()) return;

    await this.pool.query(`
      INSERT INTO gsd_memory.conversation_sessions (id, started_at, ended_at, project, branch, summary, topics)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        ended_at = COALESCE(EXCLUDED.ended_at, gsd_memory.conversation_sessions.ended_at),
        turn_count = gsd_memory.conversation_sessions.turn_count,
        summary = COALESCE(EXCLUDED.summary, gsd_memory.conversation_sessions.summary),
        topics = COALESCE(EXCLUDED.topics, gsd_memory.conversation_sessions.topics)
    `, [
      session.id, session.startedAt, session.endedAt ?? null,
      session.project ?? null, session.branch ?? null,
      session.summary ?? null, session.topics ?? [],
    ]);
  }

  /** Store a conversation turn. */
  async storeTurn(turn: {
    id: string;
    sessionId: string;
    role: string;
    content: string;
    timestamp: Date;
    toolCalls?: string[];
    filesAccessed?: string[];
    tags?: string[];
  }): Promise<void> {
    if (!await this.ensureReady()) return;

    // Embed the turn content at store time so semantic conversation search
    // works without a later re-embedding pass (PG-5). Degrade gracefully: no
    // embedder, or an embed failure, stores the turn with a NULL vector rather
    // than dropping it. Serialized as a pgvector literal (NULL casts cleanly).
    let embedding: string | null = null;
    if (this.embedder) {
      try {
        const { embedding: vec } = await this.embedder.embed(turn.content);
        if (Array.isArray(vec) && vec.length > 0) embedding = `[${vec.join(',')}]`;
      } catch {
        embedding = null;
      }
    }

    await this.pool.query(`
      INSERT INTO gsd_memory.conversation_turns (id, session_id, role, content, timestamp, tool_calls, files_accessed, tags, embedding)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
      ON CONFLICT (id) DO NOTHING
    `, [
      turn.id, turn.sessionId, turn.role, turn.content, turn.timestamp,
      turn.toolCalls ?? null, turn.filesAccessed ?? null, turn.tags ?? [], embedding,
    ]);

    // Update session turn count
    await this.pool.query(`
      UPDATE gsd_memory.conversation_sessions
      SET turn_count = turn_count + 1
      WHERE id = $1
    `, [turn.sessionId]);
  }

  /**
   * Search conversation history using full-text search.
   * This data is ALWAYS PRIVATE — never synced externally.
   */
  async searchConversations(
    query: string,
    limit = 20,
    sessionFilter?: string[],
  ): Promise<Array<{ turn: ConversationTurnRow; sessionId: string; score: number }>> {
    if (!await this.ensureReady()) return [];

    const conditions = [`to_tsvector('english', content) @@ plainto_tsquery('english', $1)`];
    const params: any[] = [query];
    let paramIdx = 2;

    if (sessionFilter && sessionFilter.length > 0) {
      conditions.push(`session_id = ANY($${paramIdx})`);
      params.push(sessionFilter);
      paramIdx++;
    }

    const sql = `
      SELECT *,
        ts_rank_cd(to_tsvector('english', content), plainto_tsquery('english', $1)) AS rank
      FROM gsd_memory.conversation_turns
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC, timestamp DESC
      LIMIT ${limit}
    `;

    const result = await this.pool.query(sql, params);
    return result.rows.map((row: any) => this.toTurnResult(row, row.rank));
  }

  /** Project a conversation_turns row into a search result with a given score. */
  private toTurnResult(
    row: any,
    score: number,
  ): { turn: ConversationTurnRow; sessionId: string; score: number } {
    return {
      turn: {
        id: row.id,
        session_id: row.session_id,
        role: row.role,
        content: row.content,
        timestamp: row.timestamp,
        tool_calls: row.tool_calls,
        files_accessed: row.files_accessed,
        tags: row.tags ?? [],
      },
      sessionId: row.session_id,
      score,
    };
  }

  /**
   * Semantic search over conversation turns via pgvector cosine similarity
   * (PG-5), complementing the full-text searchConversations. Turns stored
   * without an embedding are excluded. This data is ALWAYS PRIVATE — never
   * synced externally.
   */
  async searchConversationsByEmbedding(
    embedding: number[],
    limit = 20,
    sessionFilter?: string[],
  ): Promise<Array<{ turn: ConversationTurnRow; sessionId: string; score: number }>> {
    if (!await this.ensureReady()) return [];

    const conditions = ['embedding IS NOT NULL'];
    const params: any[] = [`[${embedding.join(',')}]`, limit];
    let paramIdx = 3;
    if (sessionFilter && sessionFilter.length > 0) {
      conditions.push(`session_id = ANY($${paramIdx})`);
      params.push(sessionFilter);
      paramIdx++;
    }

    const sql = `
      SELECT *,
        1 - (embedding <=> $1::vector) AS score
      FROM gsd_memory.conversation_turns
      WHERE ${conditions.join(' AND ')}
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `;

    const result = await this.pool.query(sql, params);
    return result.rows.map((row: any) => this.toTurnResult(row, row.score));
  }

  /** Get recent conversation turns across all sessions. */
  async getRecentTurns(limit = 50): Promise<ConversationTurnRow[]> {
    if (!await this.ensureReady()) return [];

    const result = await this.pool.query(`
      SELECT * FROM gsd_memory.conversation_turns
      ORDER BY timestamp DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  }

  // ─── External Sync (PUBLIC ONLY) ────────────────────────────────────────

  /**
   * Get all public memories for external database sync.
   *
   * HARD RULE: Only returns memories with visibility = 'public'.
   * Conversation data is NEVER included.
   */
  async getPublicMemoriesForSync(): Promise<MemoryRecord[]> {
    if (!await this.ensureReady()) return [];

    const result = await this.pool.query(`
      SELECT * FROM gsd_memory.memories
      WHERE visibility = 'public'
        AND valid_to IS NULL
      ORDER BY updated_at DESC
    `);

    return result.rows.map((row: MemoryRow) => this.rowToRecord(row));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async ensureReady(): Promise<boolean> {
    if (!this.initialized) await this.init();
    return this.initialized && this.pool !== null;
  }

  private rowToRecord(row: MemoryRow): MemoryRecord {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      description: row.description,
      content: row.content,
      lodCurrent: LodLevel.FABRICATION,
      tags: row.tags ?? [],
      confidence: row.confidence,
      validFrom: new Date(row.valid_from),
      validTo: row.valid_to ? new Date(row.valid_to) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      lastAccessed: new Date(row.last_accessed),
      accessCount: row.access_count,
      provenance: {
        scope: row.scope,
        visibility: row.visibility,
        domains: row.domains ?? [],
        project: row.project ?? undefined,
        branch: row.branch ?? undefined,
        worktree: row.worktree ?? undefined,
        mission: row.mission ?? undefined,
        phase: row.phase ?? undefined,
      },
      temporalClass: row.temporal_class,
      sourceFile: row.source_file ?? undefined,
      sourceSession: row.source_session ?? undefined,
      relatedTo: row.related_to ?? [],
    };
  }

  private rowToResult(row: MemoryRow & { text_rank?: number }): MemoryResult {
    const record = this.rowToRecord(row);
    const ageDays = (Date.now() - record.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const baseScore = row.text_rank ?? 0.5;
    const temporal = temporalRelevance(record.temporalClass, ageDays);

    return {
      record,
      score: baseScore * temporal,
      sourceLod: LodLevel.FABRICATION,
      tokenEstimate: Math.ceil(record.content.length / 4),
    };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map a max visibility level to the set of allowed visibilities. */
function visibilityLevels(maxVisibility: MemoryVisibility): MemoryVisibility[] {
  switch (maxVisibility) {
    case 'public': return ['public'];
    case 'internal': return ['public', 'internal'];
    case 'private': return ['public', 'internal', 'private'];
  }
}
