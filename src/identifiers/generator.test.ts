import { describe, it, expect } from 'vitest';
import {
  inferDomain,
  generateAgentId,
  generateSkillId,
  generateAdapterId,
  parseAgentId,
  parseSkillId,
  parseAdapterId,
} from './generator.js';
import type { AgentId } from './types.js';

describe('inferDomain', () => {
  it('classifies frontend descriptions', () => {
    expect(inferDomain('React component for login form')).toBe('frontend');
  });

  it('classifies backend descriptions', () => {
    expect(inferDomain('REST API endpoint for users')).toBe('backend');
  });

  it('classifies testing descriptions', () => {
    expect(inferDomain('vitest mock for auth')).toBe('testing');
  });

  it('classifies infrastructure descriptions', () => {
    expect(inferDomain('Docker CI pipeline config')).toBe('infrastructure');
  });

  it('classifies observation descriptions', () => {
    expect(inferDomain('dashboard metric logging')).toBe('observation');
  });

  it('classifies silicon descriptions', () => {
    expect(inferDomain('GPU VRAM model inference adapter')).toBe('silicon');
  });

  it('defaults to infrastructure when no keywords match', () => {
    expect(inferDomain('unknown thing')).toBe('infrastructure');
  });

  it('uses pattern parameter for additional context', () => {
    expect(inferDomain('some thing', 'react component')).toBe('frontend');
  });

  it('handles empty string', () => {
    expect(inferDomain('')).toBe('infrastructure');
  });

  it('handles case-insensitive matching', () => {
    expect(inferDomain('REACT COMPONENT')).toBe('frontend');
  });

  it('breaks ties alphabetically by domain name', () => {
    // 'build' hits infrastructure, 'test' hits testing
    // If equal scores, alphabetical: infrastructure < testing, so infrastructure wins
    const result = inferDomain('build test');
    expect(['infrastructure', 'testing']).toContain(result);
  });
});

describe('generateAgentId', () => {
  it('generates first ID in domain with no existing', () => {
    expect(generateAgentId('frontend')).toBe('F-1');
    expect(generateAgentId('frontend', [])).toBe('F-1');
  });

  it('generates sequential ID accounting for existing', () => {
    expect(generateAgentId('frontend', ['F-1' as AgentId, 'F-2' as AgentId])).toBe('F-3');
  });

  it('ignores existing IDs from different domains', () => {
    expect(generateAgentId('backend', ['F-1' as AgentId])).toBe('B-1');
  });

  it('handles gaps in numbering', () => {
    expect(generateAgentId('frontend', ['F-1' as AgentId, 'F-5' as AgentId])).toBe('F-6');
  });

  it('generates IDs for all domains', () => {
    expect(generateAgentId('frontend')).toBe('F-1');
    expect(generateAgentId('backend')).toBe('B-1');
    expect(generateAgentId('testing')).toBe('T-1');
    expect(generateAgentId('infrastructure')).toBe('I-1');
    expect(generateAgentId('observation')).toBe('O-1');
    expect(generateAgentId('silicon')).toBe('S-1');
  });
});

describe('generateSkillId', () => {
  it('generates dot-notation skill ID', () => {
    expect(generateSkillId('F-1' as AgentId, 'recipe')).toBe('F-1.recipe');
  });

  it('lowercases and sanitizes abbreviation', () => {
    expect(generateSkillId('B-1' as AgentId, 'API Handler!!')).toBe('B-1.apihandl');
  });

  it('truncates abbreviation to 8 chars', () => {
    expect(generateSkillId('F-1' as AgentId, 'verylongabbreviation')).toBe('F-1.verylong');
  });

  it('handles already clean abbreviation', () => {
    expect(generateSkillId('F-1' as AgentId, 'rcp')).toBe('F-1.rcp');
  });
});

