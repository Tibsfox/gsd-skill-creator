/**
 * Music Department Integration Test
 *
 * @module departments/music/department.test
 */

import { describe, it, expect } from 'vitest';
import { musicDepartment } from './music-department.js';

describe('Music Department', () => {
  it('has correct department ID', () => {
    expect(musicDepartment.id).toBe('music');
  });

  it('has exactly 5 wings', () => {
    expect(musicDepartment.wings).toHaveLength(5);
  });

  it('has unique wing IDs', () => {
    const ids = musicDepartment.wings.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has correct token budget', () => {
    expect(musicDepartment.tokenBudget.summaryLimit).toBe(3000);
    expect(musicDepartment.tokenBudget.activeLimit).toBe(12000);
    expect(musicDepartment.tokenBudget.deepLimit).toBe(50000);
  });

  it('contains expected wings', () => {
    const ids = musicDepartment.wings.map((w) => w.id);
    expect(ids).toContain('rhythm-movement');
    expect(ids).toContain('melody-voice');
    expect(ids).toContain('harmony-structure');
    expect(ids).toContain('instruments-ensemble');
    expect(ids).toContain('music-history-culture');
  });

  it('each wing has a non-empty description', () => {
    for (const wing of musicDepartment.wings) {
      expect(wing.description.length).toBeGreaterThan(10);
    }
  });
});
