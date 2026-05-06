/**
 * Cross-file resolver — walks IndexResult, resolves references against the
 * symbol table, builds call edges and type relations.
 *
 * Confidence convention (per src/intelligence/types.ts):
 *   declaration→declaration:    1.0 (already set at index time, not here)
 *   call site, single match:    0.9
 *   call site, multi-match:     0.5 (ambiguous; first match wins, low confidence)
 *   call site, in-file match:   0.95 (slightly higher than cross-file)
 *   type-relation, resolved:    0.9
 *   import re-export:           0.8
 *   unresolved:                 0.0
 * @module intelligence/symbols/resolver
 */

import type {
  AtlasCallEdge,
  AtlasSymbol,
  AtlasSymbolReference,
  AtlasTypeRelation,
  CallEdgeId,
  ResolutionKind,
  SymbolId,
  TypeRelationId,
} from '../types.js';
import type { FileIndexResult, IndexResult, ResolveResult, ResolverContext } from './types.js';
import { parse, significant, type Token } from '../../atlas/syntax/index.js';
import { resolveTsImport } from './import-resolution/ts.js';
import { resolveRustUse } from './import-resolution/rust.js';
import { resolvePythonImport } from './import-resolution/python.js';

interface SymbolBucket {
  byName: Map<string, AtlasSymbol[]>;
  byQualifiedName: Map<string, AtlasSymbol[]>;
  byFile: Map<string, AtlasSymbol[]>;
}

function bucket(symbols: AtlasSymbol[]): SymbolBucket {
  const byName = new Map<string, AtlasSymbol[]>();
  const byQualifiedName = new Map<string, AtlasSymbol[]>();
  const byFile = new Map<string, AtlasSymbol[]>();
  for (const s of symbols) {
    arrPush(byName, s.name, s);
    arrPush(byQualifiedName, s.qualified_name, s);
    arrPush(byFile, s.file_path, s);
  }
  return { byName, byQualifiedName, byFile };
}

function arrPush<K, V>(m: Map<K, V[]>, k: K, v: V): void {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
}

function hash32(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(16);
}

/**
 * Resolve every reference, produce call edges + type relations. The reference
 * rows themselves are returned with resolved_symbol_id + confidence filled in.
 */
export function resolve(idx: IndexResult, ctx: ResolverContext): ResolveResult {
  const buckets = bucket(idx.symbols);
  const knownFiles = new Set(idx.files.map((f) => f.file_path));

  // Per-file imported-name → resolved-file map (for narrowing references).
  const importBindingsByFile = new Map<string, Map<string, string>>();
  // Per-file local-name → original export-name map (for aliased imports).
  const importOriginalByFile = new Map<string, Map<string, string>>();
  for (const f of idx.files) {
    const { byFile, byOrigName } = computeImportBindings(f, ctx, knownFiles);
    importBindingsByFile.set(f.file_path, byFile);
    importOriginalByFile.set(f.file_path, byOrigName);
  }

  // Per-file enclosing-symbol lookup (caller_symbol_id resolution).
  const enclosingByFile = new Map<string, AtlasSymbol[]>();
  for (const s of idx.symbols) {
    arrPush(enclosingByFile, s.file_path, s);
  }

  const refs: AtlasSymbolReference[] = [];
  const calls: AtlasCallEdge[] = [];
  const seenCallEdge = new Set<string>();
  const seenTypeRel = new Set<string>();
  const typeRels: AtlasTypeRelation[] = [];

  for (const ref of idx.references) {
    const fileBindings = importBindingsByFile.get(ref.file_path);
    const fileBindingOrig = importOriginalByFile.get(ref.file_path);
    const inFileSyms = (enclosingByFile.get(ref.file_path) ?? []).filter(
      (s) => s.name === ref.name && s.kind !== 'import' && s.kind !== 'export',
    );
    const targetSym = pickResolutionTarget(ref, inFileSyms, buckets, fileBindings, fileBindingOrig, idx.files, ctx, knownFiles);
    const updated: AtlasSymbolReference = targetSym
      ? {
          ...ref,
          resolved_symbol_id: targetSym.symbol.id,
          resolution_confidence: targetSym.confidence,
          resolution_kind: ref.resolution_kind === 'unknown' ? 'call' : ref.resolution_kind,
        }
      : ref;
    refs.push(updated);

    if (targetSym && (ref.resolution_kind === 'call' || (updated.resolution_kind === 'call'))) {
      const caller = findEnclosing(enclosingByFile.get(ref.file_path) ?? [], ref.start_byte);
      if (caller && caller.id !== targetSym.symbol.id) {
        const key = `${caller.id}|${targetSym.symbol.id}|${ref.start_byte}`;
        if (!seenCallEdge.has(key)) {
          seenCallEdge.add(key);
          const id: CallEdgeId = `C-${hash32(key)}`;
          calls.push({
            id,
            snapshot_id: ctx.snapshot_id,
            caller_symbol_id: caller.id,
            callee_symbol_id: targetSym.symbol.id,
            call_site_byte: ref.start_byte,
            call_site_line: ref.start_line,
            confidence: targetSym.confidence,
          });
        }
      }
    }
  }

  // Type relations: extends / implements / returns / param scanned via re-tokenize.
  for (const f of idx.files) {
    const fileSyms = idx.symbols.filter((s) => s.file_path === f.file_path);
    extractTypeRelations(f, fileSyms, buckets, importBindingsByFile.get(f.file_path), ctx, typeRels, seenTypeRel);
  }

  return { references: refs, calls, type_relations: typeRels };
}

