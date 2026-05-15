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
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync } from 'node:fs';
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
    // v1.49.603: NASA pages must include 8 Research Track cards (1a/1b/2/3/4/5/6/7)
    // and ≥1 bottom-of-content nav-card. Both are PASS-required for the gate
    // introduced in v1.49.603.
    body += '<div class="track-card t1"><div class="track-num">Track 1a</div></div>\n';
    body += '<div class="track-card t2"><div class="track-num">Track 1b</div></div>\n';
    body += '<div class="track-card t3"><div class="track-num">Track 2</div></div>\n';
    body += '<div class="track-card t4"><div class="track-num">Track 3</div></div>\n';
    body += '<div class="track-card t5"><div class="track-num">Track 4</div></div>\n';
    body += '<div class="track-card t6"><div class="track-num">Track 5</div></div>\n';
    body += '<div class="track-card t7"><div class="track-num">Track 6 - MUS cross-track</div></div>\n';
    body += '<div class="track-card t8"><div class="track-num">Track 7 - ELC cross-track</div></div>\n';
    body += '<div class="nav-card"><a href="../prev/">prev</a><a href="../next/">next</a></div>\n';
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
//
// v1.49.594 W0 (#10222): also writes matching `href="artifacts/<cat>/<file>"`
// cross-link references into the NASA index.html so the cross-link coverage
// check passes by default in tests. Pass `linkCoverage` to control how many
// of the on-disk files get a matching reference (default 1.0 = 100% coverage).
function makeArtifacts(version, fileCounts, linkCoverage = 1.0) {
  // fileCounts = { story: N, shaders: N, audio: N, sims: N, circuits: N }
  const artifactsDir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version, 'artifacts');
  const onDiskPaths = [];
  for (const [cat, count] of Object.entries(fileCounts)) {
    if (count === 0) continue;
    const catDir = join(artifactsDir, cat);
    mkdirSync(catDir, { recursive: true });
    for (let i = 0; i < count; i++) {
      writeFileSync(join(catDir, `file-${i}.txt`), `synthetic ${cat} artifact ${i}`);
      onDiskPaths.push(`${cat}/file-${i}.txt`);
    }
  }

  // Append `href="artifacts/<path>"` anchors to the NASA index.html so the
  // cross-link coverage submetric (added v1.49.594) passes alongside the
  // artifact-suite check. Only append if the index exists (some tests don't
  // call gold() before makeArtifacts).
  const indexPath = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version, 'index.html');
  if (!existsSync(indexPath) || onDiskPaths.length === 0) return;

  const linkCount = Math.round(onDiskPaths.length * linkCoverage);
  const linksHtml = onDiskPaths
    .slice(0, linkCount)
    .map(p => `<li><a href="artifacts/${p}" style="color:var(--gold);">${p}</a></li>`)
    .join('\n');
  const text = readFileSync(indexPath, 'utf8');
  // Inject the cross-link block right before </body>.
  const injected = text.replace('</body>', `<ul class="cross-links">\n${linksHtml}\n</ul>\n</body>`);
  writeFileSync(indexPath, injected);
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

