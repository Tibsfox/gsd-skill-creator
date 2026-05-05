/**
 * Atlas KB — symbol-side query layer (v1.49.607 W1 Track B).
 *
 * Implements the symbol-side methods of the `AtlasKB` query surface declared
 * in `src/intelligence/types.ts`. Operates against the per-project
 * intelligence DB after migration `003_atlas_symbols.sql` has been applied.
 *
 * Identity: every method is a thin prepared-statement wrapper. The class
 * lazy-prepares each statement on first use and caches it so call sites
 * pay the SQLite parser cost exactly once per KB instance.
 *
 * Additivity invariant (per ADR 0003): this file does not touch the
 * v1.49.597 query surface in `store.ts`; it composes alongside it.
 */

import type Database from 'better-sqlite3';
import type {
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasCallEdge,
  AtlasTypeRelation,
  SymbolId,
  SnapshotId,
  SymbolKind,
  AtlasLanguage,
} from '../types.js';
import { rowToAtlasSymbol, rowToAtlasReference, rowToAtlasCallEdge, rowToAtlasTypeRelation } from './atlas-rows.js';
import type { SymbolRow, SymbolReferenceRow, CallEdgeRow, TypeRelationRow } from './atlas-rows.js';

// ─── SymbolsKB ──────────────────────────────────────────────────────────────

export class SymbolsKB {
  private readonly _db: Database.Database;

  // Prepared-statement cache. better-sqlite3's Statement objects are
  // bound to the underlying DB; reusing them keeps the parser cost at
  // zero on the hot path (driver of the < 300ms Sankey budget).
  private _stmtListByFile?: Database.Statement;
  private _stmtGetById?: Database.Statement;
  private _stmtFindByQN?: Database.Statement;
  private _stmtListCallers?: Database.Statement;
  private _stmtListCallees?: Database.Statement;
  private _stmtListRefs?: Database.Statement;
  private _stmtListRelFrom?: Database.Statement;
  private _stmtListRelTo?: Database.Statement;
  // listSymbolsInSnapshot uses dynamic SQL (variable WHERE clauses) so it
  // cannot be a single cached prepared statement; base case is cached below.
  private _stmtListInSnapshot?: Database.Statement;

  constructor(db: Database.Database) {
    this._db = db;
  }

  // ─── Symbols ──────────────────────────────────────────────────────────

  listSymbolsForFile(snapshot: SnapshotId, file_path: string): AtlasSymbol[] {
    if (!this._stmtListByFile) {
      this._stmtListByFile = this._db.prepare(
        `SELECT * FROM symbols
         WHERE snapshot_id = ? AND file_path = ?
         ORDER BY start_byte ASC`,
      );
    }
    const rows = this._stmtListByFile.all(snapshot, file_path) as SymbolRow[];
    return rows.map(rowToAtlasSymbol);
  }

