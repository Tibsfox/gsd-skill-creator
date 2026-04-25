/**
 * Integration test suite.
 *
 * End-to-end auditAll() smoke test plus the Gate G10 hard-preservation
 * invariants:
 *   - Default-off byte-identical (flag false → empty + disabled marker, no reads).
 *   - CAPCOM source-regex audit (no imports of orchestration/dacp/capcom).
 *   - Read-only verification on PASS path (no writes anywhere under the
 *     fixture skill library).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import * as skilldex from '../index.js';

const SRC_DIR = path.resolve(__dirname, '..');

// ---------- helpers ----------

let tmpRoot: string;
let skillsDir: string;
let configPath: string;

function writeConfig(enabled: boolean): void {
  const cfg = {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'skilldex-auditor': { enabled },
      },
    },
  };
  fs.writeFileSync(configPath, JSON.stringify(cfg));
}

function writeSkill(name: string, content: string): string {
  const dir = path.join(skillsDir, name);
  fs.mkdirSync(dir, { recursive: true });
  const fp = path.join(dir, 'SKILL.md');
  fs.writeFileSync(fp, content);
  return fp;
}

beforeEach(() => {
  tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'skilldex-integration-'));
  skillsDir = path.join(tmpRoot, 'skills');
  configPath = path.join(tmpRoot, 'config.json');
  fs.mkdirSync(skillsDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

// ---------- end-to-end ----------

describe('auditAll — end-to-end', () => {
  it('walks a fixture skill library and produces a structured report', async () => {
    writeSkill(
      'good',
      '---\nname: good-skill\ndescription: A good skill.\nversion: 1.0\n---\n# Good\n',
    );
    writeSkill(
      'broken',
      '---\ndescription: missing name\n---\n# Broken\n',
    );
    writeConfig(true);

    const report = await skilldex.auditAll(skillsDir, configPath);
    expect(report.disabled).toBe(false);
    expect(report.inspected).toBe(2);
    expect(report.summary.fail).toBeGreaterThanOrEqual(1);
    expect(report.summary.pass).toBeGreaterThanOrEqual(1);
    expect(report.findings.length).toBeGreaterThanOrEqual(4);
  });
});

// ---------- gate G10 hard preservation ----------

describe('Gate G10 — default-off byte-identical', () => {
  it('auditSkill returns [] and reads no skill file when flag is off', async () => {
    const skillFile = writeSkill(
      'never-read',
      '---\nname: never-read\ndescription: should not be parsed\n---\n# X\n',
    );
    writeConfig(false);

    const before = fs.statSync(skillFile);
    const findings = await skilldex.auditSkill(skillFile, configPath);
    const after = fs.statSync(skillFile);

    expect(findings).toEqual([]);
    // atime may or may not change depending on filesystem; mtime/size MUST not.
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(after.size).toBe(before.size);
  });

  it('auditAll returns disabled report when flag is off', async () => {
    writeSkill(
      'good',
      '---\nname: good-skill\ndescription: A good skill.\n---\n# Good\n',
    );
    writeConfig(false);

    const report = await skilldex.auditAll(skillsDir, configPath);
    expect(report.disabled).toBe(true);
    expect(report.inspected).toBe(0);
    expect(report.findings).toEqual([]);
    expect(report.summary).toEqual({ pass: 0, warn: 0, fail: 0 });
  });

  it('auditAll returns disabled report when config file is absent', async () => {
    writeSkill(
      'good',
      '---\nname: good-skill\ndescription: A good skill.\n---\n# Good\n',
    );
    // No config file at all.
    const report = await skilldex.auditAll(
      skillsDir,
      path.join(tmpRoot, 'no-config-here.json'),
    );
    expect(report.disabled).toBe(true);
    expect(report.inspected).toBe(0);
  });
});

describe('Gate G10 — read-only on PASS path', () => {
  it('auditAll does not touch skill file mtime/size on a PASS run', async () => {
    const fp = writeSkill(
      'good',
      '---\nname: good-skill\ndescription: A.\nversion: 1.0\n---\n# Good\n',
    );
    writeConfig(true);
    const before = fs.statSync(fp);
    await skilldex.auditAll(skillsDir, configPath);
    const after = fs.statSync(fp);
    expect(after.mtimeMs).toBe(before.mtimeMs);
    expect(after.size).toBe(before.size);
  });
});

describe('Gate G10 — CAPCOM source-regex audit', () => {
  it('no source file imports from src/orchestration|dacp|capcom', () => {
    const offenders: string[] = [];
    const stack: string[] = [SRC_DIR];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === '__tests__') continue;
          stack.push(fp);
        } else if (ent.isFile() && fp.endsWith('.ts')) {
          const text = fs.readFileSync(fp, 'utf8');
          if (/src\/(orchestration|dacp|capcom)/.test(text)) {
            offenders.push(fp);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('no source file writes into the skill-library paths', () => {
    const offenders: string[] = [];
    const stack: string[] = [SRC_DIR];
    while (stack.length > 0) {
      const dir = stack.pop()!;
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        const fp = path.join(dir, ent.name);
        if (ent.isDirectory()) {
          if (ent.name === '__tests__') continue;
          stack.push(fp);
        } else if (ent.isFile() && fp.endsWith('.ts')) {
          const text = fs.readFileSync(fp, 'utf8');
          if (/fs\.(writeFile|appendFile|writeFileSync|appendFileSync)/.test(text)) {
            offenders.push(fp);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('Public API surface', () => {
  it('exports auditSkill and auditAll', () => {
    expect(typeof skilldex.auditSkill).toBe('function');
    expect(typeof skilldex.auditAll).toBe('function');
  });

  it('exports the conformance + emitter + registry primitives', () => {
    expect(typeof skilldex.parseSkillFile).toBe('function');
    expect(typeof skilldex.scoreSpec).toBe('function');
    expect(typeof skilldex.emitFinding).toBe('function');
    expect(typeof skilldex.parseReport).toBe('function');
    expect(typeof skilldex.listRegistry).toBe('function');
    expect(typeof skilldex.isSkilldexAuditorEnabled).toBe('function');
  });
});
