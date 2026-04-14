/**
 * ArenaSkillStore — arena-backed alternative to the filesystem SkillStore.
 *
 * Implements the same minimal `SkillStore` contract used by
 * `skill-creator-mcp.ts` (create / list / exists), plus extended
 * lifecycle operations (get / update / remove / setLifecycle /
 * listEntries) needed for `SkillWorkspace` equivalence.
 *
 * Skills are stored as JSON-serialized records in the arena's Resident
 * tier via the `ContentAddressedStore` substrate built in P1. The
 * lookup key is `sha256(skillName)` — giving us O(1) name lookup
 * without a separate index, and automatic arena-side persistence via
 * the checkpoint + journal machinery (M7-M11).
 *
 * # Why Resident tier
 *
 * Skills are long-lived and small. The Resident tier is the Amiga-
 * inspired "survives every checkpoint cheaply" region — skills here
 * warm-start in <1 ms after a crash recovery, vs ~60 ms of
 * `readdir + stat + parse` per skill in the filesystem flow.
 *
 * # Name collisions
 *
 * `sha256(skillName)` collisions are cryptographically implausible.
 * We treat the hash as the canonical skill identity. Renaming a
 * skill means allocating a new hash-keyed record and migrating
 * history — not supported in P2 (matches the filesystem `SkillStore`
 * which has no rename op either).
 *
 * # Rollback
 *
 * This module doesn't touch the existing filesystem `SkillStore`.
 * Callers wire either the file-backed or arena-backed store through
 * `SkillCreatorDeps.skillStore`. Rollback = switch back.
 *
 * See `.planning/INTEGRATION-MEMORY-UNISON-SKILLS.md` design doc.
 *
 * @module mesh/arena-skill-store
 */

import { sha256Hex } from '../memory/content-addressed-store.js';
import type { GroveStore } from '../memory/grove-store.js';
import type { SkillLifecycleState, StateTransition } from './operation-tracker.js';

// ─── Record shape ───────────────────────────────────────────────────────────

/**
 * Serialized form of a skill in the arena. This is the full record
 * — everything `SkillWorkspace` and `OperationTracker` need to
 * function without touching the filesystem.
 */
export interface ArenaSkillRecord {
  /** Skill name (e.g. "vision-to-mission"). The lookup identity. */
  name: string;
  /** One-line description from the YAML frontmatter. */
  description: string;
  /** Full SKILL.md body text. */
  body: string;
  /** Schema version for this record layout. */
  version: number;
  /** Epoch ms when first created. */
  createdAt: number;
  /** Epoch ms of the last update. */
  updatedAt: number;
  /** Current lifecycle state. */
  lifecycle: SkillLifecycleState;
  /** Ordered history of lifecycle transitions. */
  lifecycleHistory: StateTransition[];
  /** Count of `tested` transitions — used for the "tested models" display. */
  testedModels: number;
}

/** Current record schema version. Bump when breaking the on-wire shape. */
export const SKILL_RECORD_VERSION = 1;

// ─── Interfaces matching filesystem SkillStore ──────────────────────────────

/**
 * Subset of `SkillCreatorDeps.skillStore` from `skill-creator-mcp.ts`.
 * Matched exactly so `ArenaSkillStore` can be substituted via DI.
 */
export interface SkillStoreContract {
  create(
    skillName: string,
    metadata: { name: string; description: string },
    body: string,
  ): Promise<{ path: string }>;
  list(): Promise<string[]>;
  exists(skillName: string): Promise<boolean>;
}

/**
 * Summary row for workspace listings — matches `SkillWorkspaceEntry`
 * from `skill-workspace.ts` so `ArenaSkillStore.listEntries()` is a
 * drop-in replacement for `SkillWorkspace.listSkills()`.
 */
export interface ArenaSkillEntry {
  name: string;
  status: SkillLifecycleState;
  testedModels: number;
  /** ISO-8601 string of `updatedAt`, for filesystem parity. */
  lastModified: string;
}

export interface ArenaSkillStoreOptions {
  /** Content-addressed substrate. Typically scoped to the Resident tier. */
  cas: GroveStore;
}

// ─── Serialization ──────────────────────────────────────────────────────────