  /**
   * List all symbols in a snapshot, optionally filtered by kind and/or language,
   * with limit/offset pagination. Uses idx_symbols_snapshot index for O(log n)
   * snapshot lookup; secondary kind/language filters are applied in-DB via
   * dynamic SQL when present (avoids a full-scan post-filter in JS).
   *
   * Dynamic-SQL note: because the WHERE clause varies by opts, a single cached
   * prepared statement cannot cover all code paths. The base case (no filters) is
   * cached; filtered cases prepare an ad-hoc statement per call. Caller-side
   * caching or connection pooling should be applied if the filtered path is hot.
   */
  listSymbolsInSnapshot(
    snapshot: SnapshotId,
    opts?: {
      kindFilter?: SymbolKind[];
      languageFilter?: AtlasLanguage[];
      limit?: number;
      offset?: number;
    },
  ): AtlasSymbol[] {
    const limit = opts?.limit ?? 500;
    const offset = opts?.offset ?? 0;
    const kinds = opts?.kindFilter ?? [];
    const langs = opts?.languageFilter ?? [];

    const hasKind = kinds.length > 0;
    const hasLang = langs.length > 0;

    if (!hasKind && !hasLang) {
      // Base case: cacheable prepared statement via idx_symbols_snapshot.
      if (!this._stmtListInSnapshot) {
        this._stmtListInSnapshot = this._db.prepare(
          `SELECT * FROM symbols
           WHERE snapshot_id = ?
           ORDER BY file_path ASC, start_byte ASC
           LIMIT ? OFFSET ?`,
        );
      }
      const rows = this._stmtListInSnapshot.all(snapshot, limit, offset) as SymbolRow[];
      return rows.map(rowToAtlasSymbol);
    }

    // Filtered case: dynamic SQL prepared inline.
    const clauses: string[] = ['snapshot_id = ?'];
    const params: unknown[] = [snapshot];

    if (hasKind) {
      clauses.push(`kind IN (${kinds.map(() => '?').join(',')})`);
      for (const k of kinds) params.push(k);
    }
    if (hasLang) {
      clauses.push(`language IN (${langs.map(() => '?').join(',')})`);
      for (const l of langs) params.push(l);
    }

    params.push(limit, offset);
    const sql = `SELECT * FROM symbols WHERE ${clauses.join(' AND ')} ORDER BY file_path ASC, start_byte ASC LIMIT ? OFFSET ?`;
    const rows = this._db.prepare(sql).all(...params) as SymbolRow[];
    return rows.map(rowToAtlasSymbol);
  }

  getSymbol(id: SymbolId): AtlasSymbol | null {
    if (!this._stmtGetById) {
      this._stmtGetById = this._db.prepare('SELECT * FROM symbols WHERE id = ?');
    }
    const row = this._stmtGetById.get(id) as SymbolRow | undefined;
    return row ? rowToAtlasSymbol(row) : null;
  }

  findSymbolsByQualifiedName(snapshot: SnapshotId, qn: string): AtlasSymbol[] {
    if (!this._stmtFindByQN) {
      this._stmtFindByQN = this._db.prepare(
        `SELECT * FROM symbols
         WHERE snapshot_id = ? AND qualified_name = ?
         ORDER BY file_path ASC, start_byte ASC`,
      );
    }
    const rows = this._stmtFindByQN.all(snapshot, qn) as SymbolRow[];
    return rows.map(rowToAtlasSymbol);
  }

  // ─── Calls ────────────────────────────────────────────────────────────

  /**
   * List inbound call edges (callers) for a symbol — i.e. every call site
   * whose `callee_symbol_id` equals the argument. Indexed via
   * `idx_calls_callee` for O(log n) lookup.
   */
  listCallers(symbol_id: SymbolId): AtlasCallEdge[] {
    if (!this._stmtListCallers) {
      this._stmtListCallers = this._db.prepare(
        `SELECT * FROM calls
         WHERE callee_symbol_id = ?
         ORDER BY snapshot_id DESC, call_site_byte ASC`,
      );
    }
    const rows = this._stmtListCallers.all(symbol_id) as CallEdgeRow[];
    return rows.map(rowToAtlasCallEdge);
  }

  /**
   * List outbound call edges (callees) for a symbol — i.e. every call site
   * whose `caller_symbol_id` equals the argument. Indexed via
   * `idx_calls_caller` for O(log n) lookup.
   */
  listCallees(symbol_id: SymbolId): AtlasCallEdge[] {
    if (!this._stmtListCallees) {
      this._stmtListCallees = this._db.prepare(
        `SELECT * FROM calls
         WHERE caller_symbol_id = ?
         ORDER BY snapshot_id DESC, call_site_byte ASC`,
      );
    }
    const rows = this._stmtListCallees.all(symbol_id) as CallEdgeRow[];
    return rows.map(rowToAtlasCallEdge);
  }

  // ─── References ───────────────────────────────────────────────────────

