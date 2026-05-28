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
//   average_drop_alert       default 3  — avg score drop ≥ N points (per-type)
//   recent20_drop_alert      default 10 — recent N below historical by N (per-type)
//   recent20_all_F_alert     default 5  — last N releases all F (non-degree,
//                            non-chip — chip ships are F-by-design on the
//                            substantive-feature rubric)
//   per_type_min_samples     default 3  — minimum recent-N samples of a type
//                            to fire per-type drift alerts (avoid noise)
//
// Per-type baselines (v1.49.841): baselines are tracked per release_type
// (degree | milestone | feature | chip | patch) so that operational-cadence
// shifts (e.g. a long chip-ship run) don't compare against a degree-heavy
// global baseline and fire false F-grade drift alerts. The legacy global
// `average_score` / `recent20_average` fields are preserved in the baseline
// snapshot for backward inspection but no longer drive alerts.

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
  per_type_min_samples: 3,
}, cfg.quality_drift || {});

const KNOWN_TYPES = ['degree', 'milestone', 'feature', 'chip', 'patch'];

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

  // Per-type historical baselines (v1.49.841 — replaces global recent20
  // drift with type-aware comparison so operational-cadence shifts don't
  // fire false alerts).
  const { rows: byTypeHist } = await db.query(`
    SELECT r.release_type, COUNT(*) AS n, AVG(s.score)::float AS avg
    FROM release_history.release_score s
    JOIN release_history.release r ON r.version = s.version
    WHERE r.release_type IS NOT NULL
    GROUP BY r.release_type
  `);
  const histByType = {};
  for (const r of byTypeHist) {
    histByType[r.release_type] = {
      count: parseInt(r.n, 10),
      average: Math.round(r.avg * 10) / 10,
    };
  }

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

  // Per-type recent averages.
  const recentByType = {};
  for (const r of recent) {
    const t = r.release_type || 'unclassified';
    recentByType[t] = recentByType[t] || { count: 0, sum: 0 };
    recentByType[t].count++;
    recentByType[t].sum += r.score;
  }
  for (const t of Object.keys(recentByType)) {
    recentByType[t].average = Math.round((recentByType[t].sum / recentByType[t].count) * 10) / 10;
    delete recentByType[t].sum;
  }

  // "recent all F" alert is type-aware — degree-type releases use a prose
  // format that scores low on the structured rubric by design, and chip-type
  // ships (v1.49.841+) score F by design on the substantive-feature rubric.
  // Only fire when feature/milestone/patch in the recent window are all F.
  const recentWindow = recent.slice(0, T.recent20_all_F_alert);
  const authoredTypes = new Set(['feature', 'milestone', 'patch']);
  const authoredRecent = recentWindow.filter(r => authoredTypes.has(r.release_type));
  const recentAllF = authoredRecent.length > 0
    && authoredRecent.every(r => r.grade === 'F');

  await db.close();

  const current = {
    captured_at: new Date().toISOString(),
    total,
    average_score: Math.round(avg * 10) / 10,
    distribution: byGrade,
    recent20_average: Math.round(recentAvg * 10) / 10,
    by_type: {
      historical: histByType,
      recent: recentByType,
    },
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
  const perTypeDeltas = {};

  // Per-type historical-average drop alerts. Baselines without the
  // `by_type` field (pre-v1.49.841) fall through to a one-shot
  // migration message; the operator should re-baseline with
  // --update-baseline to enable per-type drift detection.
  const baseHist = baseline.by_type && baseline.by_type.historical;
  if (!baseHist) {
    alerts.push({
      kind: 'baseline_schema_migration',
      severity: 'warning',
      message: `Baseline lacks by_type field — re-run with --update-baseline to enable per-type drift detection (v1.49.841+)`,
    });
  } else {
    for (const type of KNOWN_TYPES) {
      const base = baseHist[type];
      const cur = histByType[type];
      if (!base || !cur) continue;
      const delta = Math.round((cur.average - base.average) * 10) / 10;
      perTypeDeltas[type] = delta;
      if (delta <= -T.average_drop_alert) {
        alerts.push({
          kind: `average_drop_${type}`,
          severity: 'major',
          message: `${type}-type average dropped ${Math.abs(delta).toFixed(1)} points (baseline ${base.average} → current ${cur.average}, n=${cur.count})`,
        });
      }
    }

    // Per-type recent-N drift alerts. Compares current recent-N-average
    // of a type against the RECENT-N-AVERAGE captured at baseline time
    // for THAT TYPE. This makes drift-check answer "did this type's
    // score get worse SINCE I last calibrated", which is the intended
    // regression signal — comparing recent against all-time historical
    // would fire whenever ship cadence shifts even without any real
    // authoring regression (Lesson #10438 candidate; see v1.49.841
    // retrospective). Requires min samples to fire.
    const baseRecent = baseline.by_type && baseline.by_type.recent;
    if (baseRecent) {
      for (const type of KNOWN_TYPES) {
        const rec = recentByType[type];
        const base = baseRecent[type];
        if (!rec || !base) continue;
        if (rec.count < T.per_type_min_samples) continue;
        const delta = Math.round((rec.average - base.average) * 10) / 10;
        if (delta <= -T.recent20_drop_alert) {
          alerts.push({
            kind: `recent_drift_${type}`,
            severity: 'major',
            message: `Recent ${type}-type avg (${rec.average}, n=${rec.count}) is ${Math.abs(delta).toFixed(1)} below baseline-recent ${type}-type avg (${base.average}, n=${base.count})`,
          });
        }
      }
    }
  }

  // Alert: last N all F (authored types only — see authoredTypes above)
  if (recentAllF) {
    alerts.push({
      kind: 'recent_all_F',
      severity: 'warning',
      message: `Last ${T.recent20_all_F_alert} authored-type releases all graded F — authoring regression`,
    });
  }

  // Alert: per-grade shifts (positive shift of F, negative shift of A/B).
  // Kept as a global signal — grade distribution captures across-type
  // regressions that per-type avg drops would miss.
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
    per_type_deltas: perTypeDeltas,
    alerts,
    status: alerts.length === 0 ? 'clean'
          : alerts.some(a => a.severity === 'major') ? 'drifting' : 'warn',
  };
  writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));

  console.log(JSON.stringify({
    status: report.status,
    alert_count: alerts.length,
    per_type_deltas: perTypeDeltas,
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
