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
    const r = runAudit('1.69');
    expect(r.stdout).toMatch(/PASS/);
    expect(r.stdout).toMatch(/Summary: PASS=3/);
  });
});