  listReferencesForSymbol(symbol_id: SymbolId): AtlasSymbolReference[] {
    if (!this._stmtListRefs) {
      this._stmtListRefs = this._db.prepare(
        `SELECT * FROM symbol_references
         WHERE resolved_symbol_id = ?
         ORDER BY snapshot_id DESC, file_path ASC, start_byte ASC`,
      );
    }
    const rows = this._stmtListRefs.all(symbol_id) as SymbolReferenceRow[];
    return rows.map(rowToAtlasReference);
  }

  // ─── Type relations ───────────────────────────────────────────────────

  listTypeRelationsFrom(symbol_id: SymbolId): AtlasTypeRelation[] {
    if (!this._stmtListRelFrom) {
      this._stmtListRelFrom = this._db.prepare(
        `SELECT * FROM type_relations
         WHERE from_symbol_id = ?
         ORDER BY snapshot_id DESC, kind ASC`,
      );
    }
    const rows = this._stmtListRelFrom.all(symbol_id) as TypeRelationRow[];
    return rows.map(rowToAtlasTypeRelation);
  }

  listTypeRelationsTo(symbol_id: SymbolId): AtlasTypeRelation[] {
    if (!this._stmtListRelTo) {
      this._stmtListRelTo = this._db.prepare(
        `SELECT * FROM type_relations
         WHERE to_symbol_id = ?
         ORDER BY snapshot_id DESC, kind ASC`,
      );
    }
    const rows = this._stmtListRelTo.all(symbol_id) as TypeRelationRow[];
    return rows.map(rowToAtlasTypeRelation);
  }

  // ─── Writers (atlas-indexer F2) ───────────────────────────────────────
  //
  // Bulk-insert helpers consumed by `src/intelligence/atlas-indexer/runner.ts`.
  // Each batch wraps a single transaction; prepared statements are cached on
  // the instance for repeat calls. Inserts use ON CONFLICT(id) DO NOTHING so
  // a re-run for the same snapshot is idempotent — the indexer's deterministic
  // id generation guarantees stable keys across reindex passes.

  bulkInsertSymbols(rows: AtlasSymbol[]): number {
    if (rows.length === 0) return 0;
    const insert = this._db.prepare(
      `INSERT INTO symbols
         (id, snapshot_id, project_id, file_path, kind, name, qualified_name,
          start_byte, end_byte, start_line, end_line, signature_hash,
          modifiers_json, language, parent_symbol_id)
       VALUES
         (@id, @snapshot_id, @project_id, @file_path, @kind, @name, @qualified_name,
          @start_byte, @end_byte, @start_line, @end_line, @signature_hash,
          @modifiers_json, @language, @parent_symbol_id)
       ON CONFLICT(id) DO NOTHING`,
    );
    const txn = this._db.transaction((batch: AtlasSymbol[]) => {
      let n = 0;
      for (const s of batch) {
        const r = insert.run({
          id: s.id,
          snapshot_id: s.snapshot_id,
          project_id: s.project_id,
          file_path: s.file_path,
          kind: s.kind,
          name: s.name,
          qualified_name: s.qualified_name,
          start_byte: s.start_byte,
          end_byte: s.end_byte,
          start_line: s.start_line,
          end_line: s.end_line,
          signature_hash: s.signature_hash,
          modifiers_json: JSON.stringify(s.modifiers ?? []),
          language: s.language,
          parent_symbol_id: s.parent_symbol_id,
        });
        if (r.changes > 0) n++;
      }
      return n;
    });
    return txn(rows);
  }

  bulkInsertReferences(rows: AtlasSymbolReference[]): number {
    if (rows.length === 0) return 0;
    const insert = this._db.prepare(
      `INSERT INTO symbol_references
         (id, snapshot_id, file_path, start_byte, end_byte, start_line, end_line,
          name, resolved_symbol_id, resolution_confidence, resolution_kind)
       VALUES
         (@id, @snapshot_id, @file_path, @start_byte, @end_byte, @start_line, @end_line,
          @name, @resolved_symbol_id, @resolution_confidence, @resolution_kind)
       ON CONFLICT(id) DO NOTHING`,
    );
    const txn = this._db.transaction((batch: AtlasSymbolReference[]) => {
      let n = 0;
      for (const ref of batch) {
        const r = insert.run({
          id: ref.id,
          snapshot_id: ref.snapshot_id,
          file_path: ref.file_path,
          start_byte: ref.start_byte,
          end_byte: ref.end_byte,
          start_line: ref.start_line,
          end_line: ref.end_line,
          name: ref.name,
          resolved_symbol_id: ref.resolved_symbol_id,
          resolution_confidence: ref.resolution_confidence,
          resolution_kind: ref.resolution_kind,
        });
        if (r.changes > 0) n++;
      }
      return n;
    });
    return txn(rows);
  }