interface PickedTarget {
  symbol: AtlasSymbol;
  confidence: number;
}

function pickResolutionTarget(
  ref: AtlasSymbolReference,
  inFileSyms: AtlasSymbol[],
  buckets: SymbolBucket,
  fileBindings: Map<string, string> | undefined,
  fileBindingOrig: Map<string, string> | undefined,
  allFiles: FileIndexResult[],
  ctx: ResolverContext,
  knownFiles: Set<string>,
): PickedTarget | null {
  // 1. Same-file declaration wins (highest signal).
  if (inFileSyms.length === 1) return { symbol: inFileSyms[0]!, confidence: ref.resolution_kind === 'call' ? 0.95 : 1.0 };
  if (inFileSyms.length > 1) {
    return { symbol: inFileSyms[0]!, confidence: 0.6 };
  }
  // 2. Cross-file resolution via import binding.
  if (fileBindings) {
    const importedFrom = fileBindings.get(ref.name);
    if (importedFrom) {
      // Look up by original export-name when the local binding is aliased.
      const lookupName = fileBindingOrig?.get(ref.name) ?? ref.name;
      let candidates = (buckets.byFile.get(importedFrom) ?? []).filter(
        (s) => s.name === lookupName && s.kind !== 'import' && s.kind !== 'export',
      );
      // Default-import fallback: when original is 'default', match the sole
      // exported symbol of that file (single-export heuristic).
      if (candidates.length === 0 && lookupName === 'default') {
        const fileSyms = (buckets.byFile.get(importedFrom) ?? []).filter(
          (s) => s.kind !== 'import' && s.kind !== 'export',
        );
        if (fileSyms.length === 1) candidates = fileSyms;
      }
      // Re-export chain: if the intermediate file has no matching declaration,
      // follow re-exports transitively to find the ultimate source.
      if (candidates.length === 0) {
        const chain = followReExportChain(lookupName, importedFrom, allFiles, ctx, knownFiles);
        if (chain.file !== importedFrom || chain.originalName !== lookupName) {
          candidates = (buckets.byFile.get(chain.file) ?? []).filter(
            (s) => s.name === chain.originalName && s.kind !== 'import' && s.kind !== 'export',
          );
        }
      }
      if (candidates.length === 1) return { symbol: candidates[0]!, confidence: ref.resolution_kind === 'call' ? 0.9 : 0.95 };
      if (candidates.length > 1) return { symbol: candidates[0]!, confidence: 0.5 };
    }
  }
  // 3. Global by-name fallback. A single unambiguous global match is a fairly
  // strong signal even without explicit import binding (rare paths where the
  // extractor could not parse the import clause).
  const all = buckets.byName.get(ref.name);
  if (all && all.length === 1) return { symbol: all[0]!, confidence: ref.resolution_kind === 'call' ? 0.7 : 0.8 };
  if (all && all.length > 1) return { symbol: all[0]!, confidence: 0.4 };
  return null;
}

