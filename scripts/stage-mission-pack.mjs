#!/usr/bin/env node
/**
 * Stage a mission pack zip into the staging inbox and run intake flow.
 *
 * Usage: node scripts/stage-mission-pack.mjs <zip-path>
 *
 * Extracts markdown files from the zip, stages each one via stageDocument(),
 * then runs runIntakeFlow() on each and reports results.
 */

import { execSync } from 'node:child_process';
import { readdir, readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { stageDocument, runIntakeFlow } from '../dist/staging/index.js';

const zipPath = process.argv[2];
if (!zipPath) {
  console.error('Usage: node scripts/stage-mission-pack.mjs <zip-path>');
  process.exit(1);
}

const basePath = process.cwd();

async function main() {
  // 1. Extract zip to temp directory
  const tmpDir = await mkdtemp(join(tmpdir(), 'mission-pack-'));
  console.log(`\n📦 Extracting ${zipPath} to ${tmpDir}...\n`);

  try {
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'pipe' });
  } catch (err) {
    console.error('Failed to extract zip:', err.message);
    process.exit(1);
  }

  // 2. Find all markdown files (recursively)
  const entries = await findMarkdownFiles(tmpDir);
  console.log(`Found ${entries.length} markdown files:\n`);
  for (const entry of entries) {
    console.log(`  - ${entry.relative}`);
  }
  console.log('');

  // 3. Stage each document
  const results = [];
  for (const entry of entries) {
    const content = await readFile(entry.absolute, 'utf-8');
    const filename = entry.relative.replace(/\//g, '--'); // flatten path for inbox

    console.log(`━━━ Staging: ${filename} ━━━`);

    // Stage the document
    try {
      const stageResult = await stageDocument({
        basePath,
        filename,
        content,
        source: 'mission-pack:foxfire-heritage-v2',
      });
      console.log(`  ✓ Staged → ${stageResult.documentPath}`);

      // Run intake flow
      const flowResult = await runIntakeFlow({
        basePath,
        filename,
        source: 'mission-pack:foxfire-heritage-v2',
      });

      console.log(`  Route:  ${flowResult.route}`);
      console.log(`  Step:   ${flowResult.step}`);
      console.log(`  Status: ${flowResult.message}`);

      if (flowResult.questions.length > 0) {
        console.log(`  Gaps:`);
        for (const q of flowResult.questions) {
          console.log(`    - [${q.area}] ${q.question}`);
        }
      }

      const hygieneRisk = flowResult.hygieneReport?.overallRisk ?? 'unknown';
      console.log(`  Hygiene risk: ${hygieneRisk}`);
      console.log('');

      results.push({
        filename,
        route: flowResult.route,
        step: flowResult.step,
        message: flowResult.message,
        hygieneRisk,
        gapCount: flowResult.questions.length,
        needsConfirmation: flowResult.needsConfirmation,
      });
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}\n`);
      results.push({
        filename,
        route: 'error',
        step: 'failed',
        message: err.message,
        hygieneRisk: 'unknown',
        gapCount: 0,
        needsConfirmation: false,
      });
    }
  }

  // 4. Summary
  console.log('\n════════════════════════════════════════════════════════');
  console.log('  INTAKE SUMMARY');
  console.log('════════════════════════════════════════════════════════\n');

  const clear = results.filter(r => r.route === 'clear').length;
  const gaps = results.filter(r => r.route === 'gaps').length;
  const confused = results.filter(r => r.route === 'confused').length;
  const errors = results.filter(r => r.route === 'error').length;

  console.log(`  Total documents: ${results.length}`);
  console.log(`  Clear (ready):   ${clear}`);
  console.log(`  Gaps (questions): ${gaps}`);
  console.log(`  Confused:        ${confused}`);
  console.log(`  Errors:          ${errors}`);
  console.log('');

  // Per-document table
  for (const r of results) {
    const icon = r.route === 'clear' ? '✓' : r.route === 'gaps' ? '?' : r.route === 'error' ? '✗' : '!';
    const confirm = r.needsConfirmation ? ' [awaiting confirmation]' : '';
    console.log(`  ${icon} ${r.filename}`);
    console.log(`    → ${r.route} | hygiene: ${r.hygieneRisk}${confirm}`);
    if (r.gapCount > 0) {
      console.log(`    → ${r.gapCount} gap(s) identified`);
    }
  }

  console.log('\n════════════════════════════════════════════════════════\n');

  // Cleanup temp dir
  await rm(tmpDir, { recursive: true, force: true });
}

/** Recursively find all .md files under a directory. */
async function findMarkdownFiles(dir, prefix = '') {
  const results = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = join(dir, entry.name);

    if (entry.isDirectory()) {
      const sub = await findMarkdownFiles(absolute, relative);
      results.push(...sub);
    } else if (entry.name.endsWith('.md')) {
      results.push({ relative, absolute });
    }
  }

  return results;
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