  bulkInsertCalls(rows: AtlasCallEdge[]): number {
    if (rows.length === 0) return 0;
    const insert = this._db.prepare(
      `INSERT INTO calls
         (id, snapshot_id, caller_symbol_id, callee_symbol_id,
          call_site_byte, call_site_line, confidence)
       VALUES
         (@id, @snapshot_id, @caller_symbol_id, @callee_symbol_id,
          @call_site_byte, @call_site_line, @confidence)
       ON CONFLICT(id) DO NOTHING`,
    );
    const txn = this._db.transaction((batch: AtlasCallEdge[]) => {
      let n = 0;
      for (const e of batch) {
        const r = insert.run({
          id: e.id,
          snapshot_id: e.snapshot_id,
          caller_symbol_id: e.caller_symbol_id,
          callee_symbol_id: e.callee_symbol_id,
          call_site_byte: e.call_site_byte,
          call_site_line: e.call_site_line,
          confidence: e.confidence,
        });
        if (r.changes > 0) n++;
      }
      return n;
    });
    return txn(rows);
  }

  bulkInsertTypeRelations(rows: AtlasTypeRelation[]): number {
    if (rows.length === 0) return 0;
    const insert = this._db.prepare(
      `INSERT INTO type_relations
         (id, snapshot_id, from_symbol_id, to_symbol_id, kind, confidence)
       VALUES
         (@id, @snapshot_id, @from_symbol_id, @to_symbol_id, @kind, @confidence)
       ON CONFLICT(id) DO NOTHING`,
    );
    const txn = this._db.transaction((batch: AtlasTypeRelation[]) => {
      let n = 0;
      for (const t of batch) {
        const r = insert.run({
          id: t.id,
          snapshot_id: t.snapshot_id,
          from_symbol_id: t.from_symbol_id,
          to_symbol_id: t.to_symbol_id,
          kind: t.kind,
          confidence: t.confidence,
        });
        if (r.changes > 0) n++;
      }
      return n;
    });
    return txn(rows);
  }

  /**
   * Clear all rows for a snapshot — used when re-indexing replaces a prior
   * pass. Wraps four DELETEs in one transaction.
   */
  clearSnapshot(snapshot_id: SnapshotId): void {
    const txn = this._db.transaction(() => {
      this._db.prepare('DELETE FROM symbols WHERE snapshot_id = ?').run(snapshot_id);
      this._db.prepare('DELETE FROM symbol_references WHERE snapshot_id = ?').run(snapshot_id);
      this._db.prepare('DELETE FROM calls WHERE snapshot_id = ?').run(snapshot_id);
      this._db.prepare('DELETE FROM type_relations WHERE snapshot_id = ?').run(snapshot_id);
    });
    txn();
  }

  // ─── Test helpers (not part of AtlasKB surface) ──────────────────────

  /**
   * Return the count of distinct prepared statements currently cached.
   * Used by the round-trip tests to assert prepared-statement reuse.
   */
  preparedStatementCount(): number {
    let n = 0;
    if (this._stmtListByFile) n++;
    if (this._stmtGetById) n++;
    if (this._stmtFindByQN) n++;
    if (this._stmtListCallers) n++;
    if (this._stmtListCallees) n++;
    if (this._stmtListRefs) n++;
    if (this._stmtListRelFrom) n++;
    if (this._stmtListRelTo) n++;
    if (this._stmtListInSnapshot) n++;
    return n;
  }
}
