/**
 * wl done — Submit completion evidence for a wanted item.
 *
 * Generates an INSERT INTO completions + UPDATE wanted SET status='in_review'
 * SQL batch. By default prints the batch for review (SEC-03). Requires
 * --execute to apply locally via the DoltClient. Never auto-pushes.
 *
 * SEC-03: Without --execute, SQL is printed to stdout and the command exits
 * without modifying any state. With --execute, SQL is applied to the local
 * Dolt clone via client.execute() (execFile, no shell interpolation).
 *
 * Security note on screenForInjection: the function flags UPDATE as a threat.
 * The generated SQL batch intentionally contains UPDATE. Therefore only the
 * user-supplied evidence string is screened — NOT the full SQL batch. This
 * prevents false positives while still catching injection attempts in evidence.
 *
 * @module wl-done
 */

import * as p from '@clack/prompts';
import pc from 'picocolors';
import * as fs from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { bootstrap } from '../../../integrations/wasteland/bootstrap.js';
import { screenForInjection } from '../../../integrations/wasteland/sql-escape.js';
import { sanitizeMessageText } from '../../../core/validation/message-safety.js';
import { emitCompletionSubmitted } from '../../../integrations/wasteland/wasteland-events.js';

// ============================================================================
// Help text
// ============================================================================

const HELP_TEXT = `wl done — Submit completion evidence for a wanted item

Usage:
  wl done [wanted-id] [options]

Arguments:
  [wanted-id]             ID of the wanted item (e.g. w-001). When omitted,
                          shows a selector of your claimed items.

Options:
  --wanted-id <id>        Wanted item ID (alternative to positional arg)
  --evidence <text>       Completion evidence (PR URL, commit hash, etc.)
  --evidence-file <path>  Read evidence from a file (e.g. COMPLETION.md)
  --execute               Apply SQL to local Dolt clone (default: dry-run)
  --force                 Submit even if item is already completed or claimed
  --json                  Output machine-readable JSON
  --offline               Skip dolt pull sync on startup
  --help, -h              Show this help

Generates an INSERT INTO completions + UPDATE wanted SET status='in_review'
SQL batch. Without --execute, prints SQL for review (SEC-03).
With --execute, applies locally — no auto-push.
`;

// ============================================================================
// Flag helpers
// ============================================================================

/**
 * Return true when any of the named flags appear in the args array.
 * Handles both --flag and -f (first char) forms.
 */
function hasFlag(args: string[], ...flags: string[]): boolean {
  return flags.some(f => args.includes(`--${f}`) || args.includes(`-${f.charAt(0)}`));
}

/**
 * Return the value following --flag in the args array, or undefined when absent.
 */
