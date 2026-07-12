/**
 * Flywheel lineage assembly — joins the full adaptive-learning flywheel into a
 * single navigable chain:
 *
 *   source → department concept → skill → activations → corrections
 *
 * Each subsystem stores its artifacts under its OWN id scheme (source ledger:
 * content-hash + provenance; college: concept ids; telemetry: skill names), so
 * there is no shared artifact-id key across the flywheel. This module makes the
 * join key EXPLICIT and honest rather than pretending it is solved:
 *
 *   JOIN-KEY STRATEGY (bounded first cut)
 *   -------------------------------------
 *   Spine = the normalized skill name. It is the only reliable cross-subsystem
 *   key, and only the DOWNSTREAM half of the flywheel actually shares it:
 *
 *     • skill → activations / corrections : telemetry keys every event by
 *       `skillName`, so this join is EXACT.
 *
 *   The UPSTREAM half (source/concept → skill) has no shared id. Those links are
 *   inferred and each carries the confidence of the inference so the output is
 *   never dishonest about what was guessed:
 *
 *     • concept → skill : EXPLICIT when a concept lists the skill in `skills`,
 *       else HEURISTIC on skill-name / concept-name token overlap.
 *     • source  → skill : EXPLICIT when a source's provenance names the skill
 *       (`extra.skill` or `label`), else HEURISTIC on a name substring match.
 *
 *   Upstream artifacts that match nothing are DROPPED, never fabricated. A full
 *   content-hash-based join-key unification across every subsystem is a
 *   follow-up (see the module tests + the capstone deferred note).
 */

// ─── Node / link model ───────────────────────────────────────────────────────

/** The five flywheel stages, upstream → downstream. */
export type FlywheelStage = 'source' | 'concept' | 'skill' | 'activation' | 'correction';

/** How confidently an upstream link was joined to the skill spine. */
export type JoinConfidence = 'exact' | 'explicit' | 'heuristic';

/** One artifact somewhere in the flywheel, normalized into a common shape. */
export interface FlywheelNode {
  stage: FlywheelStage;
  /** Subsystem-native identity, namespaced by stage (e.g. `source:<hash>`). */
  id: string;
  /** Human label for rendering. */
  label: string;
  /** Stage-specific metadata (provenance, domain, scores, counts). */
  meta: Record<string, unknown>;
}

/** A directed join between two flywheel nodes, tagged with how it was inferred. */
export interface FlywheelLink {
  from: string;
  to: string;
  /** The value the join was made on (e.g. the skill name). */
  joinKey: string;
  confidence: JoinConfidence;
}

/** The assembled chain for one skill. */
export interface FlywheelChain {
  skill: string;
  normalizedSkill: string;
  nodes: FlywheelNode[];
  links: FlywheelLink[];
  sources: FlywheelNode[];
  concepts: FlywheelNode[];
  skillNode: FlywheelNode;
  activations: FlywheelNode | null;
  corrections: FlywheelNode | null;
}

// ─── Structural inputs (decoupled from concrete subsystem types) ─────────────

/** A source-ledger row, structurally. */
export interface LedgerSourceLike {
  contentHash: string;
  provenance: {
    origin: string;
    sourceId: string;
    label?: string;
    ingestedAt?: string;
    extra?: Record<string, unknown>;
  };
}

/** A college concept, structurally. `skills` is an optional explicit back-link. */
export interface ConceptLike {
  id: string;
  name?: string;
  domain?: string;
  skills?: string[];
}

/** Per-skill telemetry, structurally (a UsagePatternDetector SkillPatternEntry). */
export interface TelemetryLike {
  skillName: string;
  sessionCount: number;
  loadCount: number;
  avgScore: number;
  loadRate: number;
  budgetSkipCount?: number;
}

/** Everything the assembler needs, already loaded by the caller. */
export interface FlywheelInput {
  skill: string;
  sources: LedgerSourceLike[];
  concepts: ConceptLike[];
  /** Per-skill telemetry entry, or undefined when telemetry is unavailable. */
  telemetry?: TelemetryLike;
  /** Whether the pattern detector flagged this skill as a correction magnet. */
  correctionMagnet?: boolean;
  /** Raw count of `skill-correction` events observed for the skill. */
  correctionCount?: number;
}

// ─── Normalization + token helpers ───────────────────────────────────────────

/** Canonical skill-name form used as the join spine. */
export function normalizeSkillName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
}

function overlapCount(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n++;
  return n;
}

// ─── Upstream match strategies ───────────────────────────────────────────────

interface MatchResult {
  matched: boolean;
  confidence: JoinConfidence;
}

const NO_MATCH: MatchResult = { matched: false, confidence: 'heuristic' };

