/**
 * Desktop-side magic level persistence via Tauri IPC commands.
 *
 * Uses dynamic import for @tauri-apps/api/core to support test mocking.
 *
 * @module magic/persistence
 */

import { invoke } from '@tauri-apps/api/core';
import { MagicLevel, DEFAULT_MAGIC_LEVEL } from './types';

/**
 * Load the current magic level from the backend via IPC.
 * Returns DEFAULT_MAGIC_LEVEL on error (backend unreachable, no config).
 */
export async function loadMagicLevel(): Promise<MagicLevel> {
  try {
    const result = await invoke<{ level: number }>('get_magic_level');
    const level = result.level;
    if (level >= 1 && level <= 5) return level as MagicLevel;
    return DEFAULT_MAGIC_LEVEL;
  } catch {
    return DEFAULT_MAGIC_LEVEL;
  }
}

/**
 * Save magic level to backend. Returns the response including previous level.
 */
export async function saveMagicLevel(
  level: MagicLevel,
): Promise<{ level: number; previous_level: number }> {
  return invoke<{ level: number; previous_level: number }>('set_magic_level', {
    level,
  });
}
