#!/usr/bin/env node
// LLM tiebreaker — batches ambiguous investigate lessons through claude -p for
// reasoned classification. Updates release_history.lesson with classification_source='llm'
// and requires_review=true.
//
// Strategy:
//   1. Select investigate lessons with at least 1 distinctive keyword (signal)
//   2. For each, find its top candidate later release (best keyword overlap even if below threshold)
//   3. Batch 5 lessons per LLM call — ask for applied/deferred/investigate/superseded + reasoning
//   4. Persist classification with requires_review flag
//
// Usage:
//   node tools/release-history/llm-tiebreaker.mjs --limit 5      # smoke test
//   node tools/release-history/llm-tiebreaker.mjs --limit 100    # batch
//   node tools/release-history/llm-tiebreaker.mjs                # all ambiguous (careful)
//   node tools/release-history/llm-tiebreaker.mjs --dry-run      # don't call claude or write DB

import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const ctx_cfg = loadConfig();
const REPORT_FILE = join(ctx_cfg.cache_dir_abs, '_llm-tiebreaker-report.json');
mkdirSync(ctx_cfg.cache_dir_abs, { recursive: true });

const STOPWORDS = new Set([
  'the','and','for','with','from','this','that','was','are','have','has','had','not','but',
  'you','all','use','can','too','our','out','any','one','two','three','when','what','how','why',
  'where','who','some','more','most','less','very','just','like','need','done','been','its','their',
  'them','then','than','over','into','onto','off','well','good','bad','even','only','also','make',
  'made','got','get','gets','should','could','would','will','still','much','lot',
]);

const DISTINCTIVE_LEN = 6;
const BATCH_SIZE = 5;

function extractKeywords(text) {
  const words = (text || '').toLowerCase().match(/[a-z][a-z0-9_-]{3,}/g) || [];
  return [...new Set(words.filter(w => !STOPWORDS.has(w) && w.length >= 4))];
}

function compareSemver(a, b) {
  if (a.semver_major !== b.semver_major) return a.semver_major - b.semver_major;
  if (a.semver_minor !== b.semver_minor) return a.semver_minor - b.semver_minor;
  return a.semver_patch - b.semver_patch;
}

async function callClaude(prompt) {
  // Headless claude invocation — prints a single response to stdout
  const r = spawnSync('claude', ['-p', prompt, '--output-format', 'text'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 180000, // 3 min
  });
  if (r.status !== 0) {
    throw new Error(`claude exit ${r.status}: ${r.stderr?.slice(0, 500)}`);
  }
  return r.stdout.trim();
}

function buildBatchPrompt(batch) {
  const jsonSpec = batch.map((l, i) => ({
    lesson_id: l.id,
    version_lesson_was_raised: l.first_seen_version,
    lesson_short: l.body,
    lesson_full: l.long_body_md?.slice(0, 600) || l.body,
    top_candidate_release: l.candidate_release,
    candidate_feature_snippet: (l.candidate_blob || '').slice(0, 400),
  }));
  return `You are classifying retrospective lessons from a software project to determine whether each lesson has been **applied** (fixed in later work), **superseded** (replaced by a better approach in later work), **deferred** (acknowledged but not worked on), or is still open (**investigate**).

For each of the ${batch.length} lessons below, examine the lesson text and the candidate later-release feature snippet. Decide the status.

Rules:
- applied: the candidate release visibly addresses this specific lesson. Be strict — vague overlap is NOT enough.
- superseded: the candidate release or later work clearly REPLACED the approach this lesson addressed.
- deferred: the lesson is acknowledged but no action taken, AND it's not critical enough to block anything.
- investigate: unclear — the evidence is weak or the candidate doesn't directly address the lesson.

Return ONLY a JSON array. Each element must have shape:
{"lesson_id": N, "status": "applied"|"superseded"|"deferred"|"investigate", "reasoning": "one short sentence", "evidence_version": "v1.X.Y"|null}

Lessons:
${JSON.stringify(jsonSpec, null, 2)}

JSON array:`;
}

