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
    return n;
  }
}
