/**
 * Atlas IPC-to-HTTP command handlers for browser-tab mode (v1.49.607 W4c).
 *
 * Mirrors the 13 Tauri atlas commands defined in `src-tauri/src/intelligence/atlas.rs`,
 * but dispatches against the in-process TypeScript KB stack (KBStore + SymbolsKB +
 * ProvenanceKB) instead of the Rust SqliteAtlasKbDelegate. Same return shapes, same
 * empty-state contract: missing snapshot / unknown id → empty array (not error).
 *
 * Resolution model: most atlas commands take `snapshot_id` (or `symbol_id` / `mission_id`)
 * with no `project_id`. We mirror the Rust delegate's scan-every-registered-project
 * approach — iterate over the KBStore registry, ensure each project DB is open, and
 * aggregate non-empty results. With small registries (typical: 1-4 projects per repo)
 * the scan is O(N) registries × one indexed lookup; threading project_id through the
 * IPC surface is a v1.49.608+ refinement.
 *
 * Ownership: this module is wired into `dashboard-bridge.ts` via `installAtlasCommands()`
 * to keep the bridge file focused on its KB-command catalog. The atlas commands form
 * a coherent sub-surface (read methods + indexer dispatch + cache invalidation) and
 * are large enough to merit their own file.
 *
 * Browser-mode invariant: this file imports nothing from `@tauri-apps/api`. The
 * `intelligenceIpc` shim in `src/intelligence/ipc.ts` is the only file that does;
 * its HTTP fallback path lands here.
 */

import type Database from 'better-sqlite3';
import type { KBStore } from './kb/store.js';
import { SymbolsKB } from './kb/symbols.js';
import { ProvenanceKB } from './kb/provenance.js';
import type {
  AtlasCallEdge,
  AtlasFilesChanged,
  AtlasMissionProvenance,
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasTypeRelation,
  ProjectId,
  SnapshotId,
  SymbolId,
  SymbolKind,
  AtlasLanguage,
} from './types.js';

// ─── Public payload types ─────────────────────────────────────────────────────

/** Mirrors `MissionForFileSummary` from `ipc.ts`. */
export interface MissionForFileSummary {
  mission_id: string;
  weight: number;
  line_count: number;
}

/** Mirrors the Rust `InvalidateCacheResult` shape returned over the wire. */
export interface InvalidateCacheResult {
  scope: 'project' | 'all';
  evicted_count: number;
}

// ─── Module-private helpers ───────────────────────────────────────────────────

/**
 * Ensure every registered project's DB is open in the KBStore, then iterate
 * through them. Yields each `(projectId, projectPath, db)` tuple in registration
 * order. Caller is responsible for any per-DB query and aggregation.
 *
 * Callers MUST tolerate empty registries (e.g. fresh `~/.gsd/intelligence/registry.db`
 * with no rows) — the iterator simply produces nothing.
 */
async function* iterProjectDBs(
  kb: KBStore,
): AsyncGenerator<{ projectId: ProjectId; db: Database.Database }, void, void> {
  const projects = await kb.listProjects();
  for (const p of projects) {
    try {
      await kb.ensureProjectDB(p.id);
    } catch {
      // Project row exists in registry but DB couldn't be opened (path missing,
      // migration failure). Skip — empty-state contract: do not throw.
      continue;
    }
    let db: Database.Database;
    try {
      db = await kb.getProjectRawDB(p.id);
    } catch {
      continue;
    }
    yield { projectId: p.id, db };
  }
}

/**
 * Run a SQL query across every registered project DB and concatenate non-null
 * results. Used by the snapshot-keyed and mission-keyed atlas commands.
 */
async function scanAggregate<T>(
  kb: KBStore,
  query: (db: Database.Database) => T[],
): Promise<T[]> {
  const out: T[] = [];
  for await (const { db } of iterProjectDBs(kb)) {
    try {
      const rows = query(db);
      if (rows.length > 0) out.push(...rows);
    } catch {
      // Schema mismatch (project DB lacks migration 003) — skip.
    }
  }
  return out;
}

/**
 * Return the first non-null result from any registered project DB. Used by
 * `atlas_get_symbol`, which has unique results per id.
 */
async function scanFirstNonNull<T>(
  kb: KBStore,
  query: (db: Database.Database) => T | null,
): Promise<T | null> {
  for await (const { db } of iterProjectDBs(kb)) {
    try {
      const r = query(db);
      if (r) return r;
    } catch {
      // schema mismatch — skip
    }
  }
  return null;
}

// ─── Atlas command handlers (one per Tauri command in atlas.rs) ──────────────

async function listSymbolsForFile(
  kb: KBStore,
  args: { snapshotId: string; filePath: string },
): Promise<AtlasSymbol[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).listSymbolsForFile(args.snapshotId as SnapshotId, args.filePath),
  );
}

