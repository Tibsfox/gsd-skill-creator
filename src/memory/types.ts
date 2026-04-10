/**
 * Memory system types — LOD-tiered memory architecture.
 *
 * Six storage tiers mapped to BIM-derived LOD levels:
 *   LOD 100 (RAM)        — Process memory, session facts
 *   LOD 200 (Index)      — MEMORY.md pointers, always in context
 *   LOD 300 (Files)      — Individual markdown files, on-demand
 *   LOD 350 (Vectors)    — ChromaDB semantic search
 *   LOD 400 (Database)   — PostgreSQL + pgvector relational store
 *   LOD 500 (Corpus)     — Full filesystem + git history
 *
 * @module memory/types
 */

import type { LodLevel } from '../lod/types.js';

// ─── Visibility & Storage Policy ─────────────────────────────────────────────

/**
 * Visibility classification — controls WHERE a memory can be stored.
 *
 * This is a HARD SECURITY BOUNDARY. Private data must NEVER reach
 * external databases. The storage policy is enforced at the store level:
 * any attempt to sync private data to a public store must fail.
 *
 *   private   — Local machine only. Session logs, personal data, IP,
 *               credentials, Foxy origins, Fox Companies strategy.
 *               Stored: RAM, local files, local Chroma, local PostgreSQL.
 *               NEVER synced to external stores.
 *
 *   internal  — Shared within trusted infrastructure. Project decisions,
 *               architecture, working notes, .planning/ artifacts.
 *               Stored: all local stores + trusted private remotes.
 *               NOT synced to public-facing databases.
 *
 *   public    — Safe to publish. Research content, repo docs, www content,
 *               published artifacts, open-source code.
 *               Stored: anywhere, including external SQL (tibsfox.com).
 */
export type MemoryVisibility = 'private' | 'internal' | 'public';

/**
 * Storage policy per visibility level.
 * Defines which storage backends are allowed for each visibility.
 */
export interface StoragePolicy {
  /** Human description. */
  description: string;

  /** Allowed local storage tiers (LOD levels). */
  allowedLocalTiers: LodLevel[];

  /** Can this visibility level sync to external/remote PostgreSQL? */
  allowExternalSync: boolean;

  /** Can this visibility level appear in published sites (www/)? */
  allowPublicSite: boolean;

  /** Can this visibility level be included in git commits? */
  allowGitCommit: boolean;
}

/**
 * Storage policies — the enforcement rules.
 *
 * HARD RULE: private.allowExternalSync === false, always.
 * HARD RULE: private.allowPublicSite === false, always.
 * These are not configurable. They are security invariants.
 */
export const STORAGE_POLICIES: Record<MemoryVisibility, StoragePolicy> = {
  private: {
    description: 'Local only. Session logs, personal data, credentials, IP. Never leaves this machine.',
    allowedLocalTiers: [100, 200, 300, 350, 400] as LodLevel[],
    allowExternalSync: false,  // HARD RULE — never changes
    allowPublicSite: false,    // HARD RULE — never changes
    allowGitCommit: false,     // Private data should not be committed
  },
  internal: {
    description: 'Trusted infrastructure. Project decisions, architecture, working notes.',
    allowedLocalTiers: [100, 200, 300, 350, 400] as LodLevel[],
    allowExternalSync: false,  // Internal stays on trusted infra only
    allowPublicSite: false,    // Not for public sites
    allowGitCommit: true,      // Can be committed (e.g., .planning/ decisions)
  },
  public: {
    description: 'Safe to publish. Research, docs, www content, open-source.',
    allowedLocalTiers: [100, 200, 300, 350, 400, 500] as LodLevel[],
    allowExternalSync: true,   // Can sync to tibsfox.com SQL
    allowPublicSite: true,     // Can appear on published sites
    allowGitCommit: true,      // Can be committed
  },
};

/**
 * Check if a memory can be stored at a given backend.
 *
 * @param visibility — the memory's visibility classification
 * @param target — what we're trying to do with it
 * @returns true if the operation is allowed
 */
