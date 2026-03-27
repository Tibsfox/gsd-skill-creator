/**
 * wl stamp — Validate a completion and issue a stamp.
 *
 * Generates an INSERT INTO stamps + UPDATE completions SQL batch.
 * By default prints the batch for review. Requires --execute to apply.
 * Refuses to self-stamp (author cannot stamp own completion).
 *
 * @module wl-stamp
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import { randomBytes } from 'node:crypto';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { sqlEscape, screenForInjection } from '../../../integrations/wasteland/sql-escape.js';
import { hasFlag, getFlagValue, extractPositionalArgs } from '../../../integrations/wasteland/cli-utils.js';
import { emitStampIssued } from '../../../integrations/wasteland/wasteland-events.js';

// ============================================================================
// Help text
// ============================================================================

const HELP_TEXT = `wl stamp — Validate a completion and issue a stamp

Usage:
  wl stamp [completion-id] [options]
  wl stamp --list [options]

Arguments:
  [completion-id]         ID of the completion to stamp (e.g. c-abc123).

Commands:
  --list                  Show unstamped completions available for review.

Options:
  --quality <1-5>         Quality score (craftsmanship, correctness)
  --reliability <1-5>     Reliability score (consistency, completeness)
  --creativity <1-5>      Creativity score (novelty, approach)
  --message <text>        Validation message / review notes
  --execute               Apply SQL to local Dolt clone (default: dry-run)
  --json                  Output machine-readable JSON
  --offline               Skip dolt pull sync on startup
  --help, -h              Show this help

Examples:
  wl stamp --list                          List unstamped completions
  wl stamp c-abc123                        Interactive stamp (prompts for scores)
  wl stamp c-abc123 --quality 4 --reliability 4 --creativity 3 --execute
`;

// ============================================================================
// SQL generation
// ============================================================================

interface StampData {
  stampId: string;
  completionId: string;
  author: string;
  subject: string;
  quality: number;
  reliability: number;
  creativity: number;
  message: string;
}

function generateStampSQL(stamp: StampData): string {
  const valence = JSON.stringify({
    quality: stamp.quality,
    reliability: stamp.reliability,
    creativity: stamp.creativity,
  });

  const lines = [
    `INSERT INTO stamps (id, author, subject, valence, confidence, severity, context_id, context_type, message, created_at)`,
    `VALUES ('${sqlEscape(stamp.stampId)}', '${sqlEscape(stamp.author)}', '${sqlEscape(stamp.subject)}', '${sqlEscape(valence)}', 0.9, 'leaf', '${sqlEscape(stamp.completionId)}', 'completion', '${sqlEscape(stamp.message)}', NOW());`,
    ``,
    `UPDATE completions SET validated_by = '${sqlEscape(stamp.author)}', stamp_id = '${sqlEscape(stamp.stampId)}', validated_at = NOW() WHERE id = '${sqlEscape(stamp.completionId)}';`,
  ];

  return lines.join('\n');
}

// ============================================================================
// List unstamped completions
// ============================================================================

async function listUnstamped(client: { query: (sql: string) => Promise<{ rows: Record<string, unknown>[] }> }, handle: string, json: boolean): Promise<number> {
  const result = await client.query(
    `SELECT c.id, c.wanted_id, c.completed_by, c.evidence, w.title FROM completions c LEFT JOIN wanted w ON c.wanted_id = w.id WHERE c.validated_by IS NULL AND c.completed_by != '${sqlEscape(handle)}' ORDER BY c.completed_at DESC`
  );

  if (json) {
    console.log(JSON.stringify(result.rows, null, 2));
    return 0;
  }

  if (result.rows.length === 0) {
    p.log.info('No unstamped completions available for review.');
    return 0;
  }

  p.log.info(pc.bold(`${result.rows.length} completion(s) available for review:`));
  console.log('');

  for (const row of result.rows) {
    const title = (row.title as string) || (row.wanted_id as string) || 'unknown';
    const evidence = (row.evidence as string) || '';
    const preview = evidence.length > 80 ? evidence.slice(0, 77) + '...' : evidence;

    console.log(pc.bold(pc.cyan(row.id as string)));
    console.log(`  ${pc.dim('Item:')} ${title}`);
    console.log(`  ${pc.dim('By:')} ${row.completed_by}`);
    console.log(`  ${pc.dim('Evidence:')} ${preview}`);
    console.log('');
  }

  return 0;
}

// ============================================================================
// Main command
// ============================================================================

export async function wlStampCommand(args: string[]): Promise<number> {
  if (hasFlag(args, 'help', 'h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  const json = hasFlag(args, 'json');
  const execute = hasFlag(args, 'execute');
  const offline = hasFlag(args, 'offline');

  // Bootstrap
  let bootstrapResult;
  try {
    bootstrapResult = await bootstrap({ offline });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (json) { console.log(JSON.stringify({ error: msg })); }
    else { p.log.error(msg); }
    return 1;
  }

  const { client, config } = bootstrapResult;
  const handle = config.handle;

  // List mode
  if (hasFlag(args, 'list')) {
    return listUnstamped(client, handle, json);
  }

  // Get completion ID
  const flagsWithValues = new Set(['--quality', '--reliability', '--creativity', '--message']);
  const positionals = extractPositionalArgs(args, flagsWithValues);
  const completionId = positionals[0] || getFlagValue(args, 'completion-id');

  if (!completionId) {
    if (json) { console.log(JSON.stringify({ error: 'Completion ID required. Use: wl stamp <completion-id>' })); }
    else { p.log.error('Completion ID required. Use: wl stamp <completion-id> or wl stamp --list'); }
    return 1;
  }

  // Fetch completion
  const comp = await client.query(
    `SELECT c.id, c.wanted_id, c.completed_by, c.evidence, c.validated_by, w.title FROM completions c LEFT JOIN wanted w ON c.wanted_id = w.id WHERE c.id = '${sqlEscape(completionId)}'`
  );

  if (comp.rows.length === 0) {
    if (json) { console.log(JSON.stringify({ error: `Completion ${completionId} not found` })); }
    else { p.log.error(`Completion ${completionId} not found.`); }
    return 1;
  }

  const completion = comp.rows[0];

  // Self-stamp check
  if (completion.completed_by === handle) {
    if (json) { console.log(JSON.stringify({ error: 'Cannot stamp your own completion' })); }
    else { p.log.error('Cannot stamp your own completion. Ask another participant to validate.'); }
    return 1;
  }

  // Already stamped check
  if (completion.validated_by) {
    if (json) { console.log(JSON.stringify({ error: `Already stamped by ${completion.validated_by}` })); }
    else { p.log.warning(`Already stamped by ${completion.validated_by}.`); }
    return 1;
  }

  // Show evidence
  if (!json) {
    p.log.info(pc.bold('Reviewing completion:'));
    console.log(`  ${pc.dim('ID:')} ${completionId}`);
    console.log(`  ${pc.dim('Item:')} ${completion.title || completion.wanted_id}`);
    console.log(`  ${pc.dim('By:')} ${completion.completed_by}`);
    console.log(`  ${pc.dim('Evidence:')} ${completion.evidence}`);
    console.log('');
  }

  // Get scores (from flags or prompt)
  let quality = parseInt(getFlagValue(args, 'quality') || '', 10);
  let reliability = parseInt(getFlagValue(args, 'reliability') || '', 10);
  let creativity = parseInt(getFlagValue(args, 'creativity') || '', 10);
  let message = getFlagValue(args, 'message') || '';

  // Validate scores are 1-5
  const validScore = (n: number) => !isNaN(n) && n >= 1 && n <= 5;

  if (!validScore(quality) || !validScore(reliability) || !validScore(creativity)) {
    if (json) {
      console.log(JSON.stringify({ error: 'All scores (--quality, --reliability, --creativity) required, 1-5' }));
      return 1;
    }

    // Interactive prompts
    if (!validScore(quality)) {
      const q = await p.text({ message: 'Quality score (1-5):', validate: v => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? undefined : 'Enter 1-5'; } });
      if (p.isCancel(q)) return 1;
      quality = parseInt(q as string, 10);
    }
    if (!validScore(reliability)) {
      const r = await p.text({ message: 'Reliability score (1-5):', validate: v => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? undefined : 'Enter 1-5'; } });
      if (p.isCancel(r)) return 1;
      reliability = parseInt(r as string, 10);
    }
    if (!validScore(creativity)) {
      const c = await p.text({ message: 'Creativity score (1-5):', validate: v => { const n = parseInt(v, 10); return n >= 1 && n <= 5 ? undefined : 'Enter 1-5'; } });
      if (p.isCancel(c)) return 1;
      creativity = parseInt(c as string, 10);
    }
    if (!message) {
      const m = await p.text({ message: 'Review message (optional):' });
      if (p.isCancel(m)) return 1;
      message = (m as string) || '';
    }
  }

  // Screen message for injection
  if (message) {
    const screening = screenForInjection(message);
    if (!screening.safe) {
      const reason = screening.threats.join(', ');
      if (json) { console.log(JSON.stringify({ error: `Message rejected: ${reason}` })); }
      else { p.log.error(`Message rejected: ${reason}`); }
      return 1;
    }
  }

  // Generate stamp
  const stampId = `s-${randomBytes(5).toString('hex')}`;
  const stamp: StampData = {
    stampId,
    completionId,
    author: handle,
    subject: completion.completed_by as string,
    quality,
    reliability,
    creativity,
    message: message || `Validated by ${handle}`,
  };

  const sql = generateStampSQL(stamp);

  if (json) {
    console.log(JSON.stringify({ stampId, sql, stamp, dryRun: !execute }));
    return 0;
  }

  if (!execute) {
    p.log.info(pc.bold('Generated SQL (dry run):'));
    console.log('');
    console.log(sql);
    console.log('');
    p.log.info(`Run with ${pc.bold('--execute')} to apply.`);
    return 0;
  }

  // Execute
  try {
    for (const stmt of sql.split(';').filter(s => s.trim())) {
      await client.query(stmt.trim() + ';');
    }
    await emitStampIssued({ stampId, wantedId: completion.wanted_id as string, handle }, { patternsDir: undefined });
    p.log.success(`Stamp ${pc.bold(stampId)} issued to ${pc.bold(completion.completed_by as string)}`);
    p.log.info(`Quality: ${quality} | Reliability: ${reliability} | Creativity: ${creativity}`);
    p.log.info(`Run ${pc.bold('dolt add . && dolt commit -m "stamp: ..."')} to persist.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    p.log.error(`Failed to execute: ${msg}`);
    return 1;
  }

  return 0;
}
