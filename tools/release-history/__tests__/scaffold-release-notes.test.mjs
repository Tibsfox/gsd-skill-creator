/**
 * scaffold-release-notes.test.mjs — counter-cadence #27 (v1.49.958).
 *
 * Covers the release-notes scaffolding SOURCE ELIMINATOR + the paired ship-time
 * FILL gate added to check-completeness (two-layer-closure #10431/#10436):
 *   - the pure content builder (5 canonical files, sized, sentinel-marked);
 *   - the CLI --write / --check / preservation / --force behavior;
 *   - check-completeness --strict BLOCKING an unfilled scaffold (the FILL gate)
 *     and passing once the markers are replaced.
 * All CLI cases run against an isolated SC_RELEASE_NOTES_ROOT temp tree.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  buildReleaseNotesFiles,
  REQUIRED_FILES,
  SCAFFOLD_PENDING_TOKEN,
  SCAFFOLD_PENDING_MARKER,
} from '../scaffold-release-notes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCAFFOLDER = resolve(HERE, '..', 'scaffold-release-notes.mjs');
const COMPLETENESS = resolve(HERE, '..', 'check-completeness.mjs');
const V = 'v1.49.999';

function run(script, args, root) {
  return spawnSync(process.execPath, [script, ...args], {
    env: { ...process.env, SC_RELEASE_NOTES_ROOT: root },
    encoding: 'utf8',
  });
}

describe('scaffold-release-notes — builder (pure)', () => {
  const files = buildReleaseNotesFiles({ version: V, name: 'demo ship', type: 'feat(cli)', date: '2026-06-02' });

  it('produces exactly the 5 required files', () => {
    expect(Object.keys(files).sort()).toEqual([...REQUIRED_FILES].sort());
  });

  it('every file exceeds the 200-byte completeness floor', () => {
    for (const k of REQUIRED_FILES) expect(files[k].length).toBeGreaterThanOrEqual(200);
  });

  it('every file carries the scaffold-pending token', () => {
    for (const k of REQUIRED_FILES) expect(files[k]).toContain(SCAFFOLD_PENDING_TOKEN);
  });

  it('interpolates version + name into the README and context frontmatter', () => {
    expect(files['README.md']).toContain(`version: ${V}`);
    expect(files['README.md']).toContain('demo ship');
    expect(files['chapter/99-context.md']).toContain(`version: ${V}`);
    expect(files['chapter/99-context.md']).toContain('feat(cli)');
  });
});

describe('scaffold-release-notes — CLI (isolated SC_RELEASE_NOTES_ROOT)', () => {
  let root;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'srn-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('--check on a missing version reports structure drift (exit 1)', () => {
    const r = run(SCAFFOLDER, ['--version', V, '--check'], root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('INCOMPLETE');
  });

  it('--write creates all 5 files and the post-condition passes (exit 0)', () => {
    const r = run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    expect(r.status).toBe(0);
    for (const rel of REQUIRED_FILES) expect(existsSync(join(root, V, rel))).toBe(true);
  });

  it('after --write, --check passes (structure present, exit 0)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const r = run(SCAFFOLDER, ['--version', V, '--check'], root);
    expect(r.status).toBe(0);
  });

  it('a freshly scaffolded dir BLOCKS check-completeness --strict (unfilled markers)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const r = run(COMPLETENESS, [V, '--strict'], root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('scaffold-pending');
  });

  it('a freshly scaffolded dir PASSES check-completeness NON-strict (structure present)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const r = run(COMPLETENESS, [V], root);
    expect(r.status).toBe(0);
  });

  it('filling every marker makes check-completeness --strict pass', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const filled = `# filled section\n${'x'.repeat(300)}\n`;
    for (const rel of REQUIRED_FILES) writeFileSync(join(root, V, rel), filled);
    const r = run(COMPLETENESS, [V, '--strict'], root);
    expect(r.status).toBe(0);
  });

  it('--write PRESERVES a filled (hand-authored) file and leaves a pristine scaffold unchanged', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const handAuthored = `# my real README\n${'y'.repeat(300)}`;
    writeFileSync(join(root, V, 'README.md'), handAuthored);
    const r = run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('PRESERVED README.md');
    expect(readFileSync(join(root, V, 'README.md'), 'utf8')).toBe(handAuthored); // untouched
    // an untouched chapter is a pristine scaffold: left unchanged, still carries the marker
    expect(r.stdout).toContain('UNCHANGED chapter/00-summary.md');
    expect(readFileSync(join(root, V, 'chapter/00-summary.md'), 'utf8')).toContain(SCAFFOLD_PENDING_MARKER);
  });

  it('PRESERVES a PARTIALLY-filled file (real prose + a leftover marker) instead of clobbering it (review fix)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    // Operator fills most of a file in place but leaves one section's marker.
    const partial = `# real heading\n${'z'.repeat(300)}\n## still WIP\n${SCAFFOLD_PENDING_MARKER}\n`;
    writeFileSync(join(root, V, 'README.md'), partial);
    const r = run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root); // default --write, no --force
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, V, 'README.md'), 'utf8')).toBe(partial); // NOT clobbered
    expect(r.stderr).toContain('PARTIALLY FILLED'); // warned, not silently rewritten
  });

  it('--force DOES reset a partially-filled file back to a blank scaffold', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    const partial = `# real heading\n${'z'.repeat(300)}\n${SCAFFOLD_PENDING_MARKER}\n`;
    writeFileSync(join(root, V, 'README.md'), partial);
    const r = run(SCAFFOLDER, ['--version', V, '--name', 'demo', '--force'], root);
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, V, 'README.md'), 'utf8')).not.toBe(partial); // reset
    expect(readFileSync(join(root, V, 'README.md'), 'utf8')).toContain(SCAFFOLD_PENDING_MARKER);
  });

  it('check-completeness --strict does NOT trip on prose that NAMES the token without the full marker comment (#10462)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    // Filled prose that DESCRIBES the gate by naming the bare token (not the comment).
    const prose = `# Lessons\nThe FILL gate greps for the ${SCAFFOLD_PENDING_TOKEN} sentinel. ${'commentary '.repeat(40)}`;
    for (const rel of REQUIRED_FILES) writeFileSync(join(root, V, rel), prose);
    const r = run(COMPLETENESS, [V, '--strict'], root);
    expect(r.status).toBe(0); // names the token but lacks the marker comment -> passes
  });

  it('--force overwrites even a filled file (back to a scaffold)', () => {
    run(SCAFFOLDER, ['--version', V, '--name', 'demo'], root);
    writeFileSync(join(root, V, 'README.md'), `# my real README\n${'y'.repeat(300)}`);
    const r = run(SCAFFOLDER, ['--version', V, '--name', 'demo', '--force'], root);
    expect(r.status).toBe(0);
    expect(readFileSync(join(root, V, 'README.md'), 'utf8')).toContain(SCAFFOLD_PENDING_TOKEN);
  });

  it('rejects a malformed --version (exit 1)', () => {
    const r = run(SCAFFOLDER, ['--version', '1.49.999', '--name', 'demo'], root);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('vMAJOR.MINOR.PATCH');
  });
});