export function isStorageAllowed(
  visibility: MemoryVisibility,
  target: 'local' | 'external-sync' | 'public-site' | 'git-commit'
): boolean {
  const policy = STORAGE_POLICIES[visibility];
  switch (target) {
    case 'local': return true; // Local storage always allowed
    case 'external-sync': return policy.allowExternalSync;
    case 'public-site': return policy.allowPublicSite;
    case 'git-commit': return policy.allowGitCommit;
  }
}

/**
 * Infer visibility from memory type, scope, and content signals.
 *
 * Conservative: when in doubt, classify as private.
 * Can always be manually promoted to internal/public.
 */
export function inferVisibility(
  type: MemoryType,
  scope: MemoryScope,
  tags: string[] = []
): MemoryVisibility {
  // Session data is ALWAYS private
  if (scope === 'session') return 'private';

  // Certain tags force private
  const privateTags = ['credentials', 'personal', 'ip', 'classified', 'private', 'secret'];
  if (tags.some(t => privateTags.includes(t.toLowerCase()))) return 'private';

  // User identity is private (personal information)
  if (type === 'user') return 'private';

  // Certain tags indicate public
  const publicTags = ['published', 'research', 'open-source', 'documentation', 'www'];
  if (tags.some(t => publicTags.includes(t.toLowerCase()))) return 'public';

  // Semantic knowledge from research is public by default
  if (type === 'semantic' && scope === 'domain') return 'public';

  // Reference links to external resources are public
  if (type === 'reference' && scope === 'global') return 'public';

  // Project and feedback memories are internal by default
  if (type === 'project' || type === 'feedback') return 'internal';

  // Episodic (session events) are private
  if (type === 'episodic') return 'private';

  // Default: internal (conservative but not locked down)
  return 'internal';
}

/**
 * Database routing based on visibility.
 *
 * Returns which PostgreSQL database/schema a memory should be stored in.
 * Private + internal → local PostgreSQL (localhost:5432, artemis schema)
 * Public → can ALSO sync to external PostgreSQL (tibsfox.com)
 */
export interface DatabaseRoute {
  /** Local database connection (always present). */
  local: { host: 'localhost'; schema: 'artemis' };

  /** External database connection (only for public data, null otherwise). */
  external: { host: string; schema: string } | null;
}

export function routeToDatabase(visibility: MemoryVisibility): DatabaseRoute {
  const local = { host: 'localhost' as const, schema: 'artemis' as const };

  if (visibility === 'public') {
    return {
      local,
      external: { host: 'tibsfox.com', schema: 'public_research' },
    };
  }

  // Private and internal: local only, external is null
  return { local, external: null };
}

// ─── Memory Scope & Provenance ───────────────────────────────────────────────

/**
 * Where a memory applies. Determines relevance when querying across contexts.
 *
 * Ordered from broadest to narrowest:
 *   global    — Universal truths, user identity, cross-project preferences
 *   domain    — Applies to a knowledge domain (e.g., "networking", "rust")
 *   project   — Specific to one project/repo
 *   branch    — Specific to a git branch within a project
 *   session   — Relevant only to a single work session
 */
export type MemoryScope =
  | 'global'    // User prefs, identity, universal feedback — always relevant
  | 'domain'    // Domain knowledge — relevant when working in that domain
  | 'project'   // Project-specific decisions, architecture, patterns
  | 'branch'    // Branch-specific state (e.g., artemis-ii vs nasa vs dev)
  | 'session';  // Ephemeral session context — highest relevance but shortest life

/**
 * Complete provenance: where a memory came from and what it's about.
 * Answers: "Why should I care about this memory right now?"
 */
export interface MemoryProvenance {
  /** The scope at which this memory applies. */
  scope: MemoryScope;

  /**
   * Visibility classification — controls storage routing.
   * HARD RULE: private data never reaches external databases.
   */
  visibility: MemoryVisibility;

  /**
   * The project this memory belongs to (null for global scope).
   * Note: artemis-ii and gsd-skill-creator are the same repo (worktree),
   * so they share the same project scope: 'gsd-skill-creator'.
   */
  project?: string;

  /** The git branch this memory was created on (null for project+ scope). */
  branch?: string;

