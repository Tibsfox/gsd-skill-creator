/**
 * Internal types for the symbol pipeline (W1 Track A).
 * @module intelligence/symbols/types
 */

import type {
  AtlasCallEdge,
  AtlasLanguage,
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasTypeRelation,
  ProjectId,
  SnapshotId,
  SymbolKind,
} from '../types.js';
import type { CoarseNode, CoarseNodeKind } from '../../atlas/syntax/index.js';

export interface FileInput {
  file_path: string;
  source: string;
  language: AtlasLanguage;
}

/** One file's index result; consumed by the resolver. */
export interface FileIndexResult {
  file_path: string;
  language: AtlasLanguage;
  symbols: AtlasSymbol[];
  references: AtlasSymbolReference[];
  /** Module-spec strings of imports (raw, language-specific shape). */
  imports: ImportRecord[];
}

export interface ImportRecord {
  module_spec: string;
  /** Imported local-name bindings (named imports, use-segments, from-imports). */
  imported_names: string[];
  /**
   * Optional richer binding shape for languages whose extractor distinguishes
   * the original export-name from the local binding (TS/JS). When present,
   * supersedes `imported_names` for resolution purposes.
   */
  imported_bindings?: Array<{ local: string; original: string }>;
  /** Whether it is a default/namespace/star import (treat as bag). */
  star: boolean;
  start_byte: number;
  end_byte: number;
  start_line: number;
  end_line: number;
}

export interface IndexResult {
  files: FileIndexResult[];
  symbols: AtlasSymbol[];
  references: AtlasSymbolReference[];
}

export interface ResolverContext {
  snapshot_id: SnapshotId;
  project_id: ProjectId;
  /** Repository root path; used by import resolvers to interpret relative specs. */
  project_root: string;
  /** Optional tsconfig paths map for TS path-mapped imports. */
  ts_paths?: Record<string, string[]>;
}

export interface ResolveResult {
  references: AtlasSymbolReference[];
  calls: AtlasCallEdge[];
  type_relations: AtlasTypeRelation[];
}

/** Maps coarse-AST kind -> atlas SymbolKind for a single language. */
export type KindMap = Partial<Record<CoarseNodeKind, SymbolKind>>;

export interface ExtractorAdapter {
  language: AtlasLanguage;
  /** AST kind to atlas SymbolKind mapping. */
  kindMap: KindMap;
  /** Compose qualified name from a coarse-AST node + parent symbol (if any). */
  qualifiedName(node: CoarseNode, parentQn: string | null): string;
  /** Optional: filter out coarse nodes that do not represent stored symbols. */
  filter?(node: CoarseNode): boolean;
}
