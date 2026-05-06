/**
 * Rust use-path resolution: crate-relative + super + module path.
 * Resolves a "use path::to::Item" spec to a file path using the in-index file
 * set. Crate root is assumed to be `<project_root>/src/lib.rs` or `src/main.rs`.
 * @module intelligence/symbols/import-resolution/rust
 */

import * as path from 'node:path';

export interface RustResolverOptions {
  project_root: string;
  known_files: Set<string>;
  crate_root?: string; // project-relative; defaults tried in order
}

const DEFAULT_CRATE_ROOTS = ['src/lib.rs', 'src/main.rs'];

/**
 * Convert a use-path string (already concatenated by the rust extractor —
 * may contain '::' segments and trailing braces from glob imports) into a
 * resolved file path or null. Returns the file containing the imported
 * module's `mod.rs` or `<segment>.rs`.
 */
export function resolveRustUse(
  from_file: string,
  spec: string,
  opts: RustResolverOptions,
): string | null {
  // Strip glob-import suffix `{...}` — coarse extractor concatenated path.
  const cleanSpec = spec.replace(/\{.*$/, '').replace(/[\s,;]+$/g, '');
  const segments = cleanSpec.split('::').filter((s) => s.length > 0 && s !== '*');
  if (segments.length === 0) return null;

  const head = segments[0]!;
  let cursorDir: string;
  let rest: string[];

  if (head === 'crate') {
    const root = pickCrateRoot(opts);
    if (!root) return null;
    cursorDir = path.posix.dirname(root);
    rest = segments.slice(1);
  } else if (head === 'super') {
    cursorDir = path.posix.dirname(path.posix.dirname(from_file));
    rest = segments.slice(1);
  } else if (head === 'self') {
    cursorDir = path.posix.dirname(from_file);
    rest = segments.slice(1);
  } else {
    // Bare crate name → look for src/<head>.rs or treat as external (unresolved).
    const candidate = path.posix.join('src', head + '.rs');
    if (opts.known_files.has(candidate)) {
      cursorDir = path.posix.dirname(candidate);
      rest = segments.slice(1);
    } else {
      return null;
    }
  }

  // Walk the rest: each segment should map to <cursor>/<seg>.rs OR <cursor>/<seg>/mod.rs.
  // We stop walking once only one segment remains (assumed to be the imported item).
  while (rest.length > 1) {
    const seg = rest.shift()!;
    const flat = path.posix.join(cursorDir, seg + '.rs');
    const folder = path.posix.join(cursorDir, seg, 'mod.rs');
    if (opts.known_files.has(flat)) {
      cursorDir = path.posix.join(cursorDir, seg);
      // `<seg>.rs` defines the module, but submodules live at <cursorDir>/<seg>/...
    } else if (opts.known_files.has(folder)) {
      cursorDir = path.posix.join(cursorDir, seg);
    } else {
      return null;
    }
  }

  const last = rest[0];
  if (!last) {
    const candidateMod = path.posix.join(cursorDir, 'mod.rs');
    if (opts.known_files.has(candidateMod)) return candidateMod;
    return null;
  }
  const flat = path.posix.join(cursorDir, last + '.rs');
  const folder = path.posix.join(cursorDir, last, 'mod.rs');
  if (opts.known_files.has(flat)) return flat;
  if (opts.known_files.has(folder)) return folder;
  // Fall through: maybe `last` is an item inside cursorDir/mod.rs.
  const mod = path.posix.join(cursorDir, 'mod.rs');
  if (opts.known_files.has(mod)) return mod;
  return null;
}

function pickCrateRoot(opts: RustResolverOptions): string | null {
  if (opts.crate_root && opts.known_files.has(opts.crate_root)) return opts.crate_root;
  for (const r of DEFAULT_CRATE_ROOTS) {
    if (opts.known_files.has(r)) return r;
  }
  return null;
}
