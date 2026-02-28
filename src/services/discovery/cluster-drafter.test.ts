/**
 * TDD tests for activation-focused SKILL.md draft generation for cluster candidates.
 *
 * Tests generateClusterDraft for activation-focused content structure,
 * YAML frontmatter, "When to Activate" section, guidance placeholders,
 * pattern evidence table, and footer.
 */

import { describe, it, expect } from 'vitest';
import { generateClusterDraft } from './cluster-drafter.js';
import type { ClusterCandidate } from './cluster-scorer.js';

// ============================================================================
// Helpers
// ============================================================================

/** Build a ClusterCandidate with sensible defaults and overrides */
function makeClusterCandidate(overrides: Partial<ClusterCandidate> = {}): ClusterCandidate {
  return {
    label: overrides.label ?? 'Help me refactor authentication',
    suggestedName: overrides.suggestedName ?? 'help-refactor-authentication',
    suggestedDescription: overrides.suggestedDescription ?? 'Guides workflow when: Help me refactor authentication',
    clusterSize: overrides.clusterSize ?? 15,
    coherence: overrides.coherence ?? 0.85,
    score: overrides.score ?? 0.72,
    scoreBreakdown: overrides.scoreBreakdown ?? {
      size: 0.6,
      crossProject: 0.7,
      coherence: 0.85,
      recency: 0.9,
    },
    examplePrompts: overrides.examplePrompts ?? [
      'Help me refactor this authentication module',
      'Refactor the auth service to use JWT tokens',
      'Clean up the authentication logic in this project',
    ],
    evidence: overrides.evidence ?? {
      projects: ['project-alpha', 'project-beta', 'project-gamma'],
      promptCount: 15,
      lastSeen: '2026-02-05T12:00:00.000Z',
    },
  };
}

// ============================================================================
// generateClusterDraft: structure
// ============================================================================

describe('generateClusterDraft structure', () => {
  it('returns name matching suggestedName', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.name).toBe('help-refactor-authentication');
  });

  it('content starts with valid YAML frontmatter delimiter', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content.startsWith('---\n')).toBe(true);
  });

  it('frontmatter contains name field', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    const frontmatter = result.content.split('---')[1];
    expect(frontmatter).toContain('name: help-refactor-authentication');
  });

  it('frontmatter contains description field', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    const frontmatter = result.content.split('---')[1];
    expect(frontmatter).toContain('description:');
  });
});

// ============================================================================
// generateClusterDraft: activation section (primary)
// ============================================================================

describe('generateClusterDraft activation section', () => {
  it('has "When to Activate" section as primary content', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('## When to Activate');
  });

  it('includes the cluster label in a blockquote', () => {
    const candidate = makeClusterCandidate({ label: 'Debug failing tests' });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('> Debug failing tests');
  });

  it('lists all example prompts', () => {
    const candidate = makeClusterCandidate({
      examplePrompts: [
        'Refactor auth module',
        'Clean up login code',
        'Simplify authentication flow',
      ],
    });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('Refactor auth module');
    expect(result.content).toContain('Clean up login code');
    expect(result.content).toContain('Simplify authentication flow');
  });

  it('truncates example prompts to 80 chars each', () => {
    const longPrompt = 'A'.repeat(120);
    const candidate = makeClusterCandidate({
      examplePrompts: [longPrompt],
    });
    const result = generateClusterDraft(candidate);
    // The full 120-char prompt should NOT appear
    expect(result.content).not.toContain(longPrompt);
    // But a truncated version should
    expect(result.content).toContain('A'.repeat(80));
  });

  it('truncates label to 100 chars in blockquote', () => {
    const longLabel = 'B'.repeat(150);
    const candidate = makeClusterCandidate({ label: longLabel });
    const result = generateClusterDraft(candidate);
    expect(result.content).not.toContain(longLabel);
    expect(result.content).toContain('B'.repeat(100));
  });
});

// ============================================================================
// generateClusterDraft: does NOT have tool workflow
// ============================================================================

describe('generateClusterDraft does NOT have tool workflow', () => {
  it('does NOT contain "## Workflow" section with tool steps', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).not.toContain('## Workflow');
  });

  it('does NOT contain tool-specific steps like "**Read**" or "**Edit**"', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    // Should not have numbered tool steps
    expect(result.content).not.toMatch(/\d+\.\s+\*\*Read\*\*/);
    expect(result.content).not.toMatch(/\d+\.\s+\*\*Edit\*\*/);
    expect(result.content).not.toMatch(/\d+\.\s+\*\*Bash\*\*/);
  });
});

// ============================================================================
// generateClusterDraft: guidance section
// ============================================================================

describe('generateClusterDraft guidance section', () => {
  it('has "Guidance" section with placeholder steps for user to fill in', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('## Guidance');
  });

  it('guidance section has numbered steps', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    const guidanceSection = result.content.split('## Guidance')[1].split('##')[0];
    expect(guidanceSection).toContain('1.');
    expect(guidanceSection).toContain('2.');
  });
});

// ============================================================================
// generateClusterDraft: evidence section
// ============================================================================

describe('generateClusterDraft evidence section', () => {
  it('has "Pattern Evidence" section', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('## Pattern Evidence');
  });

  it('evidence shows project count', () => {
    const candidate = makeClusterCandidate({
      evidence: { projects: ['p1', 'p2', 'p3'], promptCount: 10, lastSeen: '2026-02-05' },
    });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('| Projects | 3 |');
  });

  it('evidence shows cluster size', () => {
    const candidate = makeClusterCandidate({ clusterSize: 25 });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('| Prompts in cluster | 25 |');
  });

  it('evidence shows coherence', () => {
    const candidate = makeClusterCandidate({ coherence: 0.85 });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('| Coherence | 0.85 |');
  });

  it('evidence shows confidence score', () => {
    const candidate = makeClusterCandidate({ score: 0.72 });
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('| Confidence score | 0.72 |');
  });
});

// ============================================================================
// generateClusterDraft: footer
// ============================================================================

describe('generateClusterDraft footer', () => {
  it('has footer noting semantic clustering origin', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('semantic clustering');
  });

  it('mentions activation pattern in footer', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content).toContain('activation pattern');
  });
});

// ============================================================================
// Content budget
// ============================================================================

describe('content budget', () => {
  it('generated content for a typical cluster candidate is under 15,000 characters', () => {
    const candidate = makeClusterCandidate();
    const result = generateClusterDraft(candidate);
    expect(result.content.length).toBeLessThan(15000);
  });
});