async function listSymbolsInSnapshot(
  kb: KBStore,
  args: {
    snapshotId: string;
    kindFilter?: string[] | null;
    languageFilter?: string[] | null;
    limit?: number | null;
    offset?: number | null;
  },
): Promise<AtlasSymbol[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).listSymbolsInSnapshot(args.snapshotId as SnapshotId, {
      kindFilter: (args.kindFilter ?? undefined) as SymbolKind[] | undefined,
      languageFilter: (args.languageFilter ?? undefined) as AtlasLanguage[] | undefined,
      limit: args.limit ?? undefined,
      offset: args.offset ?? undefined,
    }),
  );
}

async function getSymbol(
  kb: KBStore,
  args: { id: string },
): Promise<AtlasSymbol | null> {
  return scanFirstNonNull(kb, (db) => new SymbolsKB(db).getSymbol(args.id as SymbolId));
}

async function findSymbolsByQualifiedName(
  kb: KBStore,
  args: { snapshotId: string; qn: string },
): Promise<AtlasSymbol[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).findSymbolsByQualifiedName(args.snapshotId as SnapshotId, args.qn),
  );
}

async function listCallers(
  kb: KBStore,
  args: { symbolId: string },
): Promise<AtlasCallEdge[]> {
  return scanAggregate(kb, (db) => new SymbolsKB(db).listCallers(args.symbolId as SymbolId));
}

async function listCallees(
  kb: KBStore,
  args: { symbolId: string },
): Promise<AtlasCallEdge[]> {
  return scanAggregate(kb, (db) => new SymbolsKB(db).listCallees(args.symbolId as SymbolId));
}

async function listReferencesForSymbol(
  kb: KBStore,
  args: { symbolId: string },
): Promise<AtlasSymbolReference[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).listReferencesForSymbol(args.symbolId as SymbolId),
  );
}

async function listTypeRelationsFrom(
  kb: KBStore,
  args: { symbolId: string },
): Promise<AtlasTypeRelation[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).listTypeRelationsFrom(args.symbolId as SymbolId),
  );
}

async function listTypeRelationsTo(
  kb: KBStore,
  args: { symbolId: string },
): Promise<AtlasTypeRelation[]> {
  return scanAggregate(kb, (db) =>
    new SymbolsKB(db).listTypeRelationsTo(args.symbolId as SymbolId),
  );
}

async function listFilesChangedByMission(
  kb: KBStore,
  args: { missionId: string },
): Promise<AtlasFilesChanged[]> {
  return scanAggregate(kb, (db) =>
    new ProvenanceKB(db).listFilesChangedByMission(args.missionId),
  );
}

async function listMissionsForFile(
  kb: KBStore,
  args: { snapshotId: string; filePath: string },
): Promise<MissionForFileSummary[]> {
  return scanAggregate(kb, (db) =>
    new ProvenanceKB(db).listMissionsForFile(args.snapshotId as SnapshotId, args.filePath),
  );
}

async function listProvenanceForLine(
  kb: KBStore,
  args: { snapshotId: string; filePath: string; lineNo: number },
): Promise<AtlasMissionProvenance[]> {
  return scanAggregate(kb, (db) =>
    new ProvenanceKB(db).listProvenanceForLine(
      args.snapshotId as SnapshotId,
      args.filePath,
      args.lineNo,
    ),
  );
}

/**
 * Fire-and-forget indexer dispatch. Returns immediately after kicking off the
 * background task. Progress + completion are signalled via `atlas:indexing.*`
 * events, which the bridge's KBStore is already subscribed to (see
 * `KBStore.setEventBus()`), so the cached SymbolsKB/ProvenanceKB are
 * automatically invalidated on `atlas:indexing.completed`.
 *
 * Resolution: when `args.projectId` is omitted, the indexer cannot run (no
 * project path to walk). Browser-mode UIs must pass `projectId`; if missing,
 * the handler throws so the failure surfaces in the UI.
 */
async function requestIndexSnapshot(
  kb: KBStore,
  args: { snapshotId: string; projectId?: string; projectPath?: string },
): Promise<void> {
  if (!args.snapshotId) {
    throw new Error('atlas_request_index_snapshot: snapshotId is required');
  }
  if (!args.projectId) {
    throw new Error(
      'atlas_request_index_snapshot: projectId is required in browser-mode (no registered-default fallback)',
    );
  }

  // Lazy-load the indexer module so the bridge stays small in test envs that
  // don't have the indexer compiled.
  const runnerMod = (await import('./atlas-indexer/runner.js')) as {
    runAtlasIndexer: typeof import('./atlas-indexer/runner.js').runAtlasIndexer;
  };

  let projectPath = args.projectPath;
  if (!projectPath) {
    const project = await kb.getProject(args.projectId);
    if (!project) {
      throw new Error(`atlas_request_index_snapshot: project "${args.projectId}" not found`);
    }
    projectPath = project.path;
  }

  await kb.ensureProjectDB(args.projectId);
  const db = await kb.getProjectRawDB(args.projectId);

  // Fire-and-forget: don't await — UI listens for atlas:indexing.completed.
  runnerMod
    .runAtlasIndexer(db, {
      snapshotId: args.snapshotId as SnapshotId,
      projectId: args.projectId as ProjectId,
      projectPath,
    })
    .catch((err: unknown) => {
      // The indexer is required to publish its own atlas:indexing.failed event
      // before throwing; the catch here is purely so the unawaited promise
      // doesn't surface as an unhandled rejection.
      const message = err instanceof Error ? err.message : String(err);
      // eslint-disable-next-line no-console
      console.error('[atlas-bridge] runAtlasIndexer threw:', message);
    });
}

