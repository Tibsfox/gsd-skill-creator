/**
 * HB-02 AgentDoG — shared test helpers.
 */

import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function withFlag(value: boolean | undefined): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'agentdog-test-'));
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
          'agentdog-schema': block,
        },
      },
    }),
  );
  return { configPath, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

export function withMissingFile(): { configPath: string; cleanup: () => void } {
  const dir = mkdtempSync(join(tmpdir(), 'agentdog-test-'));
  return {
    configPath: join(dir, '.claude', 'never-created.json'),
    cleanup: () => rmSync(dir, { recursive: true, force: true }),
  };
}
