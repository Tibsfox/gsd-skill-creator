import { describe, it, expect } from 'vitest';
import { codeQualityStage } from './code-quality.js';
import { MockSubagentClient } from '../subagent-client.js';
import type { SkillDraft, CritiqueFinding } from '../types.js';

function makeDraft(): SkillDraft {
  return {
    skillName: 'test-skill',
    skillDir: '/skills/test-skill',
    body: '---\nname: test-skill\ndescription: A test\n---\n\n# Test\n',
    metadata: { name: 'test-skill', description: 'A test' },
    files: new Map(),
  };
}

describe('codeQualityStage', () => {
  it('stamps stage name on findings', async () => {
    const mockFinding: CritiqueFinding = {
      stage: 'other',
      severity: 'warning',
      message: 'File lacks clear responsibility',
    };
    const client = new MockSubagentClient([[mockFinding]]);
    const stage = codeQualityStage(client);

    const findings = await stage.run(makeDraft());

    expect(findings).toHaveLength(1);
    expect(findings[0]?.stage).toBe('code-quality');
    expect(findings[0]?.message).toBe('File lacks clear responsibility');
  });

  it('empty queue returns []', async () => {
    const client = new MockSubagentClient([]);
    const stage = codeQualityStage(client);

    const findings = await stage.run(makeDraft());
    expect(findings).toHaveLength(0);
  });

  it('stage name is code-quality', () => {
    const client = new MockSubagentClient([]);
    const stage = codeQualityStage(client);
    expect(stage.name).toBe('code-quality');
  });
});
