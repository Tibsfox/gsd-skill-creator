import { describe, it, expect } from 'vitest';
import {
  assembleFlywheelChain,
  formatFlywheelChain,
  flywheelToSankey,
  normalizeSkillName,
  conceptMatchesSkill,
  sourceMatchesSkill,
  type FlywheelInput,
  type LedgerSourceLike,
  type ConceptLike,
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
  return {
    skill: 'commit-style',
    sources,
    concepts,
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

describe('assembleFlywheelChain', () => {
  it('joins matched upstream artifacts and downstream telemetry onto the skill spine', () => {
    const chain = assembleFlywheelChain(fixture());

    // Sources: label match + explicit extra.skill match; unrelated dropped.
    expect(chain.sources.map((s) => s.meta.contentHash)).toEqual([
      'aaaaaaaaaaaa1111',
      'cccccccccccc3333',
    ]);

    // Concepts: heuristic token match + explicit back-link; math concept dropped.
    expect(chain.concepts.map((c) => c.meta.conceptId).sort()).toEqual([
      'commit-message',
      'conventional-commits',
    ]);

    expect(chain.activations?.meta.loadCount).toBe(12);
    expect(chain.corrections?.meta.correctionCount).toBe(3);

    // Downstream links are exact; the explicit source link is tagged explicit.
    const actLink = chain.links.find((l) => l.to === chain.activations!.id);
    expect(actLink?.confidence).toBe('exact');
    const explicitSrc = chain.links.find((l) => l.from === 'source:cccccccccccc3333');
    expect(explicitSrc?.confidence).toBe('explicit');
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
    expect(out).toContain('sources (2)');
    expect(out).toContain('concepts (2)');
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
