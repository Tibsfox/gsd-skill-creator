#!/usr/bin/env node
// Applies a proposed-diff JSON (from tools/citation-debt/scan-retrospectives.mjs
// --write-diff) to .planning/citation-debt.json.
//
// Workflow:
//   1. Author retrospective with formal "### V-flag emit/close/state:" blocks
//      (see docs/citation-debt-syntax.md).
//   2. Run scan: `node tools/citation-debt/scan-retrospectives.mjs --since vX --write-diff`
//   3. Review the diff at .planning/citation-debt-proposed-diff.json.
//   4. Run this tool: `node tools/citation-debt/apply-diff.mjs [--auto-confirm]`.
//
// The tool is conservative by default:
//   - Each action is described and the operator confirms y/n before write.
//   - --auto-confirm bypasses prompts (for CI / automated pipelines).
//   - --dry-run shows what would be done but writes nothing.
//
// The current ledger is rewritten in-place with the merged actions. A backup
// is written to .planning/citation-debt.json.bak.<timestamp> before any
// changes land.
//
// Closes CONCERNS §9.3 part 2 (L-03).
//
// Exit codes:
//   0  applied successfully (or dry-run, or no actions to apply)
//   1  applied with errors (some actions failed)
//   2  invalid input — diff missing/malformed, ledger missing
//   3  user declined confirmation
//   4  CLI argument error

import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = repoRoot();
const DEFAULT_DIFF_PATH = resolve(REPO_ROOT, '.planning/citation-debt-proposed-diff.json');
const LEDGER_PATH = resolve(REPO_ROOT, '.planning/citation-debt.json');

function parseArgs(argv) {
  const opts = {
    diffPath: DEFAULT_DIFF_PATH,
    autoConfirm: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    } else if (a === '--auto-confirm') {
      opts.autoConfirm = true;
    } else if (a === '--dry-run') {
      opts.dryRun = true;
    } else if (a === '--diff') {
      opts.diffPath = resolve(argv[++i]);
      if (!opts.diffPath) {
        process.stderr.write(`--diff requires a path argument\n`);
        process.exit(4);
      }
    } else {
      process.stderr.write(`unknown argument: ${a}\n`);
      process.exit(4);
    }
  }
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: node tools/citation-debt/apply-diff.mjs [options]',
      '',
      'Applies a proposed-diff JSON to .planning/citation-debt.json after',
      'operator confirmation. The diff is produced by:',
      '  node tools/citation-debt/scan-retrospectives.mjs --since vX.Y.Z --write-diff',
      '',
      'Options:',
      '  --diff <path>        Diff input path (default: .planning/citation-debt-proposed-diff.json)',
      '  --auto-confirm       Apply without per-action confirmation (CI / automated use)',
      '  --dry-run            Print actions but do not write the ledger',
      '  -h, --help           Show usage',
      '',
      'Exit codes:',
      '  0  applied successfully (or dry-run, or no actions)',
      '  1  applied with errors',
      '  2  invalid input (diff missing, ledger missing)',
      '  3  user declined confirmation',
      '  4  CLI argument error',
      '',
    ].join('\n'),
  );
}

function loadLedger() {
  if (!existsSync(LEDGER_PATH)) {
    process.stderr.write(`fatal: ledger not found at ${LEDGER_PATH}\n`);
    process.exit(2);
  }
  const raw = readFileSync(LEDGER_PATH, 'utf8');
  return JSON.parse(raw);
}

function loadDiff(diffPath) {
  if (!existsSync(diffPath)) {
    process.stderr.write(`fatal: diff not found at ${diffPath}\n`);
    process.stderr.write(`  Run: node tools/citation-debt/scan-retrospectives.mjs --since vX --write-diff\n`);
    process.exit(2);
  }
  const raw = readFileSync(diffPath, 'utf8');
  return JSON.parse(raw);
}

