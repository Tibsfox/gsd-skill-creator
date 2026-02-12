import { describe, it, expect } from 'vitest';
import { stripToPortable, exportPortableContent } from './portable-exporter.js';
import type { SkillMetadata, Skill } from '../types/skill.js';

// ============================================================================
// stripToPortable() tests
// ============================================================================

describe('stripToPortable', () => {
  it('returns only standard fields for minimal input', () => {
    const metadata: SkillMetadata = {
      name: 'my-skill',
      description: 'A simple skill',
    };

    const result = stripToPortable(metadata);

    expect(result).toEqual({
      name: 'my-skill',
      description: 'A simple skill',
    });
    // Must NOT have any extra keys
    expect(Object.keys(result)).toEqual(['name', 'description']);
  });

  it('preserves optional standard fields: license and compatibility', () => {
    const metadata: SkillMetadata = {
      name: 'licensed-skill',
      description: 'Skill with license',
      license: 'MIT',
      compatibility: 'Claude Code 1.0+',
    };

    const result = stripToPortable(metadata);

    expect(result.license).toBe('MIT');
    expect(result.compatibility).toBe('Claude Code 1.0+');
  });

  it('converts allowed-tools from string[] to space-delimited string', () => {
    const metadata: SkillMetadata = {
      name: 'tools-skill',
      description: 'Skill with tools',
      'allowed-tools': ['Read', 'Write', 'Grep'],
    };

    const result = stripToPortable(metadata);

    expect(result['allowed-tools']).toBe('Read Write Grep');
  });

  it('converts allowed-tools from single-element array to single string', () => {
    const metadata: SkillMetadata = {
      name: 'single-tool',
      description: 'Single tool skill',
      'allowed-tools': ['Read'],
    };

    const result = stripToPortable(metadata);

    expect(result['allowed-tools']).toBe('Read');
  });

  it('handles allowed-tools that is already a string (passes through trimmed)', () => {
    const metadata: SkillMetadata = {
      name: 'string-tools',
      description: 'String tools skill',
      'allowed-tools': '  Read Write  ',
    };

    const result = stripToPortable(metadata);

    expect(result['allowed-tools']).toBe('Read Write');
  });

  it('omits allowed-tools entirely when empty array', () => {
    const metadata: SkillMetadata = {
      name: 'no-tools',
      description: 'No tools skill',
      'allowed-tools': [],
    };

    const result = stripToPortable(metadata);

    expect(result['allowed-tools']).toBeUndefined();
    expect('allowed-tools' in result).toBe(false);
  });

  it('strips all Claude extension fields', () => {
    const metadata: SkillMetadata = {
      name: 'extended-skill',
      description: 'Skill with extensions',
      context: 'fork',
      agent: 'my-agent',
      model: 'claude-sonnet-4-20250514',
      hooks: { pre: 'echo hello' },
      'disable-model-invocation': true,
      'user-invocable': true,
      'argument-hint': 'file path',
    };

    const result = stripToPortable(metadata);

    expect(result).toEqual({
      name: 'extended-skill',
      description: 'Skill with extensions',
    });
    expect('context' in result).toBe(false);
    expect('agent' in result).toBe(false);
    expect('model' in result).toBe(false);
    expect('hooks' in result).toBe(false);
    expect('disable-model-invocation' in result).toBe(false);
    expect('user-invocable' in result).toBe(false);
    expect('argument-hint' in result).toBe(false);
  });

  it('strips metadata.extensions[gsd-skill-creator] block', () => {
    const metadata: SkillMetadata = {
      name: 'gsd-skill',
      description: 'Skill with GSD extensions',
      metadata: {
        extensions: {
          'gsd-skill-creator': {
            version: 3,
            enabled: true,
            createdAt: '2025-01-01',
          },
        },
      },
    };

    const result = stripToPortable(metadata);

    // metadata should be omitted since it's empty after stripping
    expect(result.metadata).toBeUndefined();
    expect('metadata' in result).toBe(false);
  });

  it('preserves non-extension metadata keys', () => {
    const metadata: SkillMetadata = {
      name: 'meta-skill',
      description: 'Skill with metadata',
      metadata: {
        extensions: {
          'gsd-skill-creator': { version: 1 },
        },
        author: 'test-user',
        version: '1.0',
      } as SkillMetadata['metadata'],
    };

    const result = stripToPortable(metadata);

    expect(result.metadata).toEqual({
      author: 'test-user',
      version: '1.0',
    });
  });

  it('omits metadata entirely when empty after stripping extensions', () => {
    const metadata: SkillMetadata = {
      name: 'empty-meta',
      description: 'Only GSD extensions in metadata',
      metadata: {
        extensions: {
          'gsd-skill-creator': { enabled: true },
        },
      },
    };

    const result = stripToPortable(metadata);

    expect('metadata' in result).toBe(false);
  });

  it('handles legacy root-level GSD fields - all stripped', () => {
    const metadata: SkillMetadata = {
      name: 'legacy-skill',
      description: 'Skill with legacy fields',
      triggers: { intents: ['deploy'], threshold: 0.8 },
      learning: { applicationCount: 5 },
      enabled: true,
      version: 2,
      extends: 'base-skill',
      createdAt: '2025-01-01',
      updatedAt: '2025-06-01',
    };

    const result = stripToPortable(metadata);

    expect(result).toEqual({
      name: 'legacy-skill',
      description: 'Skill with legacy fields',
    });
    expect('triggers' in result).toBe(false);
    expect('learning' in result).toBe(false);
    expect('enabled' in result).toBe(false);
    expect('version' in result).toBe(false);
    expect('extends' in result).toBe(false);
    expect('createdAt' in result).toBe(false);
    expect('updatedAt' in result).toBe(false);
  });

  it('handles skill with ALL fields set (kitchen sink test)', () => {
    const metadata: SkillMetadata = {
      name: 'kitchen-sink',
      description: 'Every field populated',
      license: 'Apache-2.0',
      compatibility: 'Claude Code 2.0+',
      'allowed-tools': ['Read', 'Write'],
      'disable-model-invocation': true,
      'user-invocable': true,
      'argument-hint': 'path',
      model: 'claude-sonnet-4-20250514',
      context: 'fork',
      agent: 'security-agent',
      hooks: { pre: 'lint' },
      triggers: { intents: ['test'] },
      learning: { applicationCount: 10 },
      enabled: true,
      version: 5,
      extends: 'parent-skill',
      createdAt: '2025-01-01',
      updatedAt: '2025-12-01',
      metadata: {
        extensions: {
          'gsd-skill-creator': { version: 5, enabled: true },
          'other-tool': { setting: 'value' },
        },
        author: 'foxy',
      } as SkillMetadata['metadata'],
    };

    const result = stripToPortable(metadata);

    expect(result).toEqual({
      name: 'kitchen-sink',
      description: 'Every field populated',
      license: 'Apache-2.0',
      compatibility: 'Claude Code 2.0+',
      'allowed-tools': 'Read Write',
      metadata: {
        extensions: {
          'other-tool': { setting: 'value' },
        },
        author: 'foxy',
      },
    });
  });
});

