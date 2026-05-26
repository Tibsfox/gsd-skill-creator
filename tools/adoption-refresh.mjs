#!/usr/bin/env node
/**
 * adoption-refresh.mjs — orchestrator: scan + diff prior baseline + write
 * new baseline + render dashboard widget.
 *
 * Added v1.49.787 (Tier 1 T1.2 ship 2/3). Replaces the manual two-step
 * (`node tools/adoption-scan.mjs > docs/ADOPTION-BASELINE-...md` +
 * `node tools/render-adoption-dashboard.mjs`) with a single command that
 * also surfaces status-change diffs.
 *
 * What this does:
 *   1. Runs adoption-scan (JSON output captured in-memory)
 *   2. Reads any prior baseline JSON snapshot (if present)
 *   3. Diffs status changes per module: previous-status → current-status
 *   4. Writes new baseline markdown to docs/ADOPTION-BASELINE-vN.md (overwrite)
 *   5. Writes JSON snapshot to docs/ADOPTION-BASELINE-vN.json (overwrite)
 *   6. Renders dashboard/adoption.html
 *   7. Prints diff summary to stderr
 *
 * The JSON snapshot lives next to the markdown baseline so future runs can
 * diff against the prior version without re-parsing markdown.
 *
 * CLI:
 *   node tools/adoption-refresh.mjs           # use current package.json version
 *   node tools/adoption-refresh.mjs --version 1.49.787
 *   node tools/adoption-refresh.mjs --no-dashboard   # skip dashboard render
 *   node tools/adoption-refresh.mjs --dry-run        # report diff, write nothing
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.cwd());
const SCAN_PATH = join(HERE, 'adoption-scan.mjs');
const RENDER_PATH = join(HERE, 'render-adoption-dashboard.mjs');

const versionIdx = args.indexOf('--version');
const VERSION = versionIdx >= 0 ? args[versionIdx + 1] : (() => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  return pkg.version;
})();
const NO_DASHBOARD = args.includes('--no-dashboard');
const DRY_RUN = args.includes('--dry-run');

const BASELINE_MD = join(ROOT, 'docs', `ADOPTION-BASELINE-v${VERSION}.md`);
const BASELINE_JSON = join(ROOT, 'docs', `ADOPTION-BASELINE-v${VERSION}.json`);

function runScan() {
  const result = spawnSync('node', [SCAN_PATH, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error('[adoption-refresh] FATAL: adoption-scan failed');
    if (result.stderr) console.error(result.stderr);
    process.exit(2);
  }
  return JSON.parse(result.stdout);
}

function runScanMarkdown() {
  const result = spawnSync('node', [SCAN_PATH], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error('[adoption-refresh] FATAL: adoption-scan markdown failed');
    if (result.stderr) console.error(result.stderr);
    process.exit(2);
  }
  return result.stdout;
}

function findPriorJson() {
  // Look for the most recent ADOPTION-BASELINE-v*.json in docs/, excluding the
  // one we're about to write.
  const docsDir = join(ROOT, 'docs');
  if (!existsSync(docsDir)) return null;
  const entries = readdirSync(docsDir)
    .filter((f) => /^ADOPTION-BASELINE-v[0-9.]+\.json$/.test(f) && f !== `ADOPTION-BASELINE-v${VERSION}.json`)
    .sort();
  if (entries.length === 0) return null;
  return join(docsDir, entries[entries.length - 1]);
}

function diffRecords(prior, current) {
  const priorMap = new Map(prior.map((r) => [r.module, r]));
  const currentMap = new Map(current.map((r) => [r.module, r]));
  const changes = {
    newModules: [],
    removedModules: [],
    statusChanged: [],
    callerCountChanged: [],
  };
  for (const r of current) {
    const p = priorMap.get(r.module);
    if (!p) {
      changes.newModules.push(r.module);
      continue;
    }
    if (p.status !== r.status) {
      changes.statusChanged.push({ module: r.module, from: p.status, to: r.status });
    } else if (p.realCallerCount !== r.realCallerCount) {
      changes.callerCountChanged.push({
        module: r.module,
        from: p.realCallerCount,
        to: r.realCallerCount,
      });
    }
  }
  for (const r of prior) {
    if (!currentMap.has(r.module)) {
      changes.removedModules.push(r.module);
    }
  }
  return changes;
}

function formatDiff(changes) {
  const lines = [];
  const total =
    changes.newModules.length +
    changes.removedModules.length +
    changes.statusChanged.length +
    changes.callerCountChanged.length;
  if (total === 0) {
    return '[adoption-refresh] no changes since prior baseline';
  }
  lines.push(`[adoption-refresh] ${total} change(s) since prior baseline:`);
  if (changes.statusChanged.length > 0) {
    lines.push(`  status changes (${changes.statusChanged.length}):`);
    for (const c of changes.statusChanged) {
      const dir = c.from === 'isolated' && c.to !== 'isolated'
        ? '↑'
        : c.from === 'living' && c.to !== 'living'
          ? '↓'
          : c.to === 'living'
            ? '↑'
            : '·';
      lines.push(`    ${dir} ${c.module}: ${c.from} → ${c.to}`);
    }
  }
  if (changes.newModules.length > 0) {
    lines.push(`  new modules (${changes.newModules.length}): ${changes.newModules.join(', ')}`);
  }
  if (changes.removedModules.length > 0) {
    lines.push(`  removed modules (${changes.removedModules.length}): ${changes.removedModules.join(', ')}`);
  }
  if (changes.callerCountChanged.length > 0) {
    const significant = changes.callerCountChanged.filter((c) => Math.abs(c.from - c.to) >= 2);
    if (significant.length > 0) {
      lines.push(`  significant caller-count changes (≥2, ${significant.length}):`);
      for (const c of significant.slice(0, 10)) {
        const dir = c.to > c.from ? '+' : '−';
        lines.push(`    ${dir} ${c.module}: ${c.from} → ${c.to}`);
      }
      if (significant.length > 10) lines.push(`    ... +${significant.length - 10} more`);
    }
    const noisy = changes.callerCountChanged.length - significant.length;
    if (noisy > 0) {
      lines.push(`  (suppressed ${noisy} ±1-caller fluctuations)`);
    }
  }
  return lines.join('\n');
}

function renderDashboard(currentJson) {
  if (NO_DASHBOARD) return;
  if (DRY_RUN) {
    console.error('[adoption-refresh] DRY-RUN: would render dashboard/adoption.html');
    return;
  }
  const result = spawnSync('node', [RENDER_PATH], {
    cwd: ROOT,
    encoding: 'utf8',
    input: JSON.stringify(currentJson),
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error('[adoption-refresh] FATAL: render-adoption-dashboard failed');
    if (result.stderr) console.error(result.stderr);
    process.exit(2);
  }
  if (result.stderr) process.stderr.write(result.stderr);
}

function main() {
  const current = runScan();
  const currentMarkdown = runScanMarkdown();

  const priorPath = findPriorJson();
  let changes = null;
  if (priorPath) {
    try {
      const prior = JSON.parse(readFileSync(priorPath, 'utf8'));
      changes = diffRecords(prior, current);
    } catch (err) {
      console.error(`[adoption-refresh] WARN: cannot parse prior baseline at ${priorPath}: ${err.message}`);
    }
  } else {
    console.error('[adoption-refresh] no prior baseline found (first run)');
  }

  if (changes) {
    console.error(formatDiff(changes));
  }

  if (DRY_RUN) {
    console.error(`[adoption-refresh] DRY-RUN: would write ${BASELINE_MD}`);
    console.error(`[adoption-refresh] DRY-RUN: would write ${BASELINE_JSON}`);
  } else {
    mkdirSync(dirname(BASELINE_MD), { recursive: true });
    writeFileSync(BASELINE_MD, currentMarkdown, 'utf8');
    writeFileSync(BASELINE_JSON, JSON.stringify(current, null, 2) + '\n', 'utf8');
    console.error(`[adoption-refresh] wrote ${BASELINE_MD}`);
    console.error(`[adoption-refresh] wrote ${BASELINE_JSON}`);
  }

  renderDashboard(current);

  process.exit(0);
}

main();
