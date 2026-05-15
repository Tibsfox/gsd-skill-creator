#!/usr/bin/env node
// Scans release-notes retrospectives for V-flag emit/close patterns and
// reports activity that may require updates to .planning/citation-debt.json.
//
// Addresses CONCERNS.md §9.3 — ledger is not updated by ship pipelines.
// v1.49.653 L-03: added --write-diff to emit a machine-readable diff for
// the apply-diff tool. See docs/citation-debt-syntax.md for block syntax.
//
// Usage:
//   node tools/citation-debt/scan-retrospectives.mjs [options]
//
// Options:
//   --since <vX.Y.Z>       Scan retrospectives from this version forward (inclusive)
//   --json                 Emit machine-readable JSON
//   --quiet                Suppress per-file no-activity lines
//   --write-diff           Write proposed-diff JSON to .planning/citation-debt-proposed-diff.json
//                          (parses formal "### V-flag emit/close/state:" blocks per docs/citation-debt-syntax.md)
//   --diff-path <path>     Override default diff output path
//   -h, --help             Show usage
//
// Exit codes:
//   0  scan complete, no V-flag activity detected
//   1  scan complete, V-flag activity detected — review and update ledger
//   2  CLI argument error
//   3  retrospective tree missing / unreadable

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = repoRoot();
const NOTES_DIR = resolve(REPO_ROOT, 'docs/release-notes');
const LEDGER_PATH = resolve(REPO_ROOT, '.planning/citation-debt.json');

// V-flag identifier with word boundaries that exclude FA-NNN-NN false positives.
// Matches: "V-8", "V-9-MTR", "V-20", "V-9-NCSC"; rejects "FA-647-15", "v1.49.645".
const V_FLAG_RE = /(^|[^-A-Za-z0-9])(V-\d+(?:-[A-Z]+)?)\b/g;

// Heuristic event classification — refined by surrounding-context substrings.
const EMIT_HINTS = /(emitted|new\s+v-flag|surfaced\s+v-flag|opened|newly\s+open)/i;
const CLOSE_HINTS = /(closed|resolved|covered|retired|retiring)/i;
const STATE_HINTS = /(partial|deferred|covered)/i;

function parseArgs(argv) {
  const opts = {
    since: null,
    json: false,
    quiet: false,
    writeDiff: false,
    diffPath: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') {
      printHelp();
      process.exit(0);
    } else if (a === '--json') {
      opts.json = true;
    } else if (a === '--quiet') {
      opts.quiet = true;
    } else if (a === '--write-diff') {
      opts.writeDiff = true;
    } else if (a === '--diff-path') {
      opts.diffPath = argv[++i];
      if (!opts.diffPath) {
        process.stderr.write(`--diff-path requires a path argument\n`);
        process.exit(2);
      }
    } else if (a === '--since') {
      opts.since = argv[++i];
      if (!opts.since || !/^v?\d+\.\d+\.\d+$/.test(opts.since)) {
        process.stderr.write(`--since requires a version (vX.Y.Z); got ${JSON.stringify(opts.since)}\n`);
        process.exit(2);
      }
      if (!opts.since.startsWith('v')) opts.since = 'v' + opts.since;
    } else {
      process.stderr.write(`unknown argument: ${a}\n`);
      process.exit(2);
    }
  }
  return opts;
}

function printHelp() {
  process.stdout.write(
    [
      'Usage: node tools/citation-debt/scan-retrospectives.mjs [options]',
      '',
      'Scans docs/release-notes/v*/chapter/03-retrospective.md for V-flag mentions',
      'and (optionally) emits a proposed-diff JSON for tools/citation-debt/apply-diff.mjs.',
      '',
      'Options:',
      '  --since <vX.Y.Z>      Scan retrospectives from this version forward (inclusive)',
      '  --json                Emit machine-readable JSON (informal-mention mode)',
      '  --quiet               Suppress per-file no-activity lines',
      '  --write-diff          Parse formal V-flag emit/close/state blocks',
      '                        and write .planning/citation-debt-proposed-diff.json.',
      '                        See docs/citation-debt-syntax.md for block syntax.',
      '  --diff-path <path>    Override default diff output path',
      '  -h, --help            Show usage',
      '',
      'Exit codes:',
      '  0  no activity — ledger is in sync (or --write-diff with valid actions)',
      '  1  activity detected — review and update ledger (or --write-diff with errors)',
      '  2  CLI argument error',
      '  3  retrospective tree missing',
      '',
    ].join('\n'),
  );
}

