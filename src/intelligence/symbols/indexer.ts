/**
 * Indexer — drives the W0.5 tokenizer over a list of source files,
 * walks the coarse-AST per file, and emits AtlasSymbol[] + AtlasSymbolReference[].
 * @module intelligence/symbols/indexer
 */

import type {
  AtlasLanguage,
  AtlasSymbol,
  AtlasSymbolReference,
  ProjectId,
  SnapshotId,
} from '../types.js';
import {
  parse,
  significant,
  type CoarseNode,
  type LanguageId,
  type Token,
} from '../../atlas/syntax/index.js';
import type {
  ExtractorAdapter,
  FileIndexResult,
  FileInput,
  ImportRecord,
  IndexResult,
} from './types.js';
import { tsAdapter } from './extractors/ts.js';
import { jsAdapter } from './extractors/js.js';
import { rustAdapter } from './extractors/rust.js';
import { pythonAdapter } from './extractors/python.js';
import { goAdapter } from './extractors/go.js';
import { javaAdapter } from './extractors/java.js';
import { cppAdapter } from './extractors/cpp.js';
import { bashAdapter } from './extractors/bash.js';
import { glslAdapter } from './extractors/glsl.js';

const ADAPTERS: Record<AtlasLanguage, ExtractorAdapter> = {
  ts: tsAdapter,
  js: jsAdapter,
  rust: rustAdapter,
  python: pythonAdapter,
  go: goAdapter,
  java: javaAdapter,
  cpp: cppAdapter,
  bash: bashAdapter,
  glsl: glslAdapter,
};

const SYNTAX_LANG: Record<AtlasLanguage, LanguageId> = {
  ts: 'typescript',
  js: 'javascript',
  rust: 'rust',
  python: 'python',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  bash: 'bash',
  glsl: 'glsl',
};

export interface IndexerOptions {
  snapshot_id: SnapshotId;
  project_id: ProjectId;
}

/**
 * djb2 string hash → hex (stable across runs; signature_hash fingerprint).
 */