// W0 (v1.49.594): cross-link coverage submetric — closes #10222 candidate.
// Carry-forward fix from v1.49.593 close: v1.72/v1.73/v1.74 NASA index.html
// pages shipped with thin/empty/missing card-population (artifacts on disk
// but not enumerated as href="artifacts/..." references in Creative
// Artifacts / Runnable Simulations / Forest Contribution cards). The
// artifact-suite check passed (files present); the structural gap was
// invisible because the gate only verified disk presence + canonical h2s.
describe('W0 (v1.49.594): cross-link coverage submetric (#10222)', () => {
  it('PASS when ≥80% of artifacts referenced (gold pattern)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }); // 100% coverage
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.crossLinks).not.toBeNull();
    expect(nasa.crossLinks.totalOnDisk).toBe(13);
    expect(nasa.crossLinks.coveredOnDisk).toBe(13);
    expect(nasa.crossLinks.coverage).toBe(1.0);
    expect(nasa.crossLinks.status).toBe('PASS');
    expect(nasa.submetrics.crossLinks).toBe('PASS');
    expect(nasa.status).toBe('PASS');
  });

  it('WARN when 50-80% coverage (partial linkage drift)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // 13 files; only 60% (8) referenced → coverage in WARN band [0.5, 0.8)
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.60);
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.crossLinks.coverage).toBeGreaterThanOrEqual(0.5);
    expect(nasa.crossLinks.coverage).toBeLessThan(0.8);
    expect(nasa.crossLinks.status).toBe('WARN');
    expect(nasa.submetrics.crossLinks).toBe('WARN');
    expect(nasa.status).toBe('WARN');
  });

  it('FAIL coverage downgrades to WARN in soak mode (default)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // 13 files; only 10% (1) referenced → coverage in FAIL band <0.5
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.10);
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.crossLinks.coverage).toBeLessThan(0.5);
    expect(nasa.crossLinks.status).toBe('FAIL');             // raw status
    expect(nasa.submetrics.crossLinksRaw).toBe('FAIL');       // raw status preserved
    expect(nasa.submetrics.crossLinks).toBe('WARN');          // soak-mode downgrade
    expect(nasa.status).toBe('WARN');                         // overall not FAIL
    expect(nasa.crossLinkStrictActive).toBe(false);
  });

  it('FAIL coverage stays FAIL with --cross-link-strict (post-soak mode)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.10);
    const r = runAudit('1.69', '--json', '--cross-link-strict');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.crossLinks.status).toBe('FAIL');
    expect(nasa.submetrics.crossLinks).toBe('FAIL');          // no downgrade
    expect(nasa.status).toBe('FAIL');                         // overall FAIL
    expect(nasa.crossLinkStrictActive).toBe(true);
  });

  it('--strict + --cross-link-strict: exit 1 on FAIL coverage', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.10);
    const r = runAudit('1.69', '--strict', '--cross-link-strict');
    expect(r.code).toBe(1);
  });

  it('--strict (without --cross-link-strict): exit 0 even on FAIL coverage (soak)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.10);
    const r = runAudit('1.69', '--strict');
    // soak-mode: FAIL coverage → WARN → no overall FAIL → --strict exits 0
    expect(r.code).toBe(0);
  });

  it('MUS + ELC do not enforce cross-link check (NASA-only)', () => {
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
    expect(mus.crossLinks).toBeNull();
    expect(elc.crossLinks).toBeNull();
    expect(mus.status).toBe('PASS');
    expect(elc.status).toBe('PASS');
  });

  it('null when artifacts/ directory missing (no link-target on disk)', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    // No makeArtifacts call → no artifacts/ dir
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.crossLinks).toBeNull();
    // overall status governed by artifacts MISSING (FAIL) — independent of cross-links
    expect(nasa.artifacts.status).toBe('MISSING');
  });

  it('human format reports cross-link gap when WARN', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.60);
    const r = runAudit('1.69');
    expect(r.stdout).toMatch(/cross-links: WARN/);
    expect(r.stdout).toMatch(/coverage/);
  });

  it('soft-mode annotation appears when FAIL downgraded to WARN', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 }, 0.10);
    const r = runAudit('1.69');
    expect(r.stdout).toMatch(/cross-links: FAIL/);
    expect(r.stdout).toMatch(/soft-mode: FAIL downgraded to WARN/);
  });
});

// ---------------------------------------------------------------------------
// v1.49.603 — track-cards + nav-card drift gate (#10244-pattern, observation #3)
// ---------------------------------------------------------------------------

/**
 * Build a NASA index.html with controllable Track-card + nav-card content
 * for the v1.49.603 sub-checks. Default: include all 8 cards + nav-card
 * (PASS). Pass `trackCardCount` to control how many of Track 1a/1b/2/3/4/5/6/7
 * appear (the variants are always written in order; 6 means 1a+1b+2+3+4+5).
 * Pass `navCard:false` to omit the nav-card class.
 */
function nasaWithCards(version, opts = {}) {
  const trackCardCount = opts.trackCardCount !== undefined ? opts.trackCardCount : 8;
  const navCard = opts.navCard !== false;
  const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', 'NASA', version);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'index.html');
  const variants = ['Track 1a', 'Track 1b', 'Track 2', 'Track 3', 'Track 4', 'Track 5', 'Track 6', 'Track 7'];
  let body = `<html><head><title>NASA ${version}</title></head><body>\n`;
  body += `<h1>NASA ${version}</h1>\n`;
  body += '<h2>Three Parallel Threads</h2>\n<h2>Resonance Axes</h2>\n';
  body += '<h2>Founding-Instance Narrative</h2>\n<h2>Forest Contribution</h2>\n';
  body += '<h2>Governance & Chain Declarations</h2>\n<h2>Data Files</h2>\n<h2>Dedication</h2>\n';
  for (let i = 0; i < 8; i++) body += '<div class="card">card</div>\n';
  for (let i = 0; i < trackCardCount && i < variants.length; i++) {
    body += `<div class="track-card t${i+1}"><div class="track-num">${variants[i]}</div></div>\n`;
  }
  if (navCard) body += '<div class="nav-card"><a href="../prev/">prev</a><a href="../next/">next</a></div>\n';
  let curBody = body + '</body></html>\n';
  while (curBody.split('\n').length < 600 || Buffer.byteLength(curBody) < 80000) {
    curBody = curBody.replace('</body>', '<p>filler line of synthetic depth content</p>\n</body>');
    if (curBody.split('\n').length > 900) break;
  }
  writeFileSync(path, curBody);
  return path;
}

