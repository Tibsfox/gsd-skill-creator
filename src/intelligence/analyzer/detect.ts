/**
 * C01 — Language detection.
 *
 * detectLanguage: by extension first, shebang fallback for extensionless files.
 */

import { extname, basename } from 'node:path';
import type { Language } from './types.js';

// ─── Extension → Language map ─────────────────────────────

const EXT_MAP: Record<string, Language> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.rs': 'rust',
  '.py': 'python',
  '.sh': 'bash',
  '.bash': 'bash',
  '.glsl': 'glsl',
  '.vert': 'glsl',
  '.frag': 'glsl',
  '.comp': 'glsl',
};

/**
 * Detect the source language for a file.
 *
 * 1. Try extension-based detection.
 * 2. If extension is missing or unrecognized, attempt shebang detection from the
 *    first line of the source text.
 * 3. Return null if language cannot be determined.
 *
 * @param filePath - File path (absolute or relative) — only the extension is used.
 * @param source - Optional source text for shebang fallback.
 */
export function detectLanguage(filePath: string, source?: string): Language | null {
  const ext = extname(filePath).toLowerCase();

  // Extension-based detection takes priority
  if (ext in EXT_MAP) {
    return EXT_MAP[ext]!;
  }

  // Shebang fallback (only used when extension is absent or unrecognized)
  if (source) {
    const firstLine = source.split('\n')[0]?.trim() ?? '';
    if (firstLine.startsWith('#!')) {
      return detectFromShebang(firstLine);
    }
  }

  return null;
}

function detectFromShebang(shebangLine: string): Language | null {
  // Normalize: remove #! and split on spaces
  const rest = shebangLine.slice(2).trim();
  const parts = rest.split(/\s+/);
  // Handle both forms:
  //   /usr/bin/env python3  →  command = parts[0]="env", then check parts[1]
  //   /bin/bash             →  command = basename of parts[0]
  //   /usr/bin/python       →  command = basename of parts[0]

  const commandPart = parts[0] ?? '';
  const commandBase = commandPart.split('/').pop()?.toLowerCase() ?? '';

  let interp: string;
  if (commandBase === 'env' && parts.length >= 2) {
    // /usr/bin/env <interpreter>
    interp = (parts[1] ?? '').toLowerCase();
  } else {
    // /bin/bash, /usr/bin/python, etc.
    interp = commandBase;
  }

  if (interp === 'python' || interp === 'python3') return 'python';
  if (interp === 'bash' || interp === 'sh') return 'bash';

  return null;
}
