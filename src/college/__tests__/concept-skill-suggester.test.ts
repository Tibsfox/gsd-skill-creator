import { describe, it, expect } from 'vitest';
import {
  suggestConceptSkillLinksSemantic,
  conceptSkillPairKey,
  formatConceptSkillCandidates,
  type ConceptSkillEmbedder,
} from '../concept-skill-suggester.js';

/**
 * Deterministic fake embedder: a 3-dim vector over keyword presence
 * [review, commit, calculus]. Texts sharing a keyword embed similarly.
 */
const fakeEmbedder: ConceptSkillEmbedder = {
  async embed(text: string) {
    const t = text.toLowerCase();
    return {
      embedding: [
        t.includes('review') ? 1 : 0,
        t.includes('commit') ? 1 : 0,
        t.includes('calculus') || t.includes('derivative') ? 1 : 0,
      ],
    };
  },
};

const CONCEPTS = [
  { id: 'code-peer-review', name: 'peer review', description: 'reviewing code changes', domain: 'engineering' },
  { id: 'derivative', name: 'derivative', description: 'rate of change in calculus', domain: 'mathematics' },
];
const SKILLS = [
  { name: 'code-review', description: 'review code for bugs and style' },
  { name: 'commit-style', description: 'write conventional commit messages' },
];

describe('suggestConceptSkillLinksSemantic', () => {
  it('proposes links above the similarity threshold, ranked most-similar first', async () => {
    const out = await suggestConceptSkillLinksSemantic(CONCEPTS, SKILLS, new Set(), fakeEmbedder, {
      similarityThreshold: 0.5,
    });
    // code-peer-review ↔ code-review share "review" → similarity 1; the calculus
    // concept matches no skill keyword → no proposal.
    expect(out.length).toBeGreaterThan(0);
    expect(out[0]).toMatchObject({ conceptId: 'code-peer-review', skill: 'code-review' });
    expect(out[0]!.similarity).toBeGreaterThanOrEqual(0.5);
    // ranked descending
    for (let i = 1; i < out.length; i++) {
      expect(out[i - 1]!.similarity).toBeGreaterThanOrEqual(out[i]!.similarity);
    }
  });

  it('dedups against existing pairs and writes nothing', async () => {
    const existing = new Set([conceptSkillPairKey('code-peer-review', 'code-review')]);
    const out = await suggestConceptSkillLinksSemantic(CONCEPTS, SKILLS, existing, fakeEmbedder, {
      similarityThreshold: 0.5,
    });
    expect(out.some((c) => c.conceptId === 'code-peer-review' && c.skill === 'code-review')).toBe(false);
  });

  it('honors the threshold (high threshold suppresses weak matches)', async () => {
    const out = await suggestConceptSkillLinksSemantic(CONCEPTS, SKILLS, new Set(), fakeEmbedder, {
      similarityThreshold: 0.99,
    });
    // Only exact keyword co-occurrence (similarity 1) survives.
    expect(out.every((c) => c.similarity >= 0.99)).toBe(true);
  });

  it('caps proposals per concept', async () => {
    const manySkills = [
      { name: 'code-review', description: 'review code' },
      { name: 'adversarial-pr-review', description: 'review pull requests' },
    ];
    const capped = await suggestConceptSkillLinksSemantic(CONCEPTS, manySkills, new Set(), fakeEmbedder, {
      similarityThreshold: 0.5,
      maxPerConcept: 1,
    });
    const reviewProposals = capped.filter((c) => c.conceptId === 'code-peer-review');
    expect(reviewProposals).toHaveLength(1);
  });

  it('is inert (returns []) when either side has no embeddable text', async () => {
    expect(await suggestConceptSkillLinksSemantic([], SKILLS, new Set(), fakeEmbedder)).toEqual([]);
    expect(await suggestConceptSkillLinksSemantic(CONCEPTS, [], new Set(), fakeEmbedder)).toEqual([]);
  });
});

describe('formatConceptSkillCandidates', () => {
  it('renders an empty queue as a single no-suggestions line', () => {
    expect(formatConceptSkillCandidates([])).toBe(
      'No concept→skill links suggested (existing mapping already covers the corpus).',
    );
  });

  it('renders candidates as a HUMAN REVIEW ONLY block with cosine + domain', () => {
    const out = formatConceptSkillCandidates([
      { conceptId: 'code-peer-review', skill: 'code-review', similarity: 0.912, conceptDomain: 'engineering' },
      { conceptId: 'derivative', skill: 'test-generator', similarity: 0.8 },
    ]);
    expect(out).toContain('HUMAN REVIEW ONLY, nothing written');
    expect(out).toContain('Suggested concept→skill links (2)');
    expect(out).toContain('+ code-peer-review [engineering] -> code-review  (cos 0.912)');
    expect(out).toContain('+ derivative -> test-generator  (cos 0.800)');
  });
});