/**
 * Concept → skill. EXPLICIT when the concept names the skill in `skills`, else
 * HEURISTIC when concept id/name tokens overlap the skill-name tokens enough
 * that at least half the skill's tokens are covered.
 */
export function conceptMatchesSkill(
  concept: ConceptLike,
  normalizedSkill: string,
  skillTokens: Set<string>,
): MatchResult {
  if (concept.skills?.some((s) => normalizeSkillName(s) === normalizedSkill)) {
    return { matched: true, confidence: 'explicit' };
  }
  if (skillTokens.size === 0) return NO_MATCH;
  const conceptTokens = tokenize(`${concept.id} ${concept.name ?? ''}`);
  const overlap = overlapCount(skillTokens, conceptTokens);
  if (overlap >= 1 && overlap / skillTokens.size >= 0.5) {
    return { matched: true, confidence: 'heuristic' };
  }
  return NO_MATCH;
}

/**
 * Source → skill. EXPLICIT when provenance names the skill (`extra.skill` or a
 * `label` equal to the skill), else HEURISTIC when the label or sourceId
 * contains the skill name (hyphen or space form) as a substring.
 */
export function sourceMatchesSkill(
  source: LedgerSourceLike,
  skill: string,
  normalizedSkill: string,
): MatchResult {
  const extraSkill = source.provenance.extra?.skill;
  if (typeof extraSkill === 'string' && normalizeSkillName(extraSkill) === normalizedSkill) {
    return { matched: true, confidence: 'explicit' };
  }
  const label = source.provenance.label;
  if (label && normalizeSkillName(label) === normalizedSkill) {
    return { matched: true, confidence: 'explicit' };
  }
  const spaceForm = normalizedSkill.replace(/-/g, ' ');
  const haystacks = [label ?? '', source.provenance.sourceId].map((h) => h.toLowerCase());
  for (const h of haystacks) {
    if (h.includes(normalizedSkill) || (spaceForm.length >= 3 && h.includes(spaceForm))) {
      return { matched: true, confidence: 'heuristic' };
    }
  }
  return NO_MATCH;
}

// ─── Assembly ────────────────────────────────────────────────────────────────

/**
 * Assemble the flywheel lineage chain for one skill from already-loaded
 * subsystem data. Pure: no I/O, deterministic given its input.
 */
export function assembleFlywheelChain(input: FlywheelInput): FlywheelChain {
  const normalizedSkill = normalizeSkillName(input.skill);
  const skillTokens = tokenize(input.skill);

  const skillNodeId = `skill:${normalizedSkill}`;
  const skillNode: FlywheelNode = {
    stage: 'skill',
    id: skillNodeId,
    label: input.skill,
    meta: {},
  };

  const nodes: FlywheelNode[] = [];
  const links: FlywheelLink[] = [];

  // ── Upstream: sources ──
  const sources: FlywheelNode[] = [];
  for (const src of input.sources) {
    const m = sourceMatchesSkill(src, input.skill, normalizedSkill);
    if (!m.matched) continue;
    const node: FlywheelNode = {
      stage: 'source',
      id: `source:${src.contentHash}`,
      label: `${src.provenance.origin}:${src.provenance.sourceId}`,
      meta: {
        contentHash: src.contentHash,
        origin: src.provenance.origin,
        sourceId: src.provenance.sourceId,
        label: src.provenance.label,
        ingestedAt: src.provenance.ingestedAt,
      },
    };
    sources.push(node);
    links.push({ from: node.id, to: skillNodeId, joinKey: normalizedSkill, confidence: m.confidence });
  }

  // ── Upstream: department concepts ──
  const concepts: FlywheelNode[] = [];
  for (const c of input.concepts) {
    const m = conceptMatchesSkill(c, normalizedSkill, skillTokens);
    if (!m.matched) continue;
    const node: FlywheelNode = {
      stage: 'concept',
      id: `concept:${c.id}`,
      label: c.name ?? c.id,
      meta: { conceptId: c.id, domain: c.domain },
    };
    concepts.push(node);
    links.push({ from: node.id, to: skillNodeId, joinKey: normalizedSkill, confidence: m.confidence });
  }

  // ── Downstream: activations (exact join on skill name) ──
  let activations: FlywheelNode | null = null;
  if (input.telemetry) {
    const t = input.telemetry;
    activations = {
      stage: 'activation',
      id: `activation:${normalizedSkill}`,
      label: `${t.loadCount} load session(s)`,
      meta: {
        sessionCount: t.sessionCount,
        loadCount: t.loadCount,
        avgScore: t.avgScore,
        loadRate: t.loadRate,
        budgetSkipCount: t.budgetSkipCount ?? 0,
      },
    };
    links.push({
      from: skillNodeId,
      to: activations.id,
      joinKey: normalizedSkill,
      confidence: 'exact',
    });
  }

  // ── Downstream: corrections (exact join on skill name) ──
  let corrections: FlywheelNode | null = null;
  const correctionCount = input.correctionCount ?? 0;
  if (correctionCount > 0 || input.correctionMagnet) {
    corrections = {
      stage: 'correction',
      id: `correction:${normalizedSkill}`,
      label: `${correctionCount} correction(s)`,
      meta: {
        correctionCount,
        correctionMagnet: input.correctionMagnet ?? false,
      },
    };
    const from = activations ? activations.id : skillNodeId;
    links.push({ from, to: corrections.id, joinKey: normalizedSkill, confidence: 'exact' });
  }

  nodes.push(...sources, ...concepts, skillNode);
  if (activations) nodes.push(activations);
  if (corrections) nodes.push(corrections);

  return {
    skill: input.skill,
    normalizedSkill,
    nodes,
    links,
    sources,
    concepts,
    skillNode,
    activations,
    corrections,
  };
}

