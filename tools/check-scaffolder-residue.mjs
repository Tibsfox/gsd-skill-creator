#!/usr/bin/env node
// Detects scaffolder-emit TODO patterns that have escaped into source-of-truth
// skill/agent files (CONCERNS.md §18.2 shipping-risk gate).
//
// The scaffolders at:
//   src/capabilities/capability-scaffolder.ts
//   src/detection/skill-generator.ts
//   src/vtm/test-plan-generator.ts (in-test patterns; auto-stubbed)
// intentionally emit TODO markers into skeleton outputs. If those skeletons
// get committed without being filled, the TODOs ship to public installs.
//
// This tool scans project-claude/skills/ and project-claude/agents/ for the
// known scaffolder-emit phrases (literal substrings — narrowly scoped to
// avoid false positives on legitimate agent instructions that mention "TODO"
// as a concept they detect).
//
// Usage:
//   node tools/check-scaffolder-residue.mjs           (human-readable report)
//   node tools/check-scaffolder-residue.mjs --json
//   node tools/check-scaffolder-residue.mjs --strict  (exit 1 on any finding)
//
// Exit codes:
//   0  no scaffolder residue
//   1  residue found AND --strict
//   3  invalid args

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';

function repoRoot() {
  try {
    return execSync('git rev-parse --show-toplevel', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return process.cwd();
  }
}

const REPO_ROOT = repoRoot();
const SCAN_DIRS = [
  resolve(REPO_ROOT, 'project-claude/skills'),
  resolve(REPO_ROOT, 'project-claude/agents'),
];

// Literal scaffolder-emit phrases — sourced from:
//   src/capabilities/capability-scaffolder.ts (lines 112, 116, 144, 148)
//   src/detection/skill-generator.ts (lines 208, 218)
// These are specific enough to avoid matching agent prompts that legitimately
// reference TODO as a concept (e.g. doc-linter, gsd-code-reviewer).
const SCAFFOLDER_PHRASES = [
  'TODO: Add skill instructions here.',
  'TODO: Describe when this skill should activate',
  'TODO: Describe when this agent should be delegated to',
  'TODO: Add agent instructions here.',
  '<!-- TODO: Add specific guidelines for this pattern -->',
  '<!-- TODO: Add examples based on your workflow -->',
];

function parseArgs(argv) {
  const opts = { json: false, strict: false };
  for (const a of argv) {
    if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
    else if (a === '-h' || a === '--help') {
      process.stdout.write(
        [
          'Usage: node tools/check-scaffolder-residue.mjs [--json] [--strict]',
          '',
          'Scans project-claude/skills/ and project-claude/agents/ for known',
          'scaffolder-emit TODO phrases that escape from skeleton templates.',
          '',
          'Exit 0 on clean. With --strict, exit 1 if residue found.',
        ].join('\n') + '\n',
      );
      process.exit(0);
    } else {
      process.stderr.write(`unknown arg: ${a}\n`);
      process.exit(3);
    }
  }
  return opts;
}

function walkMarkdown(dir, out) {
  if (!statSync(dir, { throwIfNoEntry: false })) return;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) {
      walkMarkdown(full, out);
    } else if (s.isFile() && name.endsWith('.md')) {
      out.push(full);
    }
  }
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const findings = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    for (const phrase of SCAFFOLDER_PHRASES) {
      if (lines[i].includes(phrase)) {
        findings.push({
          file: filePath.replace(REPO_ROOT + '/', ''),
          line_number: i + 1,
          phrase,
          line_text: lines[i].trim(),
        });
      }
    }
  }
  return findings;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const files = [];
  for (const d of SCAN_DIRS) walkMarkdown(d, files);

  const findings = [];
  for (const f of files) findings.push(...scanFile(f));

  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        {
          scan_date: new Date().toISOString().split('T')[0],
          scanned_files: files.length,
          scaffolder_phrases_checked: SCAFFOLDER_PHRASES.length,
          findings,
        },
        null,
        2,
      ),
    );
    process.stdout.write('\n');
  } else {
    process.stdout.write(`Scanned ${files.length} files in project-claude/skills + agents\n`);
    process.stdout.write(`Checked ${SCAFFOLDER_PHRASES.length} scaffolder-emit phrases\n`);
    if (findings.length === 0) {
      process.stdout.write('No scaffolder residue detected — shipping path clean.\n');
    } else {
      process.stdout.write(`\nFound ${findings.length} scaffolder-residue site(s):\n\n`);
      for (const f of findings) {
        process.stdout.write(`  ${f.file}:${f.line_number}\n`);
        process.stdout.write(`    phrase: "${f.phrase}"\n`);
        process.stdout.write(`    line:   ${f.line_text.slice(0, 100)}\n\n`);
      }
      process.stdout.write('A scaffolded skeleton was committed without being filled.\n');
      process.stdout.write('Fix: replace the TODO body with real content before publishing.\n');
    }
  }

  if (findings.length > 0 && opts.strict) {
    process.exit(1);
  }
  process.exit(0);
}

main();