/**
 * Browser-mode cache invalidation. The Rust delegate evicts SQLite connections
 * from its LRU; the TS-side equivalent is `KBStore.clearAtlasKBCache(projectId)`,
 * which drops the cached `SymbolsKB`/`ProvenanceKB` (each holds prepared statements
 * pinned to a stale DB transaction).
 *
 * Returns the same `{ scope, evicted_count }` shape as the Rust command. Counts
 * are the number of `(SymbolsKB, ProvenanceKB)` pairs cleared (so 0..2 per project).
 */
async function invalidateCache(
  kb: KBStore,
  args: { projectId?: string | null },
): Promise<InvalidateCacheResult> {
  const targetId = args.projectId ?? null;
  if (typeof targetId === 'string' && targetId.length > 0) {
    const before = kb.cachedAtlasSymbolsKBCount() + kb.cachedAtlasProvenanceKBCount();
    kb.clearAtlasKBCache(targetId);
    const after = kb.cachedAtlasSymbolsKBCount() + kb.cachedAtlasProvenanceKBCount();
    return { scope: 'project', evicted_count: Math.max(0, before - after) };
  }
  const before = kb.cachedAtlasSymbolsKBCount() + kb.cachedAtlasProvenanceKBCount();
  kb.clearAtlasKBCache();
  const after = kb.cachedAtlasSymbolsKBCount() + kb.cachedAtlasProvenanceKBCount();
  return { scope: 'all', evicted_count: Math.max(0, before - after) };
}

// ─── Public installer ────────────────────────────────────────────────────────

/**
 * Handler signature matching the COMMANDS table in `dashboard-bridge.ts`.
 *
 * Defined locally rather than imported to avoid a cycle: `dashboard-bridge.ts`
 * imports this module to call `installAtlasCommands`.
 */
type AtlasCommandHandler = (kb: KBStore, args: Record<string, unknown>) => Promise<unknown>;

/**
 * The 13-command catalog in dispatch order, exported so tests can iterate
 * over it without instantiating a full bridge router.
 */
export const ATLAS_COMMANDS: Record<string, AtlasCommandHandler> = {
  atlas_list_symbols_for_file: (kb, args) =>
    listSymbolsForFile(kb, args as Parameters<typeof listSymbolsForFile>[1]),
  atlas_list_symbols_in_snapshot: (kb, args) =>
    listSymbolsInSnapshot(kb, args as Parameters<typeof listSymbolsInSnapshot>[1]),
  atlas_get_symbol: (kb, args) => getSymbol(kb, args as Parameters<typeof getSymbol>[1]),
  atlas_find_symbols_by_qualified_name: (kb, args) =>
    findSymbolsByQualifiedName(kb, args as Parameters<typeof findSymbolsByQualifiedName>[1]),
  atlas_list_callers: (kb, args) => listCallers(kb, args as Parameters<typeof listCallers>[1]),
  atlas_list_callees: (kb, args) => listCallees(kb, args as Parameters<typeof listCallees>[1]),
  atlas_list_references_for_symbol: (kb, args) =>
    listReferencesForSymbol(kb, args as Parameters<typeof listReferencesForSymbol>[1]),
  atlas_list_type_relations_from: (kb, args) =>
    listTypeRelationsFrom(kb, args as Parameters<typeof listTypeRelationsFrom>[1]),
  atlas_list_type_relations_to: (kb, args) =>
    listTypeRelationsTo(kb, args as Parameters<typeof listTypeRelationsTo>[1]),
  atlas_list_files_changed_by_mission: (kb, args) =>
    listFilesChangedByMission(kb, args as Parameters<typeof listFilesChangedByMission>[1]),
  atlas_list_missions_for_file: (kb, args) =>
    listMissionsForFile(kb, args as Parameters<typeof listMissionsForFile>[1]),
  atlas_list_provenance_for_line: (kb, args) =>
    listProvenanceForLine(kb, args as Parameters<typeof listProvenanceForLine>[1]),
  atlas_request_index_snapshot: (kb, args) =>
    requestIndexSnapshot(kb, args as Parameters<typeof requestIndexSnapshot>[1]),
  atlas_invalidate_cache: (kb, args) =>
    invalidateCache(kb, args as Parameters<typeof invalidateCache>[1]),
};

/**
 * Install the atlas command handlers into a host command table.
 *
 * Used by `dashboard-bridge.ts` to merge atlas commands into the unified
 * COMMANDS dispatch surface in one call site.
 */
export function installAtlasCommands(
  target: Record<string, AtlasCommandHandler>,
): void {
  for (const [cmd, handler] of Object.entries(ATLAS_COMMANDS)) {
    target[cmd] = handler;
  }
}