function describeAction(a) {
  if (a.kind === 'emit') {
    return [
      `EMIT new V-flag ${a.v_flag_id} (status=DEFERRED)`,
      `  source: ${a.source_file}:${a.source_line} (from ${a.source_version})`,
      `  target: ${a.entry.citation_target}`,
      `  reason: ${a.entry.deferred_reason}`,
      `  follow_up: ${a.entry.follow_up_action}`,
    ].join('\n');
  }
  if (a.kind === 'close') {
    return [
      `CLOSE ${a.v_flag_id} → ${a.to_status} (closing_milestone=${a.closing_milestone})`,
      `  source: ${a.source_file}:${a.source_line}`,
      `  evidence: ${a.evidence}`,
    ].join('\n');
  }
  if (a.kind === 'state') {
    return [
      `STATE ${a.v_flag_id} → ${a.to_status} (transition_milestone=${a.transition_milestone})`,
      `  source: ${a.source_file}:${a.source_line}`,
      `  evidence: ${a.evidence}`,
    ].join('\n');
  }
  return `UNKNOWN action: ${JSON.stringify(a)}`;
}

function applyAction(ledger, action) {
  const today = new Date().toISOString().split('T')[0];
  if (action.kind === 'emit') {
    // entry pre-built by scan tool; append
    ledger.push({ ...action.entry, last_updated: today });
    return { ok: true };
  }
  const idx = ledger.findIndex((e) => e.v_flag_id === action.v_flag_id);
  if (idx === -1) {
    return { ok: false, error: `V-flag ${action.v_flag_id} not in ledger` };
  }
  if (action.kind === 'close') {
    ledger[idx] = {
      ...ledger[idx],
      status: action.to_status,
      last_updated: today,
      resolution_note: action.evidence,
      closing_milestone: action.closing_milestone,
    };
    return { ok: true };
  }
  if (action.kind === 'state') {
    const prevStatus = ledger[idx].status;
    const history = ledger[idx].status_history ?? [];
    history.push({
      from: prevStatus,
      to: action.to_status,
      at: today,
      milestone: action.transition_milestone,
      evidence: action.evidence,
    });
    ledger[idx] = {
      ...ledger[idx],
      status: action.to_status,
      last_updated: today,
      status_history: history,
    };
    return { ok: true };
  }
  return { ok: false, error: `unknown action kind: ${action.kind}` };
}

async function promptConfirm(prompt) {
  const rl = createInterface({ input, output });
  try {
    const answer = await rl.question(prompt);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const diff = loadDiff(opts.diffPath);
  const actions = diff.proposed_actions ?? [];

  if (actions.length === 0) {
    process.stdout.write(`No proposed actions in ${opts.diffPath.replace(REPO_ROOT + '/', '')}.\n`);
    process.exit(0);
  }

  process.stdout.write(`Reading ${opts.diffPath.replace(REPO_ROOT + '/', '')}\n`);
  process.stdout.write(`Found ${actions.length} proposed action(s):\n\n`);
  for (let i = 0; i < actions.length; i++) {
    process.stdout.write(`[${i + 1}/${actions.length}] ${describeAction(actions[i])}\n\n`);
  }

  if (opts.dryRun) {
    process.stdout.write(`Dry-run — no changes written. Re-run without --dry-run to apply.\n`);
    process.exit(0);
  }

  if (!opts.autoConfirm) {
    const ok = await promptConfirm(`Apply ${actions.length} action(s) to citation-debt.json? [y/N] `);
    if (!ok) {
      process.stdout.write(`Declined. No changes written.\n`);
      process.exit(3);
    }
  }

  // Backup before write
  const ledger = loadLedger();
  const backupPath = `${LEDGER_PATH}.bak.${Date.now()}`;
  copyFileSync(LEDGER_PATH, backupPath);
  process.stdout.write(`Backed up current ledger to ${backupPath.replace(REPO_ROOT + '/', '')}\n`);

  let okCount = 0;
  let errCount = 0;
  for (const action of actions) {
    const result = applyAction(ledger, action);
    if (result.ok) {
      okCount++;
    } else {
      errCount++;
      process.stderr.write(`  FAIL ${action.v_flag_id}: ${result.error}\n`);
    }
  }

  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + '\n', 'utf8');
  process.stdout.write(`Wrote updated ledger: ${okCount} applied, ${errCount} failed.\n`);
  if (errCount > 0) {
    process.stdout.write(
      `Restore from backup if needed: cp ${backupPath.replace(REPO_ROOT + '/', '')} ${LEDGER_PATH.replace(REPO_ROOT + '/', '')}\n`,
    );
  }
  process.exit(errCount > 0 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(`fatal: ${err.message}\n`);
  process.exit(1);
});
