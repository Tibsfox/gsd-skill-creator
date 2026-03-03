/**
 * Cross-dependency conflict detector.
 *
 * Uses static version range analysis to detect when two dependencies
 * (same name, same ecosystem) declare incompatible version ranges.
 * Best-effort: false negatives are acceptable; false positives are not.
 */

import type { DependencyRecord, Ecosystem } from '../dependency-auditor/types.js';
import type { ConflictFinding } from './types.js';
export type { ConflictFinding };

// ─── Version parsing helpers ──────────────────────────────────────────────────

type VersionTuple = [number, number, number];
type Bound = { op: '>=' | '>' | '<' | '<=' | '==' | '!='; ver: VersionTuple } | null;

function parseVersionTuple(v: string): VersionTuple {
  const cleaned = v.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function cmpTuples(a: VersionTuple, b: VersionTuple): number {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

// ─── Range expansion ─────────────────────────────────────────────────────────

interface VersionRange {
  lower: VersionTuple;  // inclusive lower bound
  upper: VersionTuple;  // exclusive upper bound (infinity = [Infinity, 0, 0])
  hasUpper: boolean;
  exact: VersionTuple | null; // set for exact version matches
}

const INF: VersionTuple = [Infinity, 0, 0];

function expandRange(version: string): VersionRange | null {
  const v = version.trim();

  // Exact version: "1.0.0", "2.0", "1"
  if (/^\d[\d.]*$/.test(v)) {
    const exact = parseVersionTuple(v);
    return { lower: exact, upper: exact, hasUpper: true, exact };
  }

  // Caret: ^major.minor.patch → >=major.minor.patch, <(major+1).0.0
  const caretMatch = v.match(/^\^(\d[\d.]*)$/);
  if (caretMatch) {
    const parts = caretMatch[1].split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    const patch = parts[2] ?? 0;
    const lower: VersionTuple = [major, minor, patch];
    let upper: VersionTuple;
    if (major > 0) {
      upper = [major + 1, 0, 0];
    } else if (minor > 0) {
      upper = [0, minor + 1, 0];
    } else {
      upper = [0, 0, patch + 1];
    }
    return { lower, upper, hasUpper: true, exact: null };
  }

  // Tilde: ~major.minor.patch → >=major.minor.patch, <major.(minor+1).0
  const tildeMatch = v.match(/^~(\d[\d.]*)$/);
  if (tildeMatch) {
    const parts = tildeMatch[1].split('.').map(Number);
    const major = parts[0] ?? 0;
    const minor = parts[1] ?? 0;
    const patch = parts[2] ?? 0;
    const lower: VersionTuple = [major, minor, patch];
    const upper: VersionTuple = [major, minor + 1, 0];
    return { lower, upper, hasUpper: true, exact: null };
  }

  // Compound: parse >=, >, <=, <, ==, != with optional commas
  const parts = v.split(',').map((p) => p.trim()).filter(Boolean);
  let lower: VersionTuple = [0, 0, 0];
  let upper: VersionTuple = INF;
  let hasUpper = false;
  let exact: VersionTuple | null = null;

  for (const part of parts) {
    const m = part.match(/^(>=|<=|!=|==|~=|>|<)\s*(\d[\d.]*)$/);
    if (!m) continue;
    const op = m[1];
    const ver = parseVersionTuple(m[2]);

    if (op === '==' || op === '~=') {
      exact = ver;
      lower = ver;
      upper = ver;
      hasUpper = true;
    } else if (op === '>=') {
      if (cmpTuples(ver, lower) > 0) lower = ver;
    } else if (op === '>') {
      const next: VersionTuple = [ver[0], ver[1], ver[2] + 1];
      if (cmpTuples(next, lower) > 0) lower = next;
    } else if (op === '<') {
      if (!hasUpper || cmpTuples(ver, upper) < 0) { upper = ver; hasUpper = true; }
    } else if (op === '<=') {
      const next: VersionTuple = [ver[0], ver[1], ver[2] + 1];
      if (!hasUpper || cmpTuples(next, upper) < 0) { upper = next; hasUpper = true; }
    }
    // != is tricky — skip for false-positive safety
  }

  return { lower, upper: hasUpper ? upper : INF, hasUpper, exact };
}

// ─── Intersection test ────────────────────────────────────────────────────────

/**
 * Returns true if the two version ranges have no possible intersection.
 * Conservative: only reports conflict when clearly incompatible.
 */
function rangesConflict(a: VersionRange, b: VersionRange): boolean {
  // Both exact — conflict only if different
  if (a.exact && b.exact) {
    return cmpTuples(a.exact, b.exact) !== 0;
  }

  // One exact — check if it falls within the other range
  if (a.exact) {
    const inLower = cmpTuples(a.exact, b.lower) >= 0;
    const inUpper = !b.hasUpper || cmpTuples(a.exact, b.upper) < 0;
    return !(inLower && inUpper);
  }
  if (b.exact) {
    const inLower = cmpTuples(b.exact, a.lower) >= 0;
    const inUpper = !a.hasUpper || cmpTuples(b.exact, a.upper) < 0;
    return !(inLower && inUpper);
  }

  // Both ranges: check if max(lower) >= min(upper) — no overlap
  const maxLower = cmpTuples(a.lower, b.lower) >= 0 ? a.lower : b.lower;

  // Only report conflict if BOTH have upper bounds and they clearly don't overlap
  if (!a.hasUpper || !b.hasUpper) {
    // One or both are unbounded above — check if the lower bounds conflict
    // e.g. a.upper=3.0.0 and b.lower=4.0.0 → conflict
    if (a.hasUpper && cmpTuples(b.lower, a.upper) >= 0) return true;
    if (b.hasUpper && cmpTuples(a.lower, b.upper) >= 0) return true;
    return false;
  }

  const minUpper = cmpTuples(a.upper, b.upper) <= 0 ? a.upper : b.upper;
  return cmpTuples(maxLower, minUpper) >= 0;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class ConflictDetector {
  detectConflicts(deps: DependencyRecord[]): ConflictFinding[] {
    return detectConflicts(deps);
  }
}

export function detectConflicts(deps: DependencyRecord[]): ConflictFinding[] {
  const findings: ConflictFinding[] = [];

  // Group by ecosystem + name
  const groups = new Map<string, DependencyRecord[]>();
  for (const dep of deps) {
    const key = `${dep.ecosystem}:${dep.name}`;
    const group = groups.get(key) ?? [];
    group.push(dep);
    groups.set(key, group);
  }

  for (const [, group] of groups) {
    if (group.length < 2) continue;

    // Check all pairs within the group
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const depA = group[i];
        const depB = group[j];

        // Same exact version string → no conflict
        if (depA.version === depB.version) continue;

        const rangeA = expandRange(depA.version);
        const rangeB = expandRange(depB.version);

        // If we can't parse either range, skip (false-positive safety)
        if (!rangeA || !rangeB) continue;

        if (rangesConflict(rangeA, rangeB)) {
          findings.push({
            packageA: depA.name,
            packageB: depB.name,
            ecosystem: depA.ecosystem as Ecosystem,
            rangeA: depA.version,
            rangeB: depB.version,
            explanation: `${depA.name}@${depA.version} and ${depB.name}@${depB.version} declare incompatible version constraints`,
          });
        }
      }
    }
  }

  return findings;
}