// ============================================================================
// exportPortableContent() tests
// ============================================================================

describe('exportPortableContent', () => {
  it('produces valid YAML frontmatter with --- delimiters', () => {
    const skill: Skill = {
      metadata: {
        name: 'export-test',
        description: 'Test export',
      },
      body: '# Instructions\n\nDo the thing.',
      path: '/skills/export-test.md',
    };

    const result = exportPortableContent(skill);

    expect(result).toMatch(/^---\n/);
    expect(result).toMatch(/\n---\n/);
    expect(result).toContain('name: export-test');
    expect(result).toContain('description: Test export');
  });

  it('body content is preserved exactly', () => {
    const body = '# My Skill\n\nDo **exactly** this:\n\n1. Step one\n2. Step two\n';
    const skill: Skill = {
      metadata: {
        name: 'body-test',
        description: 'Body preservation test',
      },
      body,
      path: '/skills/body-test.md',
    };

    const result = exportPortableContent(skill);

    // Body should appear after frontmatter
    const parts = result.split('---');
    // parts[0] is empty (before first ---), parts[1] is frontmatter, parts[2] is body
    const bodyPart = parts.slice(2).join('---').trim();
    expect(bodyPart).toContain('# My Skill');
    expect(bodyPart).toContain('Do **exactly** this:');
    expect(bodyPart).toContain('1. Step one');
  });

  it('content paths are normalized to forward slashes', () => {
    const skill: Skill = {
      metadata: {
        name: 'path-test',
        description: 'Path normalization in export',
      },
      body: 'See [reference](references\\GUIDE.md) and run scripts\\build.sh',
      path: '/skills/path-test.md',
    };

    const result = exportPortableContent(skill);

    expect(result).toContain('references/GUIDE.md');
    expect(result).toContain('scripts/build.sh');
    expect(result).not.toContain('references\\GUIDE.md');
    expect(result).not.toContain('scripts\\build.sh');
  });
});
