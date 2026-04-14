import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SkillStore } from '../../storage/skill-store.js';
import { validateSingleSkill } from './validate.js';

async function makeSkillAndValidate(
  store: SkillStore,
  skillsDir: string,
  name: string,
  metadata: Record<string, unknown>,
  body = '# body\n',
) {
  await store.create(name, metadata as any, body);
  const skillPath = path.join(skillsDir, name, 'SKILL.md');
  return validateSingleSkill(store, name, 'current', skillPath);
}

describe('validateSingleSkill — CSO description warnings (Phase B)', () => {
  let tempDir: string;
  let skillsDir: string;
  let store: SkillStore;
  let prevStrict: string | undefined;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'validate-cso-'));
    skillsDir = path.join(tempDir, 'skills');
    fs.mkdirSync(skillsDir, { recursive: true });
    store = new SkillStore(skillsDir);
    prevStrict = process.env.GSD_CSO_STRICT;
    delete process.env.GSD_CSO_STRICT;
  });

  afterEach(() => {
    if (prevStrict === undefined) delete process.env.GSD_CSO_STRICT;
    else process.env.GSD_CSO_STRICT = prevStrict;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('emits warning when description contains capability verbs (default mode)', async () => {
    const result = await makeSkillAndValidate(store, skillsDir, 'cap-verb-skill', {
      name: 'cap-verb-skill',
      description: 'Manages workflow state and orchestrates handoffs.',
    });
    expect(result.warnings.some(w => w.includes('CSO') && w.toLowerCase().includes('manages'))).toBe(true);
    // CSO is warning-only by default — must not flip validity
    expect(result.errors.some(e => e.includes('CSO'))).toBe(false);
  });

  it('does not emit CSO warning for CSO-clean description', async () => {
    const result = await makeSkillAndValidate(store, skillsDir, 'clean-skill', {
      name: 'clean-skill',
      description: 'Use when the user asks for help before proceeding.',
    });
    expect(result.warnings.some(w => w.includes('CSO'))).toBe(false);
  });

  it('emits word-budget warning when on-demand description exceeds 500 words', async () => {
    // 501 two-character words = 1002 chars + 500 spaces = 1002 chars, under the 1024 schema cap
    // Use 'ab' (2 chars) * 501 = 1002 + 500 spaces = 1502 — too long.
    // Use single-char 'a' * 501 = 501 + 500 spaces = 1001 chars, under cap.
    const longDesc = Array(501).fill('a').join(' ');
    const result = await makeSkillAndValidate(store, skillsDir, 'wordy-ondemand', {
      name: 'wordy-ondemand',
      description: longDesc,
    });
    expect(result.warnings.some(w => w.includes('Word budget') && w.includes('500'))).toBe(true);
  });

  it('promotes CSO findings to errors when GSD_CSO_STRICT=1', async () => {
    process.env.GSD_CSO_STRICT = '1';
    const result = await makeSkillAndValidate(store, skillsDir, 'strict-skill', {
      name: 'strict-skill',
      description: 'Manages workflow state.',
    });
    expect(result.errors.some(e => e.includes('CSO') && e.toLowerCase().includes('manages'))).toBe(true);
    expect(result.valid).toBe(false);
  });
});
