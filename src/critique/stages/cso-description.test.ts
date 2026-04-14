import { describe, it, expect } from 'vitest';
import { csoDescriptionStage } from './cso-description.js';
import type { SkillDraft } from '../types.js';

function makeDraft(description: string): SkillDraft {
  return {
    skillName: 'test',
    skillDir: '/tmp/test',
    body: '---\n---\nbody',
    metadata: { description },
    files: new Map(),
  };
}

describe('csoDescriptionStage', () => {
  const stage = csoDescriptionStage();

  it('has name "cso-description"', () => {
    expect(stage.name).toBe('cso-description');
  });

  it('returns no findings when description is missing', async () => {
    const draft = { ...makeDraft(''), metadata: {} as Record<string, unknown> };
    expect(await stage.run(draft)).toEqual([]);
  });

  it('returns no findings when description is empty', async () => {
    expect(await stage.run(makeDraft(''))).toEqual([]);
  });

  it('returns no findings when description has no capability verbs', async () => {
    const findings = await stage.run(makeDraft('Use when the user asks for help.'));
    expect(findings).toEqual([]);
  });

  it('returns warning findings when description contains capability verbs', async () => {
    const findings = await stage.run(makeDraft('Manages workflow state and orchestrates handoffs.'));
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].stage).toBe('cso-description');
    expect(findings[0].message).toMatch(/manages|orchestrates/i);
  });

  it('finding fixHint mentions "Use when" rewrite', async () => {
    const findings = await stage.run(makeDraft('Validates GSD artifacts.'));
    expect(findings[0].fixHint).toContain('Use when');
  });

  it('does NOT import any SubagentClient (pure stage)', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/critique/stages/cso-description.ts', 'utf8');
    expect(src).not.toContain('SubagentClient');
    expect(src).not.toContain('subagent-client');
  });
});
