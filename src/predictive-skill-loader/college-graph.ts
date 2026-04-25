/**
 * Predictive Skill Loader — College-of-Knowledge graph loader.
 *
 * Loads concept .ts files under .college/departments/{dept}/concepts/{concept}.ts
 * (read-only) and builds an adjacency map suitable for the GNN link-formation
 * predictor. Concept files export a `RosettaConcept` with `id`, `domain`, and
 * `relationships[].targetId` — those edges become the social-learning-network
 * edges per arXiv:2604.18888.
 *
 * Loader is text-based (regex over the source) so we do **not** invoke the
 * concept TS files at runtime. This keeps the loader leaf-pure: no dynamic
 * imports, no side effects on the College tree, no orchestration touch.
 *
 * @module predictive-skill-loader/college-graph
 */

import fs from 'node:fs';
import path from 'node:path';

import type { CollegeGraph } from './types.js';

export interface CollegeGraphLoadOptions {
  /** Override the project root used to locate `.college/`. */
  collegeRoot?: string;
  /** Default edge weight when none is encoded. Default 1. */
  defaultEdgeWeight?: number;
  /** When true, fold a synthetic adjacency from arrays passed by callers. */
  inMemoryConcepts?: ReadonlyArray<InMemoryConcept>;
}

export interface InMemoryConcept {
  id: string;
  domain: string;
  relationships?: ReadonlyArray<{ targetId: string; weight?: number }>;
}

const ID_RE = /id:\s*['"]([^'"]+)['"]/;
const DOMAIN_RE = /domain:\s*['"]([^'"]+)['"]/;
const TARGET_RE = /targetId:\s*['"]([^'"]+)['"]/g;

function projectRoot(): string {
  const envRoot = process.env.GSD_SKILL_CREATOR_CONFIG_ROOT;
  if (envRoot && envRoot.length > 0) return envRoot;
  return process.cwd();
}

function defaultCollegeRoot(): string {
  return path.join(projectRoot(), '.college');
}

interface ConceptRecord {
  id: string;
  domain: string;
  targets: string[];
}

function parseConceptFile(absPath: string): ConceptRecord | null {
  let text: string;
  try {
    text = fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
  const idMatch = ID_RE.exec(text);
  if (!idMatch) return null;
  const domainMatch = DOMAIN_RE.exec(text);
  const targets: string[] = [];
  let m: RegExpExecArray | null;
  TARGET_RE.lastIndex = 0;
  while ((m = TARGET_RE.exec(text)) !== null) {
    if (m[1]) targets.push(m[1]);
  }
  return {
    id: idMatch[1] ?? '',
    domain: domainMatch?.[1] ?? 'unknown',
    targets,
  };
}

function walkConceptFiles(deptRoot: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(deptRoot)) return out;
  const stack: string[] = [deptRoot];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        stack.push(p);
      } else if (
        e.isFile() &&
        e.name.endsWith('.ts') &&
        !e.name.endsWith('.test.ts') &&
        !e.name.endsWith('-department.ts') &&
        e.name !== 'index.ts'
      ) {
        out.push(p);
      }
    }
  }
  out.sort();
  return out;
}

/**
 * Load the College-of-Knowledge graph. When `inMemoryConcepts` are passed,
 * uses them verbatim and skips disk IO (test ergonomics + fixtures).
 */
export function loadCollegeGraph(opts: CollegeGraphLoadOptions = {}): CollegeGraph {
  const defaultWeight = opts.defaultEdgeWeight ?? 1;
  const adjacency = new Map<string, Array<readonly [string, number]>>();
  const domains = new Map<string, string>();
  const nodeSet = new Set<string>();

  if (opts.inMemoryConcepts && opts.inMemoryConcepts.length > 0) {
    for (const c of opts.inMemoryConcepts) {
      nodeSet.add(c.id);
      domains.set(c.id, c.domain);
      const edges = (c.relationships ?? []).map(
        (r) => [r.targetId, r.weight ?? defaultWeight] as const,
      );
      adjacency.set(c.id, edges);
      for (const r of c.relationships ?? []) {
        nodeSet.add(r.targetId);
        if (!domains.has(r.targetId)) domains.set(r.targetId, 'unknown');
      }
    }
  } else {
    const collegeRoot = opts.collegeRoot ?? defaultCollegeRoot();
    const deptRoot = path.join(collegeRoot, 'departments');
    const files = walkConceptFiles(deptRoot);
    for (const f of files) {
      const rec = parseConceptFile(f);
      if (!rec || !rec.id) continue;
      nodeSet.add(rec.id);
      domains.set(rec.id, rec.domain);
      const edges: Array<readonly [string, number]> = rec.targets.map(
        (t) => [t, defaultWeight] as const,
      );
      // Merge if file appears twice (concepts can be referenced from multiple
      // dept indexes in tests); take the first set of edges + add new targets.
      const existing = adjacency.get(rec.id);
      if (existing) {
        const existingTargets = new Set(existing.map(([t]) => t));
        for (const e of edges) {
          if (!existingTargets.has(e[0])) existing.push(e);
        }
      } else {
        adjacency.set(rec.id, edges);
      }
      for (const t of rec.targets) {
        nodeSet.add(t);
        if (!domains.has(t)) domains.set(t, 'unknown');
      }
    }
  }

  // Backfill empty adjacency for orphan-target nodes so getNeighbors() never
  // throws — they simply have an empty neighbor list.
  for (const id of nodeSet) {
    if (!adjacency.has(id)) adjacency.set(id, []);
  }

  const nodes = Array.from(nodeSet).sort();
  return {
    nodes,
    adjacency,
    domains,
  };
}

/**
 * Multi-hop neighbor query. Returns nodeIds reachable within `depth` hops
 * (depth 1 = direct neighbors). The starting node is excluded from the
 * result. Each entry carries the minimum-hop distance at which it was
 * encountered (BFS) and the path-product edge weight.
 */
export function getNeighbors(
  graph: CollegeGraph,
  node: string,
  depth: number,
): Array<{ id: string; hopDepth: number; weight: number }> {
  if (depth <= 0) return [];
  if (!graph.adjacency.has(node)) return [];
  // BFS up to `depth` hops, deterministic order.
  const seen = new Map<string, { hopDepth: number; weight: number }>();
  let frontier: Array<{ id: string; weight: number }> = [{ id: node, weight: 1 }];
  seen.set(node, { hopDepth: 0, weight: 1 });
  for (let h = 1; h <= depth; h++) {
    const next: Array<{ id: string; weight: number }> = [];
    for (const f of frontier) {
      const adj = graph.adjacency.get(f.id) ?? [];
      // Sort adjacency for deterministic traversal.
      const sorted = [...adj].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      for (const [target, w] of sorted) {
        const composite = f.weight * w;
        const prior = seen.get(target);
        if (prior === undefined) {
          seen.set(target, { hopDepth: h, weight: composite });
          next.push({ id: target, weight: composite });
        } else if (prior.hopDepth === h && composite > prior.weight) {
          // Same-hop: keep the higher-weight path.
          seen.set(target, { hopDepth: h, weight: composite });
        }
      }
    }
    frontier = next;
    if (frontier.length === 0) break;
  }
  // Drop the seed.
  seen.delete(node);
  return Array.from(seen.entries())
    .map(([id, v]) => ({ id, hopDepth: v.hopDepth, weight: v.weight }))
    .sort((a, b) => {
      if (a.hopDepth !== b.hopDepth) return a.hopDepth - b.hopDepth;
      if (b.weight !== a.weight) return b.weight - a.weight;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
}
