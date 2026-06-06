/**
 * tools/__tests__/state-md-normalizer-prose.test.mjs (v1.49.637 C6)
 *
 * Tests for the prose-body milestone-drift validator. Closes v1.49.636
 * post-ship-review Finding #2 ("STATE.md prose body lag").
 *
 * Each test uses synthetic STATE.md content — does NOT touch the real
 * .planning/STATE.md.
 *
 * Coverage:
 *   1. mismatch-warns           — frontmatter vNNN != prose vNNN triggers warning
 *   2. aligned-passes           — frontmatter + prose at same milestone → no warning
 *   3. hard-fail-mode           — SC_REQUIRE_PROSE_SYNC=1 + mismatch → pass=false + hardFail=true
 *   4. decisions-section-mismatch — "### Decisions (vNNN)" header drift caught
 *   5. graceful-empty-sections   — no scanned sections present → no false positive
 *   6. allowlisted-carry-forward — "### Carry-forward" sections ignored by default
 *   7. integration --check       — child-process exit behavior + stderr emission
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import {
  validateProseSync,
  validateProseSyncAtPath,
  parseFrontmatterAndBody,
  extractSectionContent,
  DEFAULT_SECTIONS,
} from '../state-md-normalizer-prose.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const NORMALIZER_SCRIPT = resolve(HERE, '..', 'state-md-normalizer.mjs');
const PROSE_SCRIPT = resolve(HERE, '..', 'state-md-normalizer-prose.mjs');

function makeStateFixture({
  milestone = 'v1.49.637',
  branchStateProse = 'Dev tip at abc123. Latest shipped: v1.49.637.',
  decisionsSectionTag = null, // e.g. "v1.49.637" → header becomes "### Decisions (v1.49.637)"
  decisionsProse = 'Some decision text.',
  extraSections = '',
} = {}) {
  const decisionsHeader = decisionsSectionTag
    ? `### Decisions (${decisionsSectionTag})`
    : '### Decisions';
  return `---
gsd_state_version: "1.0"
milestone: ${milestone}
status: in-progress
---
## Current Position

Milestone: **${milestone} — synthetic fixture**

## Notes

### Branch State

${branchStateProse}

${decisionsHeader}

${decisionsProse}
${extraSections}
`;
}

describe('state-md-normalizer-prose — pure helpers', () => {
  it('parseFrontmatterAndBody returns frontmatter + body', () => {
    const content = makeStateFixture();
    const { frontmatter, body } = parseFrontmatterAndBody(content);
    expect(frontmatter).toBeDefined();
    expect(frontmatter.milestone).toBe('v1.49.637');
    expect(body).toContain('### Branch State');
  });

  it('parseFrontmatterAndBody returns frontmatter:null when no frontmatter block', () => {
    const { frontmatter, body } = parseFrontmatterAndBody('# Just a heading\n\nNo frontmatter here.\n');
    expect(frontmatter).toBeNull();
    expect(body).toContain('Just a heading');
  });

  it('extractSectionContent finds ATX section by header', () => {
    const content = makeStateFixture({
      branchStateProse: 'Latest shipped: v1.49.636 still referenced.',
    });
    const { body } = parseFrontmatterAndBody(content);
    const section = extractSectionContent(body, '### Branch State');
    expect(section).toContain('v1.49.636');
    // Section should NOT include the next section.
    expect(section).not.toContain('### Decisions');
  });

  it('extractSectionContent returns null when section absent', () => {
    const content = makeStateFixture();
    const { body } = parseFrontmatterAndBody(content);
    const section = extractSectionContent(body, '### Nonexistent Section');
    expect(section).toBeNull();
  });
});

describe('state-md-normalizer-prose — validateProseSync', () => {
  it('mismatch-warns: prose references v1.49.636 while frontmatter is v1.49.637', () => {
    const content = makeStateFixture({
      milestone: 'v1.49.637',
      branchStateProse: 'Dev tip at abc123. Latest shipped: v1.49.636 (predecessor).',
    });
    const result = validateProseSync(content);
    expect(result.frontmatterMilestone).toBe('v1.49.637');
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0].proseReferences).toContain('v1.49.636');
    expect(result.pass).toBe(true);     // warn-only by default
    expect(result.hardFail).toBe(false);
  });

  it('aligned-passes: frontmatter + prose at same milestone produces no warnings', () => {
    const content = makeStateFixture({
      milestone: 'v1.49.637',
      branchStateProse: 'Dev tip at abc123. Latest shipped: v1.49.637.',
      decisionsProse: 'v1.49.637 decision.',
    });
    const result = validateProseSync(content);
    expect(result.warnings).toEqual([]);
    expect(result.pass).toBe(true);
    expect(result.hardFail).toBe(false);
  });

  it('hard-fail-mode: SC_REQUIRE_PROSE_SYNC=1 + mismatch → hardFail=true, pass=false', () => {
    const content = makeStateFixture({
      milestone: 'v1.49.637',
      branchStateProse: 'Latest shipped: v1.49.636.',
    });
    const result = validateProseSync(content, { hardFailMode: true });
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.pass).toBe(false);
    expect(result.hardFail).toBe(true);
  });

  it('decisions-section-mismatch: "### Decisions (v1.49.636)" header reference caught', () => {
    const content = makeStateFixture({
      milestone: 'v1.49.637',
      branchStateProse: 'No milestone refs here.',
      decisionsSectionTag: 'v1.49.636',
      decisionsProse: 'Decision body without milestone refs.',
    });
    const result = validateProseSync(content);
    const decisionsFinding = result.warnings.find((f) => f.section === '### Decisions');
    expect(decisionsFinding).toBeDefined();
    expect(decisionsFinding.proseReferences).toContain('v1.49.636');
  });

  it('graceful-empty-sections: STATE.md without ### Branch State / ### Decisions → no warning', () => {
    const content = `---
gsd_state_version: "1.0"
milestone: v1.49.637
status: in-progress
---
## Current Position

Milestone: **v1.49.637**

## Notes

Some free-form notes. No scanned sections present.
`;
    const result = validateProseSync(content);
    expect(result.warnings).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it('allowlisted-carry-forward: "### Carry-forward" section ignored by default', () => {
    const content = `---
gsd_state_version: "1.0"
milestone: v1.49.637
status: in-progress
---
## Notes

### Branch State

Latest shipped: v1.49.637.

### Decisions

v1.49.637 decision.

### Carry-forward for Cluster #5

Future work on v1.49.7XX cluster — legitimately references future milestone.
`;
    const result = validateProseSync(content);
    // Carry-forward is NOT in DEFAULT_SECTIONS so the validator skips it
    // entirely; this test just confirms no false-positive surfaces from the
    // overall scan when an out-of-scope section names other milestones.
    expect(result.warnings).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it('returns null frontmatterMilestone when no frontmatter present (silent pass)', () => {
    const content = '# Just a heading\n\nNo frontmatter here.\n';
    const result = validateProseSync(content);
    expect(result.frontmatterMilestone).toBeNull();
    expect(result.warnings).toEqual([]);
    expect(result.pass).toBe(true);
  });
});

describe('state-md-normalizer-prose — integration with state-md-normalizer.mjs --check', () => {
  let tmpRoot;
  let workDir;
  let planningDir;
  let statePath;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'state-md-prose-int-'));
    workDir = join(tmpRoot, 'work');
    planningDir = join(workDir, '.planning');
    mkdirSync(planningDir, { recursive: true });
    statePath = join(planningDir, 'STATE.md');
  });

  afterEach(() => {
    rmSync(tmpRoot, { recursive: true, force: true });
  });

  function runCheck(extraEnv = {}) {
    return spawnSync('node', [NORMALIZER_SCRIPT, '--check'], {
      cwd: workDir,
      env: { ...process.env, ...extraEnv },
      encoding: 'utf8',
    });
  }

  /**
   * Build a STATE.md content string that the existing normalizer considers
   * already-normalized (so `--check` exits 0 on the frontmatter axis), then
   * append a `## Notes` section with prose-drift content.
   *
   * The frontmatter key ordering + body sections match exactly what
   * `state-md-normalizer.mjs --write` produces from the same inputs (so
   * round-trip yields no drift).
   */
  function buildNormalizedFixture({ proseSection }) {
    return [
      '---',
      'gsd_state_version: "1.0"',
      'milestone: v1.49.637',
      'milestone_name: prose-int-fixture',
      'status: in-progress',
      'nasa_degree: 108',
      'predecessor:',
      '  milestone: v1.49.636',
      '  shipped_at_tag: v1.49.636',
      '  shipped_at_sha: deadbeef',
      'opened_on: "2026-05-11"',
      '---',
      '',
      '## Current Position',
      '',
      'Milestone: **v1.49.637 — prose-int-fixture**',
      'Status: IN-PROGRESS',
      'Opened: 2026-05-11',
      '',
      '## Engine state baseline at v1.49.637 open',
      '',
      '- **Predecessor milestone:** v1.49.636 (tag: v1.49.636, sha: deadbeef)',
      '- **Predecessor counter-cadence:** false',
      '- **NASA degree at open:** 108',
      '',
      '## Notes',
      '',
      proseSection,
      '',
    ].join('\n');
  }

  it('--check exit 0 + WARN to stderr when frontmatter clean + prose drifts (default mode)', () => {
    const proseSection = [
      '### Branch State',
      '',
      'Latest shipped: v1.49.636 (predecessor; prose body still references predecessor).',
    ].join('\n');
    const normalized = buildNormalizedFixture({ proseSection });
    writeFileSync(statePath, normalized, 'utf8');
    const result = runCheck();
    // Exit 0 because (a) frontmatter is normalized and (b) prose drift is warn-only.
    expect(result.status).toBe(0);
    expect(result.stderr).toContain('prose-body milestone drift');
    expect(result.stderr).toContain('v1.49.636');
  });

  it('--check exit 1 when SC_REQUIRE_PROSE_SYNC=1 + prose drift', () => {
    const proseSection = [
      '### Branch State',
      '',
      'Latest shipped: v1.49.636 (mismatch).',
    ].join('\n');
    const normalized = buildNormalizedFixture({ proseSection });
    writeFileSync(statePath, normalized, 'utf8');
    const result = runCheck({ SC_REQUIRE_PROSE_SYNC: '1' });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('prose-body milestone drift');
    // Wrapper in state-md-normalizer.mjs prints SC_REQUIRE_PROSE_SYNC line on hard-fail
    expect(result.stderr).toContain('SC_REQUIRE_PROSE_SYNC=1');
  });

  // Direct-CLI invocation (`node state-md-normalizer-prose.mjs`). The integration
  // tests above only drive the WRAPPER, so the prose file's own isDirectInvocation
  // guard was never exercised — which let a `new URL().pathname` Windows bug sit
  // latent (cli() silently never ran on windows; thisPath "/D:/.." != argv[1]).
  it('runs cli() when invoked directly (--json emits parseable output)', () => {
    writeFileSync(statePath, makeStateFixture(), 'utf8');
    const r = spawnSync('node', [PROSE_SCRIPT, '--json'], { cwd: workDir, encoding: 'utf8' });
    expect(r.status).toBe(0);
    // Pre-fix on windows this stdout was EMPTY (guard false → cli() skipped).
    expect(r.stdout.trim().length).toBeGreaterThan(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.frontmatterMilestone).toBe('v1.49.637');
  });
});