function getFlagValue(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(`--${flag}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

/**
 * Extract positional arguments (values not preceded by a --flag key).
 * Skips flag names (--foo) and their associated values.
 */
function extractPositionalArgs(args: string[]): string[] {
  const positionals: string[] = [];
  let i = 0;
  while (i < args.length) {
    if (args[i].startsWith('-')) {
      // Skip flag and its value if the next token doesn't start with -
      i++;
      if (i < args.length && !args[i].startsWith('-')) i++;
    } else {
      positionals.push(args[i]);
      i++;
    }
  }
  return positionals;
}

// ============================================================================
// Command
// ============================================================================

/**
 * wl done command — submit completion evidence for a wasteland wanted item.
 *
 * Flow:
 * 1. Help check (short-circuits before bootstrap)
 * 2. Parse flags (execute, json, force)
 * 3. bootstrap() — loads config, creates client, syncs unless --offline
 * 4. Resolve wanted-id (positional, --wanted-id flag, or interactive selector)
 * 5. Pre-check: query the wanted item; error if not found; warn if already done
 * 6. Collect evidence (--evidence flag, --evidence-file, or interactive prompt)
 * 7. Screen evidence string for injection patterns (NOT the full SQL batch)
 * 8. Generate completion ID: c-{handle}-{5-byte-hex}
 * 9. Build SQL batch: INSERT INTO completions + UPDATE wanted SET status='in_review'
 * 10. Execute or print (SEC-03)
 *
 * @param args    - CLI arguments array
 * @param options - Optional overrides (configDir for test isolation)
 * @returns Exit code: 0 success, 1 user error / not found / cancelled, 2 execute error
 */
export async function wlDoneCommand(
  args: string[],
  options?: { configDir?: string },
): Promise<number> {
  // 1. Help
  if (hasFlag(args, 'help', 'h')) {
    console.log(HELP_TEXT);
    return 0;
  }

  // 2. Parse flags
  const executeMode = hasFlag(args, 'execute');
  const jsonMode = hasFlag(args, 'json');
  const force = hasFlag(args, 'force');

  // 3. Bootstrap — config, client, wasteland, synced
  const { config, client } = await bootstrap(args, options);

  // 4. Resolve wanted-id
  let wantedId = getFlagValue(args, 'wanted-id') ?? extractPositionalArgs(args)[0];

  if (!wantedId) {
    // Query the user's claimed/open items and show a selector
    const claimedResult = await client.query(
      client.generateSQL(
        `SELECT id, title FROM wanted WHERE claimed_by = ? AND status IN ('open', 'claimed')`,
        [config.handle],
      ),
    );
    if (claimedResult.rows.length === 0) {
      console.error(pc.red('No claimed items found for your handle. Use --wanted-id to specify one directly.'));
      return 1;
    }
    const selected = await p.select({
      message: 'Select the wanted item you completed:',
      options: claimedResult.rows.map(r => ({ value: r['id'] ?? '', label: `${r['id']} — ${r['title']}` })),
    });
    if (p.isCancel(selected)) {
      p.cancel('Cancelled.');
      return 1;
    }
    wantedId = selected as string;
  }

  // 5. Pre-check: verify the item exists
  const preCheckResult = await client.query(
    client.generateSQL(
      `SELECT id, title, status, claimed_by FROM wanted WHERE id = ?`,
      [wantedId],
    ),
  );

  if (preCheckResult.rows.length === 0) {
    console.error(pc.red(`Wanted item not found: ${wantedId}`));
    return 1;
  }

  const item = preCheckResult.rows[0];

  if (!force && item['status'] === 'completed') {
    console.error(pc.red('Item already completed. Use --force to submit anyway.'));
    return 1;
  }

  if (!force && item['claimed_by'] && item['claimed_by'] !== config.handle) {
    console.log(pc.yellow(`Warning: item claimed by ${item['claimed_by']}. Use --force to override.`));
    // Warn only — do not block
  }

  // 6. Collect evidence
  let evidence = getFlagValue(args, 'evidence');

  if (!evidence) {
    const filePath = getFlagValue(args, 'evidence-file');
    if (filePath) {
      evidence = (await fs.readFile(filePath, 'utf8')).trim();
    }
  }

  if (!evidence) {
    const result = await p.text({ message: 'Evidence of completion (PR URL, commit hash, etc.)' });
    if (p.isCancel(result)) {
      p.cancel('Cancelled.');
      return 1;
    }
    evidence = result as string;
  }

  // 6b. R1.2: Screen evidence for prompt injection patterns (13-pattern catalog).
  //     Evidence stored in Dolt could be read back and displayed — sanitize before
  //     it enters the data layer. sanitizeMessageText neutralizes role-override,
  //     instruction-hijack, and prompt-extraction patterns.
  const sanitizeResult = sanitizeMessageText(evidence);
  if (sanitizeResult.sanitized) {
    console.error(pc.yellow(`Warning: evidence contained prompt injection patterns: ${sanitizeResult.patternsFound.join(', ')}`));
    console.error(pc.yellow('Patterns have been neutralized in the submitted evidence.'));
    evidence = sanitizeResult.text;
  }

  // 7. Screen evidence ONLY — not the full SQL batch.
  // screenForInjection flags UPDATE as a threat; the generated SQL intentionally
  // contains UPDATE. Screening only the evidence string avoids false positives.
  const { safe, threats } = screenForInjection(evidence);
  if (!safe) {
    console.error(pc.red('Injection pattern detected in evidence:'));
    for (const t of threats) console.error(pc.red(`  - ${t}`));
    return 1;
  }

  // 8. Generate completion ID
  const completionId = `c-${config.handle}-${randomBytes(5).toString('hex')}`;

  // 9. Build SQL batch
  const insertSql = client.generateSQL(
    'INSERT INTO completions (id, wanted_id, completed_by, evidence, completed_at) VALUES (?, ?, ?, ?, ?)',
    [completionId, wantedId, config.handle, evidence, new Date().toISOString()],
  );

  const updateSql = client.generateSQL(
    "UPDATE wanted SET status='in_review', updated_at=? WHERE id=? AND status IN ('open', 'claimed')",
    [new Date().toISOString(), wantedId],
  );

  const fullSql = `${insertSql};\n${updateSql};`;

  // 10. Execute or print (SEC-03)
  if (executeMode) {
    try {
      await client.execute(fullSql);
      // R2.1: Emit completion event onto core bus (non-blocking, fire-and-forget)
      emitCompletionSubmitted({ completionId, wantedId, handle: config.handle }).catch(() => {});
      console.log(pc.green('Completion submitted to local clone.'));
      console.log(pc.dim('Push when ready: dolt push origin main'));
      if (jsonMode) {
        console.log(JSON.stringify({ status: 'executed', completionId }, null, 2));
      }
      return 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(pc.red(`Execute failed: ${msg}`));
      return 2;
    }
  }

  // Default: dry-run, print SQL for review
  if (jsonMode) {
    console.log(JSON.stringify({ status: 'ready', sql: fullSql, completionId }, null, 2));
  } else {
    console.log(fullSql);
    console.log(pc.dim('\nReview the SQL above. Run with --execute to apply locally.'));
  }
  return 0;
}