describe('v1.49.603: NASA Research Track cards + nav-card drift gate (#10244 obs #3)', () => {
  it('PASS when 8/8 unique Track cards (1a/1b/2/3/4/5/6/7) and ≥1 nav-card', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 8, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('PASS');
    expect(nasa.submetrics.navCard).toBe('PASS');
    expect(nasa.trackCards.found).toBe(8);
    expect(nasa.navCard.count).toBeGreaterThanOrEqual(1);
  });

  it('FAIL when 0 Track cards (drift fixture matching v1.77 pre-hot-fix)', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 0, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('FAIL');
    expect(nasa.trackCards.found).toBe(0);
    expect(nasa.status).toBe('FAIL');
  });

  it('FAIL when 4 Track cards (drift fixture matching v1.76 pre-hot-fix)', () => {
    // 4 cards = below WARN threshold of 6 — FAIL/BLOCKER
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 4, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('FAIL');
    expect(nasa.trackCards.found).toBe(4);
  });

  it('WARN when 6 Track cards (boundary; matches v1.78 pre-hot-fix at 6 of 8)', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 6, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('WARN');
    expect(nasa.trackCards.found).toBe(6);
  });

  it('WARN when 7 Track cards (boundary upper)', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 7, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('WARN');
    expect(nasa.trackCards.found).toBe(7);
  });

  it('FAIL when nav-card absent (gold cards present, but no nav-card class)', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 8, navCard: false });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(nasa.submetrics.trackCards).toBe('PASS');
    expect(nasa.submetrics.navCard).toBe('FAIL');
    expect(nasa.navCard.count).toBe(0);
    expect(nasa.status).toBe('FAIL');
  });

  it('SC_SKIP_TRACK_CARDS_GATE=1 downgrades FAIL → WARN (emergency override)', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 0, navCard: false });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const stdout = execSync(`node ${SCRIPT_PATH} 1.75 --json --root ${tmpRoot}`, {
      cwd: tmpRoot, encoding: 'utf8',
      env: { ...process.env, SC_SKIP_TRACK_CARDS_GATE: '1' },
    });
    const report = JSON.parse(stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    // Raw status is FAIL but the override downgrades to WARN
    expect(nasa.submetrics.trackCardsRaw).toBe('FAIL');
    expect(nasa.submetrics.trackCards).toBe('WARN');
    expect(nasa.submetrics.navCardRaw).toBe('FAIL');
    expect(nasa.submetrics.navCard).toBe('WARN');
    expect(nasa.trackCardsGateSkipped).toBe(true);
  });

  it('--strict exits 1 when track-cards FAIL', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 0, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--strict');
    expect(r.code).toBe(1);
  });

  it('human format reports track-card and nav-card gaps', () => {
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 0, navCard: false });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75');
    expect(r.stdout).toMatch(/track-cards: FAIL/);
    expect(r.stdout).toMatch(/nav-card: FAIL/);
    expect(r.stdout).toMatch(/missing tracks:/);
  });

  it('MUS + ELC do not enforce track-card or nav-card check (NASA-only)', () => {
    // Build MUS + ELC index without any track cards or nav-card; should still PASS
    gold('NASA', '1.74', 600, 80000);
    nasaWithCards('1.75', { trackCardCount: 8, navCard: true });
    gold('MUS', '1.74', 600, 80000, 14);
    gold('MUS', '1.75', 600, 80000, 14);
    gold('ELC', '1.74', 600, 80000, 14);
    gold('ELC', '1.75', 600, 80000, 14);
    makeArtifacts('1.75', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.75', '--json');
    const report = JSON.parse(r.stdout);
    const mus = report.findings.find(f => f.track === 'MUS');
    const elc = report.findings.find(f => f.track === 'ELC');
    expect(mus.trackCards).toBeNull();
    expect(mus.navCard).toBeNull();
    expect(elc.trackCards).toBeNull();
    expect(elc.navCard).toBeNull();
    expect(mus.status).toBe('PASS');
    expect(elc.status).toBe('PASS');
  });
});

