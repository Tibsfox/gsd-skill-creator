#!/usr/bin/env node
// Citation-debt ledger query tool.
//
// Reads .planning/citation-debt.json and emits a human-readable table
// (default) or JSON (--json). Read-only — does not mutate the ledger.
//
// Usage:
//   node tools/citation-debt/list.mjs [options]
//
// Options:
//   --status <value>          DEFERRED | PARTIAL | COVERED | RESOLVED (case-insensitive)
//   --mission <value>         substring match against mission_origin
//   --citation-target <value> substring match against citation_target
//   --json                    emit JSON array instead of table
//   --no-color                disable ANSI colors regardless of TTY
//   -h, --help                show usage
//
// Exit codes:
//   0  success
//   1  ledger file missing / invalid JSON
//   2  no entries matched (when filters provided)
//   3  CLI argument error

import { existsSync, readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const VALID_STATUSES = new Set(['DEFERRED', 'PARTIAL', 'COVERED', 'RESOLVED']);

function printHelp() {
  process.stdout.write(
    [
      'Usage: node tools/citation-debt/list.mjs [options]',
      '',
      'Reads .planning/citation-debt.json and lists matching entries.',
      '',
      'Options:',
      '  --status <value>          Filter by status: DEFERRED | PARTIAL | COVERED | RESOLVED',
      '  --mission <value>         Filter by mission_origin (substring match, case-insensitive)',
      '  --citation-target <value> Filter by citation_target (substring match, case-insensitive)',
      '  --json                    Output JSON array instead of human-readable table',
      '  --no-color                Disable ANSI color codes',
      '  -h, --help                Show this help',
      '',
      'Exit codes:',
      '  0  Success',
      '  1  Ledger file not found / invalid JSON',
      '  2  No entries matched (when filters provided)',
      '  3  CLI argument error',
      '',
      'Examples:',
      '  node tools/citation-debt/list.mjs',
      '  node tools/citation-debt/list.mjs --status DEFERRED',
      '  node tools/citation-debt/list.mjs --mission v1.49.584 --json',
      '',
    ].join('\n'),
  );
}

function parseArgs(argv) {
  const opts = {
    status: null,
    mission: null,
    citationTarget: null,
    json: false,
    color: true,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      opts.help = true;
    } else if (a === '--json') {
      opts.json = true;
    } else if (a === '--no-color') {
      opts.color = false;
    } else if (a === '--status') {
      const v = argv[++i];
      if (!v) throw new Error('--status requires a value');
      const upper = v.toUpperCase();
      if (!VALID_STATUSES.has(upper)) {
        throw new Error(`--status must be one of ${[...VALID_STATUSES].join(', ')} (got: ${v})`);
      }
      opts.status = upper;
    } else if (a === '--mission') {
      const v = argv[++i];
      if (!v) throw new Error('--mission requires a value');
      opts.mission = v.toLowerCase();
    } else if (a === '--citation-target') {
      const v = argv[++i];
      if (!v) throw new Error('--citation-target requires a value');
      opts.citationTarget = v.toLowerCase();
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function colorize(s, code, enabled) {
  if (!enabled) return s;
  return `\x1b[${code}m${s}\x1b[0m`;
}

function statusColor(status, enabled) {
  const code = {
    DEFERRED: '31', // red
    PARTIAL: '33', // yellow
    COVERED: '36', // cyan
    RESOLVED: '32', // green
  }[status] || '0';
  return colorize(status, code, enabled);
}

function truncate(s, max) {
  if (s == null) return '';
  const t = String(s);
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + '…';
}

function formatTable(rows, useColor) {
  const cols = [
    { key: 'v_flag_id', label: 'V-Flag', max: 12 },
    { key: 'status', label: 'Status', max: 9 },
    { key: 'mission_origin', label: 'Mission', max: 11 },
    { key: 'citation_target', label: 'Citation Target', max: 60 },
    { key: 'deferred_reason', label: 'Reason', max: 22 },
  ];
  const widths = cols.map((c) => {
    const longest = rows.reduce((m, r) => Math.max(m, truncate(r[c.key], c.max).length), c.label.length);
    return Math.min(longest, c.max);
  });
  const header = cols.map((c, i) => c.label.padEnd(widths[i])).join('  ');
  const sep = widths.reduce((s, w) => s + w, 0) + (cols.length - 1) * 2;
  const out = [];
  out.push(header);
  out.push('─'.repeat(sep));
  for (const r of rows) {
    const cells = cols.map((c, i) => {
      const raw = truncate(r[c.key], c.max).padEnd(widths[i]);
      if (c.key === 'status') {
        const colored = statusColor(r[c.key], useColor);
        const visibleLen = raw.length;
        const pad = ' '.repeat(Math.max(0, visibleLen - String(r[c.key]).length));
        return colored + pad;
      }
      return raw;
    });
    out.push(cells.join('  '));
  }
  return out.join('\n');
}

function summaryLine(total, matched, filtersActive) {
  if (!filtersActive) {
    const counts = { DEFERRED: 0, PARTIAL: 0, COVERED: 0, RESOLVED: 0 };
    return `Citation Debt Ledger — ${total} entries`;
  }
  return `Citation Debt Ledger — ${matched} of ${total} entries matched`;
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`error: ${e.message}\n`);
    process.stderr.write('run with --help for usage\n');
    process.exit(3);
  }

  if (opts.help) {
    printHelp();
    process.exit(0);
  }

  const root = repoRoot();
  const ledgerPath = join(root, '.planning', 'citation-debt.json');

  if (!existsSync(ledgerPath)) {
    process.stderr.write(`error: ledger not found at ${ledgerPath}\n`);
    process.exit(1);
  }

  let entries;
  try {
    const raw = readFileSync(ledgerPath, 'utf8');
    entries = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error('ledger must be a JSON array');
  } catch (e) {
    process.stderr.write(`error: failed to parse ledger: ${e.message}\n`);
    process.exit(1);
  }

  const total = entries.length;
  const filtersActive = !!(opts.status || opts.mission || opts.citationTarget);

  const matched = entries.filter((e) => {
    if (opts.status && String(e.status || '').toUpperCase() !== opts.status) return false;
    if (opts.mission && !String(e.mission_origin || '').toLowerCase().includes(opts.mission)) return false;
    if (opts.citationTarget && !String(e.citation_target || '').toLowerCase().includes(opts.citationTarget)) return false;
    return true;
  });

  if (opts.json) {
    process.stdout.write(JSON.stringify(matched, null, 2) + '\n');
    if (filtersActive && matched.length === 0) process.exit(2);
    process.exit(0);
  }

  const useColor = opts.color && process.stdout.isTTY;

  process.stdout.write(summaryLine(total, matched.length, filtersActive) + '\n\n');

  if (matched.length === 0) {
    if (filtersActive) {
      process.stdout.write('(no entries matched the supplied filters)\n');
      process.exit(2);
    }
    process.stdout.write('(ledger is empty)\n');
    process.exit(0);
  }

  process.stdout.write(formatTable(matched, useColor) + '\n');
  process.stdout.write('\nUse --json for machine-readable output. See entry follow_up_action for next steps.\n');
  process.exit(0);
}

main();
