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
import { ensureAllowed, type LoaderContext } from '../security/loader-context.js';
import { normalizeEvaluationChipset } from './normalizers/evaluation.js';
import {
  CartridgeSchema,
  ResearchOutputCartridgeSchema,
  type Cartridge,
  type ResearchOutputCartridge,
} from './types.js';

const LOADER_SOURCE = 'cartridge/loader';

export interface LoadCartridgeOptions {
  /** Maximum depth of nested src: chains. Defaults to 16. */
  maxDepth?: number;
  /** Optional security chokepoint — see src/security/loader-context.ts. */
  ctx?: LoaderContext;
}

/** Union of all top-level cartridge shapes the loader can return. */
export type AnyCartridge = Cartridge | ResearchOutputCartridge;

/**
 * Return true when the document root declares `kind: research-output`.
 *
 * Research-output cartridges bypass the standard `chipsets.length >= 1`
 * requirement and are validated against `ResearchOutputCartridgeSchema` instead
 * of `CartridgeSchema`. The detection happens before any schema parse so that
 * a missing / invalid `chipsets` field does not produce a confusing Zod error.
 */
function isResearchOutputDoc(doc: Record<string, unknown>): boolean {
  return doc['kind'] === 'research-output';
}

/**
 * Load and parse a cartridge.yaml file into a validated Cartridge object.
 *
 * This function handles only standard executable-chipset cartridges. For
 * research-output cartridges (kind: research-output), use `loadAnyCartridge()`
 * which returns the `AnyCartridge` union. Calling this function on a
 * research-output cartridge.yaml will throw with a descriptive error.
 *
 * @param cartridgePath Absolute or cwd-relative path to a cartridge.yaml file.
 */
export function loadCartridge(
  cartridgePath: string,
  options: LoadCartridgeOptions = {},
): Cartridge {
  const maxDepth = options.maxDepth ?? 16;
  const ctx = options.ctx;
  const absolutePath = isAbsolute(cartridgePath)
    ? cartridgePath
    : resolve(process.cwd(), cartridgePath);

  ensureAllowed(ctx, LOADER_SOURCE, 'load-cartridge', absolutePath);
  const rawText = readFileSync(absolutePath, 'utf8');
  const rawDoc = parseYaml(rawText);

  if (rawDoc === null || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
    throw new Error(
      `loader: cartridge at ${absolutePath} must be a YAML mapping (got ${describeType(rawDoc)})`,
    );
  }

  const doc = rawDoc as Record<string, unknown>;

  if (isResearchOutputDoc(doc)) {
    throw new Error(
      `loader: cartridge at ${absolutePath} is a research-output cartridge (kind: research-output). ` +
      `Use loadAnyCartridge() to load both standard and research-output cartridges.`,
    );
  }

  const baseDir = dirname(absolutePath);
  const resolved = resolveCartridgeEntries(
    doc,
    baseDir,
    new Set(),
    maxDepth,
    ctx,
  );

  return CartridgeSchema.parse(resolved);
}

/**
 * Load any cartridge.yaml — standard or research-output.
 *
 * Returns `Cartridge` for standard executable-chipset cartridges (no top-level
 * `kind:` field, or `kind:` is a chipset kind). Returns `ResearchOutputCartridge`
 * for cartridges that declare `kind: research-output` at the document root.
 *
 * Use `isResearchOutputCartridge()` from `./types.js` to narrow the result.
 *
 * @param cartridgePath Absolute or cwd-relative path to a cartridge.yaml file.
 */
export function loadAnyCartridge(
  cartridgePath: string,
  options: LoadCartridgeOptions = {},
): AnyCartridge {
  const maxDepth = options.maxDepth ?? 16;
  const ctx = options.ctx;
  const absolutePath = isAbsolute(cartridgePath)
    ? cartridgePath
    : resolve(process.cwd(), cartridgePath);

  ensureAllowed(ctx, LOADER_SOURCE, 'load-cartridge', absolutePath);
  const rawText = readFileSync(absolutePath, 'utf8');
  const rawDoc = parseYaml(rawText);

  if (rawDoc === null || typeof rawDoc !== 'object' || Array.isArray(rawDoc)) {
    throw new Error(
      `loader: cartridge at ${absolutePath} must be a YAML mapping (got ${describeType(rawDoc)})`,
    );
  }

  const doc = rawDoc as Record<string, unknown>;

  // Research-output cartridges do not have a chipsets array — route them to the
  // alternate schema before any src: resolution (they have no src: references).
  if (isResearchOutputDoc(doc)) {
    return ResearchOutputCartridgeSchema.parse(doc);
  }

  const baseDir = dirname(absolutePath);
  const resolved = resolveCartridgeEntries(
    doc,
    baseDir,
    new Set(),
    maxDepth,
    ctx,
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
  const ctx = options.ctx;
  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new Error(
      `loader: cartridge document must be a mapping (got ${describeType(doc)})`,
    );
  }
  const docObj = doc as Record<string, unknown>;
  const resolved = resolveCartridgeEntries(
    docObj,
    baseDir,
    new Set(),
    maxDepth,
    ctx,
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
  ctx: LoaderContext | undefined,
): Record<string, unknown> {
  const chipsets = doc.chipsets;
  if (!Array.isArray(chipsets)) {
    // Let the downstream Zod parse produce the error message
    return doc;
  }

  const resolvedChipsets = chipsets.map((entry) =>
    resolveChipsetEntry(entry, baseDir, visited, maxDepth, ctx),
  );

  return { ...doc, chipsets: resolvedChipsets };
}

function resolveChipsetEntry(
  entry: unknown,
  baseDir: string,
  visited: Set<string>,
  remainingDepth: number,
  ctx: LoaderContext | undefined,
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

  ensureAllowed(ctx, LOADER_SOURCE, 'read-file', filePath, `src: '${src}'`);
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
      ctx,
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
