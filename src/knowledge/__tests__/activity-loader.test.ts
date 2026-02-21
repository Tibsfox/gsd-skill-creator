/**
 * Tests for activity JSON loader with validation.
 *
 * Validates loadActivities() parses JSON arrays into typed PackActivity
 * records and loadActivitiesFile() reads from disk.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fs/promises
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
}));

import { loadActivities, loadActivitiesFile } from '../activity-loader.js';

// ============================================================================
// Fixtures
// ============================================================================

const VALID_ACTIVITIES_JSON = JSON.stringify([
  {
    id: 'ACT-001',
    name: 'Counting with Blocks',
    module_id: 'MATH-101-M1',
    grade_range: ['K', '1'],
    duration_minutes: 30,
    description: 'Students use blocks to explore counting and cardinality.',
    materials: ['blocks', 'number cards'],
    learning_objectives: ['Count reliably to 20', 'Understand one-to-one correspondence'],
  },
  {
    id: 'ACT-002',
    name: 'Pattern Extension',
    module_id: 'MATH-101-M2',
    grade_range: ['1', '2', '3'],
    duration_minutes: 25,
    description: 'Extend visual and numeric patterns.',
    materials: ['pattern cards', 'colored tiles'],
    learning_objectives: ['Identify repeating patterns', 'Predict next elements'],
    variations: ['Use sound patterns instead of visual'],
  },
]);

// ============================================================================
// loadActivities
// ============================================================================

describe('loadActivities', () => {
  it('parses valid activities array', async () => {
    const result = await loadActivities(VALID_ACTIVITIES_JSON);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.activities).toHaveLength(2);
      expect(result.activities[0].id).toBe('ACT-001');
      expect(result.activities[0].name).toBe('Counting with Blocks');
      expect(result.activities[0].module_id).toBe('MATH-101-M1');
      expect(result.activities[0].duration_minutes).toBe(30);
      expect(result.activities[1].variations).toEqual(['Use sound patterns instead of visual']);
    }
  });

  it('validates each activity -- missing id causes error', async () => {
    const json = JSON.stringify([
      {
        name: 'No ID Activity',
        module_id: 'MOD-1',
        grade_range: ['K'],
        duration_minutes: 20,
        description: 'Missing ID.',
        materials: [],
        learning_objectives: [],
      },
    ]);
    const result = await loadActivities(json);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
      const joined = result.errors!.join(' ');
      expect(joined).toContain('id');
    }
  });

  it('accepts empty array as valid', async () => {
    const result = await loadActivities('[]');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.activities).toHaveLength(0);
    }
  });

  it('returns failure for invalid JSON', async () => {
    const result = await loadActivities('not json at all {{{');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });

  it('returns failure when JSON is not an array', async () => {
    const result = await loadActivities('{"id": "not-an-array"}');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors!.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// loadActivitiesFile
// ============================================================================

describe('loadActivitiesFile', () => {
  let mockReadFile: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const fs = await import('node:fs/promises');
    mockReadFile = fs.readFile as ReturnType<typeof vi.fn>;
    mockReadFile.mockReset();
  });

  it('reads and parses file', async () => {
    mockReadFile.mockResolvedValue(VALID_ACTIVITIES_JSON);
    const result = await loadActivitiesFile('/path/to/activities.json');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.activities).toHaveLength(2);
    }
    expect(mockReadFile).toHaveBeenCalledWith('/path/to/activities.json', 'utf-8');
  });

  it('returns failure when file cannot be read', async () => {
    const err = new Error('ENOENT') as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    mockReadFile.mockRejectedValue(err);
    const result = await loadActivitiesFile('/missing/activities.json');
    expect(result.success).toBe(false);
  });
});