function findEnclosing(syms: AtlasSymbol[], offset: number): AtlasSymbol | null {
  let best: AtlasSymbol | null = null;
  let bestSize = Infinity;
  for (const s of syms) {
    if (s.start_byte <= offset && offset <= s.end_byte && (s.kind === 'function' || s.kind === 'method')) {
      const size = s.end_byte - s.start_byte;
      if (size < bestSize) {
        best = s;
        bestSize = size;
      }
    }
  }
  // Fall back: any function/method declared earlier in the file.
  if (!best) {
    let candidate: AtlasSymbol | null = null;
    for (const s of syms) {
      if ((s.kind === 'function' || s.kind === 'method') && s.start_byte <= offset) {
        if (!candidate || s.start_byte > candidate.start_byte) candidate = s;
      }
    }
    best = candidate;
  }
  return best;
}

/**
 * Build a "name → resolved file path" map for the given file's imports.
 * Uses the language-specific import resolver. Unresolved bare imports are
 * silently skipped (their references stay at confidence 0).
 */
function computeImportBindings(
  file: FileIndexResult,
  ctx: ResolverContext,
  knownFiles: Set<string>,
): { byFile: Map<string, string>; byOrigName: Map<string, string> } {
  const byFile = new Map<string, string>();
  const byOrigName = new Map<string, string>();
  if (file.imports.length === 0) return { byFile, byOrigName };

  for (const imp of file.imports) {
    let resolved: string | null = null;
    if (file.language === 'ts' || file.language === 'js') {
      resolved = resolveTsImport(file.file_path, imp.module_spec, {
        project_root: ctx.project_root,
        paths: ctx.ts_paths,
        known_files: knownFiles,
      });
    } else if (file.language === 'rust') {
      resolved = resolveRustUse(file.file_path, imp.module_spec, {
        project_root: ctx.project_root,
        known_files: knownFiles,
      });
    } else if (file.language === 'python') {
      resolved = resolvePythonImport(file.file_path, imp.module_spec, {
        project_root: ctx.project_root,
        known_files: knownFiles,
      });
    }
    if (!resolved) continue;
    // Prefer the richer binding shape when available (TS/JS extractor parses
    // import clauses; original-name carries default/aliased semantics).
    if (imp.imported_bindings && imp.imported_bindings.length > 0) {
      for (const b of imp.imported_bindings) {
        byFile.set(b.local, resolved);
        if (b.original !== b.local) byOrigName.set(b.local, b.original);
        else if (b.original === 'default' || b.original === '*') byOrigName.set(b.local, b.original);
      }
    } else if (imp.imported_names.length > 0) {
      for (const n of imp.imported_names) byFile.set(n, resolved);
    } else {
      // Bare-spec import (no clause captured): keep a sentinel so type-relation
      // scans can still find the resolved file via the '*' prefix.
      byFile.set('*' + resolved, resolved);
    }
  }
  return { byFile, byOrigName };
}

/**
 * Resolve the module spec of a re-export record to a file path. Handles TS/JS
 * and Rust; returns null for unresolvable or unsupported languages.
 */
function resolveReExportSpec(
  fileResult: FileIndexResult,
  moduleSpec: string,
  ctx: ResolverContext,
  knownFiles: Set<string>,
): string | null {
  if (fileResult.language === 'ts' || fileResult.language === 'js') {
    return resolveTsImport(fileResult.file_path, moduleSpec, {
      project_root: ctx.project_root,
      paths: ctx.ts_paths,
      known_files: knownFiles,
    });
  }
  if (fileResult.language === 'rust') {
    return resolveRustUse(fileResult.file_path, moduleSpec, {
      project_root: ctx.project_root,
      known_files: knownFiles,
    });
  }
  return null;
}

/**
 * Follow re-export chains: given that `localName` from `intermediateFile` is
 * needed, check whether `intermediateFile` itself re-exports that name from
 * another file. Returns the ultimate source file path (or the intermediate
 * file if no re-export chain is found). Depth-limited to avoid cycles.
 * Supports TS/JS (`export { ... } from`) and Rust (`pub use`).
 */
