/**
 * Tests for SkillIndex: activation counter fields, preservation across
 * rebuild() and refresh(), recordActivations SET semantics, and unknown-name
 * reporting. All tests use temp dirs — never touch the real .claude/skills.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { SkillStore } from './skill-store.js';
import { SkillIndex } from './skill-index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mkTmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Write a minimal SKILL.md in <skillsDir>/<name>/SKILL.md. */
function writeSkill(skillsDir: string, name: string, description = 'A test skill'): void {
  const dir = path.join(skillsDir, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n`,
    'utf8',
  );
}

// ---------------------------------------------------------------------------
// Test lifecycle
// ---------------------------------------------------------------------------

let tempDir: string;
let skillsDir: string;
let store: SkillStore;

beforeEach(() => {
  tempDir = mkTmp('skill-index-test-');
  skillsDir = path.join(tempDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  store = new SkillStore(skillsDir);
});

afterEach(() => {
  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// D3(a): activation fields preserved across rebuild()
// ---------------------------------------------------------------------------

describe('SkillIndex activation fields — rebuild()', () => {
  it('preserves activationCount and lastActivation across a full rebuild', async () => {
    writeSkill(skillsDir, 'gsd-workflow');
    writeSkill(skillsDir, 'security-hygiene');

    const index = new SkillIndex(store, skillsDir);
    await index.rebuild();

    // Record activations.
    const ts = '2026-06-10T12:00:00.000Z';
    const { recorded, unknown } = await index.recordActivations(
      new Map([['gsd-workflow', { count: 7, lastActivation: ts }]]),
    );
    expect(recorded).toEqual(['gsd-workflow']);
    expect(unknown).toEqual([]);

    // Rebuild discards nothing that was on disk skills but preserves counters.
    await index.rebuild();

    const all = await index.getAll();
    const gsd = all.find((e) => e.name === 'gsd-workflow');
    const sec = all.find((e) => e.name === 'security-hygiene');

    expect(gsd).toBeDefined();
    expect(gsd!.activationCount).toBe(7);
    expect(gsd!.lastActivation).toBe(ts);

    // security-hygiene never had activations — fields must be absent (not 0).
    expect(sec).toBeDefined();
    expect(sec!.activationCount).toBeUndefined();
    expect(sec!.lastActivation).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// D3(b): activation fields preserved across refresh() after mtime change
// ---------------------------------------------------------------------------

describe('SkillIndex activation fields — refresh()', () => {
  it('preserves activationCount and lastActivation when a skill file is touched', async () => {
    writeSkill(skillsDir, 'gsd-workflow');

    const index = new SkillIndex(store, skillsDir);
    await index.rebuild();

    const ts = '2026-06-10T08:00:00.000Z';
    await index.recordActivations(
      new Map([['gsd-workflow', { count: 3, lastActivation: ts }]]),
    );

    // Touch the file to force a refresh of this entry.
    const skillFilePath = path.join(skillsDir, 'gsd-workflow', 'SKILL.md');
    const now = Date.now();
    fs.utimesSync(skillFilePath, new Date(now + 5000), new Date(now + 5000));

    // refresh() must carry the counters forward.
    await index.refresh();

    const all = await index.getAll();
    const entry = all.find((e) => e.name === 'gsd-workflow');
    expect(entry).toBeDefined();
    expect(entry!.activationCount).toBe(3);
    expect(entry!.lastActivation).toBe(ts);
  });
});

// ---------------------------------------------------------------------------
// D3(c): recordActivations SET semantics — second call with lower count overwrites
// ---------------------------------------------------------------------------

describe('SkillIndex.recordActivations SET semantics', () => {
  it('overwrites on a second call with a lower count (SET, not increment)', async () => {
    writeSkill(skillsDir, 'gsd-workflow');

    const index = new SkillIndex(store, skillsDir);
    await index.rebuild();

    const ts1 = '2026-06-09T00:00:00.000Z';
    await index.recordActivations(
      new Map([['gsd-workflow', { count: 10, lastActivation: ts1 }]]),
    );

    const ts2 = '2026-06-10T00:00:00.000Z';
    await index.recordActivations(
      new Map([['gsd-workflow', { count: 4, lastActivation: ts2 }]]),
    );

    const all = await index.getAll();
    const entry = all.find((e) => e.name === 'gsd-workflow');
    expect(entry!.activationCount).toBe(4);   // overwritten to 4, not 14
    expect(entry!.lastActivation).toBe(ts2);
  });
});

// ---------------------------------------------------------------------------
// D3(d): unknown names returned, not written
// ---------------------------------------------------------------------------

describe('SkillIndex.recordActivations unknown names', () => {
  it('returns unknown names and does not create new entries for them', async () => {
    writeSkill(skillsDir, 'gsd-workflow');

    const index = new SkillIndex(store, skillsDir);
    await index.rebuild();

    const { recorded, unknown } = await index.recordActivations(
      new Map([
        ['gsd-workflow', { count: 5, lastActivation: null }],
        ['does-not-exist', { count: 2, lastActivation: null }],
      ]),
    );

    expect(recorded).toEqual(['gsd-workflow']);
    expect(unknown).toEqual(['does-not-exist']);

    // does-not-exist must NOT have been added to the index.
    const all = await index.getAll();
    expect(all.find((e) => e.name === 'does-not-exist')).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// D3(e): entries without activations round-trip without the fields
// ---------------------------------------------------------------------------

describe('SkillIndex back-compat — no activation fields on untouched entries', () => {
  it('entries without activations serialize without activationCount/lastActivation', async () => {
    writeSkill(skillsDir, 'gsd-workflow');
    writeSkill(skillsDir, 'security-hygiene');

    const index = new SkillIndex(store, skillsDir);
    await index.rebuild();

    // Record activations only for gsd-workflow.
    await index.recordActivations(
      new Map([['gsd-workflow', { count: 1, lastActivation: '2026-06-10T00:00:00.000Z' }]]),
    );

    // Read the raw JSON to verify field absence (not just `undefined` at runtime).
    const indexPath = path.join(skillsDir, '.skill-index.json');
    const raw = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const secEntry = (raw.entries as Array<Record<string, unknown>>).find(
      (e) => e['name'] === 'security-hygiene',
    );
    expect(secEntry).toBeDefined();
    expect('activationCount' in secEntry!).toBe(false);
    expect('lastActivation' in secEntry!).toBe(false);

    const gsdEntry = (raw.entries as Array<Record<string, unknown>>).find(
      (e) => e['name'] === 'gsd-workflow',
    );
    expect(gsdEntry).toBeDefined();
    expect(gsdEntry!['activationCount']).toBe(1);
    expect(gsdEntry!['lastActivation']).toBe('2026-06-10T00:00:00.000Z');
  });
});
