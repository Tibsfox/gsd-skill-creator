import { describe, it, expect } from 'vitest';
import { buildSkillSkeleton, titleFromName, SKILL_PRESETS, type SkillPreset } from './skill-skeletons.js';

describe('titleFromName', () => {
  it('title-cases a lowercase-hyphen name', () => {
    expect(titleFromName('my-cool-skill')).toBe('My Cool Skill');
  });
  it('falls back to Skill for an empty name', () => {
    expect(titleFromName('')).toBe('Skill');
  });
});

describe('buildSkillSkeleton', () => {
  const presets: SkillPreset[] = ['workflow-guide', 'reference', 'checklist', 'blank'];

  it('every preset produces a non-empty body with an H1 title and the description', () => {
    for (const preset of presets) {
      const body = buildSkillSkeleton(preset, 'deploy-helper', 'Helps deploy the app');
      expect(body.startsWith('# Deploy Helper')).toBe(true);
      expect(body).toContain('Helps deploy the app');
      expect(body.length).toBeGreaterThan(10);
    }
  });

  it('workflow-guide has a Steps section, checklist has task boxes, reference has a code fence', () => {
    expect(buildSkillSkeleton('workflow-guide', 'x', 'd')).toContain('## Steps');
    expect(buildSkillSkeleton('checklist', 'x', 'd')).toContain('- [ ]');
    expect(buildSkillSkeleton('reference', 'x', 'd')).toContain('```');
  });

  it('blank is minimal (title + description only, no sections)', () => {
    const body = buildSkillSkeleton('blank', 'x', 'd');
    expect(body).not.toContain('##');
  });

  it('falls back to a description placeholder when none is given', () => {
    expect(buildSkillSkeleton('blank', 'x', '')).toContain('Describe what this skill does.');
  });

  it('SKILL_PRESETS covers exactly the four presets', () => {
    expect(SKILL_PRESETS.map((p) => p.value).sort()).toEqual(
      ['blank', 'checklist', 'reference', 'workflow-guide'],
    );
  });
});