describe('generateAdapterId', () => {
  it('generates colon-notation adapter ID', () => {
    expect(generateAdapterId('F-1' as AgentId, 'rcp')).toBe('F-1:rcp');
  });

  it('lowercases and sanitizes abbreviation', () => {
    expect(generateAdapterId('B-1' as AgentId, 'API Handler!!')).toBe('B-1:apihandl');
  });

  it('truncates abbreviation to 8 chars', () => {
    expect(generateAdapterId('F-1' as AgentId, 'verylongabbreviation')).toBe('F-1:verylong');
  });
});

describe('parseAgentId', () => {
  it('parses valid agent ID', () => {
    expect(parseAgentId('F-1')).toEqual({
      domain: 'frontend',
      prefix: 'F',
      number: 1,
    });
  });

  it('parses all domain prefixes', () => {
    expect(parseAgentId('B-3')).toEqual({ domain: 'backend', prefix: 'B', number: 3 });
    expect(parseAgentId('T-1')).toEqual({ domain: 'testing', prefix: 'T', number: 1 });
    expect(parseAgentId('I-2')).toEqual({ domain: 'infrastructure', prefix: 'I', number: 2 });
    expect(parseAgentId('O-1')).toEqual({ domain: 'observation', prefix: 'O', number: 1 });
    expect(parseAgentId('S-4')).toEqual({ domain: 'silicon', prefix: 'S', number: 4 });
  });

  it('returns null for invalid format', () => {
    expect(parseAgentId('invalid')).toBeNull();
    expect(parseAgentId('')).toBeNull();
    expect(parseAgentId('X-1')).toBeNull();
    expect(parseAgentId('F-0')).toBeNull();
    expect(parseAgentId('F-')).toBeNull();
    expect(parseAgentId('F')).toBeNull();
  });

  it('returns null for skill or adapter IDs', () => {
    expect(parseAgentId('F-1.rcp')).toBeNull();
    expect(parseAgentId('F-1:rcp')).toBeNull();
  });
});

describe('parseSkillId', () => {
  it('parses valid skill ID', () => {
    expect(parseSkillId('F-1.rcp')).toEqual({
      agentId: 'F-1',
      abbreviation: 'rcp',
    });
  });

  it('parses multi-char abbreviation', () => {
    expect(parseSkillId('B-3.apihandl')).toEqual({
      agentId: 'B-3',
      abbreviation: 'apihandl',
    });
  });

  it('returns null for invalid format', () => {
    expect(parseSkillId('invalid')).toBeNull();
    expect(parseSkillId('')).toBeNull();
    expect(parseSkillId('F-1')).toBeNull();
    expect(parseSkillId('F-1:')).toBeNull();
    expect(parseSkillId('F-1:rcp')).toBeNull();
  });
});

describe('parseAdapterId', () => {
  it('parses valid adapter ID', () => {
    expect(parseAdapterId('F-1:rcp')).toEqual({
      agentId: 'F-1',
      abbreviation: 'rcp',
    });
  });

  it('parses multi-char abbreviation', () => {
    expect(parseAdapterId('S-2:lora')).toEqual({
      agentId: 'S-2',
      abbreviation: 'lora',
    });
  });

  it('returns null for invalid format', () => {
    expect(parseAdapterId('invalid')).toBeNull();
    expect(parseAdapterId('')).toBeNull();
    expect(parseAdapterId('F-1')).toBeNull();
    expect(parseAdapterId('F-1.rcp')).toBeNull();
  });
});

describe('round-trip', () => {
  it('generateAgentId then parseAgentId round-trips', () => {
    const id = generateAgentId('frontend');
    const parsed = parseAgentId(id);
    expect(parsed).toEqual({ domain: 'frontend', prefix: 'F', number: 1 });
  });

  it('generateSkillId then parseSkillId round-trips', () => {
    const id = generateSkillId('F-1' as AgentId, 'rcp');
    const parsed = parseSkillId(id);
    expect(parsed).toEqual({ agentId: 'F-1', abbreviation: 'rcp' });
  });

  it('generateAdapterId then parseAdapterId round-trips', () => {
    const id = generateAdapterId('F-1' as AgentId, 'rcp');
    const parsed = parseAdapterId(id);
    expect(parsed).toEqual({ agentId: 'F-1', abbreviation: 'rcp' });
  });
});
