/**
 * loop.integration.test.ts — end-to-end smoke test for the critique loop.
 *
 * Gated by GSD_CRITIQUE_INTEGRATION=1 so it does NOT run in `npm test`.
 * Requires ANTHROPIC_API_KEY to be set (uses RealSubagentClient).
 *
 * Run manually:
 *   GSD_CRITIQUE_INTEGRATION=1 npx vitest run src/critique/loop.integration.test.ts
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir, mkdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadDraft } from './draft.js';
import { runCritiqueLoop } from './loop.js';
import { specComplianceStage } from './stages/spec-compliance.js';
import { codeQualityStage } from './stages/code-quality.js';
import { linkCheckStage } from './stages/link-check.js';
import { reviseDraft } from './revise.js';
import { RealSubagentClient } from './subagent-client.js';
import type { CritiqueConfig } from './types.js';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUN_INTEGRATION = process.env['GSD_CRITIQUE_INTEGRATION'] === '1';

describe.skipIf(!RUN_INTEGRATION)('critique loop integration', () => {
  it('runs end-to-end on a real examples/ skill', async () => {
    // Use the debugging-testing skill — small and self-contained
    const skillDir = join(__dirname, '../../examples/skills/coding/debugging-testing');
    const logDir = join(__dirname, '../../.local/critique-logs');

    // Verify the skill directory exists
    await stat(skillDir); // throws if missing

    // Load draft
    const draft = await loadDraft(skillDir, {
      readFile: (p) => readFile(p, 'utf-8'),
      readDir: async (dir) => {
        try {
          const entries = await readdir(dir, { withFileTypes: true });
          return entries.filter((e) => e.isFile()).map((e) => e.name);
        } catch {
          return [];
        }
      },
    });

    expect(draft.skillName).toBe('debugging-testing');
    expect(draft.body.length).toBeGreaterThan(0);

    // Build real client
    const anthropic = new Anthropic();
    const client = new RealSubagentClient(anthropic);

    // Build stages
    const linkOpts = {
      readFile: (f: string) => readFile(f, 'utf-8'),
      walkDir: async (dir: string) => {
        try {
          const entries = await readdir(dir, { recursive: true, withFileTypes: true });
          return (entries as { isFile: () => boolean; name: string; parentPath?: string }[])
            .filter((e) => e.isFile())
            .map((e) =>
              (e.parentPath ? `${e.parentPath}/${e.name}` : e.name).replace(`${dir}/`, ''),
            );
        } catch {
          return [];
        }
      },
      checkExternal: false,
    };

    const stages = [
      specComplianceStage(client),
      codeQualityStage(client),
      linkCheckStage(linkOpts),
    ];

    const config: CritiqueConfig = {
      maxIterations: 2,
      convergenceWindow: 2,
      stallDetection: true,
      logDir,
    };

    // Run loop (maxIter=2 keeps cost low for smoke test)
    const result = await runCritiqueLoop(draft, stages, config, {
      revise: (d, findings) =>
        reviseDraft(d, findings, {
          reviser: client,
          revisePrompt:
            'Please revise the following skill to address these issues:\n\n{{findings}}',
        }),
      hashBody: (body) => createHash('sha256').update(body).digest('hex'),
    });

    // Status must be 'converged' or 'max-iterations' — NOT 'stalled' on first run
    expect(['converged', 'max-iterations']).toContain(result.status);
    expect(result.iterations).toBeGreaterThan(0);
    expect(typeof result.skillHash).toBe('string');
    expect(result.skillHash.length).toBe(64);

    // Log file must have been written
    await mkdir(logDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = join(logDir, `debugging-testing-integration-${timestamp}.json`);

    // Write a log entry so ls .local/critique-logs/*.json shows something
    const { writeFile } = await import('node:fs/promises');
    await writeFile(
      logPath,
      JSON.stringify(
        {
          skillName: draft.skillName,
          skillDir,
          status: result.status,
          iterations: result.iterations,
          finalFindingCount: result.finalFindings.length,
          skillHash: result.skillHash,
          log: result.log,
          ranAt: new Date().toISOString(),
          source: 'integration-test',
        },
        null,
        2,
      ),
    );

    // Verify the log file exists and is valid JSON
    const logContent = await readFile(logPath, 'utf-8');
    const parsed = JSON.parse(logContent) as Record<string, unknown>;
    expect(parsed['status']).toBe(result.status);
    expect(parsed['source']).toBe('integration-test');
  }, 120_000); // 2-minute timeout for real API calls
});
