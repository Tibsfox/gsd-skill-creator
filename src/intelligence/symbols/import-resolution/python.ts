/**
 * Python import resolution: from-imports + dotted relative imports.
 * Treats package roots as directories containing `__init__.py`.
 * @module intelligence/symbols/import-resolution/python
 */

import * as path from 'node:path';

export interface PythonResolverOptions {
  project_root: string;
  known_files: Set<string>;
  /** Top-level package roots (project-relative dirs). Auto-detected from `__init__.py` if omitted. */
  package_roots?: string[];
}

/**
 * Resolve a python module-spec (the `name` of an 'import' coarse-AST node).
 * Handles three shapes:
 *  - `module.path`         → search package_roots for `module/path.py` or `.../path/__init__.py`
 *  - `.relative`           → resolve against from_file's directory; one '.' = same dir
 *  - `..parent.module`     → climb one directory per leading dot
 */
export function resolvePythonImport(
  from_file: string,
  spec: string,
  opts: PythonResolverOptions,
): string | null {
  if (!spec) return null;
  const dotMatch = /^(\.+)(.*)$/.exec(spec);
  if (dotMatch) {
    const dots = dotMatch[1]!.length;
    const tail = dotMatch[2]!;
    let dir = path.posix.dirname(from_file);
    for (let k = 1; k < dots; k++) dir = path.posix.dirname(dir);
    return tryDotted(dir, tail, opts.known_files);
  }
  const roots = opts.package_roots ?? autoDetectPackageRoots(opts.known_files);
  for (const root of roots) {
    const r = tryDotted(root, spec, opts.known_files);
    if (r) return r;
  }
  // Try project root as a fallback search dir.
  return tryDotted('', spec, opts.known_files);
}

function tryDotted(baseDir: string, dotted: string, known: Set<string>): string | null {
  if (!dotted) {
    const init = path.posix.join(baseDir, '__init__.py');
    if (known.has(init)) return init;
    return null;
  }
  const segments = dotted.split('.').filter((s) => s.length > 0);
  if (segments.length === 0) {
    const init = path.posix.join(baseDir, '__init__.py');
    if (known.has(init)) return init;
    return null;
  }
  const stem = baseDir ? path.posix.join(baseDir, ...segments) : segments.join('/');
  const flat = stem + '.py';
  if (known.has(flat)) return flat;
  const init = path.posix.join(stem, '__init__.py');
  if (known.has(init)) return init;
  // Fall back to the parent's __init__ — matches `from pkg import name` where
  // `name` is exported from `pkg/__init__.py`.
  const head = segments.slice(0, -1);
  if (head.length > 0) {
    const parentStem = baseDir ? path.posix.join(baseDir, ...head) : head.join('/');
    const parentInit = path.posix.join(parentStem, '__init__.py');
    if (known.has(parentInit)) return parentInit;
  }
  return null;
}

function autoDetectPackageRoots(known: Set<string>): string[] {
  const roots = new Set<string>(['']);
  for (const f of known) {
    if (f.endsWith('/__init__.py') || f === '__init__.py') {
      roots.add(path.posix.dirname(f));
    }
  }
  return [...roots];
}
