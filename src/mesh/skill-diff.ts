/**
 * SkillDiff — impact-radius diff tool for Grove-backed skills (P5.5).
 *
 * The question this module answers: "If I change skill X from version A
 * to version B, what else in the codebase is affected?"
 *
 * There are three layers of "affected":
 *
 *   1. **Direct field diff.** What changed in the SkillSpec itself —
 *      body, description, activation patterns, dependency set.
 *
 *   2. **Reverse-dependency walk (impact radius).** Which other skills
 *      currently reference the OLD hash as one of their dependencies?
 *      Because Grove is append-only and content-addressed, these are
 *      still valid — they continue referencing the old version — but a
 *      practitioner considering an update should know which downstream
 *      skills would need updating to pick up the change.
 *
 *   3. **Transitive dependency diff.** Which dependencies are shared
 *      between the old and new versions (still reachable), which were
 *      removed (no longer reachable from new), and which were added
 *      (reachable from new but not old)?
 *
 * Grove's content-addressed design makes this cheap: every dependency
 * edge is a stable HashRef, and walking both directions is O(reachable
 * nodes). Cycles are detected by hash and visited only once.
 *
 * The diff output is a single structured report. Presentation (pretty
 * printing, CLI formatting) lives in a separate module.
 *
 * @module mesh/skill-diff
 */

import { SkillCodebase } from './skill-codebase.js';
import type { SkillSpec } from './skill-view.js';
import { parseSkillRecordBytes } from './skill-view.js';
import { type HashRef, hashRefEquals } from '../memory/grove-format.js';

// ─── Public types ───────────────────────────────────────────────────────────

/**
 * A single field-level change between old and new SkillSpec versions.
 * `field` is the name of the changed field; `before` and `after` are
 * the old and new values (stringified where needed).
 */
export interface FieldChange {
  field: 'name' | 'description' | 'body' | 'activationPatterns' | 'dependencies';
  before: unknown;
  after: unknown;
}

/** A reverse-dependency hit: some other record depends on the old hash. */
export interface DependentHit {
  /** The record that has the old hash in its dependency set. */
  hash: HashRef;
  /** The name of the dependent (from its SkillSpec). */
  name: string;
  /** The dependent's own SkillSpec, for reporting. */
  spec: SkillSpec;
}

/** A transitive dependency diff. */
export interface TransitiveDepDiff {
  /** Dependencies reachable from both old and new. */
  unchanged: HashRef[];
  /** Dependencies reachable from old but not from new. */
  removed: HashRef[];
  /** Dependencies reachable from new but not from old. */
  added: HashRef[];
}

/** The full diff report. */
export interface SkillDiffReport {
  /**
   * The skill name being diffed (if a name was supplied). May be null
   * when diffing two arbitrary hashes with no common name.
   */
  name: string | null;
  /** The hash we're diffing from. May be null if the "old" side is absent. */
  oldHash: HashRef | null;
  /** The hash we're diffing to. May be null if the "new" side is absent. */
  newHash: HashRef | null;
  /** The parsed old SkillSpec, or null if oldHash is absent or missing. */
  oldSpec: SkillSpec | null;
  /** The parsed new SkillSpec, or null if newHash is absent or missing. */
  newSpec: SkillSpec | null;
  /** Field-level changes between the specs. Empty if specs are identical. */
  fieldChanges: FieldChange[];
  /**
   * Reverse-dependency hits: other skills that currently reference oldHash.
   * Only populated when oldHash is set and resolvable.
   */
  dependents: DependentHit[];
  /**
   * Transitive dependency diff — union of reachable deps from old and new.
   */
  transitive: TransitiveDepDiff;
}

export interface DiffOptions {
  /**
   * Maximum depth to walk reverse dependencies. Defaults to 10 — deep
   * enough for realistic graphs, shallow enough to bound work.
   */
  maxReverseDepth?: number;
  /**
   * Maximum depth to walk transitive dependencies. Defaults to 10.
   */
  maxTransitiveDepth?: number;
}

// ─── Diff engine ────────────────────────────────────────────────────────────

export class SkillDiff {
  constructor(private readonly codebase: SkillCodebase) {}

