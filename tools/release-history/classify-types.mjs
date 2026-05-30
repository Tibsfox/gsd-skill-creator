#!/usr/bin/env node
// Classify each release into a type so scorer + drift-check can grade
// against the right rubric.
//
// Types:
//   degree       — paired-engine release (Part A + Part B in header, prose-style)
//   milestone    — major milestone marker (name mentions milestone/complete/shipped;
//                  or major platform-level work)
//   chip         — small operational ship (codification, KNOWN_UNWIRED chip,
//                  scaffold, stale-entry cleanup, wedge close, audit
//                  inverse-check, atomic-writer tool). Distinguished by
//                  recurring scope markers in the name. Per v1.49.841 these
//                  baseline separately from substantive features so the
//                  drift-check doesn't fire false positives during
//                  operational-debt sessions.
//   task         — task-ID-prefixed ship (T1.x, T2.x, T3.x, Sn) — task-shaped
//                  feature work with minimal release-notes that scores F on the
//                  structured rubric by design. Per v1.49.855 these baseline
//                  separately from substantive features (the v1.49.841 forward-
//                  flag closed here).
//   feature      — new functionality (default for non-fix, non-degree, non-chip,
//                  non-task)
//   patch        — small fix/bugfix/hotfix
//
// Usage:
//   node tools/release-history/classify-types.mjs             # classify all
//   node tools/release-history/classify-types.mjs v1.49.165   # one release
//   node tools/release-history/classify-types.mjs --summary   # distribution

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

// Priority order: degree → milestone → patch → chip → task → feature (default).
// Returns { type, confidence, reason }.
export function classify(release, readmeText) {
  const name = (release.name || '').trim();
  const nameLower = name.toLowerCase();

  // Degree: paired-engine release. Look for Part A + Part B in the header
  // block (first 30 lines), which is the canonical structure.
  if (readmeText) {
    const head = readmeText.split(/\r?\n/).slice(0, 30).join('\n');
    const hasPartA = /^\s*\*\*Part A[:*]/mi.test(head);
    const hasPartB = /^\s*\*\*Part B[:*]/mi.test(head);
    if (hasPartA && hasPartB) {
      return { type: 'degree', confidence: 0.95, reason: 'Part A + Part B header' };
    }
  }
  // Name-based degree detection — a "Degree <number>" title is a strong signal
  // even when the README body is absent. Hoisted out of the `if (readmeText)`
  // guard at v1.49.913: production passes readmeText only when the README exists
  // (classify-types.mjs main), so degree-named releases with no README used to
  // fall through to 'feature'. The Part A/B check above still takes precedence
  // (higher confidence) whenever a README is present, so this is a no-op on the
  // README-present path and only fixes the no-README edge case.
  //
  // Anchored to `degree <digit>` (not `\w+`) so prose compounds like
  // "180-degree Turn", "Third-degree Burn Fix", or "High-degree Polynomial" are
  // NOT misclassified as degree — a latent over-match the hoist would otherwise
  // newly expose on the no-README path. Real NASA degrees are always numbered.
  if (/\bdegree\s+\d/i.test(name)) {
    return { type: 'degree', confidence: 0.85, reason: 'name contains "Degree <number>"' };
  }

  // Milestone markers (strong name signals).
  if (/\b(milestone|complete|shipped|launch|release)\b/i.test(name) &&
      !/\bfix\b|\bpatch\b|\bhotfix\b/i.test(nameLower)) {
    return { type: 'milestone', confidence: 0.80, reason: 'name marks milestone' };
  }

  // Patch: explicit fix markers in name.
  if (/\b(fix|bugfix|hotfix|patch)\b/i.test(nameLower)) {
    return { type: 'patch', confidence: 0.85, reason: 'name marks fix/patch' };
  }

  // v1.X.0 (semver_patch == 0) — treat as milestone when nothing else matched.
  if (release.semver_patch === 0) {
    return { type: 'milestone', confidence: 0.70, reason: 'semver patch = 0' };
  }

  // Chip: small operational ship. Keywords are scope markers that have
  // become recurring in the post-v800 operational-debt cadence. Word-boundary
  // anchors keep "Chipset" (Gastown Chipset) from matching "Chip". The
  // Codify regex is title-case to avoid catching prose mentions in degree
  // titles. See v1.49.841 retrospective.
  const chipMarkers = /\b(Chip|Codification Ship|Codify|Scaffold|Singleton|Stale[- ]Entry|Wedge Close|Inverse[- ]Check|Atomic Writer)\b/;
  if (chipMarkers.test(name)) {
    return { type: 'chip', confidence: 0.85, reason: 'name marks chip-class ship' };
  }

  // Task: title STARTS WITH a task-ID prefix (T1.x, T2.x, T3.x, Sn). v1.49.855
  // closure of v1.49.841 forward-flag. Task-shaped ships have minimal release
  // notes by design (T-prefix is the canonical signal that the ship is a
  // single planning-task closure, not a substantive-feature release). Anchored
  // to title start so degree titles mentioning S-prefix segment numbers
  // (e.g. "S36 Return") aren't misclassified — those still resolve to degree
  // earlier in this function. Codification ships mentioning S-prefix work
  // (v805 "Codification Ship: S3 + S4 + S7") also still resolve to chip
  // earlier per the chipMarkers regex.
  const taskMarkers = /^[TS]\d+(\.\d+)?\s/;
  if (taskMarkers.test(name)) {
    return { type: 'task', confidence: 0.80, reason: 'name starts with task-ID prefix (T1.x/T2.x/Sn)' };
  }

  // Default: feature.
  return { type: 'feature', confidence: 0.50, reason: 'default (no strong signal)' };
}