// Compare two semver-shaped tags. Returns -1 / 0 / 1.
function cmpVersion(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number);
  const pb = b.replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

function classifyEvent(context) {
  if (EMIT_HINTS.test(context)) return 'emit';
  if (CLOSE_HINTS.test(context)) return 'close';
  if (STATE_HINTS.test(context)) return 'state-change';
  return 'mention';
}

function scanFile(filePath, knownIds) {
  const content = readFileSync(filePath, 'utf8');
  const findings = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    V_FLAG_RE.lastIndex = 0;
    let m;
    while ((m = V_FLAG_RE.exec(line)) !== null) {
      const id = m[2];
      const event = classifyEvent(line);
      findings.push({
        v_flag_id: id,
        line_number: i + 1,
        line_text: line.trim(),
        event,
        in_ledger: knownIds.has(id),
      });
    }
  }
  return findings;
}

function loadLedgerIds() {
  if (!existsSync(LEDGER_PATH)) return new Set();
  const raw = readFileSync(LEDGER_PATH, 'utf8');
  const arr = JSON.parse(raw);
  return new Set(arr.map((e) => e.v_flag_id));
}

// ============================================================================
// Formal block parser (v1.49.653 L-03)
// ============================================================================
//
// Parses "### V-flag (emit|close|state):" blocks per docs/citation-debt-syntax.md.
// Returns proposed actions suitable for tools/citation-debt/apply-diff.mjs.

// Block header. Captures: action (emit|close|state), v-flag id, optional target status.
//   ### V-flag emit: V-26
//   ### V-flag close: V-20 → RESOLVED
//   ### V-flag state: V-9-MTR → COVERED
const FORMAL_BLOCK_HEADER_RE = /^###\s+V-flag\s+(emit|close|state):\s+(V-\d+(?:-[A-Z]+)?)(?:\s*[→\->]+\s*(DEFERRED|PARTIAL|COVERED|RESOLVED))?\s*$/;

// Bullet pattern: `- key: value`
const FORMAL_BULLET_RE = /^-\s+([a-z_][a-z0-9_]*):\s*(.*)$/;

// Allowed reasons (must match ledger schema)
const ALLOWED_REASONS = new Set([
  'paywalled',
  'physical-archive',
  'vendor-inquiry',
  'research-time-cost',
]);

const ALLOWED_STATUSES = new Set(['DEFERRED', 'PARTIAL', 'COVERED', 'RESOLVED']);

/**
 * Parse formal V-flag blocks from a single retrospective file.
 *
 * @param {string} filePath
 * @param {string} version  the milestone tag (e.g. "v1.49.652")
 * @returns {Array<{kind, v_flag_id, ...}>}
 */
