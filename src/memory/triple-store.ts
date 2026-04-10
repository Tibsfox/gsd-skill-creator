/**
 * Semantic triple extraction from Grove records.
 *
 * Extracts (subject, predicate, object) triples from grove record payloads,
 * linking each triple back to its source chunk hash. This enables Memori-style
 * fact→source linkage: you can retrieve a fact and trace it back to the exact
 * record it was derived from.
 *
 * Triples are extracted structurally (from SKILL.md/AGENT.md metadata fields)
 * rather than via NLP. This makes extraction deterministic and free of LLM calls.
 *
 * # Triple model
 *
 *   (subject, predicate, object, sourceHash)
 *
 *   "vision-to-mission"  "hasType"        "skill"           → hash_abc
 *   "vision-to-mission"  "hasDescription" "Transform a..."  → hash_abc
 *   "vision-to-mission"  "belongsToWing"  "skills"          → hash_abc
 *   "sc-dev-team"        "hasMember"      "flight-ops"      → hash_def
 *
 * @module memory/triple-store
 */

import type { HashRef } from './grove-format.js';

// ─── Types ──────────────────────────────────────────────────────────────────

/** A semantic triple with source linkage. */
export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  /** Hash of the grove record this triple was extracted from. */
  sourceHash: Uint8Array;
  /** Confidence: 1.0 for structural extraction, lower for inferred. */
  confidence: number;
}

/** Result of a triple query. */
export interface TripleQueryResult {
  triples: Triple[];
  /** Number of source records consulted. */
  sourcesScanned: number;
}

/** Options for triple extraction. */
export interface ExtractionOptions {
  /** Include description triples (can be verbose). Default: true. */
  includeDescriptions?: boolean;
  /** Include dependency/member triples. Default: true. */
  includeDependencies?: boolean;
}

// ─── TripleStore ────────────────────────────────────────────────────────────

/**
 * In-memory triple store backed by extracted grove record facts.
 * Supports subject/predicate/object queries with source tracing.
 */
export class TripleStore {
  private readonly triples: Triple[] = [];
  private readonly bySubject = new Map<string, Triple[]>();
  private readonly byPredicate = new Map<string, Triple[]>();
  private readonly byObject = new Map<string, Triple[]>();

  /** Total number of stored triples. */
  get size(): number {
    return this.triples.length;
  }

  /** Add a triple and index it. */
  add(triple: Triple): void {
    this.triples.push(triple);
    this.indexTriple(triple);
  }

  /** Add multiple triples at once. */
  addAll(triples: Triple[]): void {
    for (const t of triples) this.add(t);
  }

  private indexTriple(t: Triple): void {
    const byS = this.bySubject.get(t.subject) ?? [];
    byS.push(t);
    this.bySubject.set(t.subject, byS);

    const byP = this.byPredicate.get(t.predicate) ?? [];
    byP.push(t);
    this.byPredicate.set(t.predicate, byP);

    const byO = this.byObject.get(t.object) ?? [];
    byO.push(t);
    this.byObject.set(t.object, byO);
  }

  // ─── Queries ────────────────────────────────────────────────────────────

  /** All triples about a given subject. */
  forSubject(subject: string): Triple[] {
    return this.bySubject.get(subject) ?? [];
  }

  /** All triples with a given predicate. */
  forPredicate(predicate: string): Triple[] {
    return this.byPredicate.get(predicate) ?? [];
  }

  /** All triples pointing to a given object. */
  forObject(object: string): Triple[] {
    return this.byObject.get(object) ?? [];
  }

  /**
   * Pattern query: match triples where each non-null field must match.
   * Pass null for wildcards.
   *
   *   query("flight-ops", "hasType", null)   → all type facts about flight-ops
   *   query(null, "belongsToWing", "agents") → all agents
   *   query(null, "hasMember", "flight-ops") → teams containing flight-ops
   */
  query(
    subject: string | null,
    predicate: string | null,
    object: string | null,
  ): Triple[] {
    // Start with the most selective index
    let candidates: Triple[];
    if (subject !== null) {
      candidates = this.bySubject.get(subject) ?? [];
    } else if (object !== null) {
      candidates = this.byObject.get(object) ?? [];
    } else if (predicate !== null) {
      candidates = this.byPredicate.get(predicate) ?? [];
    } else {
      candidates = this.triples;
    }

    return candidates.filter(t =>
      (subject === null || t.subject === subject) &&
      (predicate === null || t.predicate === predicate) &&
      (object === null || t.object === object),
    );
  }

  /**
   * Multi-hop path query: starting from `start`, follow predicates in order.
   * Returns all reachable objects at the end of the path.
   *
   *   path("sc-dev-team", ["hasMember", "hasType"])
   *     → follow hasMember from sc-dev-team to members,
   *       then follow hasType from each member → their types
   */
  path(start: string, predicates: string[]): string[] {
    let current = new Set([start]);
    for (const pred of predicates) {
      const next = new Set<string>();
      for (const subj of current) {
        for (const t of this.query(subj, pred, null)) {
          next.add(t.object);
        }
      }
      current = next;
      if (current.size === 0) break;
    }
    return Array.from(current);
  }