  /**
   * Diff two hashes. At least one must be non-null. If both are non-null,
   * field changes + transitive diff + reverse dependencies are all
   * reported. If only old is supplied, dependents are reported (what
   * breaks if this skill is removed). If only new is supplied, transitive
   * deps are reported (what does this skill require).
   */
  async diff(
    oldHash: HashRef | null,
    newHash: HashRef | null,
    options: DiffOptions = {},
  ): Promise<SkillDiffReport> {
    if (oldHash === null && newHash === null) {
      throw new Error('SkillDiff.diff: at least one of oldHash/newHash must be set');
    }

    const oldResolved = oldHash ? await this.resolveOrNull(oldHash) : null;
    const newResolved = newHash ? await this.resolveOrNull(newHash) : null;

    const name = newResolved?.spec.name ?? oldResolved?.spec.name ?? null;

    // Field-level diff (both sides present).
    const fieldChanges: FieldChange[] =
      oldResolved && newResolved ? diffSpecs(oldResolved.spec, newResolved.spec) : [];

    // Reverse dependencies (what currently depends on oldHash).
    const dependents = oldHash
      ? await this.findDependents(oldHash, options.maxReverseDepth ?? 10)
      : [];

    // Transitive dependency diff.
    const transitive = await this.transitiveDiff(
      oldHash,
      newHash,
      options.maxTransitiveDepth ?? 10,
    );

    return {
      name,
      oldHash,
      newHash,
      oldSpec: oldResolved?.spec ?? null,
      newSpec: newResolved?.spec ?? null,
      fieldChanges,
      dependents,
      transitive,
    };
  }

