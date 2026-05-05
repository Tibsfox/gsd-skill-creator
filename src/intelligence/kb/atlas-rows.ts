/**
 * Atlas KB — row mappers for migration 003 tables.
 *
 * Mirrors the pattern in `queries.ts`: each `*Row` type matches the
 * table column layout, and each `rowTo*` function lifts it into the
 * public Atlas type from `../types.ts`. JSON columns are parsed with
 * the same throw-on-malformed convention (D-23-08).
 *
 * v1.49.607 W1 Track B.
 */

import type {
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasCallEdge,
  AtlasTypeRelation,
  AtlasFilesChanged,
  AtlasMissionProvenance,
  SymbolKind,
  AtlasLanguage,
  ResolutionKind,
  TypeRelationKind,
  FileChangeKind,
} from '../types.js';

// ─── Raw row shapes ─────────────────────────────────────────────────────────

export interface SymbolRow {
  id: string;
  snapshot_id: string;
  project_id: string;
  file_path: string;
  kind: string;
  name: string;
  qualified_name: string;
  start_byte: number;
  end_byte: number;
  start_line: number;
  end_line: number;
  signature_hash: string | null;
  modifiers_json: string;
  language: string;
  parent_symbol_id: string | null;
}

export interface SymbolReferenceRow {
  id: string;
  snapshot_id: string;
  file_path: string;
  start_byte: number;
  end_byte: number;
  start_line: number;
  end_line: number;
  name: string;
  resolved_symbol_id: string | null;
  resolution_confidence: number;
  resolution_kind: string | null;
}

export interface CallEdgeRow {
  id: string;
  snapshot_id: string;
  caller_symbol_id: string;
  callee_symbol_id: string;
  call_site_byte: number;
  call_site_line: number;
  confidence: number;
}

export interface TypeRelationRow {
  id: string;
  snapshot_id: string;
  from_symbol_id: string;
  to_symbol_id: string;
  kind: string;
  confidence: number;
}

export interface FilesChangedRow {
  id: string;
  mission_id: string;
  commit_sha: string;
  file_path: string;
  change_kind: string;
  rename_from: string | null;
  added_lines: number;
  removed_lines: number;
}

export interface MissionProvenanceRow {
  id: string;
  snapshot_id: string;
  file_path: string;
  line_no: number;
  mission_id: string;
  commit_sha: string;
  weight: number;
}

// ─── Mappers ────────────────────────────────────────────────────────────────

function parseStringArrayStrict(text: string, ctx: string): string[] {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new Error(`atlas-rows(${ctx}): malformed JSON: ${(err as Error).message}`);
  }
  if (!Array.isArray(raw)) {
    throw new Error(`atlas-rows(${ctx}): expected array, got ${typeof raw}`);
  }
  return raw as string[];
}

export function rowToAtlasSymbol(r: SymbolRow): AtlasSymbol {
  return {
    id: r.id,
    snapshot_id: r.snapshot_id,
    project_id: r.project_id,
    file_path: r.file_path,
    kind: r.kind as SymbolKind,
    name: r.name,
    qualified_name: r.qualified_name,
    start_byte: r.start_byte,
    end_byte: r.end_byte,
    start_line: r.start_line,
    end_line: r.end_line,
    signature_hash: r.signature_hash,
    modifiers: parseStringArrayStrict(r.modifiers_json ?? '[]', 'symbols.modifiers_json'),
    language: r.language as AtlasLanguage,
    parent_symbol_id: r.parent_symbol_id,
  };
}

export function rowToAtlasReference(r: SymbolReferenceRow): AtlasSymbolReference {
  return {
    id: r.id,
    snapshot_id: r.snapshot_id,
    file_path: r.file_path,
    start_byte: r.start_byte,
    end_byte: r.end_byte,
    start_line: r.start_line,
    end_line: r.end_line,
    name: r.name,
    resolved_symbol_id: r.resolved_symbol_id,
    resolution_confidence: r.resolution_confidence,
    resolution_kind: (r.resolution_kind ?? 'unknown') as ResolutionKind,
  };
}

export function rowToAtlasCallEdge(r: CallEdgeRow): AtlasCallEdge {
  return {
    id: r.id,
    snapshot_id: r.snapshot_id,
    caller_symbol_id: r.caller_symbol_id,
    callee_symbol_id: r.callee_symbol_id,
    call_site_byte: r.call_site_byte,
    call_site_line: r.call_site_line,
    confidence: r.confidence,
  };
}

export function rowToAtlasTypeRelation(r: TypeRelationRow): AtlasTypeRelation {
  return {
    id: r.id,
    snapshot_id: r.snapshot_id,
    from_symbol_id: r.from_symbol_id,
    to_symbol_id: r.to_symbol_id,
    kind: r.kind as TypeRelationKind,
    confidence: r.confidence,
  };
}

export function rowToAtlasFilesChanged(r: FilesChangedRow): AtlasFilesChanged {
  return {
    id: r.id,
    mission_id: r.mission_id,
    commit_sha: r.commit_sha,
    file_path: r.file_path,
    change_kind: r.change_kind as FileChangeKind,
    rename_from: r.rename_from,
    added_lines: r.added_lines,
    removed_lines: r.removed_lines,
  };
}

export function rowToAtlasMissionProvenance(r: MissionProvenanceRow): AtlasMissionProvenance {
  return {
    id: r.id,
    snapshot_id: r.snapshot_id,
    file_path: r.file_path,
    line_no: r.line_no,
    mission_id: r.mission_id,
    commit_sha: r.commit_sha,
    weight: r.weight,
  };
}