function parseFormalBlocks(filePath, version) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const actions = [];

  for (let i = 0; i < lines.length; i++) {
    const hdrMatch = FORMAL_BLOCK_HEADER_RE.exec(lines[i]);
    if (!hdrMatch) continue;
    const [, action, vFlagId, toStatusRaw] = hdrMatch;
    const lineNo = i + 1;

    // Collect bullets — skip leading blank lines, then read until a second
    // blank line or next header. This tolerates `### header\n\n- bullet`
    // (markdown's standard "header + blank + content" layout) as well as
    // `### header\n- bullet` (no blank between).
    const bullets = {};
    let sawBullet = false;
    for (let j = i + 1; j < lines.length; j++) {
      const ln = lines[j];
      if (ln.startsWith('## ') || ln.startsWith('### ')) break;
      if (ln.trim() === '') {
        if (sawBullet) break;
        continue;  // skip leading blank line between header and bullets
      }
      const bMatch = FORMAL_BULLET_RE.exec(ln);
      if (bMatch) {
        sawBullet = true;
        const [, key, valueRaw] = bMatch;
        bullets[key] = valueRaw.trim() === 'null' ? null : valueRaw.trim();
      } else if (sawBullet) {
        // Non-bullet, non-blank line after bullets started → end block
        break;
      }
    }

    const proposed = {
      kind: action,
      v_flag_id: vFlagId,
      source_version: version,
      source_file: filePath.replace(REPO_ROOT + '/', ''),
      source_line: lineNo,
    };

    if (action === 'emit') {
      const missing = ['target', 'reason', 'follow_up_action'].filter((k) => !(k in bullets));
      if (missing.length > 0) {
        proposed.error = `emit missing required keys: ${missing.join(', ')}`;
      } else if (!ALLOWED_REASONS.has(bullets.reason)) {
        proposed.error = `emit reason "${bullets.reason}" not in allowed set: ${[...ALLOWED_REASONS].join('|')}`;
      } else {
        proposed.entry = {
          v_flag_id: vFlagId,
          status: 'DEFERRED',
          mission_origin: version,
          source_file: bullets.source_file ?? null,
          source_line: bullets.source_line ?? null,
          deferred_reason: bullets.reason,
          follow_up_action: bullets.follow_up_action,
          citation_target: bullets.target,
          last_updated: new Date().toISOString().split('T')[0],
        };
      }
    } else if (action === 'close') {
      proposed.to_status = toStatusRaw || 'RESOLVED';
      if (!ALLOWED_STATUSES.has(proposed.to_status)) {
        proposed.error = `close to_status "${proposed.to_status}" not in allowed set`;
      } else if (!bullets.evidence) {
        proposed.error = 'close missing required key: evidence';
      } else {
        proposed.evidence = bullets.evidence;
        proposed.closing_milestone = bullets.closing_milestone ?? version;
      }
    } else if (action === 'state') {
      proposed.to_status = toStatusRaw;
      if (!proposed.to_status) {
        proposed.error = 'state action requires "→ <STATUS>" in header (e.g. "### V-flag state: V-X → COVERED")';
      } else if (!ALLOWED_STATUSES.has(proposed.to_status)) {
        proposed.error = `state to_status "${proposed.to_status}" not in allowed set`;
      } else if (!bullets.evidence) {
        proposed.error = 'state missing required key: evidence';
      } else {
        proposed.evidence = bullets.evidence;
        proposed.transition_milestone = bullets.transition_milestone ?? version;
      }
    }

    actions.push(proposed);
  }

  return actions;
}

/**
 * Validate the set of proposed actions against the current ledger.
 *
 * @param {Array} actions
 * @param {Set<string>} knownIds   set of existing V-flag IDs
 * @returns {{ valid: Array, errors: Array }}
 */
function validateActions(actions, knownIds) {
  const valid = [];
  const errors = [];
  const newIds = new Set();

  for (const a of actions) {
    if (a.error) {
      errors.push(a);
      continue;
    }
    if (a.kind === 'emit') {
      if (knownIds.has(a.v_flag_id)) {
        errors.push({ ...a, error: `emit collision: V-flag ${a.v_flag_id} already exists in ledger` });
        continue;
      }
      if (newIds.has(a.v_flag_id)) {
        errors.push({ ...a, error: `emit duplicate within scan: V-flag ${a.v_flag_id} emitted twice` });
        continue;
      }
      newIds.add(a.v_flag_id);
      valid.push(a);
    } else if (a.kind === 'close' || a.kind === 'state') {
      if (!knownIds.has(a.v_flag_id) && !newIds.has(a.v_flag_id)) {
        errors.push({ ...a, error: `${a.kind} on unknown V-flag: ${a.v_flag_id} not in ledger and not emitted in this scan` });
        continue;
      }
      valid.push(a);
    }
  }

  return { valid, errors };
}