// ─── Text rendering ──────────────────────────────────────────────────────────

const CONF_TAG: Record<JoinConfidence, string> = {
  exact: 'exact',
  explicit: 'explicit',
  heuristic: '~heuristic',
};

function confOf(chain: FlywheelChain, nodeId: string): JoinConfidence {
  const link = chain.links.find((l) => l.from === nodeId);
  return link?.confidence ?? 'heuristic';
}

/** Render an assembled chain as structured, human-readable lineage text. */
export function formatFlywheelChain(chain: FlywheelChain): string {
  const lines: string[] = [];
  lines.push(`Flywheel lineage for '${chain.skill}'`);

  lines.push(`  sources (${chain.sources.length}):`);
  if (chain.sources.length === 0) {
    lines.push('    (none joined — no source names this skill)');
  } else {
    for (const s of chain.sources) {
      lines.push(`    - [${CONF_TAG[confOf(chain, s.id)]}] ${s.meta.contentHash ? String(s.meta.contentHash).slice(0, 12) : ''}  ${s.label}`);
    }
  }

  lines.push(`  concepts (${chain.concepts.length}):`);
  if (chain.concepts.length === 0) {
    lines.push('    (none joined — no department concept maps to this skill)');
  } else {
    for (const c of chain.concepts) {
      const domain = c.meta.domain ? ` (${String(c.meta.domain)})` : '';
      lines.push(`    - [${CONF_TAG[confOf(chain, c.id)]}] ${c.label}${domain}`);
    }
  }

  lines.push(`  skill: ${chain.skill}`);

  if (chain.activations) {
    const m = chain.activations.meta;
    const pct = Math.round(Number(m.loadRate) * 100);
    lines.push(
      `  activations: ${m.loadCount} load session(s), avg score ${Number(m.avgScore).toFixed(2)}, load rate ${pct}%`,
    );
  } else {
    lines.push('  activations: (no telemetry)');
  }

  if (chain.corrections) {
    const m = chain.corrections.meta;
    const magnet = m.correctionMagnet ? ' [correction-magnet]' : '';
    lines.push(`  corrections: ${m.correctionCount}${magnet}`);
  } else {
    lines.push('  corrections: 0');
  }

  lines.push('  chain: source -> concept -> skill -> activations -> corrections');
  return lines.join('\n');
}

// ─── Sankey mapping (for the atlas visual render) ────────────────────────────

/** A Sankey node shape (structurally compatible with atlas/sankey SankeyNode). */
export interface FlywheelSankeyNode {
  id: string;
  label: string;
}

/** A Sankey link shape (structurally compatible with atlas/sankey SankeyLink). */
export interface FlywheelSankeyLink {
  source: string;
  target: string;
  value: number;
}

/**
 * Project the flywheel chain onto Sankey nodes/links for the atlas renderer.
 * Link value encodes flow magnitude: activation flow scales with load count,
 * correction flow with correction count, upstream links are unit-weight.
 */
export function flywheelToSankey(chain: FlywheelChain): {
  nodes: FlywheelSankeyNode[];
  links: FlywheelSankeyLink[];
} {
  const nodes: FlywheelSankeyNode[] = chain.nodes.map((n) => ({ id: n.id, label: n.label }));
  const links: FlywheelSankeyLink[] = chain.links.map((l) => {
    let value = 1;
    const target = chain.nodes.find((n) => n.id === l.to);
    if (target?.stage === 'activation') value = Math.max(1, Number(target.meta.loadCount) || 1);
    else if (target?.stage === 'correction') value = Math.max(1, Number(target.meta.correctionCount) || 1);
    return { source: l.from, target: l.to, value };
  });
  return { nodes, links };
}
