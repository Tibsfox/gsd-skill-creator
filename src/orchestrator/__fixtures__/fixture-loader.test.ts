/**
 * Tests for the fixture loader utility and fixture file integrity.
 *
 * Validates:
 * - fixture-loader.ts resolves correct absolute paths
 * - All 27 command fixtures have valid frontmatter with name and description
 * - All command fixtures have an <objective> tag
 * - Agent fixtures have gsd-* prefix and valid frontmatter
 * - Team config.json is valid JSON with required fields
 * - VERSION file contains semver string
 * - Planning fixtures exist and contain expected content
 * - GsdDiscoveryService can discover from fixture directory
 */

import { describe, it, expect } from 'vitest';
import { access, readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { getFixturePath, getFixturePaths } from './fixture-loader.js';
import { GsdDiscoveryService } from '../discovery/discovery-service.js';

// ============================================================================
// Fixture Loader
// ============================================================================

describe('fixture-loader', () => {
  it('getFixturePath returns absolute path', () => {
    const result = getFixturePath();
    expect(result).toMatch(/^\//);
  });

  it('getFixturePath default version resolves to gsd-v1.15', () => {
    const result = getFixturePath();
    expect(result).toMatch(/gsd-v1\.15$/);
  });

  it('getFixturePaths returns both gsdBase and planningDir', () => {
    const result = getFixturePaths();
    expect(typeof result.gsdBase).toBe('string');
    expect(typeof result.planningDir).toBe('string');
  });

  it('getFixturePaths.gsdBase points to existing directory', async () => {
    const { gsdBase } = getFixturePaths();
    await expect(access(gsdBase)).resolves.toBeUndefined();
  });

  it('getFixturePaths.planningDir points to existing directory', async () => {
    const { planningDir } = getFixturePaths();
    await expect(access(planningDir)).resolves.toBeUndefined();
  });
});

// ============================================================================
// Fixture Integrity - Commands
// ============================================================================

describe('fixture integrity - commands', () => {
  const commandsDir = () => join(getFixturePath(), 'commands', 'gsd');

  it('gsd-v1.15 contains 27 command files', async () => {
    const entries = await readdir(commandsDir());
    const mdFiles = entries.filter((f) => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(27);
  });

  it('all command fixtures have valid frontmatter with name and description', async () => {
    const entries = await readdir(commandsDir());
    const mdFiles = entries.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const content = await readFile(join(commandsDir(), file), 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch, `${file}: missing frontmatter`).toBeTruthy();

      const fm = fmMatch![1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      expect(nameMatch, `${file}: missing name`).toBeTruthy();
      expect(nameMatch![1].trim()).toMatch(/^gsd:/);

      const descMatch = fm.match(/^description:\s*(.+)$/m);
      expect(descMatch, `${file}: missing description`).toBeTruthy();
      expect(descMatch![1].trim().length).toBeGreaterThan(0);
    }
  });

  it('all command fixtures have an <objective> tag', async () => {
    const entries = await readdir(commandsDir());
    const mdFiles = entries.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const content = await readFile(join(commandsDir(), file), 'utf-8');
      expect(content, `${file}: missing <objective>`).toContain('<objective>');
    }
  });
});

// ============================================================================
// Fixture Integrity - Agents
// ============================================================================

describe('fixture integrity - agents', () => {
  const agentsDir = () => join(getFixturePath(), 'agents');

  it('gsd-v1.15 contains agent files with gsd-* prefix', async () => {
    const entries = await readdir(agentsDir());
    const mdFiles = entries.filter((f) => f.endsWith('.md'));
    expect(mdFiles.length).toBeGreaterThan(0);

    for (const file of mdFiles) {
      expect(file, `${file}: does not start with gsd-`).toMatch(/^gsd-/);
    }
  });

  it('all agent fixtures have valid frontmatter', async () => {
    const entries = await readdir(agentsDir());
    const mdFiles = entries.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const content = await readFile(join(agentsDir(), file), 'utf-8');
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch, `${file}: missing frontmatter`).toBeTruthy();

      const fm = fmMatch![1];
      const nameMatch = fm.match(/^name:\s*(.+)$/m);
      expect(nameMatch, `${file}: missing name`).toBeTruthy();

      const descMatch = fm.match(/^description:\s*(.+)$/m);
      expect(descMatch, `${file}: missing description`).toBeTruthy();
    }
  });
});

// ============================================================================
// Fixture Integrity - Teams
// ============================================================================

describe('fixture integrity - teams', () => {
  const teamsDir = () => join(getFixturePath(), 'teams');

  it('gsd-v1.15 has at least one team config', async () => {
    const entries = await readdir(teamsDir());
    const teamDirs = entries.filter(async (entry) => {
      try {
        await access(join(teamsDir(), entry, 'config.json'));
        return true;
      } catch {
        return false;
      }
    });
    expect(teamDirs.length).toBeGreaterThan(0);
  });

  it('team config.json is valid JSON with required fields', async () => {
    const configPath = join(teamsDir(), 'gsd-research-team', 'config.json');
    const content = await readFile(configPath, 'utf-8');
    const config = JSON.parse(content);

    expect(config.name).toBeTruthy();
    expect(config.members).toBeDefined();
    expect(Array.isArray(config.members)).toBe(true);
    expect(config.leadAgentId).toBeTruthy();
  });
});

// ============================================================================
// Fixture Integrity - VERSION
// ============================================================================

describe('fixture integrity - VERSION', () => {
  it('VERSION file contains version string', async () => {
    const versionPath = join(getFixturePath(), 'get-shit-done', 'VERSION');
    const content = await readFile(versionPath, 'utf-8');
    expect(content.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

// ============================================================================
// Fixture Integrity - Planning
// ============================================================================

describe('fixture integrity - planning', () => {
  const planningDir = () => getFixturePaths().planningDir;

  it('planning/ROADMAP.md exists and contains phases', async () => {
    const content = await readFile(join(planningDir(), 'ROADMAP.md'), 'utf-8');
    expect(content).toContain('Phase');
  });

  it('planning/STATE.md exists and contains position', async () => {
    const content = await readFile(join(planningDir(), 'STATE.md'), 'utf-8');
    expect(content).toContain('Phase:');
  });

  it('planning/config.json is valid JSON', async () => {
    const content = await readFile(join(planningDir(), 'config.json'), 'utf-8');
    const config = JSON.parse(content);
    expect(config.mode).toBeDefined();
  });
});

// ============================================================================
// Fixture Discovery Integration
// ============================================================================

describe('fixture discovery integration', () => {
  it('GsdDiscoveryService can discover from fixture directory', async () => {
    const fixturePath = getFixturePath();
    const service = new GsdDiscoveryService(fixturePath);
    const result = await service.discover();

    expect(result.commands).toHaveLength(27);
    expect(result.agents.length).toBeGreaterThanOrEqual(1);
    expect(result.teams.length).toBeGreaterThanOrEqual(1);

    // No parse errors for commands
    const parseErrors = service.warnings.filter(
      (w) => w.type === 'parse-error' && w.path.includes('commands'),
    );
    expect(parseErrors, `Parse errors: ${JSON.stringify(parseErrors)}`).toHaveLength(0);
  });
});
