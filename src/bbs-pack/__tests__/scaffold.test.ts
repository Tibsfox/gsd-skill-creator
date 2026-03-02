/**
 * BBS Pack scaffold validation tests.
 *
 * Validates the complete pack structure created by Phase 519:
 * directory layout, module placeholders, chipset configuration,
 * SKILL.md orchestrator, metadata, and references.
 *
 * Covers requirements: BBS-01.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

// ============================================================================
// YAML parsing helper (uses js-yaml)
// ============================================================================

let jsYaml: { load: (s: string) => unknown };

beforeAll(async () => {
  const mod = await import('js-yaml');
  jsYaml = mod.default ?? mod;
});

function loadYaml<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return jsYaml.load(content) as T;
}

// ============================================================================
// Module directory names
// ============================================================================

const MODULE_DIRS = [
  '01-terminal-modem',
  '02-ansi-art',
  '03-fidonet',
  '04-irc-dancer',
  '05-door-games',
];

// ============================================================================
// Group 1: Directory Structure (BBS-01)
// ============================================================================

describe('Directory Structure (BBS-01)', () => {
  it('bbs-pack root directory exists', () => {
    expect(fs.existsSync(packRoot)).toBe(true);
  });

  it('all 5 module directories exist', () => {
    for (const dir of MODULE_DIRS) {
      const fullPath = path.join(packRoot, 'modules', dir);
      expect(fs.existsSync(fullPath), `missing: modules/${dir}`).toBe(true);
    }
  });

  it('support directories exist (shared, references, __tests__)', () => {
    const supportDirs = ['shared', 'references', '__tests__'];
    for (const dir of supportDirs) {
      const fullPath = path.join(packRoot, dir);
      expect(fs.existsSync(fullPath), `missing: ${dir}`).toBe(true);
    }
  });

  it('each module directory contains content.md, assessment.md, and labs.ts', () => {
    for (const dir of MODULE_DIRS) {
      const modulePath = path.join(packRoot, 'modules', dir);
      for (const file of ['content.md', 'assessment.md', 'labs.ts']) {
        const filePath = path.join(modulePath, file);
        expect(fs.existsSync(filePath), `missing: modules/${dir}/${file}`).toBe(true);
      }
    }
  });

  it('shared/ has types.ts, ansi.ts, cp437.ts, sauce.ts', () => {
    const sharedFiles = ['types.ts', 'ansi.ts', 'cp437.ts', 'sauce.ts'];
    for (const file of sharedFiles) {
      const filePath = path.join(packRoot, 'shared', file);
      expect(fs.existsSync(filePath), `missing: shared/${file}`).toBe(true);
    }
  });
});

// ============================================================================
// Group 2: Module Content Placeholders
// ============================================================================

describe('Module Content Placeholders', () => {
  const expectedTitles: Record<string, string> = {
    '01-terminal-modem': '# Module 1: Terminal and Modem Protocols',
    '02-ansi-art': '# Module 2: ANSI Art',
    '03-fidonet': '# Module 3: FidoNet',
    '04-irc-dancer': '# Module 4: IRC and Dancer',
    '05-door-games': '# Module 5: Door Games',
  };

  it('each content.md contains the correct module title', () => {
    for (const [dir, title] of Object.entries(expectedTitles)) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'content.md'), 'utf-8');
      expect(content, `modules/${dir}/content.md should contain title`).toContain(title);
    }
  });

  it('each content.md contains tier and safety mode metadata', () => {
    for (const dir of MODULE_DIRS) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'content.md'), 'utf-8');
      expect(content, `modules/${dir}/content.md should have Tier`).toContain('Tier');
      expect(content, `modules/${dir}/content.md should have Safety Mode`).toContain('Safety Mode');
    }
  });

  it('each labs.ts exports a labs array', () => {
    for (const dir of MODULE_DIRS) {
      const content = fs.readFileSync(path.join(packRoot, 'modules', dir, 'labs.ts'), 'utf-8');
      expect(content, `modules/${dir}/labs.ts should export labs`).toContain('export const labs');
    }
  });
});

// ============================================================================
// Group 3: Chipset Configuration
// ============================================================================

interface ChipsetSkill {
  id: string;
  name: string;
  triggers: string[];
  module: string;
  tier: number;
}

interface ChipsetAgent {
  id: string;
  name: string;
  skills: string[];
  role: string;
  tier: number;
}

interface ChipsetConfig {
  name: string;
  version: string;
  skills: ChipsetSkill[];
  agents: ChipsetAgent[];
  topology: { type: string };
}

describe('Chipset Configuration', () => {
  let chipset: ChipsetConfig;

  beforeAll(() => {
    chipset = loadYaml<ChipsetConfig>(path.join(packRoot, 'chipset.yaml'));
  });

  it('defines exactly 5 skills', () => {
    expect(chipset.skills).toHaveLength(5);
  });

  it('each skill has id, name, triggers (non-empty), module, and tier', () => {
    for (const skill of chipset.skills) {
      expect(skill.id, `skill must have id`).toBeTruthy();
      expect(skill.name, `${skill.id} must have name`).toBeTruthy();
      expect(Array.isArray(skill.triggers), `${skill.id} triggers must be array`).toBe(true);
      expect(skill.triggers.length, `${skill.id} triggers must be non-empty`).toBeGreaterThan(0);
      expect(skill.module, `${skill.id} must have module`).toBeTruthy();
      expect(skill.tier, `${skill.id} must have tier`).toBeGreaterThanOrEqual(1);
      expect(skill.tier, `${skill.id} tier must be <= 3`).toBeLessThanOrEqual(3);
    }
  });

  it('defines exactly 3 agents', () => {
    expect(chipset.agents).toHaveLength(3);
  });

  it('each agent has id, name, skills (non-empty), and role', () => {
    for (const agent of chipset.agents) {
      expect(agent.id, `agent must have id`).toBeTruthy();
      expect(agent.name, `${agent.id} must have name`).toBeTruthy();
      expect(Array.isArray(agent.skills), `${agent.id} skills must be array`).toBe(true);
      expect(agent.skills.length, `${agent.id} skills must be non-empty`).toBeGreaterThan(0);
      expect(agent.role, `${agent.id} must have role`).toBeTruthy();
    }
  });

  it('all skill IDs referenced by agents exist in the skills array', () => {
    const skillIds = new Set(chipset.skills.map((s) => s.id));
    for (const agent of chipset.agents) {
      for (const skillRef of agent.skills) {
        expect(skillIds.has(skillRef), `agent ${agent.id} references unknown skill "${skillRef}"`).toBe(true);
      }
    }
  });

  it('topology type is pipeline', () => {
    expect(chipset.topology.type).toBe('pipeline');
  });
});

// ============================================================================
// Group 4: SKILL.md Orchestrator
// ============================================================================

describe('SKILL.md Orchestrator', () => {
  let skillContent: string;

  beforeAll(() => {
    skillContent = fs.readFileSync(path.join(packRoot, 'SKILL.md'), 'utf-8');
  });

  it('exists and contains frontmatter with name "bbs"', () => {
    expect(skillContent).toContain('name: bbs');
  });

  it('contains routeToModule routing description', () => {
    expect(skillContent).toContain('routeToModule');
  });

  it('lists all 5 modules in the module table', () => {
    const moduleNames = [
      'Terminal and Modem Protocols',
      'ANSI Art',
      'FidoNet',
      'IRC and Dancer',
      'Door Games',
    ];
    for (const name of moduleNames) {
      expect(skillContent, `SKILL.md should mention "${name}"`).toContain(name);
    }
  });
});

// ============================================================================
// Group 5: Metadata
// ============================================================================

interface PackMetadata {
  name: string;
  modules: { count: number; tiers: Record<string, string[]> };
  agents: { count: number };
  skills: { count: number };
  triggers: string[];
}

describe('Metadata', () => {
  let metadata: PackMetadata;

  beforeAll(() => {
    metadata = loadYaml<PackMetadata>(path.join(packRoot, 'metadata.yaml'));
  });

  it('name is "bbs"', () => {
    expect(metadata.name).toBe('bbs');
  });

  it('modules.count is 5', () => {
    expect(metadata.modules.count).toBe(5);
  });

  it('agents.count is 3', () => {
    expect(metadata.agents.count).toBe(3);
  });

  it('skills.count is 5', () => {
    expect(metadata.skills.count).toBe(5);
  });

  it('triggers is a non-empty array', () => {
    expect(Array.isArray(metadata.triggers)).toBe(true);
    expect(metadata.triggers.length).toBeGreaterThan(0);
  });

  it('all 5 module IDs are listed across tiers', () => {
    const allModules = Object.values(metadata.modules.tiers).flat();
    for (const dir of MODULE_DIRS) {
      expect(allModules, `metadata tiers should include ${dir}`).toContain(dir);
    }
  });
});

// ============================================================================
// Group 6: References
// ============================================================================

describe('References', () => {
  it('bibliography.md contains Citation Convention section', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'bibliography.md'), 'utf-8');
    expect(content).toContain('Citation Convention');
  });

  it('bibliography.md contains primary BBS sources', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'bibliography.md'), 'utf-8');
    expect(content).toContain('SAUCE');
    expect(content).toContain('FTS-0001');
    expect(content).toContain('RFC 1459');
    expect(content).toContain('CP437');
  });

  it('bibliography.md does NOT reference Horowitz & Hill', () => {
    const content = fs.readFileSync(path.join(packRoot, 'references', 'bibliography.md'), 'utf-8');
    expect(content).not.toContain('Horowitz');
    expect(content).not.toContain('Hill');
  });
});