  /**
   * The worktree name if applicable. Worktrees of the same repo share
   * project scope but may differ in branch. E.g., artemis-ii is a worktree
   * of gsd-skill-creator on the artemis-ii branch.
   */
  worktree?: string;

  /** The knowledge domain(s) this memory relates to. */
  domains: string[];

  /** The workspace/directory path where this memory originated. */
  workspace?: string;

  /** The GSD phase that produced this memory (if applicable). */
  phase?: string;

  /** The mission/milestone context (e.g., "Artemis II", "v1.50", "NASA"). */
  mission?: string;
}

// ─── Temporal Relevance ──────────────────────────────────────────────────────

/**
 * How a memory ages over time. Not all old memories are stale —
 * some are timeless knowledge, others are temporal facts that decay.
 *
 *   timeless     — Never decays: math proofs, user identity, universal laws
 *   durable      — Slow decay: architectural decisions, learned patterns
 *   seasonal     — Medium decay: project goals, current sprint context
 *   ephemeral    — Fast decay: session state, temporary workarounds, drafts
 *   dated        — Historical record: useful as context, not as current truth
 *
 * Decay rate determines how much the age of a memory reduces its
 * relevance score during queries. Timeless memories never lose relevance
 * due to age; ephemeral memories lose relevance quickly.
 */
export type TemporalClass =
  | 'timeless'    // Half-life: never. Math, identity, universal prefs.
  | 'durable'     // Half-life: 180 days. Architecture, patterns, major decisions.
  | 'seasonal'    // Half-life: 30 days. Sprint goals, active project context.
  | 'ephemeral'   // Half-life: 3 days. Session state, temp workarounds.
  | 'dated';      // Half-life: 7 days, but floor at 0.2 — always has historical value.

/**
 * Half-life in days for each temporal class.
 * After one half-life, the temporal relevance factor drops to 0.5.
 * After two half-lives, 0.25, etc.
 *
 * The `floor` prevents memories from reaching zero relevance —
 * even very old memories retain some minimum retrieval weight.
 */
export const TEMPORAL_DECAY: Record<TemporalClass, { halfLifeDays: number; floor: number }> = {
  timeless:  { halfLifeDays: Infinity, floor: 1.0 },   // Never decays
  durable:   { halfLifeDays: 180,      floor: 0.3 },   // Slow decay, retains 30% min
  seasonal:  { halfLifeDays: 30,       floor: 0.1 },   // Medium decay, retains 10% min
  ephemeral: { halfLifeDays: 3,        floor: 0.0 },   // Fast decay, can reach zero
  dated:     { halfLifeDays: 7,        floor: 0.2 },   // Decays fast but historical floor
};

/**
 * Calculate temporal relevance factor for a memory.
 *
 * @param temporalClass — how the memory ages
 * @param ageInDays — how old the memory is
 * @returns relevance factor between floor and 1.0
 */
export function temporalRelevance(temporalClass: TemporalClass, ageInDays: number): number {
  const { halfLifeDays, floor } = TEMPORAL_DECAY[temporalClass];
  if (halfLifeDays === Infinity) return 1.0;
  if (ageInDays <= 0) return 1.0;
  // Exponential decay: factor = 2^(-age/halfLife)
  const rawFactor = Math.pow(2, -ageInDays / halfLifeDays);
  return Math.max(floor, rawFactor);
}

/**
 * Infer temporal class from memory type and scope.
 * Can be overridden per-memory, but this provides sensible defaults.
 */
export function inferTemporalClass(type: MemoryType, scope: MemoryScope): TemporalClass {
  // Session-scoped anything is ephemeral (check scope first, before type)
  if (scope === 'session') return 'ephemeral';

  // User identity and universal feedback are timeless
  if (type === 'user' && scope === 'global') return 'timeless';
  if (type === 'feedback' && scope === 'global') return 'durable';

  // Semantic knowledge (concepts, facts) is durable
  if (type === 'semantic') return 'durable';

  // References are durable (URLs may rot but the pointer itself is worth keeping)
  if (type === 'reference') return 'durable';

  // Episodic memories are dated (historical value)
  if (type === 'episodic') return 'dated';

  // Project-scoped decisions are seasonal
  if (type === 'project') return 'seasonal';
  if (type === 'feedback' && scope === 'project') return 'seasonal';

  // Default: seasonal
  return 'seasonal';
}

