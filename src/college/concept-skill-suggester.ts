/**
 * Semantic concept→skill link suggester (scaffold for the deferred ML tier).
 *
 * The flywheel's concept→skill join has an EXPLICIT tier (the checked-in
 * `.college/mappings/concept-skills.json` back-link) and a low-confidence
 * token-overlap HEURISTIC tier. This is the deferred SEMANTIC tier: it embeds
 * concept and skill descriptions and proposes concept→skill links whose text
 * embeds within a cosine threshold — the substrate for growing the explicit
 * mapping.
 *
 * OPT-IN · HUMAN-GATED · INERT BY DEFAULT. The real embedder (all-MiniLM /
 * pgvector over the live corpus) is INJECTED; with no embedder there are no
 * proposals. Pedagogical-concept ↔ dev-skill similarity is noisy and
 * false-positive-prone, so this ONLY proposes ranked candidates for human
 * review — it writes NOTHING to concept-skills.json. Mirrors the semantic tier
 * of {@link ./xref-suggester.ts}.
 *
 * @module college/concept-skill-suggester
 */

/** The embedding core — injected. A real one wraps all-MiniLM/pgvector. */
export interface ConceptSkillEmbedder {
  embed(text: string): Promise<{ embedding: ReadonlyArray<number> }>;
}

export interface ConceptTextLike {
  id: string;
  name?: string;
  description?: string;
  domain?: string;
}

export interface SkillTextLike {
  name: string;
  description?: string;
}

/** A proposed concept→skill link. Human-review only — nothing is written. */
export interface ConceptSkillCandidate {
  conceptId: string;
  skill: string;
  /** Cosine similarity of the concept/skill description embeddings, [0,1]. */
  similarity: number;
  conceptDomain?: string;
}

export interface ConceptSkillSuggestOptions {
  /** Minimum cosine to propose a link. Default 0.8 (conservative). */
  similarityThreshold?: number;
  /** Cap proposals per concept (highest-similarity kept). */
  maxPerConcept?: number;
}

/** Dedup key for an existing concept→skill pair. */
export function conceptSkillPairKey(conceptId: string, skill: string): string {
  return `${normalize(conceptId)}\x00${normalize(skill)}`;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[\s_]+/g, '-');
}

function conceptText(c: ConceptTextLike): string {
  return [c.name, c.description, c.domain].filter(Boolean).join('. ').trim();
}

function skillText(s: SkillTextLike): string {
  return [s.name, s.description].filter(Boolean).join('. ').trim();
}

function cosine(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Propose concept→skill links by embedding-similarity, deduped against
 * `existingPairs` (build keys with {@link conceptSkillPairKey}). Ranked
 * most-similar first. Writes nothing — the output is a human-review queue.
 * Returns [] when either side has no embeddable text.
 */
export async function suggestConceptSkillLinksSemantic(
  concepts: ReadonlyArray<ConceptTextLike>,
  skills: ReadonlyArray<SkillTextLike>,
  existingPairs: ReadonlySet<string>,
  embedder: ConceptSkillEmbedder,
  opts: ConceptSkillSuggestOptions = {},
): Promise<ConceptSkillCandidate[]> {
  const threshold = opts.similarityThreshold ?? 0.8;

  const embConcepts = concepts.filter((c) => conceptText(c).length > 0);
  const embSkills = skills.filter((s) => skillText(s).length > 0);
  if (embConcepts.length === 0 || embSkills.length === 0) return [];

  const cVecs = await Promise.all(embConcepts.map((c) => embedder.embed(conceptText(c))));
  const sVecs = await Promise.all(embSkills.map((s) => embedder.embed(skillText(s))));

  const out: ConceptSkillCandidate[] = [];
  for (let i = 0; i < embConcepts.length; i++) {
    for (let j = 0; j < embSkills.length; j++) {
      const similarity = cosine(cVecs[i]!.embedding, sVecs[j]!.embedding);
      if (similarity < threshold) continue;
      const concept = embConcepts[i]!;
      const skill = embSkills[j]!;
      if (existingPairs.has(conceptSkillPairKey(concept.id, skill.name))) continue;
      out.push({
        conceptId: concept.id,
        skill: skill.name,
        similarity,
        ...(concept.domain ? { conceptDomain: concept.domain } : {}),
      });
    }
  }

  out.sort((a, b) => b.similarity - a.similarity || a.conceptId.localeCompare(b.conceptId));

  const cap = opts.maxPerConcept;
  if (cap === undefined || cap <= 0) return out;
  const perConcept = new Map<string, number>();
  return out.filter((c) => {
    const n = perConcept.get(c.conceptId) ?? 0;
    if (n >= cap) return false;
    perConcept.set(c.conceptId, n + 1);
    return true;
  });
}
