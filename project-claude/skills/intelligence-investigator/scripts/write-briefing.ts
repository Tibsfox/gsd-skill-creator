#!/usr/bin/env -S node --no-warnings
/**
 * write-briefing.ts — thin shim that validates the briefing then writes via KBStore.
 *
 * Usage: node write-briefing.ts <projectId> <briefingJsonPath>
 *
 * D-25-27: briefings are ALWAYS written to KB, never returned inline.
 * D-25-28: failed self-check → no KB write; the script exits non-zero before
 *          loading the KBStore module so a partial-briefing scenario is
 *          structurally impossible.
 *
 * Exit 0 → success, briefing written; emits {briefing_id} to stdout.
 * Exit 1 → validation or write failure.
 *
 * Phase 825 / C12.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface BriefingPayload {
  body: string;
  confidence: 'low' | 'medium' | 'high';
  source_findings: string[];
  suggested_moves: Array<{
    rank: number;
    title: string;
    kind: 'research' | 'vision' | 'review' | 'analyze';
    rationale: string;
    expected_unblocks?: string;
    source_findings: string[];
  }>;
  snapshot_id?: string;
}

async function main() {
  const projectId = process.argv[2];
  const briefingPath = process.argv[3];
  if (!projectId || !briefingPath) {
    process.stderr.write(
      'usage: write-briefing.ts <projectId> <briefingJsonPath>\n',
    );
    process.exit(2);
  }

  // Load the verifier lib (validates BEFORE any KB load — D-25-28).
  let verify: (
    b: BriefingPayload,
  ) => Array<{ field: string; message: string }>;
  try {
    const mod = (await import(
      resolve(process.cwd(), 'dist/intelligence/investigator/verify-briefing.js')
    )) as typeof import('../../../../src/intelligence/investigator/verify-briefing.js');
    verify = mod.verify as never;
  } catch (err) {
    process.stderr.write(
      `write-briefing: could not load dist/intelligence/investigator/verify-briefing.js: ${(err as Error).message}\n` +
        'Run npm run build first.\n',
    );
    process.exit(1);
  }

  let briefing: BriefingPayload;
  try {
    briefing = JSON.parse(readFileSync(briefingPath, 'utf8')) as BriefingPayload;
  } catch (err) {
    process.stderr.write(
      `write-briefing: failed to read/parse briefing: ${(err as Error).message}\n`,
    );
    process.exit(1);
  }

  // Self-check — failed verification → no KB write (D-25-28).
  const violations = verify(briefing);
  if (violations.length > 0) {
    process.stderr.write(
      `write-briefing: refusing to write — ${violations.length} verify-briefing violation(s)\n` +
        violations.map((v) => `  - ${v.field}: ${v.message}`).join('\n') +
        '\n',
    );
    process.exit(1);
  }

  // Load KBStore lazily (after validation passes).
  let KBStore: typeof import('../../../../src/intelligence/kb/store.js').KBStore;
  try {
    const mod = (await import(
      resolve(process.cwd(), 'dist/intelligence/kb/store.js')
    )) as typeof import('../../../../src/intelligence/kb/store.js');
    KBStore = mod.KBStore;
  } catch (err) {
    process.stderr.write(
      `write-briefing: could not load dist/intelligence/kb/store.js: ${(err as Error).message}\n` +
        'Run npm run build first.\n',
    );
    process.exit(1);
  }

  const kb = new KBStore();
  await kb.ensureRegistry();

  try {
    const result = await kb.writeBriefing({
      project_id: projectId as never,
      snapshot_id: (briefing.snapshot_id ?? 'latest') as never,
      generated_at: new Date().toISOString(),
      body: briefing.body,
      confidence: briefing.confidence,
      source_findings: briefing.source_findings as never,
      suggested_moves: briefing.suggested_moves as never,
    });
    process.stdout.write(JSON.stringify({ briefing_id: result.id }) + '\n');
    process.exit(0);
  } catch (err) {
    process.stderr.write(
      `write-briefing: KB write failed: ${(err as Error).message}\n`,
    );
    process.exit(1);
  } finally {
    kb.close();
  }
}

main();