// ─── Scope Relevance ─────────────────────────────────────────────────────────

/**
 * Scope proximity scores for relevance.
 * When querying from a specific context, how relevant is each scope?
 *
 * Example: querying from project "artemis-ii" on branch "artemis-ii":
 *   - global memories: 0.6 (always somewhat relevant)
 *   - domain memories: 0.7 (if domain matches)
 *   - project memories for "artemis-ii": 1.0 (exact match)
 *   - project memories for "nasa": 0.3 (different project)
 *   - branch memories for "artemis-ii": 1.0 (exact match)
 *   - branch memories for "dev": 0.2 (different branch)
 *   - session memories: 0.9 (current session is very relevant)
 */
export const SCOPE_BASE_RELEVANCE: Record<MemoryScope, number> = {
  global:  0.6,   // Always somewhat relevant regardless of context
  domain:  0.7,   // Relevant when domain matches
  project: 0.8,   // Relevant when project matches
  branch:  0.9,   // Relevant when branch matches
  session: 1.0,   // Most relevant — current session context
};

/** Penalty when a scoped memory doesn't match the current context. */
export const SCOPE_MISMATCH_PENALTY: Record<MemoryScope, number> = {
  global:  0.0,   // Global never mismatches
  domain:  0.4,   // Wrong domain: 0.7 * (1 - 0.4) = 0.42
  project: 0.7,   // Wrong project: 0.8 * (1 - 0.7) = 0.24
  branch:  0.8,   // Wrong branch: 0.9 * (1 - 0.8) = 0.18
  session: 1.0,   // Wrong session: 0 relevance
};

/**
 * Calculate scope relevance factor.
 *
 * @param memory — the memory's provenance
 * @param queryContext — the current query context
 * @returns relevance factor between 0.0 and 1.0
 */
export function scopeRelevance(
  memory: MemoryProvenance,
  queryContext: QueryContext
): number {
  const base = SCOPE_BASE_RELEVANCE[memory.scope];

  // Global scope — always the base relevance
  if (memory.scope === 'global') return base;

  // Domain scope — check domain overlap
  if (memory.scope === 'domain') {
    if (queryContext.domains && memory.domains.length > 0) {
      const overlap = memory.domains.filter(d => queryContext.domains!.includes(d));
      if (overlap.length > 0) return base;
    }
    return base * (1 - SCOPE_MISMATCH_PENALTY.domain);
  }

  // Project scope — check project match
  if (memory.scope === 'project') {
    if (queryContext.project && memory.project === queryContext.project) return base;
    return base * (1 - SCOPE_MISMATCH_PENALTY.project);
  }

  // Branch scope — check branch match (also needs project match)
  if (memory.scope === 'branch') {
    if (queryContext.branch && memory.branch === queryContext.branch &&
        queryContext.project && memory.project === queryContext.project) return base;
    // Same project different branch is still somewhat relevant
    if (queryContext.project && memory.project === queryContext.project) return base * 0.5;
    return base * (1 - SCOPE_MISMATCH_PENALTY.branch);
  }

  // Session scope — check session match
  if (memory.scope === 'session') {
    if (queryContext.session && queryContext.session === memory.workspace) return base;
    return 0; // Different session = not relevant
  }

  return base;
}

/** Context for scope-aware queries. */
export interface QueryContext {
  /** Current project name. */
  project?: string;

  /** Current git branch. */
  branch?: string;

  /** Current worktree name (e.g., 'artemis-ii' — same project as 'gsd-skill-creator'). */
  worktree?: string;

  /** Current knowledge domains being worked in. */
  domains?: string[];

  /** Current session identifier. */
  session?: string;

  /**
   * Maximum visibility to include in results.
   * 'private' = include all. 'public' = only public data.
   * Used when building content for external sync or publication.
   * Default: 'private' (include everything — local queries).
   */
  maxVisibility?: MemoryVisibility;
}

// ─── Memory Record ───────────────────────────────────────────────────────────