function serialize(record: ArenaSkillRecord): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(record));
}

function deserialize(bytes: Uint8Array): ArenaSkillRecord {
  const obj = JSON.parse(new TextDecoder().decode(bytes)) as Partial<ArenaSkillRecord>;
  if (
    typeof obj.name !== 'string' ||
    typeof obj.description !== 'string' ||
    typeof obj.body !== 'string'
  ) {
    throw new Error('ArenaSkillStore: corrupt skill record — missing required fields');
  }
  // Backfill optional/future fields so older records still load.
  return {
    name: obj.name,
    description: obj.description,
    body: obj.body,
    version: obj.version ?? SKILL_RECORD_VERSION,
    createdAt: obj.createdAt ?? Date.now(),
    updatedAt: obj.updatedAt ?? obj.createdAt ?? Date.now(),
    lifecycle: (obj.lifecycle as SkillLifecycleState | undefined) ?? 'draft',
    lifecycleHistory: obj.lifecycleHistory ?? [],
    testedModels: obj.testedModels ?? 0,
  };
}

// ─── Lifecycle transitions ──────────────────────────────────────────────────

const VALID_TRANSITIONS: Record<SkillLifecycleState, SkillLifecycleState[]> = {
  draft: ['tested'],
  tested: ['graded', 'optimized'],
  graded: ['optimized'],
  optimized: ['packaged'],
  packaged: [],
};

// ─── ArenaSkillStore ────────────────────────────────────────────────────────

export class ArenaSkillStore implements SkillStoreContract {
  private readonly cas: GroveStore;

  constructor(options: ArenaSkillStoreOptions) {
    this.cas = options.cas;
  }

  // ─── Hashing ──────────────────────────────────────────────────────────────

  /**
   * Derive the lookup hash for a skill name. Uses SHA-256 so the hash
   * is cryptographically unique and deterministic across processes.
   */
  private hashForName(skillName: string): string {
    return sha256Hex(new TextEncoder().encode(`skill:${skillName}`));
  }

  /**
   * Synthetic "path" returned by `create()`. Mirrors the filesystem
   * store's return shape so callers don't care which backend they're
   * talking to. Resolves to `arena://<hash>` where `<hash>` is the
   * skill's name hash.
   */
  private synthPath(skillName: string): string {
    return `arena://${this.hashForName(skillName)}`;
  }

  // ─── SkillStoreContract ───────────────────────────────────────────────────

  /**
   * Create a new skill record. If a skill with the same name already
   * exists, this overwrites it — matching the filesystem store's
   * "last write wins" behavior on `writeFile`.
   */
  async create(
    skillName: string,
    metadata: { name: string; description: string },
    body: string,
  ): Promise<{ path: string }> {
    if (!skillName || skillName.trim() === '') {
      throw new Error('ArenaSkillStore: skillName must be non-empty');
    }
    const now = Date.now();
    const hash = this.hashForName(skillName);

    // Check if we're updating an existing record so createdAt is preserved.
    const existingBytes = await this.cas.getByHash(hash);
    let createdAt = now;
    let lifecycle: SkillLifecycleState = 'draft';
    let lifecycleHistory: StateTransition[] = [];
    let testedModels = 0;
    if (existingBytes) {
      try {
        const prev = deserialize(existingBytes);
        createdAt = prev.createdAt;
        lifecycle = prev.lifecycle;
        lifecycleHistory = prev.lifecycleHistory;
        testedModels = prev.testedModels;
      } catch {
        // Corrupt record — treat as new.
      }
    }

    const record: ArenaSkillRecord = {
      name: metadata.name,
      description: metadata.description,
      body,
      version: SKILL_RECORD_VERSION,
      createdAt,
      updatedAt: now,
      lifecycle,
      lifecycleHistory,
      testedModels,
    };

    // Use replaceByHash since we may be overwriting. Dedup is still
    // active: if the serialized bytes match exactly (same content at
    // the same second), the arena side is a no-op on retry.
    await this.cas.replaceByHash(hash, serialize(record));
    return { path: this.synthPath(skillName) };
  }