function parseResponse(text) {
  // Extract the JSON array from the response
  const m = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
  if (!m) throw new Error(`No JSON array in response: ${text.slice(0, 300)}`);
  try {
    return JSON.parse(m[0]);
  } catch (e) {
    throw new Error(`JSON parse failed: ${e.message} | text: ${m[0].slice(0, 300)}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.indexOf('--limit');
  const limit = limitArg >= 0 ? parseInt(args[limitArg + 1], 10) : 999999;
  const dryRun = args.includes('--dry-run');

  const client = await openDb(ctx_cfg);

  // Select investigate lessons that have distinctive keywords (signal) and
  // haven't been human-classified. Order by age (oldest investigate items first).
  const { rows: lessons } = await client.query(`
    SELECT l.id, l.first_seen_version, l.body, l.long_body_md,
           r.semver_major, r.semver_minor, r.semver_patch
    FROM release_history.lesson l
    JOIN release_history.release r ON r.version = l.first_seen_version
    WHERE l.status = 'investigate'
      AND l.classification_source != 'human'
      AND l.classification_source != 'llm'
    ORDER BY r.semver_major, r.semver_minor, r.semver_patch, l.id
    LIMIT $1
  `, [limit]);

  // Preload later releases for candidate matching
  const { rows: releases } = await client.query(`
    SELECT r.version, r.name, r.semver_major, r.semver_minor, r.semver_patch,
           string_agg(f.title || ' ' || COALESCE(f.summary_md, ''), ' ') AS feature_blob
    FROM release_history.release r
    LEFT JOIN release_history.feature f ON f.version = r.version
    GROUP BY r.version, r.name, r.semver_major, r.semver_minor, r.semver_patch
    ORDER BY r.semver_major, r.semver_minor, r.semver_patch
  `);

  // Filter down to lessons with at least one distinctive keyword AND a plausible candidate
  const candidates = [];
  for (const l of lessons) {
    const kws = extractKeywords(l.body);
    const distinct = kws.filter(k => k.length >= DISTINCTIVE_LEN);
    if (distinct.length === 0) continue;

    const later = releases.filter(r => compareSemver(r, l) > 0).slice(0, 100);
    let bestCandidate = null, bestHits = 0;
    for (const r of later) {
      const haystack = (r.name + ' ' + (r.feature_blob || '')).toLowerCase();
      const hits = kws.filter(kw => haystack.includes(kw)).length;
      if (hits > bestHits && hits >= 1) {
        bestCandidate = r;
        bestHits = hits;
        if (hits >= 3) break; // early exit, good enough
      }
    }
    if (bestCandidate) {
      candidates.push({
        ...l,
        candidate_release: bestCandidate.version,
        candidate_blob: (bestCandidate.name || '') + ' · ' + (bestCandidate.feature_blob || ''),
      });
    }
  }

  console.error(`[tiebreaker] ${lessons.length} investigate lessons, ${candidates.length} have LLM-worthy candidates`);

  if (candidates.length === 0) {
    console.log(JSON.stringify({ considered: 0, classified: 0 }, null, 2));
    await client.close();
    return;
  }

  const stats = {
    considered: candidates.length,
    batches: 0,
    classified: 0,
    errors: 0,
    by_status: { applied: 0, superseded: 0, deferred: 0, investigate: 0 },
    samples: [],
  };

  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    const batch = candidates.slice(i, i + BATCH_SIZE);
    stats.batches++;
    const prompt = buildBatchPrompt(batch);

    if (dryRun) {
      console.error(`[tiebreaker] DRY — would call claude with batch of ${batch.length}`);
      continue;
    }

    let response;
    try {
      console.error(`[tiebreaker] batch ${stats.batches} (lessons ${batch.map(b => b.id).join(',')}) — calling claude...`);
      response = await callClaude(prompt);
    } catch (e) {
      stats.errors++;
      console.error(`[tiebreaker] batch ${stats.batches} call failed: ${e.message}`);
      continue;
    }

    let parsed;
    try {
      parsed = parseResponse(response);
    } catch (e) {
      stats.errors++;
      console.error(`[tiebreaker] batch ${stats.batches} parse failed: ${e.message}`);
      continue;
    }

    for (const r of parsed) {
      if (!r.lesson_id || !r.status) continue;
      if (!['applied', 'superseded', 'deferred', 'investigate'].includes(r.status)) continue;
      stats.by_status[r.status] = (stats.by_status[r.status] || 0) + 1;
      stats.classified++;
      if (stats.samples.length < 10) stats.samples.push(r);

      // Only carry evidence_version if the status is actually applied/superseded
      const evidenceVersion = ['applied', 'superseded'].includes(r.status)
        ? (r.evidence_version || null)
        : null;
      await client.query(
        `UPDATE release_history.lesson
         SET status = $1,
             applied_in_version = $2,
             superseded_by_version = $3,
             classification_source = 'llm',
             classification_note = $4,
             requires_review = true,
             classified_at = now()
         WHERE id = $5 AND classification_source != 'human'`,
        [
          r.status,
          r.status === 'applied' ? evidenceVersion : null,
          r.status === 'superseded' ? evidenceVersion : null,
          (r.reasoning || '').slice(0, 500),
          r.lesson_id,
        ]
      );
    }

    // Progress ping every 5 batches
    if (stats.batches % 5 === 0) console.error(`[tiebreaker] ${stats.batches} batches / ${stats.classified} classified`);
  }

  await client.close();
  writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
  console.error(`[tiebreaker] done — ${stats.classified} classified, ${stats.errors} errors`);
  console.log(JSON.stringify({
    considered: stats.considered,
    batches: stats.batches,
    classified: stats.classified,
    errors: stats.errors,
    by_status: stats.by_status,
  }, null, 2));
}

main().catch(e => { console.error('[tiebreaker] fatal:', e.message); process.exit(2); });