  /**
   * Keyword search across all triple fields.
   * Returns triples where any of subject/predicate/object contains the keyword.
   */
  search(keyword: string): Triple[] {
    const kw = keyword.toLowerCase();
    return this.triples.filter(t =>
      t.subject.toLowerCase().includes(kw) ||
      t.predicate.toLowerCase().includes(kw) ||
      t.object.toLowerCase().includes(kw),
    );
  }

  /** Distinct predicates in the store. */
  predicates(): string[] {
    return Array.from(this.byPredicate.keys()).sort();
  }

  /** Distinct subjects in the store. */
  subjects(): string[] {
    return Array.from(this.bySubject.keys()).sort();
  }
}

// ─── Extraction ─────────────────────────────────────────────────────────────

/**
 * Extract triples from a grove namespace binding + decoded payload.
 *
 * The `name` follows `wing/room` convention (e.g. `skills/vision-to-mission`).
 * The `payload` is the UTF-8 text content of the grove record (typically
 * SKILL.md or AGENT.md frontmatter + body).
 *
 * Extracted predicates:
 *   - hasType (skill, agent, team, chipset)
 *   - belongsToWing (skills, agents, teams, chipsets)
 *   - hasName (display name from metadata)
 *   - hasDescription (description field)
 *   - dependsOn (dependency links)
 *   - hasMember (team members)
 *   - activatesOn (trigger patterns)
 */
export function extractTriples(
  name: string,
  payload: string,
  sourceHash: Uint8Array,
  opts: ExtractionOptions = {},
): Triple[] {
  const includeDesc = opts.includeDescriptions ?? true;
  const includeDeps = opts.includeDependencies ?? true;

  const triples: Triple[] = [];
  const slash = name.indexOf('/');
  const wing = slash >= 0 ? name.slice(0, slash) : '_root';
  const room = slash >= 0 ? name.slice(slash + 1) : name;

  // Infer type from wing
  const typeMap: Record<string, string> = {
    skills: 'skill',
    agents: 'agent',
    teams: 'team',
    chipsets: 'chipset',
  };
  const resourceType = typeMap[wing] ?? 'resource';

  // Core structural triples (always extracted)
  triples.push({ subject: room, predicate: 'hasType', object: resourceType, sourceHash, confidence: 1.0 });
  triples.push({ subject: room, predicate: 'belongsToWing', object: wing, sourceHash, confidence: 1.0 });

  // Parse YAML frontmatter if present
  const frontmatter = parseFrontmatter(payload);
  if (frontmatter) {
    if (frontmatter.name) {
      triples.push({ subject: room, predicate: 'hasName', object: frontmatter.name, sourceHash, confidence: 1.0 });
    }
    if (includeDesc && frontmatter.description) {
      triples.push({ subject: room, predicate: 'hasDescription', object: frontmatter.description, sourceHash, confidence: 1.0 });
    }
    if (includeDeps && frontmatter.dependencies) {
      for (const dep of frontmatter.dependencies) {
        triples.push({ subject: room, predicate: 'dependsOn', object: dep, sourceHash, confidence: 1.0 });
      }
    }
    if (includeDeps && frontmatter.members) {
      for (const member of frontmatter.members) {
        triples.push({ subject: room, predicate: 'hasMember', object: member, sourceHash, confidence: 1.0 });
      }
    }
    if (frontmatter.triggers) {
      for (const trigger of frontmatter.triggers) {
        triples.push({ subject: room, predicate: 'activatesOn', object: trigger, sourceHash, confidence: 0.9 });
      }
    }
    if (frontmatter.extends) {
      triples.push({ subject: room, predicate: 'extends', object: frontmatter.extends, sourceHash, confidence: 1.0 });
    }
  }

  return triples;
}

/**
 * Minimal YAML frontmatter parser for grove records.
 * Extracts key fields without a full YAML dependency.
 */
function parseFrontmatter(text: string): Record<string, any> | null {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const lines = match[1].split('\n');
  const result: Record<string, any> = {};

  for (const line of lines) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)/);
    if (!kv) continue;
    const [, key, value] = kv;

    // Handle simple arrays: "- item" lines following an array key
    if (value.trim() === '') continue;

    // Strip quotes
    const cleaned = value.replace(/^["']|["']$/g, '').trim();

    // Handle inline arrays: [a, b, c]
    if (cleaned.startsWith('[') && cleaned.endsWith(']')) {
      result[key] = cleaned
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(Boolean);
    } else {
      result[key] = cleaned;
    }
  }

  // Parse multi-line arrays (e.g., dependencies, members)
  for (const key of ['dependencies', 'members', 'triggers']) {
    const arrayMatch = text.match(new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.+\\n?)+)`, 'm'));
    if (arrayMatch) {
      result[key] = arrayMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s+-\s+/, '').trim())
        .filter(Boolean);
    }
  }

  return result;
}
