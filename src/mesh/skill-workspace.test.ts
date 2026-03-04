import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { SkillWorkspace } from './skill-workspace.js';
import { OperationTracker } from './operation-tracker.js';

describe('SkillWorkspace', () => {
  let skillsDir: string;

  beforeEach(async () => {
    skillsDir = await mkdtemp(join(tmpdir(), 'skill-workspace-'));
  });

  afterEach(async () => {
    await rm(skillsDir, { recursive: true, force: true });
  });

  it('listSkills() returns empty array for empty directory', async () => {
    const workspace = new SkillWorkspace(skillsDir);
    const skills = await workspace.listSkills();
    expect(skills).toEqual([]);
  });

  it('listSkills() returns empty array for nonexistent directory', async () => {
    const workspace = new SkillWorkspace(join(skillsDir, 'nonexistent'));
    const skills = await workspace.listSkills();
    expect(skills).toEqual([]);
  });

  it('listSkills() returns skill entries with name, status, testedModels, lastModified', async () => {
    // Create two skill directories with SKILL.md
    const skill1Dir = join(skillsDir, 'alpha-skill');
    const skill2Dir = join(skillsDir, 'beta-skill');
    await mkdir(skill1Dir, { recursive: true });
    await mkdir(skill2Dir, { recursive: true });
    await writeFile(join(skill1Dir, 'SKILL.md'), '# Alpha', 'utf-8');
    await writeFile(join(skill2Dir, 'SKILL.md'), '# Beta', 'utf-8');

    // Set beta-skill to tested state
    const tracker = new OperationTracker(skill2Dir);
    await tracker.load();
    tracker.advance('tested');
    await tracker.save();

    const workspace = new SkillWorkspace(skillsDir);
    const skills = await workspace.listSkills();

    expect(skills).toHaveLength(2);
    // Sorted by name
    expect(skills[0].name).toBe('alpha-skill');
    expect(skills[0].status).toBe('draft');
    expect(skills[0].testedModels).toBe(0);
    expect(skills[0].lastModified).toBeTruthy();

    expect(skills[1].name).toBe('beta-skill');
    expect(skills[1].status).toBe('tested');
    expect(skills[1].testedModels).toBe(1);
  });

  it('listSkills() handles skills with no .skill-status.json (defaults to draft)', async () => {
    const skillDir = join(skillsDir, 'no-status');
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '# No Status', 'utf-8');

    const workspace = new SkillWorkspace(skillsDir);
    const skills = await workspace.listSkills();

    expect(skills).toHaveLength(1);
    expect(skills[0].status).toBe('draft');
    expect(skills[0].testedModels).toBe(0);
  });

  it('getSkillSummary(name) returns detailed info for one skill', async () => {
    const skillDir = join(skillsDir, 'my-skill');
    await mkdir(skillDir, { recursive: true });
    await writeFile(join(skillDir, 'SKILL.md'), '# My Skill', 'utf-8');

    const tracker = new OperationTracker(skillDir);
    await tracker.load();
    tracker.advance('tested');
    tracker.advance('graded');
    await tracker.save();

    const workspace = new SkillWorkspace(skillsDir);
    const summary = await workspace.getSkillSummary('my-skill');

    expect(summary).not.toBeNull();
    expect(summary!.name).toBe('my-skill');
    expect(summary!.status).toBe('graded');
    expect(summary!.testedModels).toBe(1);
    expect(summary!.lastModified).toBeTruthy();
  });

  it('getSkillSummary() returns null for nonexistent skill', async () => {
    const workspace = new SkillWorkspace(skillsDir);
    const summary = await workspace.getSkillSummary('nonexistent');
    expect(summary).toBeNull();
  });

  it('listSkills() skips directories without SKILL.md', async () => {
    const emptyDir = join(skillsDir, 'no-skill-md');
    await mkdir(emptyDir, { recursive: true });

    const workspace = new SkillWorkspace(skillsDir);
    const skills = await workspace.listSkills();
    expect(skills).toEqual([]);
  });

  it('listSkills() skips hidden directories', async () => {
    const hiddenDir = join(skillsDir, '.hidden');
    await mkdir(hiddenDir, { recursive: true });
    await writeFile(join(hiddenDir, 'SKILL.md'), '# Hidden', 'utf-8');

    const workspace = new SkillWorkspace(skillsDir);
    const skills = await workspace.listSkills();
    expect(skills).toEqual([]);
  });
});
