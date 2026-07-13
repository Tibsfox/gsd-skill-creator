import { describe, it, expect } from 'vitest';
import {
  assembleFlywheelChain,
  formatFlywheelChain,
  flywheelToSankey,
  normalizeSkillName,
  conceptMatchesSkill,
  sourceMatchesSkill,
  precedentMatchesSkill,
  citationMatchesSkill,
  type FlywheelInput,
  type LedgerSourceLike,
  type ConceptLike,
  type PrecedentLike,
  type CitationProvenanceLike,
} from './lineage.js';

// A fixture wiring two upstream subsystems (source ledger + college concepts)
// and downstream telemetry, so the assembly is exercised across the join.
function fixture(overrides: Partial<FlywheelInput> = {}): FlywheelInput {
  const sources: LedgerSourceLike[] = [
    {
      contentHash: 'aaaaaaaaaaaa1111',
      provenance: { origin: 'arxiv', sourceId: '2401.00001', label: 'commit-style research' },
    },
    {
      contentHash: 'bbbbbbbbbbbb2222',
      provenance: { origin: 'learn-acquirer', sourceId: 'notes/unrelated.md' },
    },
    {
      contentHash: 'cccccccccccc3333',
      provenance: { origin: 'citation', sourceId: 'x', extra: { skill: 'commit-style' } },
    },
  ];
  const concepts: ConceptLike[] = [
    { id: 'commit-message', name: 'Commit Message', domain: 'git' },
    { id: 'exponential-decay', name: 'Exponential Decay', domain: 'mathematics' },
    { id: 'conventional-commits', name: 'Conventional Commits', domain: 'git', skills: ['commit-style'] },
  ];
  const precedents: PrecedentLike[] = [
    {
      id: 'dt-1',
      intent: 'standardize commit subjects',
      skills: ['commit-style'],
      actor: 'executor',
      score: 0.42,
    },
    { id: 'dt-2', intent: 'unrelated refactor', skills: ['other-skill'] },
    { id: 'dt-3', intent: 'no skill attribution at all' },
  ];
  const citations: CitationProvenanceLike[] = [
    {
      citationId: 'cite-1',
      skills: ['commit-style'],
      title: 'Angular commit convention',
      artifactPath: 'docs/commits.md',
    },
    { citationId: 'cite-2', skills: ['something-else'], title: 'Unrelated paper' },
  ];
  return {
    skill: 'commit-style',
    sources,
    concepts,
    precedents,
    citations,
    telemetry: {
      skillName: 'commit-style',
      sessionCount: 20,
      loadCount: 12,
      avgScore: 0.82,
      loadRate: 0.4,
      budgetSkipCount: 1,
    },
    correctionMagnet: true,
    correctionCount: 3,
    ...overrides,
  };
}

describe('normalizeSkillName', () => {
  it('canonicalizes to hyphen-lowercase', () => {
    expect(normalizeSkillName('Commit Style!')).toBe('commit-style');
    expect(normalizeSkillName('  git__workflow  ')).toBe('git-workflow');
  });
});

describe('conceptMatchesSkill', () => {
  const tokens = new Set(['commit', 'style']);
  it('matches explicitly when the concept back-links the skill', () => {
    const r = conceptMatchesSkill(
      { id: 'x', skills: ['commit-style'] },
      'commit-style',
      tokens,
    );
    expect(r).toEqual({ matched: true, confidence: 'explicit' });
  });
  it('matches heuristically on token overlap', () => {
    const r = conceptMatchesSkill({ id: 'commit-message', name: 'Commit Message' }, 'commit-style', tokens);
    expect(r.matched).toBe(true);
    expect(r.confidence).toBe('heuristic');
  });
  it('drops unrelated concepts', () => {
    const r = conceptMatchesSkill({ id: 'exponential-decay' }, 'commit-style', tokens);
    expect(r.matched).toBe(false);
  });
});

describe('sourceMatchesSkill', () => {
  it('matches explicitly via provenance.extra.skill', () => {
    const r = sourceMatchesSkill(
      { contentHash: 'h', provenance: { origin: 'citation', sourceId: 'x', extra: { skill: 'commit-style' } } },
      'commit-style',
      'commit-style',
    );
    expect(r).toEqual({ matched: true, confidence: 'explicit' });
  });
  it('matches heuristically via a label substring', () => {
    const r = sourceMatchesSkill(
      { contentHash: 'h', provenance: { origin: 'arxiv', sourceId: 'y', label: 'commit style tips' } },
      'commit-style',
      'commit-style',
    );
    expect(r.matched).toBe(true);
    expect(r.confidence).toBe('heuristic');
  });
  it('drops unrelated sources', () => {
    const r = sourceMatchesSkill(
      { contentHash: 'h', provenance: { origin: 'learn-acquirer', sourceId: 'notes/unrelated.md' } },
      'commit-style',
      'commit-style',
    );
    expect(r.matched).toBe(false);
  });
});

describe('precedentMatchesSkill', () => {
  it('matches explicitly when the precedent back-links the skill', () => {
    const r = precedentMatchesSkill({ id: 'x', intent: 'i', skills: ['commit-style'] }, 'commit-style');
    expect(r).toEqual({ matched: true, confidence: 'explicit' });
  });
  it('drops precedents with no matching skill attribution', () => {
    expect(precedentMatchesSkill({ id: 'x', intent: 'i', skills: ['other'] }, 'commit-style').matched).toBe(false);
    expect(precedentMatchesSkill({ id: 'x', intent: 'i' }, 'commit-style').matched).toBe(false);
  });
});

