#!/usr/bin/env node
// LLM review queue triage — auto-dismiss high-confidence LLM classifications.
//
// A lesson qualifies for auto-dismiss when:
//   - classification_source = 'llm'
//   - requires_review = true
//   - status IN ('applied', 'deferred', 'superseded')
//     (i.e., the LLM made a concrete call, not an 'investigate' punt)
//   - classification_note IS NOT NULL AND length(trim(note)) >= 20
//     (i.e., the LLM explained its reasoning)
//   - If status='applied', applied_in_version IS NOT NULL
//   - If status='superseded', superseded_by_version IS NOT NULL
//
// Auto-dismissed lessons keep classification_source='llm' (honest
// provenance), just flip requires_review to false so the queue
// only surfaces lessons that actually need human eyes.
//
// Usage:
//   node tools/release-history/llm-queue-triage.mjs --dry-run   # preview counts
//   node tools/release-history/llm-queue-triage.mjs --apply     # perform update
//   node tools/release-history/llm-queue-triage.mjs             # same as --dry-run

import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');

async function main() {
  const cfg = loadConfig();
  const db = await openDb(cfg);

  // Current queue breakdown
  const { rows: before } = await db.query(`
    SELECT classification_source, requires_review, status, COUNT(*)::int AS n
    FROM release_history.lesson
    GROUP BY classification_source, requires_review, status
    ORDER BY 1, 2, 3
  `);

  // Count eligible auto-dismiss candidates
  const { rows: eligibleRows } = await db.query(`
    SELECT COUNT(*)::int AS n
    FROM release_history.lesson
    WHERE classification_source = 'llm'
      AND requires_review = true
      AND status IN ('applied', 'deferred', 'superseded')
      AND classification_note IS NOT NULL
      AND length(trim(classification_note)) >= 20
      AND (status != 'applied' OR applied_in_version IS NOT NULL)
      AND (status != 'superseded' OR superseded_by_version IS NOT NULL)
  `);
  const eligible = eligibleRows[0]?.n || 0;

  // Breakdown of eligible by status
  const { rows: byStatus } = await db.query(`
    SELECT status, COUNT(*)::int AS n
    FROM release_history.lesson
    WHERE classification_source = 'llm'
      AND requires_review = true
      AND status IN ('applied', 'deferred', 'superseded')
      AND classification_note IS NOT NULL
      AND length(trim(classification_note)) >= 20
      AND (status != 'applied' OR applied_in_version IS NOT NULL)
      AND (status != 'superseded' OR superseded_by_version IS NOT NULL)
    GROUP BY status ORDER BY status
  `);

  let dismissed = 0;
  if (apply && eligible > 0) {
    const result = await db.query(`
      UPDATE release_history.lesson
         SET requires_review = false
       WHERE classification_source = 'llm'
         AND requires_review = true
         AND status IN ('applied', 'deferred', 'superseded')
         AND classification_note IS NOT NULL
         AND length(trim(classification_note)) >= 20
         AND (status != 'applied' OR applied_in_version IS NOT NULL)
         AND (status != 'superseded' OR superseded_by_version IS NOT NULL)
    `);
    dismissed = result.rowCount || 0;
  }

  // Remaining queue
  const { rows: remainingRows } = await db.query(`
    SELECT COUNT(*)::int AS n
    FROM release_history.lesson
    WHERE classification_source = 'llm' AND requires_review = true
  `);
  const remaining = remainingRows[0]?.n || 0;

  await db.close();

  console.error(`[llm-triage] queue before: ${before.filter(r => r.classification_source==='llm' && r.requires_review).reduce((s,r)=>s+r.n,0)} LLM-flagged`);
  console.error(`[llm-triage] eligible auto-dismiss: ${eligible}`);
  for (const r of byStatus) {
    console.error(`  ${r.status.padEnd(12)}: ${r.n}`);
  }
  if (apply) {
    console.error(`[llm-triage] dismissed: ${dismissed}`);
    console.error(`[llm-triage] remaining flagged: ${remaining} (investigate-status needing human review)`);
  } else {
    console.error(`[llm-triage] dry-run — re-run with --apply to perform`);
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    eligible,
    by_status: Object.fromEntries(byStatus.map(r => [r.status, r.n])),
    dismissed: apply ? dismissed : 0,
    remaining_after: apply ? remaining : remaining - eligible,
  }, null, 2));
}

main().catch(e => { console.error('[llm-triage] fatal:', e.message); process.exit(2); });
