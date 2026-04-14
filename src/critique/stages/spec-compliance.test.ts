import { describe, it, expect } from 'vitest';
import { specComplianceStage } from './spec-compliance.js';
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

describe('specComplianceStage', () => {
  it('stamps stage name on findings', async () => {
    const mockFinding: CritiqueFinding = {
      stage: 'other',
      severity: 'error',
      message: 'Missing Use when clause',
    };
    const client = new MockSubagentClient([[mockFinding]]);
    const stage = specComplianceStage(client);

    const findings = await stage.run(makeDraft());

    expect(findings).toHaveLength(1);
    expect(findings[0]?.stage).toBe('spec-compliance');
    expect(findings[0]?.message).toBe('Missing Use when clause');
  });

  it('empty queue returns []', async () => {
    const client = new MockSubagentClient([]);
    const stage = specComplianceStage(client);

    const findings = await stage.run(makeDraft());
    expect(findings).toHaveLength(0);
  });

  it('stage name is spec-compliance', () => {
    const client = new MockSubagentClient([]);
    const stage = specComplianceStage(client);
    expect(stage.name).toBe('spec-compliance');
  });
});
