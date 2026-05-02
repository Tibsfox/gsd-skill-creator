/**
 * T2.3 (v1.49.589) — depth-audit script invariant tests
 *
 * Closes Lesson #10188 candidate from v1.49.588 §5: post-ship audit script
 * comparing sibling-file (NASA/MUS/ELC index.html) line counts against
 * predecessor-mission ratios; flag any sibling file <80% of predecessor
 * depth. Would have caught the v1.49.588 NASA/MUS/ELC depth gap automatically.
 *
 * Tests use temp dir with synthesized predecessor + current index.html
 * files; no dependence on www/ which is gitignored.
 *
 * NOTE: this test file lives at tools/__tests__/ which is OUTSIDE the
 * vitest include glob. It is forward-ready: a future milestone widening
 * vitest scope to tools/** activates it automatically. For v1.49.589,
 * run via vitest.tools.config.mjs.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'depth-audit.mjs');

let tmpRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'depth-audit-test-'));
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

function gold(track, version, lines = 600, bytes = 80000, sections = 14) {
  // Build a synthetic gold-standard index.html with N lines and ~B bytes.
  const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'index.html');
  let body = `<html><head><title>${track} ${version}</title></head><body>\n`;
  body += `<h1>${track} ${version}</h1>\n`;
  if (track === 'NASA') {
    body += '<h2>Three Parallel Threads</h2>\n';
    body += '<h2>Resonance Axes</h2>\n';
    body += '<h2>Founding-Instance Narrative</h2>\n';
    body += '<h2>Forest Contribution</h2>\n';
    body += '<h2>Governance & Chain Declarations</h2>\n';
    body += '<h2>Data Files</h2>\n';
    body += '<h2>Dedication</h2>\n';
    body += '<div class="card">card1</div>\n<div class="card">card2</div>\n';
    body += '<div class="card">card3</div>\n<div class="card">card4</div>\n';
    body += '<div class="card">card5</div>\n<div class="card">card6</div>\n';
    body += '<div class="card">card7</div>\n<div class="card">card8</div>\n';
  } else {
    // MUS + ELC use card-title h2 numbered sections
    for (let i = 1; i <= sections; i++) {
      body += `<h2 class="card-title">${i} &middot; Section ${i}</h2>\n`;
    }
  }
  // Pad with content lines to reach target line count + byte size
  let curBody = body + '</body></html>\n';
  while (curBody.split('\n').length < lines || Buffer.byteLength(curBody) < bytes) {
    curBody = curBody.replace('</body>', '<p>filler line of synthetic depth content</p>\n</body>');
    if (curBody.split('\n').length > lines * 1.5) break; // safety
  }
  writeFileSync(path, curBody);
  return path;
}

function thin(track, version) {
  // Build a synthetic THIN (lazy-truncate) page — half the depth.
  const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'index.html');
  let body = `<html><head><title>${track} ${version}</title></head><body>\n<h1>${track} ${version}</h1>\n`;
  if (track === 'NASA') {
    body += '<h2>Three Parallel Threads</h2>\n<h2>Forest Contribution</h2>\n';
  } else {
    for (let i = 1; i <= 4; i++) {
      body += `<h2 class="card-title">${i} &middot; Truncated ${i}</h2>\n`;
    }
  }
  body += '</body></html>\n';
  writeFileSync(path, body);
  return path;
}

function runAudit(version, ...flags) {
  // Pass --root tmpRoot so the script reads synthetic www/ from tmp dir.
  try {
    const stdout = execSync(`node ${SCRIPT_PATH} ${version} ${flags.join(' ')} --root ${tmpRoot}`, {
      cwd: tmpRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status || 1, stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '' };
  }
}

describe('T2.3 (v1.49.589): depth-audit script', () => {
  it('PASS when current matches predecessor depth', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // v1.49.593: artifact-suite check requires NASA artifacts/ present
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    expect(r.code).toBe(0);
    const report = JSON.parse(r.stdout);
    for (const f of report.findings) {
      expect(f.status).toBe('PASS');
    }
  });

  it('FAIL when current is half predecessor depth (lazy-truncate)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    thin('NASA', '1.69');
    thin('MUS', '1.69');
    thin('ELC', '1.69');
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    for (const f of report.findings) {
      expect(f.status).toBe('FAIL');
    }
  });

  it('--strict exits 1 on FAIL findings', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    thin('NASA', '1.69');
    thin('MUS', '1.69');
    thin('ELC', '1.69');
    const r = runAudit('1.69', '--strict');
    expect(r.code).toBe(1);
  });

  it('--strict exits 0 on PASS findings', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // v1.49.593: artifact-suite check requires NASA artifacts/ present
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--strict');
    expect(r.code).toBe(0);
  });

  it('reports MISSING when current version absent', () => {
    gold('NASA', '1.68');
    gold('MUS', '1.68');
    gold('ELC', '1.68');
    // No 1.69 files
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    expect(report.findings.every(f => f.status === 'MISSING')).toBe(true);
  });

  it('reports NO_PREDECESSOR when prior version absent', () => {
    gold('NASA', '1.69');
    // No 1.68 files
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.status).toBe('NO_PREDECESSOR');
  });

  it('--json produces machine-readable output', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    const r = runAudit('1.69', '--json');
    expect(() => JSON.parse(r.stdout)).not.toThrow();
    const report = JSON.parse(r.stdout);
    expect(report.version).toBe('1.69');
    expect(report.predecessor).toBe('1.68');
    expect(Array.isArray(report.findings)).toBe(true);
    expect(report.findings.length).toBe(3); // NASA + MUS + ELC
  });

  it('regression check — script reports correct ratios in human format', () => {
    gold('NASA', '1.68', 800, 100000);
    gold('NASA', '1.69', 800, 100000);
    gold('MUS', '1.68', 800, 100000, 14);
    gold('MUS', '1.69', 800, 100000, 14);
    gold('ELC', '1.68', 800, 100000, 14);
    gold('ELC', '1.69', 800, 100000, 14);
    // v1.49.593: artifact-suite check requires NASA artifacts/ present
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69');
    expect(r.stdout).toMatch(/PASS/);
    expect(r.stdout).toMatch(/Summary: PASS=3/);
  });
});

// T2.1 (v1.49.593): NASA artifacts/ canonical 13-file suite enforcement
// (closes Lesson #10213 candidate from v1.49.592 close — USER-FLAGGED 2026-05-01).
function makeArtifacts(version, fileCounts) {
  // fileCounts = { story: N, shaders: N, audio: N, sims: N, circuits: N }
  const artifactsDir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version, 'artifacts');
  for (const [cat, count] of Object.entries(fileCounts)) {
    if (count === 0) continue;
    const catDir = join(artifactsDir, cat);
    mkdirSync(catDir, { recursive: true });
    for (let i = 0; i < count; i++) {
      writeFileSync(join(catDir, `file-${i}.txt`), `synthetic ${cat} artifact ${i}`);
    }
  }
}

describe('T2.1 (v1.49.593): NASA artifacts/ canonical-suite enforcement (#10213)', () => {
  it('PASS when 13 files across all 5 categories (gold standard v1.69 + v1.70)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.status).toBe('PASS');
    expect(nasa.artifacts.totalFiles).toBe(13);
    expect(nasa.artifacts.categoriesFound.length).toBe(5);
  });

  it('WARN when 4 files / 4 categories (v1.72 + v1.73 actual drift case)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // 4 files across 4 categories — circuits missing entirely
    makeArtifacts('1.69', { story: 1, shaders: 1, audio: 1, sims: 1, circuits: 0 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.artifacts).toBe('WARN');
    expect(nasa.artifacts.totalFiles).toBe(4);
    expect(nasa.artifacts.categoriesFound.length).toBe(4);
    expect(nasa.artifacts.categoriesFound).not.toContain('circuits');
  });

  it('FAIL when <4 artifact files (lazy-truncate failure mode)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 1, shaders: 1, audio: 0, sims: 0, circuits: 0 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.status).toBe('FAIL');
    expect(nasa.submetrics.artifacts).toBe('FAIL');
  });

  it('FAIL when artifacts/ directory missing entirely', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // No artifacts/ dir at all
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.status).toBe('FAIL');
    expect(nasa.artifacts.status).toBe('MISSING');
  });

  it('MUS + ELC do not enforce artifacts/ check (NASA-only)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const mus = report.findings.find(f => f.track === 'MUS');
    const elc = report.findings.find(f => f.track === 'ELC');
    expect(mus.artifacts).toBeNull();
    expect(elc.artifacts).toBeNull();
    // MUS + ELC PASS independent of artifacts
    expect(mus.status).toBe('PASS');
    expect(elc.status).toBe('PASS');
  });

  it('WARN when 5 files but only 4 categories (e.g. 2 audio + 1 each shader/sim/story)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 1, shaders: 1, audio: 2, sims: 1, circuits: 0 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.artifacts).toBe('WARN');
    expect(nasa.artifacts.totalFiles).toBe(5);
    expect(nasa.artifacts.categoriesFound.length).toBe(4);
  });
});

// W0.3 (v1.49.593): --composite-pass flag for #10207 false-WARN cleanup
//
// Note: the gold() helper conflates line + byte targets (each filler line is
// fixed-size), so we cannot reliably synthesize specific byte ratios in tests.
// These tests verify FLAG MECHANICS (compositePassActive set correctly,
// thresholds applied to ratio function) rather than specific synthesized
// verdicts; verdict-on-real-data is covered by manual verification against
// www/tibsfox/com/Research/NASA/{1.71,1.72,1.73}/index.html (see ship-pipeline
// pre-tag-gate output).
describe('W0.3 (v1.49.593): --composite-pass flag (#10207)', () => {
  it('default behavior: compositePassActive=false when flag absent', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    for (const f of report.findings) {
      expect(f.compositePassActive).toBe(false);
    }
  });

  it('--composite-pass: compositePassActive=true when lines ≥ 95% AND sections OK', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);  // 100% lines / 7/7 sections
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);  // 100% lines / 14/10 sections
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json', '--composite-pass');
    const report = JSON.parse(r.stdout);
    for (const f of report.findings) {
      expect(f.compositePassActive).toBe(true);
    }
  });

  it('--composite-pass: compositePassActive=false when lines < 95% (line drop is real signal)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    thin('ELC', '1.69');  // synthesized as ~50% depth — line ratio < 95%
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json', '--composite-pass');
    const report = JSON.parse(r.stdout);
    const elc = report.findings.find(f => f.track === 'ELC');
    // ELC lines at ~50% < 95% threshold → composite-pass NOT active
    expect(elc.compositePassActive).toBe(false);
  });

  it('--composite-pass: still produces PASS verdict when conditions OK', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json', '--composite-pass');
    const report = JSON.parse(r.stdout);
    for (const f of report.findings) {
      expect(f.status).toBe('PASS');
    }
  });

  it('--composite-pass: human format shows "(composite)" annotation', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--composite-pass');
    expect(r.stdout).toMatch(/\(composite\)/);
  });
});
