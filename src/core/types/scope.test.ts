import { describe, it, expect } from 'vitest';
import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  getSkillsBasePath,
  getSkillPath,
  parseScope,
  resolveScopedSkillPath,
  SCOPE_FLAG,
  SCOPE_FLAG_SHORT,
  type SkillScope,
} from './scope.js';

// ============================================================================
// Constants tests
// ============================================================================

describe('SCOPE_FLAG constants', () => {
  it('should have SCOPE_FLAG equal to --project', () => {
    expect(SCOPE_FLAG).toBe('--project');
  });

  it('should have SCOPE_FLAG_SHORT equal to -p', () => {
    expect(SCOPE_FLAG_SHORT).toBe('-p');
  });
});

// ============================================================================
// getSkillsBasePath tests
// ============================================================================

describe('getSkillsBasePath', () => {
  it('should return path ending with .claude/skills for project scope', () => {
    const path = getSkillsBasePath('project');
    expect(path).toBe(join('.claude', 'skills'));
    expect(path.endsWith(join('.claude', 'skills'))).toBe(true);
  });

  it('should return path containing home directory for user scope', () => {
    const path = getSkillsBasePath('user');
    expect(path).toContain('.claude');
    expect(path).toContain('skills');
    expect(path.startsWith(homedir())).toBe(true);
  });

  it('should return path with homedir for user scope', () => {
    const path = getSkillsBasePath('user');
    const expectedPath = join(homedir(), '.claude', 'skills');
    expect(path).toBe(expectedPath);
  });

  it('should return different paths for user and project scopes', () => {
    const userPath = getSkillsBasePath('user');
    const projectPath = getSkillsBasePath('project');
    expect(userPath).not.toBe(projectPath);
  });
});

// ============================================================================
// getSkillPath tests
// ============================================================================

describe('getSkillPath', () => {
  it('should construct correct full path for project scope', () => {
    const path = getSkillPath('project', 'my-skill');
    expect(path).toBe(join('.claude', 'skills', 'my-skill', 'SKILL.md'));
  });

  it('should construct correct full path for user scope', () => {
    const path = getSkillPath('user', 'my-skill');
    const expectedPath = join(homedir(), '.claude', 'skills', 'my-skill', 'SKILL.md');
    expect(path).toBe(expectedPath);
  });

  it('should include skill name in path', () => {
    const path = getSkillPath('project', 'test-skill-name');
    expect(path).toContain('test-skill-name');
  });

  it('should end with SKILL.md', () => {
    const userPath = getSkillPath('user', 'any-skill');
    const projectPath = getSkillPath('project', 'any-skill');
    expect(userPath.endsWith('SKILL.md')).toBe(true);
    expect(projectPath.endsWith('SKILL.md')).toBe(true);
  });
});

// ============================================================================
// parseScope tests
// ============================================================================

describe('parseScope', () => {
  it('should return project when SCOPE_FLAG is present', () => {
    const scope = parseScope(['--project']);
    expect(scope).toBe('project');
  });

  it('should return project when SCOPE_FLAG_SHORT is present', () => {
    const scope = parseScope(['-p']);
    expect(scope).toBe('project');
  });

  it('should return user (default) when neither flag is present', () => {
    const scope = parseScope([]);
    expect(scope).toBe('user');
  });

  it('should return user when unrelated flags are present', () => {
    const scope = parseScope(['--verbose', '-v', '--help', 'some-arg']);
    expect(scope).toBe('user');
  });

  it('should return project when SCOPE_FLAG is among other flags', () => {
    const scope = parseScope(['--verbose', '--project', '--dry-run']);
    expect(scope).toBe('project');
  });

  it('should return project when SCOPE_FLAG_SHORT is among other flags', () => {
    const scope = parseScope(['-v', '-p', '-n']);
    expect(scope).toBe('project');
  });

  it('should return user for empty array', () => {
    const scope = parseScope([]);
    expect(scope).toBe('user');
  });

  it('should handle flag-like strings that are not scope flags', () => {
    const scope = parseScope(['--projectile', '-project', 'p']);
    expect(scope).toBe('user');
  });
});

// ============================================================================
// resolveScopedSkillPath tests
// ============================================================================

describe('resolveScopedSkillPath', () => {
  it('should return correct ScopedSkillPath for user scope', () => {
    const result = resolveScopedSkillPath('user', 'test-skill');

    expect(result.scope).toBe('user');
    expect(result.basePath).toBe(join(homedir(), '.claude', 'skills'));
    expect(result.fullPath).toBe(join(homedir(), '.claude', 'skills', 'test-skill', 'SKILL.md'));
  });

  it('should return correct ScopedSkillPath for project scope', () => {
    const result = resolveScopedSkillPath('project', 'test-skill');

    expect(result.scope).toBe('project');
    expect(result.basePath).toBe(join('.claude', 'skills'));
    expect(result.fullPath).toBe(join('.claude', 'skills', 'test-skill', 'SKILL.md'));
  });

  it('should have consistent basePath with getSkillsBasePath', () => {
    const scopes: SkillScope[] = ['user', 'project'];
    for (const scope of scopes) {
      const result = resolveScopedSkillPath(scope, 'any-skill');
      expect(result.basePath).toBe(getSkillsBasePath(scope));
    }
  });

  it('should have consistent fullPath with getSkillPath', () => {
    const scopes: SkillScope[] = ['user', 'project'];
    for (const scope of scopes) {
      const result = resolveScopedSkillPath(scope, 'any-skill');
      expect(result.fullPath).toBe(getSkillPath(scope, 'any-skill'));
    }
  });
});