  /**
   * List every skill name currently in the store. Uses the
   * ContentAddressedStore's in-memory hash index for speed (no arena
   * scan on the hot path). Decoding each record is required to
   * retrieve the name from its payload.
   */
  async list(): Promise<string[]> {
    const hashes = await this.cas.listHashes();
    const names: string[] = [];
    for (const hash of hashes) {
      const bytes = await this.cas.getByHash(hash);
      if (!bytes) continue;
      try {
        const record = deserialize(bytes);
        names.push(record.name);
      } catch {
        // Skip records we can't decode — another store's chunks or
        // a record from a future schema version.
      }
    }
    names.sort();
    return names;
  }

  /** True if a skill with `skillName` exists in the arena. */
  async exists(skillName: string): Promise<boolean> {
    return this.cas.hasHash(this.hashForName(skillName));
  }

  // ─── Extended API ─────────────────────────────────────────────────────────

  /**
   * Fetch the full record for a skill, or null if not present.
   */
  async get(skillName: string): Promise<ArenaSkillRecord | null> {
    const bytes = await this.cas.getByHash(this.hashForName(skillName));
    if (!bytes) return null;
    try {
      return deserialize(bytes);
    } catch {
      return null;
    }
  }

  /**
   * Remove a skill from the arena. Returns true if something was
   * removed. The underlying chunk id is freed; the hash slot is
   * available for a future `create` of the same name.
   */
  async remove(skillName: string): Promise<boolean> {
    return this.cas.removeByHash(this.hashForName(skillName));
  }

  /**
   * Advance a skill's lifecycle state. Validates the transition
   * against `VALID_TRANSITIONS` (same set OperationTracker enforces)
   * and records it in the in-record history. Throws on invalid moves.
   */
  async setLifecycle(skillName: string, to: SkillLifecycleState): Promise<void> {
    const record = await this.get(skillName);
    if (!record) {
      throw new Error(`ArenaSkillStore: skill "${skillName}" not found`);
    }

    const allowed = VALID_TRANSITIONS[record.lifecycle];
    if (!allowed.includes(to)) {
      throw new Error(
        `ArenaSkillStore: invalid transition ${record.lifecycle} → ${to} for "${skillName}"`,
      );
    }

    const now = Date.now();
    const updated: ArenaSkillRecord = {
      ...record,
      lifecycle: to,
      updatedAt: now,
      lifecycleHistory: [
        ...record.lifecycleHistory,
        { from: record.lifecycle, to, timestamp: new Date(now).toISOString() },
      ],
      testedModels: to === 'tested' ? record.testedModels + 1 : record.testedModels,
    };
    await this.cas.replaceByHash(this.hashForName(skillName), serialize(updated));
  }

  /**
   * Update the body and/or description of an existing skill without
   * changing its lifecycle. Updates `updatedAt`.
   */
  async update(
    skillName: string,
    patch: Partial<Pick<ArenaSkillRecord, 'description' | 'body'>>,
  ): Promise<void> {
    const record = await this.get(skillName);
    if (!record) {
      throw new Error(`ArenaSkillStore: skill "${skillName}" not found`);
    }
    const updated: ArenaSkillRecord = {
      ...record,
      description: patch.description ?? record.description,
      body: patch.body ?? record.body,
      updatedAt: Date.now(),
    };
    await this.cas.replaceByHash(this.hashForName(skillName), serialize(updated));
  }

  /**
   * Produce a workspace listing compatible with `SkillWorkspaceEntry`
   * from `skill-workspace.ts`. Every record is decoded once, so the
   * cost is O(N) — same as the filesystem `listSkills()` but without
   * the per-skill `readdir + stat + readFile` overhead.
   */
  async listEntries(): Promise<ArenaSkillEntry[]> {
    const hashes = await this.cas.listHashes();
    const entries: ArenaSkillEntry[] = [];
    for (const hash of hashes) {
      const bytes = await this.cas.getByHash(hash);
      if (!bytes) continue;
      try {
        const record = deserialize(bytes);
        entries.push({
          name: record.name,
          status: record.lifecycle,
          testedModels: record.testedModels,
          lastModified: new Date(record.updatedAt).toISOString(),
        });
      } catch {
        // skip
      }
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    return entries;
  }

  /** Count of indexed skills. */
  async count(): Promise<number> {
    return this.cas.count();
  }
}
