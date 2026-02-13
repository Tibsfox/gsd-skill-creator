/**
 * Tests for Offload promoter: detection and extraction of
 * promotable operations from skill metadata extensions.
 */

import { describe, it, expect } from 'vitest';
import type { SkillMetadata } from '../../types/skill.js';
import { detectPromotable, extractOffloadOps } from './promoter.js';

/**
 * Helper: create a SkillMetadata fixture with offload promotions.
 */
function makeSkill(
  name: string,
  promotions?: unknown[],
  opts?: { noExtensions?: boolean; noOffload?: boolean; offloadNoPromotions?: boolean },
): SkillMetadata {
  if (opts?.noExtensions) {
    return { name, description: `Skill ${name}` };
  }

  if (opts?.noOffload) {
    return {
      name,
      description: `Skill ${name}`,
      metadata: {
        extensions: {
          'gsd-skill-creator': {} as any,
        },
      },
    };
  }

  if (opts?.offloadNoPromotions) {
    return {
      name,
      description: `Skill ${name}`,
      metadata: {
        extensions: {
          'gsd-skill-creator': {
            offload: {},
          } as any,
        },
      },
    };
  }

  return {
    name,
    description: `Skill ${name}`,
    metadata: {
      extensions: {
        'gsd-skill-creator': {
          offload: {
            promotions: promotions ?? [],
          },
        } as any,
      },
    },
  };
}

describe('detectPromotable', () => {
  it('returns true when skill has non-empty promotions array', () => {
    const skill = makeSkill('lint-runner', [
      { name: 'lint-fix', scriptContent: 'eslint --fix .', scriptType: 'bash' },
    ]);
    expect(detectPromotable(skill)).toBe(true);
  });

  it('returns false when skill has no metadata.extensions', () => {
    const skill = makeSkill('plain-skill', undefined, { noExtensions: true });
    expect(detectPromotable(skill)).toBe(false);
  });

  it('returns false when skill has empty promotions array', () => {
    const skill = makeSkill('empty-promotions', []);
    expect(detectPromotable(skill)).toBe(false);
  });

  it('returns false when skill has extensions but no offload field', () => {
    const skill = makeSkill('no-offload', undefined, { noOffload: true });
    expect(detectPromotable(skill)).toBe(false);
  });

  it('returns false when offload.promotions is undefined', () => {
    const skill = makeSkill('offload-no-promotions', undefined, { offloadNoPromotions: true });
    expect(detectPromotable(skill)).toBe(false);
  });
});

describe('extractOffloadOps', () => {
  it('extracts OffloadOperation from skill with one promotion', () => {
    const skill = makeSkill('lint-runner', [
      { name: 'lint-fix', scriptContent: '#!/bin/bash\neslint --fix .', scriptType: 'bash' },
    ]);
    const ops = extractOffloadOps(skill);
    expect(ops).toHaveLength(1);
    expect(ops[0].id).toBe('lint-runner:lint-fix');
    expect(ops[0].script).toBe('#!/bin/bash\neslint --fix .');
    expect(ops[0].scriptType).toBe('bash');
    expect(ops[0].label).toBe('lint-fix');
  });

  it('extracts multiple operations from skill with two promotions', () => {
    const skill = makeSkill('build-tool', [
      { name: 'build', scriptContent: 'npm run build', scriptType: 'node' },
      { name: 'test', scriptContent: 'vitest run', scriptType: 'node' },
    ]);
    const ops = extractOffloadOps(skill);
    expect(ops).toHaveLength(2);
    expect(ops[0].id).toBe('build-tool:build');
    expect(ops[1].id).toBe('build-tool:test');
  });

  it('returns empty array for skill without promotions', () => {
    const skill = makeSkill('plain-skill', undefined, { noExtensions: true });
    const ops = extractOffloadOps(skill);
    expect(ops).toEqual([]);
  });

  it('returns empty array for skill with empty promotions array', () => {
    const skill = makeSkill('empty', []);
    const ops = extractOffloadOps(skill);
    expect(ops).toEqual([]);
  });

  it('generates deterministic operation id from skill name + promotion name', () => {
    const skill = makeSkill('my-skill', [
      { name: 'deploy', scriptContent: 'deploy.sh', scriptType: 'bash' },
    ]);
    const ops = extractOffloadOps(skill);
    expect(ops[0].id).toBe('my-skill:deploy');
  });

  it('respects conditions.alwaysPromote in extracted operation', () => {
    const skill = makeSkill('always-runner', [
      {
        name: 'always-lint',
        scriptContent: 'eslint .',
        scriptType: 'bash',
        conditions: { alwaysPromote: true },
      },
    ]);
    const ops = extractOffloadOps(skill);
    expect(ops).toHaveLength(1);
    // alwaysPromote is in the promotion declaration, not the operation itself
    // but the operation should still be extracted successfully
    expect(ops[0].id).toBe('always-runner:always-lint');
  });

  it('extracts workingDir from promotion, defaults to "." otherwise', () => {
    const withDir = makeSkill('tool', [
      { name: 'run', scriptContent: 'echo hi', scriptType: 'bash', workingDir: '/custom' },
    ]);
    const opsWithDir = extractOffloadOps(withDir);
    expect(opsWithDir[0].workingDir).toBe('/custom');

    const withoutDir = makeSkill('tool2', [
      { name: 'run', scriptContent: 'echo hi', scriptType: 'bash' },
    ]);
    const opsWithoutDir = extractOffloadOps(withoutDir);
    expect(opsWithoutDir[0].workingDir).toBe('.');
  });

  it('extracts timeout from promotion, uses default 30000 otherwise', () => {
    const withTimeout = makeSkill('tool', [
      { name: 'slow', scriptContent: 'sleep 100', scriptType: 'bash', timeout: 120000 },
    ]);
    const opsWithTimeout = extractOffloadOps(withTimeout);
    expect(opsWithTimeout[0].timeout).toBe(120000);

    const withoutTimeout = makeSkill('tool2', [
      { name: 'fast', scriptContent: 'echo hi', scriptType: 'bash' },
    ]);
    const opsWithoutTimeout = extractOffloadOps(withoutTimeout);
    expect(opsWithoutTimeout[0].timeout).toBe(30000);
  });

  it('extracts env from promotion, uses empty object otherwise', () => {
    const withEnv = makeSkill('tool', [
      { name: 'prod', scriptContent: 'deploy.sh', scriptType: 'bash', env: { NODE_ENV: 'production' } },
    ]);
    const opsWithEnv = extractOffloadOps(withEnv);
    expect(opsWithEnv[0].env).toEqual({ NODE_ENV: 'production' });

    const withoutEnv = makeSkill('tool2', [
      { name: 'dev', scriptContent: 'dev.sh', scriptType: 'bash' },
    ]);
    const opsWithoutEnv = extractOffloadOps(withoutEnv);
    expect(opsWithoutEnv[0].env).toEqual({});
  });
});