/** The canonical memory types (superset of auto-memory's 4 types). */
export type MemoryType =
  | 'user'       // Who the user is, preferences, background
  | 'feedback'   // Corrections and confirmations of approach
  | 'project'    // Ongoing work, goals, deadlines
  | 'reference'  // Pointers to external resources
  | 'episodic'   // Session events, what happened
  | 'semantic';  // Concepts, relationships, facts

/** A memory record that can exist at any LOD tier. */
export interface MemoryRecord {
  /** Unique identifier (UUID v4). */
  id: string;

  /** Memory classification. */
  type: MemoryType;

  /** Short name for indexing and display. */
  name: string;

  /** One-line description used for relevance matching (~150 chars). */
  description: string;

  /** Full memory content (verbatim — never summarized). */
  content: string;

  /** Highest LOD tier where this memory currently exists. */
  lodCurrent: LodLevel;

  /** Tags for filtering. */
  tags: string[];

  /** Confidence score (0.0 to 1.0). */
  confidence: number;

  // ─── Temporal ──────────────────────────────────────────────────────────

  /** When this memory became valid. */
  validFrom: Date;

  /** When this memory stopped being valid (null = still valid). */
  validTo: Date | null;

  /** When this memory was created. */
  createdAt: Date;

  /** When this memory was last modified. */
  updatedAt: Date;

  /** When this memory was last accessed/retrieved. */
  lastAccessed: Date;

  /** How many times this memory has been retrieved. */
  accessCount: number;

  // ─── Provenance ────────────────────────────────────────────────────────

  /** Where this memory came from and what it's about. */
  provenance: MemoryProvenance;

  /** How this memory ages — determines temporal relevance decay. */
  temporalClass: TemporalClass;

  /** Path to the LOD 300 markdown file (if exists). */
  sourceFile?: string;

  /** Session ID that created this memory. */
  sourceSession?: string;

  /** Related memory IDs. */
  relatedTo: string[];
}

// ─── Memory Relations ────────────────────────────────────────────────────────

/** Relationship types between memories. */
export type RelationType =
  | 'supersedes'    // This memory replaces another
  | 'contradicts'   // This memory conflicts with another
  | 'elaborates'    // This memory adds detail to another
  | 'derives-from'; // This memory was created from another

export interface MemoryRelation {
  id: string;
  subjectId: string;
  predicate: RelationType;
  objectId: string;
  validFrom: Date;
  validTo: Date | null;
  confidence: number;
  createdAt: Date;
}

// ─── Query Types ─────────────────────────────────────────────────────────────

/** Query against the unified memory system. */
export interface MemoryQuery {
  /** The search text (semantic and keyword). */
  text: string;

  /** Filter by memory type. */
  type?: MemoryType;

  /** Filter by tags. */
  tags?: string[];

  /** Maximum LOD tier to search (higher = deeper, slower). */
  maxLod?: LodLevel;

  /** Minimum LOD tier to search (skip fast tiers). */
  minLod?: LodLevel;

  /** Cascade: start from LOD 100, go deeper until minResults satisfied. */
  cascade?: boolean;

  /** Minimum number of results before stopping cascade. */
  minResults?: number;

  /** Maximum results to return. */
  limit?: number;

  /** Only return memories valid at this point in time. */
  asOf?: Date;

  /** Token budget for results (limits how much content is returned). */
  tokenBudget?: number;

  // ─── Scope & Temporal ───────────────────────────────────────────────

  /** Current context for scope-aware relevance scoring. */
  queryContext?: QueryContext;

  /** Filter by memory scope. */
  scope?: MemoryScope;

  /** Filter by temporal class. */
  temporalClass?: TemporalClass;

  /**
   * Apply temporal relevance decay to scores.
   * When true (default), older memories score lower based on their temporal class.
   * Set to false for historical queries where age doesn't matter.
   */
  applyTemporalDecay?: boolean;

  /**
   * Apply scope proximity scoring.
   * When true (default), memories from other projects/branches score lower.
   * Set to false to search all memories with equal weight.
   */
  applyScopeRelevance?: boolean;

  // ─── Visibility ──────────────────────────────────────────────────────

