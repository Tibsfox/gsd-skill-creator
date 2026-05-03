#!/usr/bin/env -S node --no-warnings
/**
 * verify-briefing.ts — thin shim that calls the verify() library function.
 *
 * Usage: node verify-briefing.ts <briefing-json-path>
 *
 * Exit 0 → PASS (briefing meets all D-25-28 requirements).
 * Exit 1 → FAIL (writes violation list to stderr, JSON to stdout).
 *
 * The validation logic lives at src/intelligence/investigator/verify-briefing.ts
 * (compiled to dist/intelligence/investigator/verify-briefing.js). Run
 * `npm run build` before invoking this shim.
 *
 * Phase 825 / C12.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

interface Briefing {
  body?: string;
  confidence?: string;
  suggested_moves?: unknown[];
  source_findings?: string[];
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    process.stderr.write('usage: verify-briefing.ts <briefing-json-path>\n');
    process.exit(2);
  }

  // Locate the compiled lib. Default cwd-relative; fallback to the path
  // alongside the cwd's dist/.
  let verify: (b: Briefing) => Array<{ field: string; message: string }>;
  try {
    const mod = (await import(
      resolve(process.cwd(), 'dist/intelligence/investigator/verify-briefing.js')
    )) as typeof import('../../../../src/intelligence/investigator/verify-briefing.js');
    verify = mod.verify;
  } catch (err) {
    process.stderr.write(
      `verify-briefing: could not load dist/intelligence/investigator/verify-briefing.js: ${(err as Error).message}\n` +
        'Run npm run build first (or invoke from the gsd-skill-creator repo root).\n',
    );
    process.exit(2);
  }

  let briefing: Briefing;
  try {
    briefing = JSON.parse(readFileSync(arg, 'utf8')) as Briefing;
  } catch (err) {
    process.stderr.write(
      `verify-briefing: failed to read/parse briefing: ${(err as Error).message}\n`,
    );
    process.exit(2);
  }

  const violations = verify(briefing);
  if (violations.length === 0) {
    process.stdout.write(
      JSON.stringify({
        status: 'pass',
        checks: ['causal_hypothesis', 'uncertainty', 'confidence', 'moves'],
      }) + '\n',
    );
    process.exit(0);
  }
  process.stdout.write(
    JSON.stringify({ status: 'fail', violations }, null, 2) + '\n',
  );
  process.stderr.write(
    `verify-briefing: ${violations.length} violation(s)\n` +
      violations.map((v) => `  - ${v.field}: ${v.message}`).join('\n') +
      '\n',
  );
  process.exit(1);
}

main();
