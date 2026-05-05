/**
 * TypeScript import-path resolution: relative + path-mapped + bare.
 * Bare imports (no leading '.', '/', or path-mapped prefix) are reported as
 * unresolved — node_modules is intentionally not walked.
 * @module intelligence/symbols/import-resolution/ts
 */

import * as path from 'node:path';

const TS_EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];

export interface TsResolverOptions {
  project_root: string;
  /** tsconfig "paths" map: pattern -> candidates (relative to baseUrl). */
  paths?: Record<string, string[]>;
  /** Set of file paths known to exist in the index (relative to project_root). */
  known_files: Set<string>;
}

/**
 * Resolve an import spec (e.g. "./foo", "../bar/baz", "@app/mod") declared in
 * `from_file` (project-relative path) and return the matching project-relative
 * file path, or null if nothing matches.
 */
export function resolveTsImport(
  from_file: string,
  spec: string,
  opts: TsResolverOptions,
): string | null {
  if (spec.startsWith('.')) {
    const dir = path.posix.dirname(from_file);
    const joined = path.posix.normalize(path.posix.join(dir, spec));
    return tryCandidates(joined, opts.known_files);
  }
  if (path.posix.isAbsolute(spec)) {
    return tryCandidates(spec.replace(/^\/+/, ''), opts.known_files);
  }
  // Path-mapped imports.
  if (opts.paths) {
    for (const [pattern, candidates] of Object.entries(opts.paths)) {
      const star = pattern.indexOf('*');
      if (star < 0) {
        if (spec === pattern) {
          for (const c of candidates) {
            const r = tryCandidates(c.replace(/\*/g, ''), opts.known_files);
            if (r) return r;
          }
        }
      } else {
        const prefix = pattern.slice(0, star);
        const suffix = pattern.slice(star + 1);
        if (spec.startsWith(prefix) && spec.endsWith(suffix)) {
          const captured = spec.slice(prefix.length, spec.length - suffix.length);
          for (const c of candidates) {
            const r = tryCandidates(c.replace('*', captured), opts.known_files);
            if (r) return r;
          }
        }
      }
    }
  }
  return null;
}

function tryCandidates(stem: string, known: Set<string>): string | null {
  // Try exact stem first (caller may already include extension).
  if (known.has(stem)) return stem;
  for (const ext of TS_EXTS) {
    const candidate = stem + ext;
    if (known.has(candidate)) return candidate;
  }
  // index.* fallbacks.
  for (const ext of TS_EXTS) {
    const candidate = path.posix.join(stem, 'index' + ext);
    if (known.has(candidate)) return candidate;
  }
  // Strip a trailing .js extension (NodeNext convention) and retry against TS sources.
  if (stem.endsWith('.js')) {
    const base = stem.slice(0, -3);
    for (const ext of ['.ts', '.tsx']) {
      const candidate = base + ext;
      if (known.has(candidate)) return candidate;
    }
  }
  return null;
}