// v1.49.654 C05 (FA-652-11): SCAFFOLD-PENDING marker + granular bypass tests.
describe('v1.49.654 C05: SCAFFOLD-PENDING + SC_SKIP_DEPTH_AUDIT_MUS_ELC', () => {
  function scaffoldStub(track, version) {
    const dir = join(tmpRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
    mkdirSync(dir, { recursive: true });
    const path = join(dir, 'index.html');
    const body = `<!DOCTYPE html>
<html><head>
<title>${track} ${version} scaffold</title>
<!-- SCAFFOLD-PENDING: backfill required -->
</head><body>
<h1>${track} ${version}</h1>
<p>scaffold</p>
</body></html>`;
    writeFileSync(path, body);
    return path;
  }

  it('MUS scaffold-pending stub downgrades FAIL to SCAFFOLD-PENDING', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    scaffoldStub('MUS', '1.69');         // tiny stub with marker
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const mus = report.findings.find(f => f.track === 'MUS');
    expect(mus.status).toBe('SCAFFOLD-PENDING');
    expect(mus.scaffoldPending).toBe(true);
    expect(mus.scaffoldDowngraded).toBe(true);
  });

  it('ELC scaffold-pending stub downgrades FAIL to SCAFFOLD-PENDING', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    scaffoldStub('ELC', '1.69');
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const elc = report.findings.find(f => f.track === 'ELC');
    expect(elc.status).toBe('SCAFFOLD-PENDING');
  });

  it('SCAFFOLD-PENDING marker on NASA index does NOT downgrade NASA finding', () => {
    // Defense-in-depth: marker only applies to MUS/ELC.
    gold('NASA', '1.68', 600, 80000);
    scaffoldStub('NASA', '1.69');         // tiny NASA stub with marker
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    const r = runAudit('1.69', '--json');
    const report = JSON.parse(r.stdout);
    const nasa = report.findings.find(f => f.track === 'NASA');
    expect(['FAIL', 'MISSING']).toContain(nasa.status);
    expect(nasa.scaffoldDowngraded).toBe(false);
  });

  it('SC_SKIP_DEPTH_AUDIT_MUS_ELC=1 downgrades MUS/ELC FAIL to WARN', () => {
    gold('NASA', '1.68', 600, 80000);
    gold('NASA', '1.69', 600, 80000);
    gold('MUS', '1.68', 600, 80000, 14);
    thin('MUS', '1.69');                  // thin = below depth, FAIL
    gold('ELC', '1.68', 600, 80000, 14);
    thin('ELC', '1.69');
    makeArtifacts('1.69', { story: 2, shaders: 2, audio: 4, sims: 2, circuits: 3 });
    try {
      const stdout = execSync(`node ${SCRIPT_PATH} 1.69 --json --root ${tmpRoot}`, {
        cwd: tmpRoot,
        encoding: 'utf8',
        env: { ...process.env, SC_SKIP_DEPTH_AUDIT_MUS_ELC: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const report = JSON.parse(stdout);
      const mus = report.findings.find(f => f.track === 'MUS');
      const elc = report.findings.find(f => f.track === 'ELC');
      expect(mus.status).toBe('WARN');
      expect(mus.musElcSkipDowngraded).toBe(true);
      expect(elc.status).toBe('WARN');
      expect(elc.musElcSkipDowngraded).toBe(true);
    } catch (e) {
      throw new Error(`audit failed: ${e.stderr || e.message}`);
    }
  });

  it('SC_SKIP_DEPTH_AUDIT_MUS_ELC=1 does NOT affect NASA findings', () => {
    gold('NASA', '1.68', 600, 80000);
    thin('NASA', '1.69');                 // NASA below-depth
    gold('MUS', '1.68', 600, 80000, 14);
    gold('MUS', '1.69', 600, 80000, 14);
    gold('ELC', '1.68', 600, 80000, 14);
    gold('ELC', '1.69', 600, 80000, 14);
    try {
      const stdout = execSync(`node ${SCRIPT_PATH} 1.69 --json --root ${tmpRoot}`, {
        cwd: tmpRoot,
        encoding: 'utf8',
        env: { ...process.env, SC_SKIP_DEPTH_AUDIT_MUS_ELC: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const report = JSON.parse(stdout);
      const nasa = report.findings.find(f => f.track === 'NASA');
      expect(['FAIL', 'MISSING']).toContain(nasa.status);
    } catch (e) {
      throw new Error(`audit failed: ${e.stderr || e.message}`);
    }
  });
});
