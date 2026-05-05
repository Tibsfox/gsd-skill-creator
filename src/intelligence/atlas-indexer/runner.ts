/**
 * Atlas indexer orchestrator (v1.49.607 W1 Track F2).
 *
 * Ties together the W1.A SymbolIndexer, the W1.A cross-file resolver, the
 * W1.B SymbolsKB writer, and the W1.B ProvenanceLinker into a single
 * end-to-end run. Mirrors the v1.49.597 `AnalyzerCore` dispatch pattern
 * (`src/intelligence/analyzer/core.ts`):
 *   1. walk project files
 *   2. detect language per file
 *   3. dispatch to the per-language extractor
 *   4. commit results to SQLite under one snapshot id
 *   5. publish IntelligenceEventBus events for the SSE bridge
 *
 * The runner is in-process; it does NOT spawn workers and does NOT use the
 * console-request loop. It is invoked from any Node host that already has
 * the per-project DB open (the dashboard server, a CLI, or a future Tauri
 * sidecar bridge). The Rust `atlas_request_index_snapshot` Tauri command
 * cannot dispatch this runner because the parser substrate lives in TS;
 * that command is documented as a TS-side responsibility — see
 * `src-tauri/src/intelligence/atlas.rs::SqliteAtlasKbDelegate::request_index_snapshot`.
 */

import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import type Database from 'better-sqlite3';
import type {
  AtlasLanguage,
  ProjectId,
  SnapshotId,
} from '../types.js';
import { indexFile, resolve as resolveSymbols, attachSources } from '../symbols/index.js';
import type { FileIndexResult, IndexResult } from '../symbols/types.js';
import { SymbolsKB } from '../kb/symbols.js';
import { ProvenanceLinker } from '../provenance/linker.js';
import { getIntelligenceEventBus } from '../events/bus.js';
import type { IntelligenceEvent } from '../events/types.js';
import { walkProjectFiles } from './file-walker.js';
import { detectAtlasLanguage } from './language-detect.js';

export interface AtlasIndexerOptions {
  snapshotId: SnapshotId;
  projectId: ProjectId;
  /** Absolute project root path. */
  projectPath: string;
  /** Restrict to a subset of languages. Default: all 9. */
  languages?: AtlasLanguage[];
  /** Optional file filter applied to relative paths. Default: accept all. */
  fileFilter?: (relativePath: string) => boolean;
  /** Optional progress callback. */
  onProgress?: (p: { filesDone: number; filesTotal: number }) => void;
  /** Optional tsconfig path-mapping for the resolver. */
  tsPaths?: Record<string, string[]>;
  /** Run the ProvenanceLinker after symbol indexing. Default: false (it
   *  shells out to git and is opt-in for hosts that have a real repo). */
  runProvenance?: boolean;
  /** When true, all rows for `snapshotId` are deleted before writing.
   *  Default: false (idempotent ON CONFLICT(id) DO NOTHING is the cheaper
   *  default; replace=true is for forced reindex). */
  replace?: boolean;
  /** Inject the bus (defaults to the singleton). Tests pass a stub. */
  bus?: { publish(e: IntelligenceEvent): void };
}

export interface AtlasIndexerResult {
  snapshotId: SnapshotId;
  files: number;
  symbols: number;
  references: number;
  calls: number;
  typeRelations: number;
  provenanceLines: number;
  durationMs: number;
}

/**
 * Run a full project index pass. Throws on unrecoverable errors (the bus
 * receives an `atlas:indexing.failed` event before the throw).
 */