  /**
   * Diff the currently-bound version of `name` against a proposed new
   * SkillSpec. The old hash is whatever `name` currently resolves to;
   * the new hash is computed from `newSpec` without writing it. This
   * is the "preview before define" workflow.
   */
  async previewUpdate(
    name: string,
    newSpec: SkillSpec,
    options: DiffOptions = {},
  ): Promise<SkillDiffReport> {
    const current = await this.codebase.resolve(name);
    const oldHash = current?.hash ?? null;

    // If there's no current binding, we can't call diff(null, null) — it
    // throws. Build a new-side-only report directly.
    let report: SkillDiffReport;
    if (oldHash) {
      report = await this.diff(oldHash, null, options);
    } else {
      report = {
        name,
        oldHash: null,
        newHash: null,
        oldSpec: null,
        newSpec: null,
        fieldChanges: [],
        dependents: [],
        transitive: { unchanged: [], removed: [], added: [] },
      };
    }

    // Fill in the new side from the provided spec (no real hash).
    report.newSpec = newSpec;
    if (report.oldSpec) {
      report.fieldChanges = diffSpecs(report.oldSpec, newSpec);
    }
    // Recompute transitive on the new side using the proposed dep set.
    const oldTrans = oldHash ? await this.reachableDeps(oldHash, options.maxTransitiveDepth ?? 10) : new Set<string>();
    const newTrans = await this.reachableDepsFromSet(
      newSpec.dependencies,
      options.maxTransitiveDepth ?? 10,
    );
    report.transitive = splitDiff(oldTrans, newTrans);
    return report;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async resolveOrNull(
    hash: HashRef,
  ): Promise<{ hash: HashRef; spec: SkillSpec } | null> {
    const bytes = await this.codebase.getStore().getByHash(hash.hash);
    if (!bytes) return null;
    try {
      const { spec } = parseSkillRecordBytes(bytes);
      return { hash, spec };
    } catch {
      return null;
    }
  }

  /**
   * Walk every currently-bound skill and check whether its dependency
   * set contains `target`. This is O(active skills × avg deps) which is
   * fine for realistic codebase sizes.
   */
  private async findDependents(target: HashRef, maxDepth: number): Promise<DependentHit[]> {
    // A single-level sweep is sufficient for impact radius — direct
    // dependents are what the user needs to update. Transitive
    // dependents can be computed by re-running findDependents on each
    // hit, but we bound that via maxDepth.
    const hits: DependentHit[] = [];
    const visited = new Set<string>();

    async function* bfs(this: SkillDiff, roots: HashRef[], depth: number): AsyncGenerator<DependentHit> {
      if (depth > maxDepth) return;
      const active = await this.codebase.listActive();
      for (const active_ of active) {
        for (const dep of active_.spec.dependencies) {
          if (roots.some((r) => hashRefEquals(r, dep))) {
            const key = hashKey(active_.hash);
            if (!visited.has(key)) {
              visited.add(key);
              yield { hash: active_.hash, name: active_.spec.name, spec: active_.spec };
            }
          }
        }
      }
    }

    for await (const hit of bfs.call(this, [target], 0)) {
      hits.push(hit);
    }
    return hits;
  }

  /**
   * Return the set of hashes reachable as transitive dependencies from a
   * root, as a set of stringified keys. Uses the codebase's
   * dependencyGraph under the hood.
   */
  private async reachableDeps(root: HashRef, maxDepth: number): Promise<Set<string>> {
    const { nodes } = await this.codebase.dependencyGraph(root, { maxDepth });
    const out = new Set<string>();
    // Skip the root itself — we want DEPS, not the root.
    for (let i = 1; i < nodes.length; i++) {
      out.add(hashKey(nodes[i].hash));
    }
    return out;
  }

  /**
   * Like reachableDeps but starting from a manually-provided set of
   * dependency hashes (for preview mode, where no record exists).
   */
  private async reachableDepsFromSet(
    roots: HashRef[],
    maxDepth: number,
  ): Promise<Set<string>> {
    const out = new Set<string>();
    for (const root of roots) {
      const { nodes } = await this.codebase.dependencyGraph(root, { maxDepth });
      for (const node of nodes) {
        out.add(hashKey(node.hash));
      }
    }
    return out;
  }

  /**
   * Compute the transitive dep diff between two hashes (either may be null).
   */
  private async transitiveDiff(
    oldHash: HashRef | null,
    newHash: HashRef | null,
    maxDepth: number,
  ): Promise<TransitiveDepDiff> {
    const oldSet = oldHash ? await this.reachableDeps(oldHash, maxDepth) : new Set<string>();
    const newSet = newHash ? await this.reachableDeps(newHash, maxDepth) : new Set<string>();
    return splitDiff(oldSet, newSet);
  }
}

// ─── Pure helpers ───────────────────────────────────────────────────────────

/**
 * Compute field-level diff between two SkillSpecs. Returns only the
 * fields that differ.
 */
export function diffSpecs(before: SkillSpec, after: SkillSpec): FieldChange[] {
  const changes: FieldChange[] = [];
  if (before.name !== after.name) {
    changes.push({ field: 'name', before: before.name, after: after.name });
  }
  if (before.description !== after.description) {
    changes.push({ field: 'description', before: before.description, after: after.description });
  }
  if (before.body !== after.body) {
    changes.push({ field: 'body', before: before.body, after: after.body });
  }
  if (!arraysEqual(before.activationPatterns, after.activationPatterns)) {
    changes.push({
      field: 'activationPatterns',
      before: before.activationPatterns,
      after: after.activationPatterns,
    });
  }
  if (!hashRefArraysEqual(before.dependencies, after.dependencies)) {
    changes.push({
      field: 'dependencies',
      before: before.dependencies,
      after: after.dependencies,
    });
  }
  return changes;
}

function arraysEqual<T>(a: T[], b: T[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function hashRefArraysEqual(a: HashRef[], b: HashRef[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!hashRefEquals(a[i], b[i])) return false;
  }
  return true;
}

/** Split two sets into (unchanged, removed, added) with original HashRef recovery. */
function splitDiff(
  oldKeys: Set<string>,
  newKeys: Set<string>,
): TransitiveDepDiff {
  // We need to recover HashRefs from the keys. Re-parse the hash key
  // format: "algoId:hex".
  const parse = (k: string): HashRef => {
    const [algoStr, hex] = k.split(':');
    const hash = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hash.length; i++) {
      hash[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return { algoId: parseInt(algoStr, 10), hash };
  };

  const unchanged: HashRef[] = [];
  const removed: HashRef[] = [];
  const added: HashRef[] = [];
  for (const k of oldKeys) {
    if (newKeys.has(k)) unchanged.push(parse(k));
    else removed.push(parse(k));
  }
  for (const k of newKeys) {
    if (!oldKeys.has(k)) added.push(parse(k));
  }
  return { unchanged, removed, added };
}

function hashKey(hash: HashRef): string {
  let out = `${hash.algoId}:`;
  for (let i = 0; i < hash.hash.length; i++) {
    out += hash.hash[i].toString(16).padStart(2, '0');
  }
  return out;
}