async function main() {
  const args = process.argv.slice(2);
  const summary = args.includes('--summary');
  const explicit = args.find(a => !a.startsWith('--'));

  const cfg = loadConfig();
  const db = await openDb(cfg);

  const { rows: releases } = await db.query(
    explicit
      ? `SELECT version, name, semver_major, semver_minor, semver_patch, source_readme
           FROM release_history.release WHERE version = $1`
      : `SELECT version, name, semver_major, semver_minor, semver_patch, source_readme
           FROM release_history.release
           ORDER BY semver_major, semver_minor, semver_patch`,
    explicit ? [explicit] : []
  );

  if (releases.length === 0) {
    console.error('[classify-types] no releases matched');
    await db.close();
    return;
  }

  const dist = { degree: 0, milestone: 0, feature: 0, patch: 0, chip: 0, task: 0 };
  let classified = 0;

  for (const r of releases) {
    const readmePath = join(REPO_ROOT, 'docs', 'release-notes', r.version, 'README.md');
    const readmeText = existsSync(readmePath) ? readFileSync(readmePath, 'utf8') : null;

    const result = classify(r, readmeText);
    dist[result.type]++;
    classified++;

    await db.query(
      `UPDATE release_history.release SET release_type = $1 WHERE version = $2`,
      [result.type, r.version]
    );

    if (explicit || summary) {
      console.error(`  ${r.version.padEnd(14)} ${result.type.padEnd(10)} conf=${result.confidence.toFixed(2)} — ${result.reason}`);
    }
  }

  await db.close();

  console.error(`[classify-types] ${classified} releases classified`);
  console.error(`  degree: ${dist.degree} | milestone: ${dist.milestone} | feature: ${dist.feature} | chip: ${dist.chip} | task: ${dist.task} | patch: ${dist.patch}`);
  console.log(JSON.stringify({ classified, distribution: dist }, null, 2));
}

// Entrypoint guard so importing for tests (chip-classification regex
// coverage) doesn't try to open a DB connection. Mirror the pattern in
// quality-drift-check.mjs's caller usage.
import { fileURLToPath } from 'node:url';
import { argv } from 'node:process';
const isMain = fileURLToPath(import.meta.url) === argv[1];
if (isMain) {
  main().catch(e => { console.error('[classify-types] fatal:', e.message); console.error(e.stack); process.exit(2); });
}