  /**
   * Filter by visibility. Only return memories at or below this visibility.
   * 'private' = include all (default for local queries).
   * 'internal' = exclude private (for shared/team contexts).
   * 'public' = only public data (for external sync or publication).
   *
   * HARD RULE: external database sync queries MUST set this to 'public'.
   */
  visibility?: MemoryVisibility;
}

/** A single result from a memory query. */
export interface MemoryResult {
  /** The memory record. */
  record: MemoryRecord;

  /** Relevance score (0.0 to 1.0). */
  score: number;

  /** Which LOD tier this result came from. */
  sourceLod: LodLevel;

  /** Estimated token count of the content. */
  tokenEstimate: number;
}

/** Aggregated query response. */
export interface MemoryQueryResponse {
  /** Ordered results (highest relevance first). */
  results: MemoryResult[];

  /** Which LOD tiers were searched. */
  tiersSearched: LodLevel[];

  /** Total time in milliseconds. */
  queryTimeMs: number;

  /** Total estimated tokens across all results. */
  totalTokens: number;
}

// ─── Store Interface ─────────────────────────────────────────────────────────

/** Interface that each LOD tier's store must implement. */
export interface MemoryStore {
  /** The LOD level this store serves. */
  readonly lod: LodLevel;

  /** Store a memory record at this tier. */
  store(record: MemoryRecord): Promise<void>;

  /** Query this tier. */
  query(q: MemoryQuery): Promise<MemoryResult[]>;

  /** Retrieve a specific memory by ID. */
  get(id: string): Promise<MemoryRecord | null>;

  /** Remove a memory from this tier (does NOT delete — just removes from this LOD). */
  remove(id: string): Promise<boolean>;

  /** Check if a memory exists at this tier. */
  has(id: string): Promise<boolean>;

  /** Count memories at this tier. */
  count(): Promise<number>;
}

// ─── Promotion/Demotion ──────────────────────────────────────────────────────

/** Criteria for automatic tier promotion. */
export interface PromotionRule {
  /** Promote to this LOD when conditions are met. */
  targetLod: LodLevel;

  /** Minimum access count to trigger promotion. */
  minAccessCount?: number;

  /** Minimum recency (accessed within N days). */
  maxDaysSinceAccess?: number;

  /** Minimum confidence score. */
  minConfidence?: number;
}

/** Criteria for automatic tier demotion. */
export interface DemotionRule {
  /** Demote from this LOD when conditions are met. */
  sourceLod: LodLevel;

  /** Demote after N days without access. */
  daysWithoutAccess: number;
}

/** Default promotion rules. */
export const DEFAULT_PROMOTIONS: PromotionRule[] = [
  // Frequently accessed → promote to RAM cache
  { targetLod: 100, minAccessCount: 10, maxDaysSinceAccess: 7 },
  // Regularly accessed → promote to MEMORY.md index
  { targetLod: 200, minAccessCount: 5, maxDaysSinceAccess: 14 },
  // New memories → auto-embed in Chroma
  { targetLod: 350, minAccessCount: 0 },
  // All memories → persist in PostgreSQL
  { targetLod: 400, minAccessCount: 0 },
];

/** Default demotion rules. */
export const DEFAULT_DEMOTIONS: DemotionRule[] = [
  // Remove from RAM after 1 day without access
  { sourceLod: 100, daysWithoutAccess: 1 },
  // Remove from MEMORY.md index after 30 days without access
  { sourceLod: 200, daysWithoutAccess: 30 },
];

// ─── Stats ───────────────────────────────────────────────────────────────────

/** Memory system health metrics. */
export interface MemoryStats {
  /** Count per tier. */
  tierCounts: Record<number, number>;

  /** Total memories across all tiers. */
  totalMemories: number;

  /** Memories by type. */
  typeCounts: Record<MemoryType, number>;

  /** Active (valid_to is null) vs deprecated. */
  activeCount: number;
  deprecatedCount: number;

  /** Average access count across all memories. */
  avgAccessCount: number;

  /** Oldest memory date. */
  oldestMemory: Date | null;

  /** Most recent memory date. */
  newestMemory: Date | null;
}
