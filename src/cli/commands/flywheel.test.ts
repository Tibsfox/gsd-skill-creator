import { describe, it, expect } from 'vitest';
import { parseFlywheelArgs } from './flywheel.js';

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
