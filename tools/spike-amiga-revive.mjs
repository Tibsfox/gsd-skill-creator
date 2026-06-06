#!/usr/bin/env -S npx tsx
/**
 * Thin shim — the AMIGA revive spike has been promoted to a first-class CLI
 * command. This runner now just forwards to it so the original reproduction
 * commands keep working:
 *
 *   npx tsx tools/spike-amiga-revive.mjs [<transcript>] [--emit] [--patterns-dir <dir>]
 *
 * Canonical entry point (all flags, plus --corpus / --json):
 *
 *   skill-creator amiga [<transcript>] [--corpus] [--emit] [--json]
 *   npx tsx src/cli.ts amiga --corpus --emit
 *
 * The real logic lives in src/amiga/spike/{transcript-reader,revive-pipeline}.ts
 * and src/cli/commands/amiga.ts — the dormant src/amiga substrate's production
 * runtime consumer.
 */

import { amigaCommand } from '../src/cli/commands/amiga.js';

const exitCode = await amigaCommand(process.argv.slice(2));
process.exit(exitCode);