function hash32(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

function endLineFromBytes(source: string, startLine: number, start: number, end: number): number {
  let line = startLine;
  for (let i = start; i < end && i < source.length; i++) {
    if (source.charCodeAt(i) === 10) line++;
  }
  return line;
}

function symbolId(snapshot: SnapshotId, file: string, kind: string, qn: string, start: number): string {
  return `S-${hash32(`${snapshot}|${file}|${kind}|${qn}|${start}`)}`;
}

function refId(snapshot: SnapshotId, file: string, name: string, start: number): string {
  return `R-${hash32(`${snapshot}|${file}|${name}|${start}`)}`;
}

/**
 * Convert one CoarseNode -> AtlasSymbol (when the adapter declares its kind).
 * Returns null when the node should not be persisted as a symbol.
 */
function toSymbol(
  node: CoarseNode,
  parentSym: AtlasSymbol | null,
  adapter: ExtractorAdapter,
  source: string,
  file_path: string,
  opts: IndexerOptions,
): AtlasSymbol | null {
  if (adapter.filter && !adapter.filter(node)) return null;
  const kind = adapter.kindMap[node.kind];
  if (!kind) return null;
  const qn = adapter.qualifiedName(node, parentSym?.qualified_name ?? null);
  const start_byte = node.start;
  const end_byte = node.end;
  const start_line = node.line;
  const end_line = endLineFromBytes(source, start_line, start_byte, end_byte);
  const sigSeed = `${kind}|${qn}|${(node.modifiers ?? []).join(',')}`;
  return {
    id: symbolId(opts.snapshot_id, file_path, kind, qn, start_byte),
    snapshot_id: opts.snapshot_id,
    project_id: opts.project_id,
    file_path,
    kind,
    name: node.name,
    qualified_name: qn,
    start_byte,
    end_byte,
    start_line,
    end_line,
    signature_hash: hash32(sigSeed),
    modifiers: node.modifiers ?? [],
    language: adapter.language,
    parent_symbol_id: parentSym?.id ?? null,
  };
}

/**
 * Sweep the significant token stream for identifier references — every IDENT
 * token whose value is a plausible symbol name. The resolver later promotes
 * a subset to call/type edges. We seed each ref with confidence=0.0; the
 * resolver raises it.
 */
function collectReferences(
  tokens: Token[],
  source: string,
  file_path: string,
  opts: IndexerOptions,
): AtlasSymbolReference[] {
  const refs: AtlasSymbolReference[] = [];
  const sig = significant(tokens);
  for (let i = 0; i < sig.length; i++) {
    const t = sig[i]!;
    if (t.kind !== 'identifier') continue;
    // Strip leading `$` from bash variable references.
    const name = t.value.startsWith('$') ? t.value.slice(1) : t.value;
    if (!name || !/^[A-Za-z_][\w$]*$/.test(name)) continue;
    const next = sig[i + 1];
    const isCall = next?.value === '(';
    const isTypeUse = next?.value === '<' || next?.value === ':';
    const kind = isCall ? 'call' : isTypeUse ? 'type_use' : 'unknown';
    const end_line = endLineFromBytes(source, t.line, t.start, t.end);
    refs.push({
      id: refId(opts.snapshot_id, file_path, name, t.start),
      snapshot_id: opts.snapshot_id,
      file_path,
      start_byte: t.start,
      end_byte: t.end,
      start_line: t.line,
      end_line,
      name,
      resolved_symbol_id: null,
      resolution_confidence: 0.0,
      resolution_kind: kind,
    });
  }
  return refs;
}

/** Build ImportRecord[] from the coarse-AST 'import' nodes (language-shaped).
 *  Also ingests 'export' nodes that carry importedNames (TS re-exports). */
function collectImports(nodes: CoarseNode[], language: AtlasLanguage): ImportRecord[] {
  const out: ImportRecord[] = [];
  for (const n of nodes) {
    // Accept plain imports AND re-export nodes (export nodes whose importedNames
    // are set — those carry a module_spec in `name` just like an import node).
    const isReExport = n.kind === 'export' && n.importedNames !== undefined;
    if (n.kind !== 'import' && !isReExport) continue;
    const bindings = n.importedNames ?? [];
    const imported_names = bindings.map((b) => b.local);
    const imported_bindings = bindings.length > 0 ? bindings.map((b) => ({ ...b })) : undefined;
    const star = bindings.some((b) => b.original === '*');
    out.push({
      module_spec: n.name,
      imported_names,
      imported_bindings,
      star,
      start_byte: n.start,
      end_byte: n.end,
      start_line: n.line,
      end_line: n.line,
    });
  }
  // 'language' arg accepted for forward extensibility; current shape is uniform.
  void language;
  return out;
}

export function indexFile(input: FileInput, opts: IndexerOptions): FileIndexResult {
  const adapter = ADAPTERS[input.language];
  if (!adapter) throw new Error(`unsupported language: ${input.language}`);
  const { tokens, ast } = parse(input.source, SYNTAX_LANG[input.language]);

  // Map nodes -> symbols, threading parent context for methods and nested fns.
  const symbols: AtlasSymbol[] = [];
  // Remember the most recent class/struct/interface/impl so methods can attach.
  const containerByName: Map<string, AtlasSymbol> = new Map();
  // Also track function symbols by qualified name for nested-fn parent lookup.
  const fnByQualifiedName: Map<string, AtlasSymbol> = new Map();
  let lastContainer: AtlasSymbol | null = null;

  for (const node of ast.nodes) {
    let parent: AtlasSymbol | null = null;
    if (node.kind === 'method' && node.parent) {
      parent = containerByName.get(node.parent) ?? lastContainer;
    } else if (node.kind === 'method') {
      parent = lastContainer;
    } else if (node.kind === 'function' && node.parent) {
      // Nested function: look up its outer function by qualified-prefix name.
      // The parent field holds the outer function's qualified name (e.g. "outer" or "outer::mid").
      parent = fnByQualifiedName.get(node.parent) ?? null;
    }
    const sym = toSymbol(node, parent, adapter, input.source, input.file_path, opts);
    if (!sym) continue;
    symbols.push(sym);
    if (
      node.kind === 'class' ||
      node.kind === 'struct' ||
      node.kind === 'interface' ||
      node.kind === 'trait' ||
      node.kind === 'impl'
    ) {
      lastContainer = sym;
      containerByName.set(node.name, sym);
    }
    if (node.kind === 'function') {
      fnByQualifiedName.set(sym.qualified_name, sym);
    }
  }

  const references = collectReferences(tokens, input.source, input.file_path, opts);
  const imports = collectImports(ast.nodes, input.language);

  return {
    file_path: input.file_path,
    language: input.language,
    symbols,
    references,
    imports,
  };
}

export function indexFiles(inputs: FileInput[], opts: IndexerOptions): IndexResult {
  const files: FileIndexResult[] = inputs.map((f) => indexFile(f, opts));
  const symbols: AtlasSymbol[] = [];
  const references: AtlasSymbolReference[] = [];
  for (const f of files) {
    symbols.push(...f.symbols);
    references.push(...f.references);
  }
  return { files, symbols, references };
}
