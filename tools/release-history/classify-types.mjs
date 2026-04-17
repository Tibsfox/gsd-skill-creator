#!/usr/bin/env node
// Classify each release into a type so scorer + drift-check can grade
// against the right rubric.
//
// Types:
//   degree       — paired-engine release (Part A + Part B in header, prose-style)
//   milestone    — major milestone marker (name mentions milestone/complete/shipped;
//                  or major platform-level work)
//   feature      — new functionality (default for non-fix, non-degree)
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

// Priority order: degree → milestone → patch → feature (default).
// Returns { type, confidence, reason }.
function classify(release, readmeText) {
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
    // Name-based degree detection as a fallback (for chapter-only releases).
    if (/\bdegree\s+\w+/i.test(name)) {
      return { type: 'degree', confidence: 0.85, reason: 'name contains "Degree N"' };
    }
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

  const dist = { degree: 0, milestone: 0, feature: 0, patch: 0 };
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
  console.error(`  degree: ${dist.degree} | milestone: ${dist.milestone} | feature: ${dist.feature} | patch: ${dist.patch}`);
  console.log(JSON.stringify({ classified, distribution: dist }, null, 2));
}

main().catch(e => { console.error('[classify-types] fatal:', e.message); console.error(e.stack); process.exit(2); });
