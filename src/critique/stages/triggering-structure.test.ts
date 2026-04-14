import { describe, it, expect } from 'vitest';
import { triggeringStructureStage } from './triggering-structure.js';
import type { SkillDraft } from '../types.js';

const validTriggering = `## Naive Prompt\nText.\n\n## Expected Baseline Failure\nText.\n\n## Expected Skill Activation\nText.\n\n## Rationalization Table\n| R | C |\n|---|---|\n| a | b |\n| c | d |\n| e | f |`;

function makeDraft(triggeringContent?: string): SkillDraft {
  const files = new Map<string, string>();
  if (triggeringContent !== undefined) files.set('triggering.test.md', triggeringContent);
  return {
    skillName: 'test',
    skillDir: '/tmp/test',
    body: '---\n---\nbody',
    metadata: {},
    files,
  };
}

describe('triggeringStructureStage', () => {
  const stage = triggeringStructureStage();

  it('has name "triggering-structure"', () => {
    expect(stage.name).toBe('triggering-structure');
  });

  it('returns one warning finding when triggering.test.md is missing', async () => {
    const findings = await stage.run(makeDraft());
    expect(findings.length).toBe(1);
    expect(findings[0].severity).toBe('warning');
    expect(findings[0].message).toContain('missing');
    expect(findings[0].fixHint).toContain('Naive Prompt');
  });

  it('returns no findings when triggering.test.md is structurally valid', async () => {
    const findings = await stage.run(makeDraft(validTriggering));
    expect(findings).toEqual([]);
  });

  it('returns error findings when triggering.test.md has missing sections', async () => {
    const broken = `## Naive Prompt\nText.\n\n## Rationalization Table\n| R | C |\n|---|---|\n| a | b |\n| c | d |\n| e | f |`;
    const findings = await stage.run(makeDraft(broken));
    expect(findings.length).toBeGreaterThan(0);
    expect(findings.every(f => f.severity === 'error')).toBe(true);
    expect(findings.every(f => f.stage === 'triggering-structure')).toBe(true);
  });

  it('returns error finding when rationalization table has fewer than 3 rows', async () => {
    const tooFew = validTriggering.replace('| e | f |', '');
    const findings = await stage.run(makeDraft(tooFew));
    expect(findings.some(f => f.message.includes('Rationalization'))).toBe(true);
  });

  it('does NOT import any SubagentClient (pure stage)', async () => {
    const fs = await import('node:fs/promises');
    const src = await fs.readFile('src/critique/stages/triggering-structure.ts', 'utf8');
    expect(src).not.toContain('SubagentClient');
    expect(src).not.toContain('subagent-client');
  });
});
