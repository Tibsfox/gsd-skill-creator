/**
 * Atlas-indexer language detector — file path → AtlasLanguage.
 *
 * The 9 atlas languages are a strict subset of the v1.49.597 analyzer's
 * languages: they map onto the SymbolIndexer adapters. This is intentionally
 * extension-only (no shebang fallback) — the atlas indexer treats path-less /
 * extensionless files as "skip" rather than guessing.
 */

import { extname } from 'node:path';
import type { AtlasLanguage } from '../types.js';

const EXT_MAP: Record<string, AtlasLanguage> = {
  '.ts': 'ts',
  '.tsx': 'ts',
  '.mts': 'ts',
  '.cts': 'ts',
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'js',
  '.rs': 'rust',
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.h': 'cpp',
  '.sh': 'bash',
  '.bash': 'bash',
  '.glsl': 'glsl',
  '.vert': 'glsl',
  '.frag': 'glsl',
  '.comp': 'glsl',
};

export function detectAtlasLanguage(filePath: string): AtlasLanguage | null {
  const ext = extname(filePath).toLowerCase();
  return EXT_MAP[ext] ?? null;
}

export const ATLAS_EXTENSIONS: ReadonlySet<string> = new Set(Object.keys(EXT_MAP));
