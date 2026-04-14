/**
 * Unified cartridge loader.
 *
 * Reads a `cartridge.yaml` file and produces a parsed `Cartridge` object.
 * Resolves two forms of external chipset references so existing YAML files
 * (e.g. examples/chipsets/*-department/chipset.yaml) can be reused without
 * rewriting:
 *
 *   - External file reference:
 *       - { kind: department, src: ./chipsets/department.yaml }
 *     The referenced file must contain a single chipset payload at its root.
 *     The loader merges the `kind` from the cartridge entry onto the loaded
 *     payload, so the external file does not need to repeat its own kind.
 *
 *   - Fragment reference (JSON-pointer-style):
 *       - { kind: grove, src: ./chipset.yaml#/grove }
 *     The path before `#` is the file to load. The path after `#/` is a
 *     slash-delimited key sequence into the loaded YAML tree; the loader
 *     extracts that sub-tree and treats it as the chipset payload (again with
 *     `kind` merged in from the cartridge entry).
 *
 * Inline chipsets — where the entry already contains all the chipset fields
 * alongside `kind` — are passed through unchanged.
 *
 * Frozen decisions (Wave 0 gate, documented in MIGRATION.md in Wave 3):
 *   - Fragment syntax is `path#/section/nested` — JSON-pointer style.
 *   - Relative paths resolve against the directory of the cartridge.yaml file.
 *   - Circular external references throw with a clear error message.
 */

import { readFileSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { normalizeEvaluationChipset } from './normalizers/evaluation.js';
import { CartridgeSchema, type Cartridge } from './types.js';

export interface LoadCartridgeOptions {
  /** Maximum depth of nested src: chains. Defaults to 16. */
  maxDepth?: number;
}

/**
 * Load and parse a cartridge.yaml file into a validated Cartridge object.
 *
 * @param cartridgePath Absolute or cwd-relative path to a cartridge.yaml file.
 */
export function loadCartridge(
  cartridgePath: string,
  options: LoadCartridgeOptions = {},
): Cartridge {
  const maxDepth = options.maxDepth ?? 16;
  const absolutePath = isAbsolute(cartridgePath)
    ? cartridgePath
    : resolve(process.cwd(), cartridgePath);

  const rawText = readFileSync(absolutePath, 'utf8');
  const rawDoc = parseYaml(rawText);

  if (rawDoc === null || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
    throw new Error(
      `loader: cartridge at ${absolutePath} must be a YAML mapping (got ${describeType(rawDoc)})`,
    );
  }

  const baseDir = dirname(absolutePath);
  const resolved = resolveCartridgeEntries(
    rawDoc as Record<string, unknown>,
    baseDir,
    new Set(),
    maxDepth,
  );

  return CartridgeSchema.parse(resolved);
}

/**
 * Parse an in-memory cartridge document (already a JS object) against the
 * unified schema, with the same src: / fragment resolution as loadCartridge.
 *
 * The cartridge is treated as if it lived at `baseDir/cartridge.yaml` — all
 * relative src: paths are resolved against `baseDir`.
 */
export function parseCartridge(
  doc: unknown,
  baseDir: string,
  options: LoadCartridgeOptions = {},
): Cartridge {
  const maxDepth = options.maxDepth ?? 16;
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(
      `loader: cartridge document must be a mapping (got ${describeType(doc)})`,
    );
  }
  const resolved = resolveCartridgeEntries(
    doc as Record<string, unknown>,
    baseDir,
    new Set(),
    maxDepth,
  );
  return CartridgeSchema.parse(resolved);
}

// ---------------------------------------------------------------------------
// Internal resolution
// ---------------------------------------------------------------------------

function resolveCartridgeEntries(
  doc: Record<string, unknown>,
  baseDir: string,
  visited: Set<string>,
  maxDepth: number,
): Record<string, unknown> {
  const chipsets = doc.chipsets;
  if (!Array.isArray(chipsets)) {
    // Let the downstream Zod parse produce the error message
    return doc;
  }

  const resolvedChipsets = chipsets.map((entry) =>
    resolveChipsetEntry(entry, baseDir, visited, maxDepth),
  );

  return { ...doc, chipsets: resolvedChipsets };
}