export async function runAtlasIndexer(
  db: Database.Database,
  opts: AtlasIndexerOptions,
): Promise<AtlasIndexerResult> {
  const start = Date.now();
  const bus = opts.bus ?? getIntelligenceEventBus();
  const langFilter = opts.languages ? new Set(opts.languages) : null;

  bus.publish({
    type: 'atlas:indexing.started',
    payload: { snapshot_id: opts.snapshotId },
  });

  try {
    // 1. Walk the project, narrowing by language extension up front.
    const allPaths = await walkProjectFiles(opts.projectPath, {
      fileFilter: opts.fileFilter,
    });
    const candidates: Array<{ abs: string; rel: string; lang: AtlasLanguage }> = [];
    for (const abs of allPaths) {
      const lang = detectAtlasLanguage(abs);
      if (!lang) continue;
      if (langFilter && !langFilter.has(lang)) continue;
      candidates.push({ abs, rel: relative(opts.projectPath, abs), lang });
    }
    const filesTotal = candidates.length;

    // 2. Per-file: read source, dispatch to indexFile.
    const fileResults: FileIndexResult[] = [];
    const sources = new Map<string, string>();
    let filesDone = 0;
    for (const c of candidates) {
      let source: string;
      try {
        source = await readFile(c.abs, 'utf-8');
      } catch {
        filesDone++;
        if (opts.onProgress) opts.onProgress({ filesDone, filesTotal });
        bus.publish({
          type: 'atlas:indexing.progress',
          payload: { snapshot_id: opts.snapshotId, files_done: filesDone, files_total: filesTotal },
        });
        continue;
      }
      try {
        const r = indexFile(
          { file_path: c.rel, source, language: c.lang },
          { snapshot_id: opts.snapshotId, project_id: opts.projectId },
        );
        fileResults.push(r);
        sources.set(c.rel, source);
      } catch {
        // Per-file parse failures must never abort the whole run.
      }
      filesDone++;
      if (opts.onProgress) opts.onProgress({ filesDone, filesTotal });
      bus.publish({
        type: 'atlas:indexing.progress',
        payload: { snapshot_id: opts.snapshotId, files_done: filesDone, files_total: filesTotal },
      });
    }

    // 3. Resolve cross-file references → call edges + type relations.
    const idx: IndexResult = {
      files: fileResults,
      symbols: fileResults.flatMap((f) => f.symbols),
      references: fileResults.flatMap((f) => f.references),
    };
    attachSources(idx, sources);
    const resolved = resolveSymbols(idx, {
      snapshot_id: opts.snapshotId,
      project_id: opts.projectId,
      project_root: opts.projectPath,
      ts_paths: opts.tsPaths,
    });

    // 4. Write to SQLite.
    const kb = new SymbolsKB(db);
    if (opts.replace) kb.clearSnapshot(opts.snapshotId);
    const symbolsInserted = kb.bulkInsertSymbols(idx.symbols);
    const refsInserted = kb.bulkInsertReferences(resolved.references);
    const callsInserted = kb.bulkInsertCalls(resolved.calls);
    const trInserted = kb.bulkInsertTypeRelations(resolved.type_relations);

    // 5. Optional provenance linker.
    let provenanceLines = 0;
    if (opts.runProvenance) {
      try {
        const linker = new ProvenanceLinker(db);
        const r = linker.run(
          { project_dir: opts.projectPath, snapshot_id: opts.snapshotId },
          { mode: opts.replace ? 'replace' : 'append' },
        );
        provenanceLines = r.provenance_inserted;
      } catch {
        // Provenance is best-effort; a missing .git or empty mission_links
        // table must not fail the indexer.
      }
    }

    bus.publish({
      type: 'atlas:indexing.completed',
      payload: {
        snapshot_id: opts.snapshotId,
        symbols_count: symbolsInserted,
        calls_count: callsInserted,
        files_count: filesTotal,
      },
    });

    return {
      snapshotId: opts.snapshotId,
      files: filesTotal,
      symbols: symbolsInserted,
      references: refsInserted,
      calls: callsInserted,
      typeRelations: trInserted,
      provenanceLines,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    bus.publish({
      type: 'atlas:indexing.failed',
      payload: {
        snapshot_id: opts.snapshotId,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}
