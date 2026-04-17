#!/usr/bin/env node
// Quality drift watcher — executable counterpart to the
// quality-drift-watcher agent. Compares current score distribution
// against .planning/release-cache/_quality-baseline.json and exits
// non-zero when drift thresholds are exceeded.
//
// First run writes the baseline and exits 0.
// Subsequent runs compare; alerts go to stderr, structured JSON to stdout.
//
// Flags:
//   --update-baseline   overwrite baseline with current (use after
//                       intentional regressions or big uplifts)
//   --warn-only         never exit non-zero (informational use)
//
// Thresholds (tunable via cfg.quality_drift):
//   average_drop_alert       default 3  — avg score drop ≥ N points
//   recent20_drop_alert      default 10 — recent 20 below historical by N
//   recent20_all_F_alert     default 5  — last N releases all F

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const BASELINE_FILE = join(cfg.cache_dir_abs, '_quality-baseline.json');
const REPORT_FILE = join(cfg.cache_dir_abs, '_drift-report.json');
mkdirSync(cfg.cache_dir_abs, { recursive: true });

const T = Object.assign({
  average_drop_alert: 3,
  recent20_drop_alert: 10,
  recent20_all_F_alert: 5,
}, cfg.quality_drift || {});

const args = process.argv.slice(2);
const updateBaseline = args.includes('--update-baseline');
const warnOnly = args.includes('--warn-only');

async function main() {
  const db = await openDb(cfg);

  // Full distribution
  const { rows: dist } = await db.query(`
    SELECT grade, COUNT(*) AS n, AVG(score) AS avg
    FROM release_history.release_score GROUP BY grade
  `);
  const byGrade = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let totalScore = 0;
  let total = 0;
  for (const r of dist) {
    byGrade[r.grade] = parseInt(r.n, 10);
    total += parseInt(r.n, 10);
    totalScore += parseInt(r.n, 10) * parseFloat(r.avg);
  }
  const avg = total > 0 ? totalScore / total : 0;

  // Recent 20 releases (newest first by semver)
  const { rows: recent } = await db.query(`
    SELECT s.score, s.grade, r.release_type
    FROM release_history.release_score s
    JOIN release_history.release r ON r.version = s.version
    ORDER BY r.semver_major DESC, r.semver_minor DESC, r.semver_patch DESC
    LIMIT 20
  `);
  const recentAvg = recent.length > 0
    ? recent.reduce((s, r) => s + r.score, 0) / recent.length : 0;
  // "recent all F" alert is type-aware — degree-type releases use a prose
  // format that scores low on the structured rubric by design, so they
  // shouldn't trip the authoring-regression alarm. Only fire when
  // non-degree releases in the recent window are all F.
  const recentWindow = recent.slice(0, T.recent20_all_F_alert);
  const nonDegreeRecent = recentWindow.filter(r => r.release_type !== 'degree');
  const recentAllF = nonDegreeRecent.length > 0
    && nonDegreeRecent.every(r => r.grade === 'F');

  await db.close();

  const current = {
    captured_at: new Date().toISOString(),
    total,
    average_score: Math.round(avg * 10) / 10,
    distribution: byGrade,
    recent20_average: Math.round(recentAvg * 10) / 10,
  };

  // First run or --update-baseline: write and exit
  if (!existsSync(BASELINE_FILE) || updateBaseline) {
    writeFileSync(BASELINE_FILE, JSON.stringify(current, null, 2));
    console.error(`[drift] baseline ${updateBaseline ? 'updated' : 'captured'}: avg ${current.average_score}, ${total} releases`);
    console.log(JSON.stringify({ action: 'baseline-set', ...current }, null, 2));
    return;
  }

  const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'));
  const alerts = [];

  // Alert: overall average dropped
  const avgDelta = current.average_score - baseline.average_score;
  if (avgDelta <= -T.average_drop_alert) {
    alerts.push({
      kind: 'average_drop',
      severity: 'major',
      message: `Average quality dropped ${Math.abs(avgDelta).toFixed(1)} points (baseline ${baseline.average_score} → current ${current.average_score})`,
    });
  }

  // Alert: recent-20 below historical
  const recentDelta = current.recent20_average - baseline.average_score;
  if (recentDelta <= -T.recent20_drop_alert) {
    alerts.push({
      kind: 'recent20_drift',
      severity: 'major',
      message: `Recent 20 average (${current.recent20_average}) is ${Math.abs(recentDelta).toFixed(1)} below historical baseline (${baseline.average_score})`,
    });
  }

  // Alert: last N all F
  if (recentAllF) {
    alerts.push({
      kind: 'recent_all_F',
      severity: 'warning',
      message: `Last ${T.recent20_all_F_alert} releases all graded F — authoring regression`,
    });
  }

  // Alert: per-grade shifts (positive shift of F, negative shift of A/B)
  for (const g of ['A', 'B', 'C', 'D', 'F']) {
    const delta = (current.distribution[g] || 0) - (baseline.distribution[g] || 0);
    if (g === 'F' && delta > 10) {
      alerts.push({
        kind: 'grade_shift_F',
        severity: 'warning',
        message: `F-grade count grew by ${delta} since baseline`,
      });
    }
    if ((g === 'A' || g === 'B') && delta < -2) {
      alerts.push({
        kind: `grade_shift_${g}`,
        severity: 'warning',
        message: `${g}-grade count dropped by ${Math.abs(delta)} since baseline`,
      });
    }
  }

  const report = {
    ran_at: new Date().toISOString(),
    baseline_at: baseline.captured_at,
    current, baseline,
    avg_delta: Math.round(avgDelta * 10) / 10,
    recent20_delta: Math.round(recentDelta * 10) / 10,
    alerts,
    status: alerts.length === 0 ? 'clean'
          : alerts.some(a => a.severity === 'major') ? 'drifting' : 'warn',
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    status: report.status,
    alert_count: alerts.length,
    avg_delta: report.avg_delta,
    recent20_delta: report.recent20_delta,
  }, null, 2));

  for (const a of alerts) {
    console.error(`  [${a.severity}] ${a.kind}: ${a.message}`);
  }
  if (alerts.length === 0) {
    console.error(`[drift] clean — avg ${current.average_score} (baseline ${baseline.average_score}), recent20 ${current.recent20_average}`);
  }

  if (warnOnly) process.exit(0);
  process.exit(report.status === 'drifting' ? 1 : 0);
}

main().catch(e => { console.error('[drift] fatal:', e.message); process.exit(2); });
