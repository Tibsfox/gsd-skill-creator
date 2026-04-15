/**
 * Activation-equivalence harness.
 *
 * Proves that every trigger keyword from a set of SOURCE skill descriptions
 * still activates a MERGED skill — preventing information loss during skill
 * merges. Used by Wave 2C merges and Wave 3 regression scan.
 *
 * The model is intentionally simple:
 *   - extract "trigger keywords" from each skill description (lowercase word stems)
 *   - a merged skill "covers" a source iff its description mentions every
 *     non-stopword stem that appeared in the source
 *
 * This is coarse, but catches the specific failure mode we care about:
 * accidentally dropping a trigger term while consolidating two skills.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'to', 'of', 'for', 'in', 'on', 'at',
  'by', 'with', 'from', 'this', 'that', 'these', 'those', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'use', 'used',
  'using', 'it', 'its', 'as', 'if', 'then', 'when', 'where', 'how', 'why',
  'what', 'which', 'also', 'into', 'other', 'such', 'etc', 'via', 'per',
]);

export interface SkillDescriptor {
  name: string;
  description: string;
}

export interface EquivalenceResult {
  source: string;
  merged: string;
  covered: boolean;
  missing: string[];
  covered_terms: string[];
}

export function extractTriggerTerms(description: string): string[] {
  const terms = description
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
  return Array.from(new Set(terms));
}

export function checkCoverage(
  source: SkillDescriptor,
  merged: SkillDescriptor
): EquivalenceResult {
  const sourceTerms = extractTriggerTerms(source.description);
  const mergedText = merged.description.toLowerCase();
  const missing: string[] = [];
  const covered: string[] = [];
  for (const term of sourceTerms) {
    if (mergedText.includes(term)) {
      covered.push(term);
    } else {
      missing.push(term);
    }
  }
  return {
    source: source.name,
    merged: merged.name,
    covered: missing.length === 0,
    missing,
    covered_terms: covered,
  };
}

export function assertActivationEquivalence(
  sources: SkillDescriptor[],
  merged: SkillDescriptor
): EquivalenceResult[] {
  const results = sources.map((src) => checkCoverage(src, merged));
  const failing = results.filter((r) => !r.covered);
  if (failing.length > 0) {
    const detail = failing
      .map((f) => `  ${f.source}: missing ${f.missing.join(', ')}`)
      .join('\n');
    throw new Error(
      `Activation equivalence failed for merged skill "${merged.name}":\n${detail}`
    );
  }
  return results;
}
