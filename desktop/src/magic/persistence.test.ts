/**
 * Tests for magic level persistence via Tauri IPC.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockInvoke = vi.fn();

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

import { loadMagicLevel, saveMagicLevel } from './persistence';
import { MagicLevel } from './types';

beforeEach(() => {
  mockInvoke.mockReset();
});

describe('loadMagicLevel', () => {
  it('calls getMagicLevel IPC command and returns level', async () => {
    mockInvoke.mockResolvedValueOnce({ level: 4 });
    const result = await loadMagicLevel();
    expect(result).toBe(4);
    expect(mockInvoke).toHaveBeenCalledWith('get_magic_level');
  });

  it('returns default 3 on IPC error', async () => {
    mockInvoke.mockRejectedValueOnce(new Error('IPC failed'));
    const result = await loadMagicLevel();
    expect(result).toBe(MagicLevel.ANNOTATED);
  });
});

describe('saveMagicLevel', () => {
  it('calls setMagicLevel IPC command with level', async () => {
    mockInvoke.mockResolvedValueOnce({ level: 4, previous_level: 3 });
    await saveMagicLevel(MagicLevel.VERBOSE);
    expect(mockInvoke).toHaveBeenCalledWith('set_magic_level', { level: 4 });
  });

  it('returns previous level from response', async () => {
    mockInvoke.mockResolvedValueOnce({ level: 4, previous_level: 3 });
    const result = await saveMagicLevel(MagicLevel.VERBOSE);
    expect(result.previous_level).toBe(3);
  });
});