function resolveChipsetEntry(
  entry: unknown,
  baseDir: string,
  visited: Set<string>,
  remainingDepth: number,
): unknown {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return entry;
  }
  const obj = entry as Record<string, unknown>;
  const src = obj.src;
  if (typeof src !== 'string' || src.length === 0) {
    // Inline chipset — normalize by kind and pass through.
    return normalizeByKind(obj, undefined);
  }

  if (remainingDepth <= 0) {
    throw new Error(
      `loader: src: reference chain exceeded max depth at "${src}"`,
    );
  }

  const { filePath, fragment } = splitSrcReference(src, baseDir);

  if (visited.has(filePath)) {
    const chain = [...visited, filePath].join(' -> ');
    throw new Error(`loader: circular src: reference detected: ${chain}`);
  }

  let externalDoc: unknown;
  try {
    externalDoc = parseYaml(readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(
      `loader: failed to read src: '${src}' (resolved to ${filePath}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }

  if (externalDoc === null || typeof externalDoc !== 'object') {
    throw new Error(
      `loader: external file ${filePath} must contain a YAML mapping (got ${describeType(externalDoc)})`,
    );
  }

  const sectionValue = fragment
    ? extractFragment(externalDoc, fragment, src)
    : externalDoc;

  if (
    sectionValue === null ||
    typeof sectionValue !== 'object' ||
    Array.isArray(sectionValue)
  ) {
    throw new Error(
      `loader: src: '${src}' resolved to a ${describeType(sectionValue)}; expected a mapping`,
    );
  }

  // Merge kind from the cartridge entry onto the loaded payload. The entry's
  // kind always wins because the cartridge.yaml is the authoritative source
  // of which chipset kind a given src: is being loaded as.
  const merged: Record<string, unknown> = {
    ...(sectionValue as Record<string, unknown>),
  };
  if ('kind' in obj && typeof obj.kind === 'string') {
    merged.kind = obj.kind;
  }

  // Allow nested src: within a loaded chipset payload as well, though it is
  // rare in practice. Resolve relative paths against the directory of the
  // external file, not the cartridge.yaml.
  const nextVisited = new Set(visited).add(filePath);
  const externalBaseDir = dirname(filePath);
  if (typeof merged.src === 'string') {
    return resolveChipsetEntry(
      merged,
      externalBaseDir,
      nextVisited,
      remainingDepth - 1,
    );
  }

  return normalizeByKind(merged, filePath);
}

function normalizeByKind(
  payload: Record<string, unknown>,
  sourceFile: string | undefined,
): Record<string, unknown> {
  if (payload.kind === 'evaluation') {
    return normalizeEvaluationChipset(payload, { sourceFile });
  }
  return payload;
}

function splitSrcReference(
  src: string,
  baseDir: string,
): { filePath: string; fragment: string | undefined } {
  const hashIndex = src.indexOf('#');
  let filePart: string;
  let fragmentPart: string | undefined;
  if (hashIndex === -1) {
    filePart = src;
    fragmentPart = undefined;
  } else {
    filePart = src.slice(0, hashIndex);
    const afterHash = src.slice(hashIndex + 1);
    if (!afterHash.startsWith('/')) {
      throw new Error(
        `loader: fragment in src: '${src}' must start with '#/' (JSON-pointer-style)`,
      );
    }
    fragmentPart = afterHash.slice(1);
  }
  const filePath = isAbsolute(filePart) ? filePart : resolve(baseDir, filePart);
  return { filePath, fragment: fragmentPart };
}

function extractFragment(
  doc: unknown,
  fragment: string,
  src: string,
): unknown {
  const parts = fragment.split('/').filter((p) => p.length > 0);
  let cursor: unknown = doc;
  for (const part of parts) {
    if (
      cursor === null ||
      typeof cursor !== 'object' ||
      Array.isArray(cursor) ||
      !(part in (cursor as Record<string, unknown>))
    ) {
      throw new Error(
        `loader: fragment '${fragment}' not found while resolving src: '${src}' (missing segment: '${part}')`,
      );
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function describeType(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}
