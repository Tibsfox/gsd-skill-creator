// CF-H-032 — agentskills.io 2025-10-02 spec compliance for SKILL.md.
//
// Verifies that every SKILL.md under project-claude/skills/ declares the
// four canonical fields the spec requires: version, format, triggers, and
// status. Status must be one of the 5 lifecycle values (uppercase) so
// that the state machine in CF-H-033 can reason about transitions.
//
// Closes: OGA-032 (MEDIUM).

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  splitFrontmatter,
  hasKey,
  VALID_STATUSES,
  SPEC_FORMAT,
  SPEC_VERSION,
} from '../../../scripts/skill-migrate-spec-fields.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..');
const SKILLS_DIR = resolve(REPO_ROOT, 'project-claude', 'skills');

function discoverSkillFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...discoverSkillFiles(p));
    else if (entry.isFile() && entry.name === 'SKILL.md') out.push(p);
  }
  return out;
}

const SKILL_FILES = discoverSkillFiles(SKILLS_DIR);

describe('CF-H-032: skill SOT discovery', () => {
  it('locates the project-claude/skills/ source-of-truth tree', () => {
    expect(SKILL_FILES.length).toBeGreaterThanOrEqual(28);
  });

  it('finds the four expected anchor skills', () => {
    const names = SKILL_FILES.map((p) => p.split('/').slice(-2)[0]);
    expect(names).toContain('security-hygiene');
    expect(names).toContain('sling-dispatch');
    expect(names).toContain('done-retirement');
    expect(names).toContain('gupp-propulsion');
  });
});

describe('CF-H-032: agentskills.io spec field coverage', () => {
  it.each(SKILL_FILES.map((p) => [p.split('/').slice(-2)[0], p] as const))(
    '%s declares version, format, triggers, and status',
    (_name, path) => {
      const text = readFileSync(path, 'utf-8');
      const { raw, hadFrontmatter } = splitFrontmatter(text);
      expect(hadFrontmatter).toBe(true);
      expect(hasKey(raw, 'version')).toBe(true);
      expect(hasKey(raw, 'format')).toBe(true);
      expect(hasKey(raw, 'triggers')).toBe(true);
      expect(hasKey(raw, 'status')).toBe(true);
    },
  );
});

describe('CF-H-032: spec field values are canonical', () => {
  it.each(SKILL_FILES.map((p) => [p.split('/').slice(-2)[0], p] as const))(
    '%s uses canonical SPEC_FORMAT and a semver-shaped version',
    (_name, path) => {
      const text = readFileSync(path, 'utf-8');
      const { raw } = splitFrontmatter(text);
      const versionMatch = /^version\s*:\s*([^\n]+)$/m.exec(raw);
      const formatMatch = /^format\s*:\s*([^\n]+)$/m.exec(raw);
      // Accept any semver-shaped value (skills may have bumped past 1.0.0
      // independently — e.g. session-observatory-live is 1.1.0).
      expect(versionMatch?.[1].trim()).toMatch(/^\d+\.\d+\.\d+$/);
      expect(formatMatch?.[1].trim()).toBe(SPEC_FORMAT);
    },
  );

  it('SPEC_VERSION constant is 1.0.0 (the migration baseline)', () => {
    expect(SPEC_VERSION).toBe('1.0.0');
  });
});

describe('CF-H-032: status uses uppercase lifecycle values', () => {
  it.each(SKILL_FILES.map((p) => [p.split('/').slice(-2)[0], p] as const))(
    '%s status is one of DRAFT/ACTIVE/DEPRECATED/RETIRED/ARCHIVED',
    (_name, path) => {
      const text = readFileSync(path, 'utf-8');
      const { raw } = splitFrontmatter(text);
      const statusMatch = /^status\s*:\s*([^\n]+)$/m.exec(raw);
      expect(statusMatch).toBeTruthy();
      const value = statusMatch![1].trim();
      expect((VALID_STATUSES as readonly string[]).includes(value)).toBe(true);
    },
  );
});

describe('CF-H-032: triggers field is a non-empty list', () => {
  it.each(SKILL_FILES.map((p) => [p.split('/').slice(-2)[0], p] as const))(
    '%s declares at least one trigger entry',
    (_name, path) => {
      const text = readFileSync(path, 'utf-8');
      const { raw } = splitFrontmatter(text);
      // Locate the triggers: block and ensure at least one '  - ' item line.
      const lines = raw.split('\n');
      const idx = lines.findIndex((l) => /^triggers\s*:/.test(l));
      expect(idx).toBeGreaterThanOrEqual(0);
      let count = 0;
      for (let j = idx + 1; j < lines.length; j++) {
        if (/^\S/.test(lines[j])) break;
        if (/^\s+-\s+/.test(lines[j])) count++;
      }
      expect(count).toBeGreaterThan(0);
    },
  );
});
