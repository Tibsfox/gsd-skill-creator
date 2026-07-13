import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFlywheelArgs, buildConceptSkillMap } from './flywheel.js';

describe('parseFlywheelArgs — --allow-heuristic', () => {
  it('defaults allowHeuristic to false', () => {
    const p = parseFlywheelArgs(['status', 'commit-style']);
    expect(p.allowHeuristic).toBe(false);
    expect(p.subcommand).toBe('status');
    expect(p.skill).toBe('commit-style');
  });

  it('parses --allow-heuristic as a boolean flag', () => {
    const p = parseFlywheelArgs(['status', 'commit-style', '--allow-heuristic']);
    expect(p.allowHeuristic).toBe(true);
  });

  it('keeps positional and other flags intact alongside --allow-heuristic', () => {
    const p = parseFlywheelArgs(['status', '--allow-heuristic', 'commit-style', '--json']);
    expect(p.allowHeuristic).toBe(true);
    expect(p.skill).toBe('commit-style');
    expect(p.json).toBe(true);
  });
});

describe('buildConceptSkillMap — concept→skill back-link inversion', () => {
  it('inverts a skill-keyed mapping into concept→skills[]', () => {
    const map = buildConceptSkillMap({
      mappings: [
        { skill: 'code-review', concepts: ['code-peer-review'] },
        { skill: 'adversarial-pr-review', concepts: ['code-peer-review'] },
        { skill: 'security-hygiene', concepts: ['code-cybersecurity-basics'] },
      ],
    });
    expect(map.get('code-peer-review')).toEqual(['code-review', 'adversarial-pr-review']);
    expect(map.get('code-cybersecurity-basics')).toEqual(['security-hygiene']);
    expect(map.get('nope')).toBeUndefined();
  });

  it('is tolerant of null / malformed / missing fields', () => {
    expect(buildConceptSkillMap(null).size).toBe(0);
    expect(buildConceptSkillMap({}).size).toBe(0);
    expect(buildConceptSkillMap({ mappings: [{ concepts: ['x'] } as never] }).size).toBe(0);
    // duplicate concept under the same skill collapses
    const map = buildConceptSkillMap({ mappings: [{ skill: 's', concepts: ['c', 'c'] }] });
    expect(map.get('c')).toEqual(['s']);
  });

  it('the shipped .college/mappings/concept-skills.json parses and maps known dev pairs', () => {
    const raw = JSON.parse(
      readFileSync(join(process.cwd(), '.college/mappings/concept-skills.json'), 'utf8'),
    );
    const map = buildConceptSkillMap(raw);
    // code-peer-review is the upstream concept for both review skills.
    expect(map.get('code-peer-review')).toEqual(
      expect.arrayContaining(['code-review', 'adversarial-pr-review']),
    );
    expect(map.get('code-cybersecurity-basics')).toContain('security-hygiene');
  });
});
