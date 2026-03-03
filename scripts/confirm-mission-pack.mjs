#!/usr/bin/env node
/**
 * Confirm all clear documents from the mission pack intake and
 * handle the gaps document with additional context.
 *
 * Usage: node scripts/confirm-mission-pack.mjs
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { confirmIntake, runIntakeFlow } from '../dist/staging/index.js';

const basePath = process.cwd();
const checkingDir = join(basePath, '.planning/staging/checking');

async function main() {
  const entries = await readdir(checkingDir);
  const docs = entries.filter(f => f.endsWith('.md') && !f.endsWith('.meta.json'));

  console.log(`\nFound ${docs.length} documents in checking/\n`);

  let confirmed = 0;
  let gapsHandled = 0;
  let errors = 0;

  for (const filename of docs.sort()) {
    const isGapsDoc = filename.includes('07-wave-plan-phase2');

    if (isGapsDoc) {
      // Confirm with additional context explaining it's a companion document
      console.log(`━━━ Confirming with context: ${filename} ━━━`);
      try {
        const result = await confirmIntake({
          basePath,
          filename,
          additionalContext:
            'This wave plan is a structural execution document. Its goals, constraints, ' +
            'deliverables, and section content are defined in companion documents: ' +
            '06-milestone-spec-phase2.md (requirements/success criteria) and ' +
            '08-component-specs-phase2.md (detailed component specifications). ' +
            'The sparse sections are intentional — they reference the companion docs ' +
            'for full context. This is the standard mission pack structure.',
        });
        console.log(`  ✓ Confirmed → ${result.step} | route: ${result.route}`);
        console.log(`  Message: ${result.message}`);
        gapsHandled++;
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        errors++;
      }
    } else {
      // Standard confirmation for clear documents
      console.log(`━━━ Confirming: ${filename} ━━━`);
      try {
        const result = await confirmIntake({
          basePath,
          filename,
        });
        console.log(`  ✓ Confirmed → ${result.step} | route: ${result.route}`);
        confirmed++;
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`);
        errors++;
      }
    }
    console.log('');
  }

  // Summary
  console.log('════════════════════════════════════════════════════════');
  console.log('  CONFIRMATION SUMMARY');
  console.log('════════════════════════════════════════════════════════\n');
  console.log(`  Clear confirmed:       ${confirmed}`);
  console.log(`  Gaps confirmed w/ctx:  ${gapsHandled}`);
  console.log(`  Errors:                ${errors}`);
  console.log(`  Total:                 ${confirmed + gapsHandled + errors}\n`);

  // Show final staging state
  const { readdir: rd } = await import('node:fs/promises');
  const readyFiles = (await rd(join(basePath, '.planning/staging/ready')).catch(() => []));
  const checkingFiles = (await rd(checkingDir).catch(() => []));
  const readyDocs = readyFiles.filter(f => f.endsWith('.md') && !f.endsWith('.meta.json'));
  const checkingDocs = checkingFiles.filter(f => f.endsWith('.md') && !f.endsWith('.meta.json'));

  console.log(`  ready/:    ${readyDocs.length} documents`);
  console.log(`  checking/: ${checkingDocs.length} documents remaining`);
  console.log('\n════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
