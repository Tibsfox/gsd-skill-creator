/**
 * HB-05 structural-completeness linter — shared test helpers.
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export interface FlagEnv {
  configPath: string;
  cleanup: () => void;
}

export function withFlag(value: boolean | undefined): FlagEnv {
  const dir = mkdtempSync(join(tmpdir(), 'sclint-test-'));
  const claudeDir = join(dir, '.claude');
  mkdirSync(claudeDir, { recursive: true });
  const configPath = join(claudeDir, 'gsd-skill-creator.json');
  const block: Record<string, unknown> = {};
  if (value !== undefined) block.enabled = value;
  writeFileSync(
    configPath,
    JSON.stringify({
      'gsd-skill-creator': {
        'cs25-26-sweep': {
          'structural-completeness-lint': block,
        },
      },
    }),
  );
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

export function withMissingFile(): FlagEnv {
  const dir = mkdtempSync(join(tmpdir(), 'sclint-test-'));
  return {
    configPath: join(dir, '.claude', 'never-created.json'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