describe('citationMatchesSkill', () => {
  it('matches explicitly when the citation attributes its artifact to the skill', () => {
    const r = citationMatchesSkill({ citationId: 'c', skills: ['commit-style'] }, 'commit-style');
    expect(r).toEqual({ matched: true, confidence: 'explicit' });
  });
  it('drops citations attributed to other skills', () => {
    expect(citationMatchesSkill({ citationId: 'c', skills: ['nope'] }, 'commit-style').matched).toBe(false);
  });
});

describe('assembleFlywheelChain', () => {
  it('joins precise upstream artifacts and downstream telemetry onto the skill spine', () => {
    const chain = assembleFlywheelChain(fixture());

    // PRECISE by default: only EXPLICIT ledger source (extra.skill) survives; the
    // loose label match ('commit-style research') is dropped, unrelated dropped.
    // Precedent + citation sources join explicitly and appear alongside.
    expect(chain.sources.map((s) => s.id)).toEqual([
      'source:cccccccccccc3333',
      'precedent:dt-1',
      'citation:cite-1',
    ]);

    // Concepts: only the explicit back-link survives; the loose token match
    // ('commit-message', the spurious 'style'/'commit' overlap) is dropped.
    expect(chain.concepts.map((c) => c.meta.conceptId)).toEqual(['conventional-commits']);

    expect(chain.activations?.meta.loadCount).toBe(12);
    expect(chain.corrections?.meta.correctionCount).toBe(3);

    // Every surviving upstream link is explicit; downstream links are exact.
    for (const src of chain.sources) {
      expect(chain.links.find((l) => l.from === src.id)?.confidence).toBe('explicit');
    }
    const actLink = chain.links.find((l) => l.to === chain.activations!.id);
    expect(actLink?.confidence).toBe('exact');
  });

  it('folds precedent and citation provenance into the sources with useful meta', () => {
    const chain = assembleFlywheelChain(fixture());
    const prec = chain.sources.find((s) => s.id === 'precedent:dt-1');
    expect(prec?.meta.kind).toBe('precedent');
    expect(prec?.meta.score).toBe(0.42);
    expect(prec?.label).toBe('standardize commit subjects');
    const cite = chain.sources.find((s) => s.id === 'citation:cite-1');
    expect(cite?.meta.kind).toBe('citation');
    expect(cite?.meta.artifactPath).toBe('docs/commits.md');
    expect(cite?.label).toBe('Angular commit convention');
  });

  it('surfaces the low-confidence heuristic tier only when opted in', () => {
    const chain = assembleFlywheelChain(fixture({ allowHeuristic: true }));
    // Heuristic ledger label match + heuristic concept token match now appear.
    expect(chain.sources.map((s) => s.id)).toContain('source:aaaaaaaaaaaa1111');
    expect(chain.concepts.map((c) => c.meta.conceptId)).toContain('commit-message');
    const heurSrc = chain.links.find((l) => l.from === 'source:aaaaaaaaaaaa1111');
    expect(heurSrc?.confidence).toBe('heuristic');
  });

  it('degrades gracefully when telemetry and corrections are absent', () => {
    const chain = assembleFlywheelChain(
      fixture({ telemetry: undefined, correctionMagnet: false, correctionCount: 0 }),
    );
    expect(chain.activations).toBeNull();
    expect(chain.corrections).toBeNull();
    // The skill node is always present as the spine.
    expect(chain.skillNode.id).toBe('skill:commit-style');
  });

  it('chains correction flow off activations when both exist', () => {
    const chain = assembleFlywheelChain(fixture());
    const corrLink = chain.links.find((l) => l.to === chain.corrections!.id);
    expect(corrLink?.from).toBe(chain.activations!.id);
  });
});

describe('formatFlywheelChain', () => {
  it('renders the full source -> ... -> corrections chain', () => {
    const out = formatFlywheelChain(assembleFlywheelChain(fixture()));
    expect(out).toContain("Flywheel lineage for 'commit-style'");
    // 3 precise sources: explicit ledger + precedent trace + citation provenance.
    expect(out).toContain('sources (3)');
    expect(out).toContain('precedent:dt-1');
    expect(out).toContain('citation:cite-1');
    expect(out).toContain('concepts (1)');
    expect(out).toContain('activations: 12 load session(s)');
    expect(out).toContain('corrections: 3 [correction-magnet]');
    expect(out).toContain('source -> concept -> skill -> activations -> corrections');
  });

  it('notes empty upstream honestly', () => {
    const out = formatFlywheelChain(
      assembleFlywheelChain({ skill: 'lonely-skill', sources: [], concepts: [] }),
    );
    expect(out).toContain('(none joined');
    expect(out).toContain('activations: (no telemetry)');
    expect(out).toContain('corrections: 0');
  });
});

describe('flywheelToSankey', () => {
  it('projects nodes/links with flow-weighted values', () => {
    const { nodes, links } = flywheelToSankey(assembleFlywheelChain(fixture()));
    expect(nodes.some((n) => n.id === 'skill:commit-style')).toBe(true);
    const actLink = links.find((l) => l.target === 'activation:commit-style');
    expect(actLink?.value).toBe(12);
    const corrLink = links.find((l) => l.target === 'correction:commit-style');
    expect(corrLink?.value).toBe(3);
  });
});
