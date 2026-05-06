/**
 * mission-attribution — scoring tests (v1.49.607 W1 Track B).
 */
import { describe, it, expect } from 'vitest';
import {
  attributeBlameLine,
  attributeFile,
  buildShaToMissionIndex,
} from '../mission-attribution.js';
import type { BlameLine, MissionCommitMap } from '../types.js';

const SHA_A = 'a'.repeat(40);
const SHA_B = 'b'.repeat(40);
const SHA_C = 'c'.repeat(40);

function makeBlame(line_no: number, sha: string): BlameLine {
  return {
    line_no,
    commit_sha: sha,
    original_line_no: line_no,
    original_file_path: 'src/x.ts',
  };
}

describe('mission-attribution', () => {
  it('single-attribution case: weight = 1.0', () => {
    const maps: MissionCommitMap[] = [{ mission_id: 'M-1', commit_shas: [SHA_A] }];
    const idx = buildShaToMissionIndex(maps);
    const result = attributeBlameLine('src/x.ts', makeBlame(1, SHA_A), idx);
    expect(result.length).toBe(1);
    expect(result[0].mission_id).toBe('M-1');
    expect(result[0].weight).toBe(1.0);
    expect(result[0].line_no).toBe(1);
  });

  it('multi-attribution split: N missions claim a sha → N rows of 1/N', () => {
    const maps: MissionCommitMap[] = [
      { mission_id: 'M-1', commit_shas: [SHA_A] },
      { mission_id: 'M-2', commit_shas: [SHA_A] },
      { mission_id: 'M-3', commit_shas: [SHA_A] },
    ];
    const idx = buildShaToMissionIndex(maps);
    const result = attributeBlameLine('src/x.ts', makeBlame(5, SHA_A), idx);
    expect(result.length).toBe(3);
    for (const r of result) {
      expect(r.weight).toBeCloseTo(1.0 / 3, 10);
      expect(r.line_no).toBe(5);
    }
    // Weights must sum to 1.0
    const total = result.reduce((s, r) => s + r.weight, 0);
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('no-attribution-row case: sha missing from index → empty result', () => {
    const maps: MissionCommitMap[] = [{ mission_id: 'M-1', commit_shas: [SHA_A] }];
    const idx = buildShaToMissionIndex(maps);
    const result = attributeBlameLine('src/x.ts', makeBlame(2, SHA_B), idx);
    expect(result).toEqual([]);
  });

  it('mission ordering is deterministic (alphabetical) inside split rows', () => {
    const maps: MissionCommitMap[] = [
      { mission_id: 'zeta', commit_shas: [SHA_A] },
      { mission_id: 'alpha', commit_shas: [SHA_A] },
      { mission_id: 'mu', commit_shas: [SHA_A] },
    ];
    const idx = buildShaToMissionIndex(maps);
    const result = attributeBlameLine('src/x.ts', makeBlame(1, SHA_A), idx);
    expect(result.map((r) => r.mission_id)).toEqual(['alpha', 'mu', 'zeta']);
  });

  it('attributeFile returns rows in line-order across mixed shas', () => {
    const maps: MissionCommitMap[] = [
      { mission_id: 'M-A', commit_shas: [SHA_A] },
      { mission_id: 'M-B', commit_shas: [SHA_B] },
      // Both missions share SHA_C → split-attribution
      { mission_id: 'M-A', commit_shas: [SHA_C] },
      { mission_id: 'M-B', commit_shas: [SHA_C] },
    ];
    const idx = buildShaToMissionIndex(maps);
    const blame = [
      makeBlame(1, SHA_A),
      makeBlame(2, SHA_B),
      makeBlame(3, SHA_C),
      makeBlame(4, 'd'.repeat(40)), // unattributed → no row
    ];
    const result = attributeFile('src/x.ts', blame, idx);
    expect(result.length).toBe(4); // 1 + 1 + 2 + 0
    expect(result[0].line_no).toBe(1);
    expect(result[0].mission_id).toBe('M-A');
    expect(result[1].line_no).toBe(2);
    expect(result[1].mission_id).toBe('M-B');
    expect(result[2].line_no).toBe(3);
    expect(result[3].line_no).toBe(3);
    expect(result[2].weight).toBeCloseTo(0.5, 10);
    expect(result[3].weight).toBeCloseTo(0.5, 10);
  });

  it('buildShaToMissionIndex de-duplicates a (sha, mission) pair across multiple maps', () => {
    const maps: MissionCommitMap[] = [
      { mission_id: 'M-A', commit_shas: [SHA_A] },
      // Same mission referencing the same sha twice (e.g. range overlap)
      { mission_id: 'M-A', commit_shas: [SHA_A, SHA_B] },
    ];
    const idx = buildShaToMissionIndex(maps);
    expect(idx.get(SHA_A)).toEqual(['M-A']);
    expect(idx.get(SHA_B)).toEqual(['M-A']);

    // weight stays 1.0 for the de-dup'd case
    const result = attributeBlameLine('src/x.ts', makeBlame(1, SHA_A), idx);
    expect(result.length).toBe(1);
    expect(result[0].weight).toBe(1.0);
  });
});
