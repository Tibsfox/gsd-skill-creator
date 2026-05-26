#!/usr/bin/env node
/**
 * render-adoption-dashboard.mjs — generate `dashboard/adoption.html` from
 * the adoption-scan JSON output.
 *
 * Added v1.49.787 (Tier 1 T1.2 ship 2/3). Self-contained static HTML with
 * inline CSS — no external assets, no JS bundler. Mirrors the dashboard/
 * static-page pattern (sibling pages are gitignored auto-regen targets).
 *
 * Input: stdin (JSON array from `node tools/adoption-scan.mjs --json`)
 * Output: writes `dashboard/adoption.html` (gitignored)
 *
 * CLI:
 *   node tools/adoption-scan.mjs --json | node tools/render-adoption-dashboard.mjs
 *   node tools/render-adoption-dashboard.mjs --in records.json
 *   node tools/render-adoption-dashboard.mjs --out custom/path.html
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const args = process.argv.slice(2);
const ROOT = resolve(process.cwd());

const inIdx = args.indexOf('--in');
const outIdx = args.indexOf('--out');
const IN_PATH = inIdx >= 0 ? resolve(args[inIdx + 1]) : null;
const OUT_PATH = outIdx >= 0 ? resolve(args[outIdx + 1]) : join(ROOT, 'dashboard', 'adoption.html');

function readInput() {
  if (IN_PATH) {
    if (!existsSync(IN_PATH)) {
      console.error(`[render-adoption-dashboard] FATAL: input file not found: ${IN_PATH}`);
      process.exit(2);
    }
    return readFileSync(IN_PATH, 'utf8');
  }
  // Read from stdin
  const chunks = [];
  return new Promise((res, rej) => {
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
    process.stdin.on('error', rej);
  });
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function statusBadge(status) {
  const colors = {
    living: '#22c55e',
    'test-only': '#f97316',
    isolated: '#ef4444',
  };
  return `<span class="badge" style="background:${colors[status] || '#888'}">${esc(status)}</span>`;
}

function renderTableRow(r) {
  const callerList = [
    ...r.internalImporters.map((m) => `\`${m}\``),
    ...(r.cliImporters.length > 0 ? ['cli'] : []),
    ...(r.externalImporters.length > 0 ? [`${r.externalImporters.length} external`] : []),
  ];
  const callers = callerList.length > 0 ? callerList.slice(0, 6).join(', ') + (callerList.length > 6 ? `, +${callerList.length - 6}` : '') : '—';
  return `
    <tr class="status-${esc(r.status)}${r.allowlisted ? ' allowlisted' : ''}">
      <td><code>${esc(r.module)}</code></td>
      <td>${statusBadge(r.status)}${r.allowlisted ? ' <span class="allowlist-tag">allowlisted</span>' : ''}</td>
      <td class="num">${r.selfFiles}</td>
      <td class="num">${r.realCallerCount}</td>
      <td class="num">${r.testCount}</td>
      <td class="callers">${esc(callers)}</td>
    </tr>`;
}

function render(records) {
  const summary = {
    total: records.length,
    living: records.filter((r) => r.status === 'living').length,
    testOnly: records.filter((r) => r.status === 'test-only').length,
    isolated: records.filter((r) => r.status === 'isolated').length,
    allowlisted: records.filter((r) => r.allowlisted).length,
    shelfwareNonAllowlisted: records.filter((r) => r.status !== 'living' && !r.allowlisted).length,
  };

  // Sort: shelfware risk first (status-priority + lower-realCallerCount first), then alphabetical
  const sorted = [...records].sort((a, b) => {
    const sw = { living: 2, 'test-only': 1, isolated: 0 };
    if (sw[a.status] !== sw[b.status]) return sw[a.status] - sw[b.status];
    if (a.allowlisted !== b.allowlisted) return a.allowlisted ? 1 : -1;
    if (a.realCallerCount !== b.realCallerCount) return a.realCallerCount - b.realCallerCount;
    return a.module.localeCompare(b.module);
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>gsd-skill-creator — Adoption Telemetry</title>
  <style>
    :root {
      --bg: #0d1117;
      --panel: #161b22;
      --border: #30363d;
      --text: #c9d1d9;
      --text-muted: #8b949e;
      --link: #58a6ff;
      --code-bg: #1f2428;
      --mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    }
    body { font-family: var(--sans); margin: 0; padding: 0; background: var(--bg); color: var(--text); }
    .wrap { max-width: 1240px; margin: 0 auto; padding: 32px 24px; }
    h1 { margin: 0 0 8px 0; font-weight: 700; font-size: 28px; }
    .subtitle { color: var(--text-muted); margin-bottom: 24px; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
    .summary-card { background: var(--panel); border: 1px solid var(--border); border-radius: 6px; padding: 16px; }
    .summary-card .label { color: var(--text-muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 32px; font-weight: 700; font-family: var(--mono); margin-top: 4px; }
    .summary-card.alert .value { color: #f97316; }
    .summary-card.good .value { color: #22c55e; }
    .summary-card.crit .value { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; background: var(--panel); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
    th, td { padding: 8px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
    th { background: #1c2128; font-weight: 600; color: var(--text-muted); text-transform: uppercase; font-size: 12px; letter-spacing: 0.05em; }
    tr:last-child td { border-bottom: none; }
    tr:hover { background: rgba(56, 139, 253, 0.05); }
    tr.allowlisted { opacity: 0.7; }
    td.num { text-align: right; font-family: var(--mono); }
    code { background: var(--code-bg); padding: 1px 6px; border-radius: 3px; font-family: var(--mono); font-size: 13px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #0d1117; letter-spacing: 0.05em; }
    .allowlist-tag { background: var(--code-bg); color: var(--text-muted); padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
    .callers { color: var(--text-muted); font-size: 13px; }
    .meta { color: var(--text-muted); font-size: 13px; margin: 24px 0 16px 0; }
    .meta a { color: var(--link); text-decoration: none; }
    .legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 13px; color: var(--text-muted); }
    .legend .item { display: flex; align-items: center; gap: 6px; }
    .legend .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .legend .dot.living { background: #22c55e; }
    .legend .dot.test-only { background: #f97316; }
    .legend .dot.isolated { background: #ef4444; }
    .nav { margin-bottom: 24px; font-size: 14px; }
    .nav a { color: var(--link); margin-right: 16px; text-decoration: none; }
    .nav a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="nav">
      <a href="index.html">← Dashboard</a>
      <a href="state.html">State</a>
      <a href="milestones.html">Milestones</a>
    </div>

    <h1>Adoption Telemetry</h1>
    <div class="subtitle">TypeScript-import-surface adoption for <code>src/&lt;module&gt;/</code> directories. Updated by <code>npm run adoption-report:refresh</code>.</div>

    <div class="summary-grid">
      <div class="summary-card"><div class="label">Total modules</div><div class="value">${summary.total}</div></div>
      <div class="summary-card good"><div class="label">Living</div><div class="value">${summary.living}</div></div>
      <div class="summary-card alert"><div class="label">Test-only</div><div class="value">${summary.testOnly}</div></div>
      <div class="summary-card crit"><div class="label">Isolated</div><div class="value">${summary.isolated}</div></div>
      <div class="summary-card"><div class="label">Allowlisted</div><div class="value">${summary.allowlisted}</div></div>
      <div class="summary-card alert"><div class="label">Shelfware (non-allowlisted)</div><div class="value">${summary.shelfwareNonAllowlisted}</div></div>
    </div>

    <div class="legend">
      <div class="item"><span class="dot isolated"></span> isolated — no importers</div>
      <div class="item"><span class="dot test-only"></span> test-only — only test imports</div>
      <div class="item"><span class="dot living"></span> living — ≥1 real caller</div>
    </div>

    <div class="meta">
      Generated <code>${esc(new Date().toISOString())}</code> · Baseline source: <a href="../docs/ADOPTION-BASELINE-v1.49.787.md">docs/ADOPTION-BASELINE-v1.49.787.md</a>
    </div>

    <table>
      <thead>
        <tr>
          <th>Module</th>
          <th>Status</th>
          <th class="num">Self files</th>
          <th class="num">Real callers</th>
          <th class="num">Test callers</th>
          <th>Callers</th>
        </tr>
      </thead>
      <tbody>
${sorted.map(renderTableRow).join('')}
      </tbody>
    </table>

    <p class="meta">Sorted shelfware-risk first: isolated → test-only → living, then by real-caller count ascending. Allowlisted entries appear at the bottom of each status group with reduced opacity.</p>
  </div>
</body>
</html>
`;
}

async function main() {
  const raw = await readInput();
  let records;
  try {
    records = JSON.parse(raw);
  } catch (err) {
    console.error(`[render-adoption-dashboard] FATAL: cannot parse input JSON: ${err.message}`);
    process.exit(2);
  }
  if (!Array.isArray(records)) {
    console.error('[render-adoption-dashboard] FATAL: input is not an array');
    process.exit(2);
  }
  const html = render(records);
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, html, 'utf8');
  console.error(`[render-adoption-dashboard] wrote ${OUT_PATH} (${records.length} modules)`);
}

main();
