/**
 * build-trs-edges.mjs — invariant tests for the TRS edge catalogue extractor.
 *
 * Hermetic setup: each test gets a tmpdir with a synthetic TRS research
 * file in a known structure. The script is invoked with cwd=workDir.
 *
 * Closes IC-613-1.2 from .planning/missions/v1-49-613-skylab-4-comet-kohoutek/CARRY-FORWARD.md
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'build-trs-edges.mjs');

let tmpRoot;
let workDir;

// Note: build-trs-edges.mjs hard-codes specific milestone paths. We construct
// minimal stubs at those paths inside tmpdir to drive the extractor.
const FIXTURE_PATHS = {
  'v1.49.605': '.planning/missions/v1-49-605-apollo-16-descartes-highlands/work/research/trs-m1-w2-pack01/research.md',
  'v1.49.606': '.planning/missions/v1-49-606-apollo-17-final-lunar-landing/work/research/trs-m1-w2-next/research.md',
  'v1.49.608': '.planning/missions/v1-49-608-pioneer-11-first-saturn-flyby/work/research/trs-m1-w2-next/research.md',
  'v1.49.613': '.planning/missions/v1-49-613-skylab-4-comet-kohoutek/work/W1-TRS-research.md',
};

function setupRepo() {
  tmpRoot = mkdtempSync(join(tmpdir(), 'build-trs-edges-test-'));
  workDir = join(tmpRoot, 'work');
  mkdirSync(workDir, { recursive: true });
}

function writeFixture(milestone, content) {
  const rel = FIXTURE_PATHS[milestone];
  if (!rel) throw new Error(`unknown fixture milestone ${milestone}`);
  const full = join(workDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function runScript(args = '') {
  try {
    const stdout = execSync(`node "${SCRIPT_PATH}" ${args}`, {
      cwd: workDir,
      encoding: 'utf8',
      stdio: 'pipe',
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

beforeEach(() => { setupRepo(); });
afterEach(() => { try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {} });

describe('build-trs-edges.mjs', () => {
  it('reports 0 edges + 0 milestones when no fixture files exist (dry-run)', () => {
    const r = runScript('--dry-run');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('total_edges=0');
    expect(r.stdout).toContain('milestones=0');
  });

  it('extracts canonical edge rows (id | source | target | relation | description)', () => {
    writeFixture('v1.49.613', [
      '---',
      'this_pack: pack-05-differential-equations',
      'predecessor_pack: pack-08-combinatorics',
      'edge_baseline: 126',
      'edges_added_this_pass: 2',
      'edge_total_after_pass: 128',
      '---',
      '',
      '## Edges',
      '',
      '| id | src | tgt | rel | desc |',
      '|---|---|---|---|---|',
      '| 127 | pack-05-001 | pack-01-002 | cross-pack-paired-with | A description of edge 127. |',
      '| 128 | pack-05-009 | pack-02-007 | cross-pack-paired-with | Edge 128 description. |',
      '',
    ].join('\n'));
    const r = runScript();
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('total_edges=2');
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.total_edges).toBe(2);
    expect(edges.edges_by_id['127'].source).toBe('pack-05-001');
    expect(edges.edges_by_id['127'].target).toBe('pack-01-002');
    expect(edges.edges_by_id['128'].relation).toBe('cross-pack-paired-with');
  });

  it('strips ** bold markers from rows (#10265 hold-test highlighting at v611)', () => {
    writeFixture('v1.49.613', [
      '---',
      'this_pack: pack-05',
      '---',
      '',
      '| **127** | **pack-05-001** | **pack-10-004** | **cross-pack-paired-with (#10265)** | **Bolded row description.** |',
      '',
    ].join('\n'));
    runScript();
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.total_edges).toBe(1);
    expect(edges.edges_by_id['127'].source).toBe('pack-05-001');
    expect(edges.edges_by_id['127'].target).toBe('pack-10-004');
    expect(edges.edges_by_id['127'].description).not.toContain('**');
  });

  it('groups edges by pack-pair (sorted alphabetically) in edges_by_pack_pair', () => {
    writeFixture('v1.49.613', [
      '---',
      'this_pack: pack-05',
      '---',
      '| 127 | pack-05-001 | pack-02-007 | cross-pack-paired-with | desc1 |',
      '| 128 | pack-02-007 | pack-05-009 | cross-pack-paired-with | desc2 |',
      '| 129 | pack-05-002 | pack-10-001 | cross-pack-paired-with | desc3 |',
      '',
    ].join('\n'));
    runScript();
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.edges_by_pack_pair['pack-02↔pack-05']).toHaveLength(2);
    expect(edges.edges_by_pack_pair['pack-05↔pack-10']).toHaveLength(1);
  });

  it('records milestone metadata from frontmatter', () => {
    writeFixture('v1.49.613', [
      '---',
      'this_pack: pack-05-differential-equations',
      'predecessor_pack: pack-08-combinatorics',
      'edge_baseline: 126',
      'edges_added_this_pass: 14',
      'edge_total_after_pass: 140',
      '---',
      '| 127 | pack-05-001 | pack-01-002 | rel | desc |',
      '',
    ].join('\n'));
    runScript();
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    const v613 = edges.milestones.find(m => m.milestone === 'v1.49.613');
    expect(v613.pack_bound).toBe('pack-05-differential-equations');
    expect(v613.predecessor_pack).toBe('pack-08-combinatorics');
    expect(v613.edge_baseline).toBe(126);
    expect(v613.edges_added).toBe(14);
    expect(v613.edge_total_after).toBe(140);
  });

  it('--check exits 0 when existing JSON matches scan', () => {
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| 127 | pack-05-001 | pack-01-002 | rel | desc |',
      '',
    ].join('\n'));
    runScript();
    const r = runScript('--check');
    expect(r.exitCode).toBe(0);
    expect(r.stdout).toContain('OK');
  });

  it('--check exits 1 when existing JSON is stale (different edge count)', () => {
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| 127 | pack-05-001 | pack-01-002 | rel | desc |',
      '',
    ].join('\n'));
    runScript();
    // Add another edge to make the scan disagree
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| 127 | pack-05-001 | pack-01-002 | rel | desc |',
      '| 128 | pack-05-002 | pack-02-001 | rel | desc2 |',
      '',
    ].join('\n'));
    const r = runScript('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('STALE');
  });

  it('--check exits 1 when output file missing', () => {
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| 127 | pack-05-001 | pack-01-002 | rel | desc |',
      '',
    ].join('\n'));
    const r = runScript('--check');
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain('does not exist');
  });

  it('first-bound dedup: same id across two milestones keeps first occurrence', () => {
    writeFixture('v1.49.608', [
      '---', 'this_pack: pack-09', '---',
      '| 99 | pack-09-001 | pack-01-002 | rel | first-bound |',
      '',
    ].join('\n'));
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| 99 | pack-09-001 | pack-01-002 | rel | duplicate-from-v613 |',
      '',
    ].join('\n'));
    runScript();
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.edges_by_id['99'].description).toBe('first-bound');
    expect(edges.edges_by_id['99'].milestone_bound).toBe('v1.49.608');
  });

  it('skips rows where id column is non-numeric (header / separator rows)', () => {
    writeFixture('v1.49.613', [
      '---', 'this_pack: pack-05', '---',
      '| id | src | tgt | rel | desc |',
      '|---|---|---|---|---|',
      '| 127 | pack-05-001 | pack-01-002 | rel | only valid edge |',
      '',
    ].join('\n'));
    runScript();
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.total_edges).toBe(1);
    expect(edges.edges_by_id['127']).toBeDefined();
  });

  it('records errors[] for missing milestone fixture files', () => {
    const r = runScript();
    expect(r.exitCode).toBe(0);
    const edges = JSON.parse(readFileSync(join(workDir, 'www/tibsfox/com/Research/TRS/edges.json'), 'utf8'));
    expect(edges.errors.length).toBeGreaterThan(0);
    expect(edges.errors.some(e => e.includes('v1.49.613'))).toBe(true);
  });
});
