/**
 * Python version compatibility matrix builder.
 *
 * Given a list of HealthSignals, extracts python_requires constraints from
 * PyPI dependencies and determines which Python versions satisfy ALL constraints
 * simultaneously.
 */

import type { HealthSignal } from '../dependency-auditor/types.js';
import type { CompatMatrixResult } from './types.js';

// ─── Candidate Python versions to test ───────────────────────────────────────

const CANDIDATE_VERSIONS = ['3.8', '3.9', '3.10', '3.11', '3.12', '3.13'];

// ─── Version parsing ─────────────────────────────────────────────────────────

function parseVersionTuple(v: string): [number, number] {
  // Remove leading non-numeric characters (e.g. '^', '~=')
  const cleaned = v.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0];
}

function cmp(a: [number, number], b: [number, number]): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

// ─── Single constraint satisfaction ──────────────────────────────────────────

interface Bound {
  op: '>=' | '>' | '<=' | '<' | '==' | '!=';
  ver: [number, number];
}

function parseSingleConstraint(constraint: string): Bound | null {
  const m = constraint.trim().match(/^(>=|<=|!=|==|~=|>|<)\s*(\d[\d.]*)$/);
  if (!m) return null;
  let op = m[1] as Bound['op'];
  const ver = parseVersionTuple(m[2]);
  // ~=X.Y means >=X.Y (compatible release — handled at a higher level)
  if (op === ('~=' as string)) op = '>=';
  return { op, ver };
}

function satisfiesBound(candidate: [number, number], bound: Bound): boolean {
  const c = cmp(candidate, bound.ver);
  switch (bound.op) {
    case '>=': return c >= 0;
    case '>':  return c > 0;
    case '<=': return c <= 0;
    case '<':  return c < 0;
    case '==': return c === 0;
    case '!=': return c !== 0;
  }
}

/**
 * Expand a `~=X.Y` compatible-release constraint into lower+upper bounds:
 * `~=3.9` → `>=3.9,<4`
 * `~=3.9.1` → treated as `>=3.9` for our minor-version granularity
 */
function expandCompatibleRelease(ver: string): string {
  const parts = ver.replace(/[^0-9.]/g, '').split('.').map(Number);
  const major = parts[0] ?? 0;
  const minor = parts[1] ?? 0;
  if (parts.length >= 2) {
    return `>=${major}.${minor},<${major + 1}`;
  }
  return `>=${major}`;
}

/** Returns true if the candidate Python version satisfies the full constraint string. */
function satisfiesConstraint(candidate: string, constraint: string): boolean {
  const candidateTuple = parseVersionTuple(candidate);

  // Expand ~= before splitting
  const expanded = constraint.includes('~=')
    ? constraint.replace(/~=\s*(\d[\d.]*)/g, (_, v) => expandCompatibleRelease(v))
    : constraint;

  // Split compound constraints by comma
  const parts = expanded.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const bound = parseSingleConstraint(part);
    if (!bound) continue; // skip unparseable parts (e.g. "python_requires" keyword)
    if (!satisfiesBound(candidateTuple, bound)) return false;
  }
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Build a Python version compatibility matrix from a list of HealthSignals.
 *
 * Filters to PyPI dependencies, reads `python_requires` from
 * `registryHealth._meta.pythonRequires`, and intersects all constraints
 * against the candidate Python version set.
 */
export function buildCompatMatrix(signals: HealthSignal[]): CompatMatrixResult {
  const constraintsByDep: Record<string, string> = {};

  for (const signal of signals) {
    if (signal.dependency.ecosystem !== 'pypi') continue;
    const meta = (signal.registryHealth as RegistryHealth & { _meta?: Record<string, unknown> })._meta;
    const req = meta?.['pythonRequires'];
    if (typeof req === 'string' && req.trim()) {
      constraintsByDep[signal.dependency.name] = req.trim();
    }
  }

  // No constraints → all versions compatible
  if (Object.keys(constraintsByDep).length === 0) {
    return {
      compatibleVersions: [...CANDIDATE_VERSIONS],
      constraintsByDep,
      hasConflict: false,
      conflictExplanation: null,
    };
  }

  // Intersect: a version is compatible only if it satisfies ALL constraints
  const compatible = CANDIDATE_VERSIONS.filter((pyVersion) =>
    Object.values(constraintsByDep).every((constraint) =>
      satisfiesConstraint(pyVersion, constraint),
    ),
  );

  const hasConflict = compatible.length === 0;
  const conflictExplanation = hasConflict
    ? `No Python version in [${CANDIDATE_VERSIONS.join(', ')}] satisfies all constraints: ${Object.entries(constraintsByDep)
        .map(([dep, req]) => `${dep} (${req})`)
        .join(', ')}`
    : null;

  return { compatibleVersions: compatible, constraintsByDep, hasConflict, conflictExplanation };
}

/** Class wrapper for composability with DiagnosticsOrchestrator. */
export class PythonCompatMatrix {
  build(signals: HealthSignal[]): CompatMatrixResult {
    return buildCompatMatrix(signals);
  }
}

// Internal type import
import type { RegistryHealth } from '../dependency-auditor/types.js';