export function followReExportChain(
  localName: string,
  intermediateFile: string,
  allFiles: FileIndexResult[],
  ctx: ResolverContext,
  knownFiles: Set<string>,
  depth = 0,
): { file: string; originalName: string } {
  if (depth > 8) return { file: intermediateFile, originalName: localName };
  const fileResult = allFiles.find((f) => f.file_path === intermediateFile);
  if (!fileResult) return { file: intermediateFile, originalName: localName };
  // Look for a re-export import record that covers `localName`.
  for (const imp of fileResult.imports) {
    if (!imp.imported_bindings) continue;
    const binding = imp.imported_bindings.find((b) => b.local === localName || b.original === '*');
    if (!binding) continue;
    const resolved = resolveReExportSpec(fileResult, imp.module_spec, ctx, knownFiles);
    if (!resolved) continue;
    const nextOriginal = binding.original === '*' ? localName : binding.original;
    return followReExportChain(nextOriginal, resolved, allFiles, ctx, knownFiles, depth + 1);
  }
  return { file: intermediateFile, originalName: localName };
}

/**
 * Re-tokenize the file once and scan for `class X extends Y`, `class X implements Y`,
 * `: Type` annotations, and emit AtlasTypeRelation rows for the ones whose
 * `Y` resolves against the symbol table.
 */
function extractTypeRelations(
  file: FileIndexResult,
  fileSyms: AtlasSymbol[],
  buckets: SymbolBucket,
  bindings: Map<string, string> | undefined,
  ctx: ResolverContext,
  out: AtlasTypeRelation[],
  seen: Set<string>,
): void {
  // Only TS/JS/Java grammars expose `extends`/`implements` cleanly; Rust uses `impl … for …`
  // which our coarse extractor surfaces as kind='impl'. Re-tokenize once for keyword scan.
  const langForSyntax = file.language === 'cpp' ? 'cpp' : file.language === 'js' ? 'javascript' : file.language;
  let tokens: Token[];
  try {
    const sourceLookup = (file as FileIndexResult & { _source?: string })._source ?? '';
    if (!sourceLookup) return;
    const parsed = parse(sourceLookup, langForSyntax === 'ts' ? 'typescript' : (langForSyntax as 'typescript'));
    tokens = parsed.tokens;
  } catch {
    return;
  }
  const sig = significant(tokens);
  for (let i = 0; i < sig.length - 2; i++) {
    const t = sig[i]!;
    if (t.value !== 'extends' && t.value !== 'implements') continue;
    // Find the enclosing class symbol (closest preceding `class IDENT` token).
    const nameT = sig[i + 1];
    if (!nameT || nameT.kind !== 'identifier') continue;
    const fromSym = findEnclosingClass(fileSyms, t.start);
    if (!fromSym) continue;
    const targetSym = resolveTypeName(nameT.value, file.file_path, fileSyms, buckets, bindings);
    if (!targetSym) continue;
    const kind = t.value === 'extends' ? 'extends' : 'implements';
    const key = `${fromSym.id}|${kind}|${targetSym.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const id: TypeRelationId = `T-${hash32(key)}`;
    out.push({
      id,
      snapshot_id: ctx.snapshot_id,
      from_symbol_id: fromSym.id,
      to_symbol_id: targetSym.id,
      kind,
      confidence: 0.9,
    });
  }
}

function findEnclosingClass(syms: AtlasSymbol[], offset: number): AtlasSymbol | null {
  let best: AtlasSymbol | null = null;
  let bestStart = -1;
  for (const s of syms) {
    if (s.kind !== 'class' && s.kind !== 'interface') continue;
    if (s.start_byte <= offset && s.start_byte > bestStart) {
      best = s;
      bestStart = s.start_byte;
    }
  }
  return best;
}

function resolveTypeName(
  name: string,
  file_path: string,
  fileSyms: AtlasSymbol[],
  buckets: SymbolBucket,
  bindings: Map<string, string> | undefined,
): AtlasSymbol | null {
  const inFile = fileSyms.find((s) => s.name === name);
  if (inFile) return inFile;
  if (bindings) {
    const f = bindings.get(name);
    if (f) {
      const cand = (buckets.byFile.get(f) ?? []).filter((s) => s.name === name);
      if (cand.length > 0) return cand[0]!;
    }
  }
  void file_path;
  const all = buckets.byName.get(name);
  if (all && all.length === 1) return all[0]!;
  return null;
}

/**
 * Stash the original source on each FileIndexResult so the resolver's type-relation
 * scan can re-tokenize without the caller threading sources through. Public helper
 * used by integration callers; tests may bypass and call resolve directly.
 */
export function attachSources(result: IndexResult, sources: Map<string, string>): IndexResult {
  for (const f of result.files) {
    const src = sources.get(f.file_path);
    if (src !== undefined) (f as FileIndexResult & { _source?: string })._source = src;
  }
  return result;
}