function listVersionDirs(since) {
  if (!existsSync(NOTES_DIR)) {
    process.stderr.write(`retrospective tree missing at ${NOTES_DIR}\n`);
    process.exit(3);
  }
  const dirs = readdirSync(NOTES_DIR)
    .filter((d) => /^v\d+\.\d+(\.\d+)?$/.test(d))
    .filter((d) => statSync(join(NOTES_DIR, d)).isDirectory());
  if (since) {
    return dirs.filter((d) => cmpVersion(d, since) >= 0).sort(cmpVersion);
  }
  return dirs.sort(cmpVersion);
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const knownIds = loadLedgerIds();
  const versions = listVersionDirs(opts.since);

  const allFindings = [];
  const allFormalActions = [];
  const scanned = [];

  for (const v of versions) {
    const retroPath = join(NOTES_DIR, v, 'chapter', '03-retrospective.md');
    if (!existsSync(retroPath)) continue;
    const findings = scanFile(retroPath, knownIds);
    scanned.push({ version: v, hits: findings.length });
    for (const f of findings) {
      allFindings.push({ version: v, ...f });
    }
    // L-03: collect formal V-flag blocks for diff output
    const formal = parseFormalBlocks(retroPath, v);
    for (const a of formal) {
      allFormalActions.push(a);
    }
  }

  // L-03: write proposed-diff if requested
  if (opts.writeDiff) {
    const { valid, errors } = validateActions(allFormalActions, knownIds);
    const diffPath = opts.diffPath
      ? resolve(opts.diffPath)
      : resolve(REPO_ROOT, '.planning/citation-debt-proposed-diff.json');
    const diff = {
      scan_date: new Date().toISOString().split('T')[0],
      since: opts.since,
      scanned_versions: scanned.map((s) => s.version),
      proposed_actions: valid,
      validation_errors: errors,
    };
    mkdirSync(dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, JSON.stringify(diff, null, 2) + '\n', 'utf8');
    process.stdout.write(
      `Wrote proposed-diff to ${diffPath.replace(REPO_ROOT + '/', '')}: ` +
        `${valid.length} valid action(s), ${errors.length} error(s)\n`,
    );
    if (errors.length > 0) {
      for (const e of errors) {
        process.stderr.write(`  ERROR ${e.source_file}:${e.source_line}  ${e.error}\n`);
      }
    }
    if (valid.length > 0) {
      process.stdout.write(
        `Next: review the diff, then run \`node tools/citation-debt/apply-diff.mjs\` to update the ledger.\n`,
      );
    }
    process.exit(errors.length > 0 ? 1 : 0);
  }

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          scan_date: new Date().toISOString().split('T')[0],
          since: opts.since,
          ledger_path: '.planning/citation-debt.json',
          known_v_flag_ids: [...knownIds].sort(),
          versions_scanned: scanned.length,
          findings: allFindings,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
  } else {
    process.stdout.write(`Scan: ${scanned.length} retrospectives from ${opts.since ?? 'all versions'}\n`);
    process.stdout.write(`Ledger entries: ${knownIds.size} V-flags\n`);
    if (allFindings.length === 0) {
      process.stdout.write('No V-flag mentions detected — ledger is in sync.\n');
    } else {
      process.stdout.write(`Detected ${allFindings.length} V-flag mention(s):\n\n`);
      for (const f of allFindings) {
        const tag = f.in_ledger ? '(in ledger)' : '(NOT in ledger)';
        process.stdout.write(`  ${f.version}:${f.line_number}  ${f.v_flag_id} ${tag}  event=${f.event}\n`);
        process.stdout.write(`    ${f.line_text.slice(0, 140)}\n`);
      }
      process.stdout.write('\nReview each finding and update .planning/citation-debt.json as needed.\n');
    }
  }

  process.exit(allFindings.length === 0 ? 0 : 1);
}

main();
