/**
 * tools/__tests__/update-catalog-indexes.test.mjs
 *
 * Hermetic tests for update-catalog-indexes.mjs.
 *
 * Fixture strategy: build minimal NASA/MUS/ELC HTML fixtures + on-disk
 * degree directories in a temp dir; invoke the tool with --root pointing
 * to the temp dir. No dependency on the real www/ (gitignored).
 *
 * Test cases:
 *   1. Zero drift — catalog matches on-disk degrees → PASS (exit 0)
 *   2. NASA Set missing 1 entry → DRIFT (exit 8)
 *   3. MUS catalog missing 1 degree-card href → DRIFT (exit 8)
 *   4. --write fixes NASA Set in place → second --check passes (exit 0)
 *   5. --write refuses to invent MUS card content → exits non-zero with message
 *   6. ELC catalog with extra entry (no matching dir) → DRIFT (exit 8)
 *   7. --json output in PASS case is valid JSON with expected shape
 *
 * Authored 2026-05-04 in v1.49.601 W0 (Catalog-Index Auto-Derive Counter-Cadence).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

import {
  scanOnDiskDegrees,
  parseNasaCompletedSet,
  parseCatalogHrefs,
  rewriteNasaCompletedSet,
  auditTrack,
  writeTrack,
  main,
} from '../update-catalog-indexes.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = join(HERE, '..', 'update-catalog-indexes.mjs');

// ---- fixture helpers ----

function makeResearchRoot(tmpRoot) {
  return join(tmpRoot, 'www', 'tibsfox', 'com', 'Research');
}

function makeDegreeDirs(researchRoot, track, degrees) {
  for (const deg of degrees) {
    mkdirSync(join(researchRoot, track, deg), { recursive: true });
  }
}

function makeNasaIndex(researchRoot, degrees) {
  const setBody = degrees.map((d) => `  '${d}'`).join(',\n');
  const html = `<!DOCTYPE html>
<html><head><title>NASA</title></head><body>
<script>
const completedMissions = new Set([
${setBody}
]);
</script>
</body></html>`;
  writeFileSync(join(researchRoot, 'NASA', 'index.html'), html, 'utf8');
}

// Cards carry the degree-meta fields the W2.2 template BLOCKER gate requires
// (added v1.49.658 — tools/catalog-card-template/spec.mjs TRACK_TEMPLATES):
// MUS needs /^S\d+$/ + SPS + NASA; ELC needs NASA + Flight subset. The
// href="${d}/index.html" is preserved so the degree-href drift audit is
// unaffected. Pre-W2.2 these helpers emitted bare <div>${d}</div> cards, which
// the newer template gate correctly rejects (templateDrift → exit 8); see
// v1.49.913 ship. The drift-injecting tests (missing/extra href) still produce
// drift via the href set, independent of these meta fields.
function makeMUSIndex(researchRoot, degrees) {
  const cards = degrees.map((d) => `<div class="degree-card"><a href="${d}/index.html">
  <div class="degree-num">MUS ${d}</div>
  <div class="degree-title">Title ${d}</div>
  <div class="degree-meta"><strong>S36:</strong> Artist</div>
  <div class="degree-meta"><strong>SPS:</strong> Species</div>
  <div class="degree-meta"><strong>NASA:</strong> Mission</div>
</a></div>`).join('\n');
  const html = `<!DOCTYPE html>
<html><head><title>MUS</title></head><body>
${cards}
</body></html>`;
  writeFileSync(join(researchRoot, 'MUS', 'index.html'), html, 'utf8');
}

function makeELCIndex(researchRoot, degrees) {
  const cards = degrees.map((d) => `<div class="degree-card"><a href="${d}/index.html">
  <div class="degree-num">ELC ${d}</div>
  <div class="degree-title">Title ${d}</div>
  <div class="degree-meta"><strong>NASA:</strong> Mission</div>
  <div class="degree-meta"><strong>Flight subset:</strong> Subset</div>
</a></div>`).join('\n');
  const html = `<!DOCTYPE html>
<html><head><title>ELC</title></head><body>
${cards}
</body></html>`;
  writeFileSync(join(researchRoot, 'ELC', 'index.html'), html, 'utf8');
}

function runCheck(tmpRoot, extraArgs = []) {
  try {
    const result = execSync(
      `node "${SCRIPT_PATH}" --root "${tmpRoot}" --check ${extraArgs.join(' ')}`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return { exitCode: 0, stdout: result, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    };
  }
}

function runWrite(tmpRoot, extraArgs = []) {
  try {
    const result = execSync(
      `node "${SCRIPT_PATH}" --root "${tmpRoot}" --write ${extraArgs.join(' ')}`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return { exitCode: 0, stdout: result, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    };
  }
}

function runJson(tmpRoot) {
  try {
    const result = execSync(
      `node "${SCRIPT_PATH}" --root "${tmpRoot}" --json`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    return { exitCode: 0, stdout: result, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status,
      stdout: err.stdout || '',
      stderr: err.stderr || '',
    };
  }
}

// ---- setup / teardown ----

let tmpRoot;
let researchRoot;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'catalog-index-test-'));
  researchRoot = makeResearchRoot(tmpRoot);
  for (const track of ['NASA', 'MUS', 'ELC']) {
    mkdirSync(join(researchRoot, track), { recursive: true });
  }
});

afterEach(() => {
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

// ---- unit tests for exported functions ----

describe('scanOnDiskDegrees', () => {
  it('returns degrees sorted numerically', () => {
    makeDegreeDirs(researchRoot, 'NASA', ['1.0', '1.1', '1.9', '1.10', '1.2']);
    const result = scanOnDiskDegrees(researchRoot, 'NASA');
    expect(result).toEqual(['1.0', '1.1', '1.2', '1.9', '1.10']);
  });

  it('ignores non-degree directories', () => {
    makeDegreeDirs(researchRoot, 'NASA', ['1.0', '1.1']);
    mkdirSync(join(researchRoot, 'NASA', 'catalog'), { recursive: true });
    mkdirSync(join(researchRoot, 'NASA', '_harness'), { recursive: true });
    const result = scanOnDiskDegrees(researchRoot, 'NASA');
    expect(result).toEqual(['1.0', '1.1']);
  });

  it('returns empty array when track dir missing', () => {
    const result = scanOnDiskDegrees(researchRoot, 'NONEXISTENT');
    expect(result).toEqual([]);
  });
});

describe('parseNasaCompletedSet', () => {
  it('parses a multi-line Set', () => {
    const html = `const completedMissions = new Set([\n  '1.0', '1.1',\n  '1.2'\n]);`;
    const result = parseNasaCompletedSet(html);
    expect(result).toEqual(['1.0', '1.1', '1.2']);
  });

  it('returns null when pattern not found', () => {
    const result = parseNasaCompletedSet('<html>no set here</html>');
    expect(result).toBeNull();
  });
});

describe('parseCatalogHrefs', () => {
  it('extracts degree hrefs from HTML', () => {
    const html = `<a href="1.0/index.html">...</a><a href="1.1/index.html">...</a>`;
    const result = parseCatalogHrefs(html);
    expect(result).toEqual(['1.0', '1.1']);
  });

  it('returns empty array for no hrefs', () => {
    const result = parseCatalogHrefs('<html><body>no hrefs</body></html>');
    expect(result).toEqual([]);
  });
});

describe('rewriteNasaCompletedSet', () => {
  it('rewrites the Set with new degrees', () => {
    const html = `<script>\nconst completedMissions = new Set([\n  '1.0'\n]);\n</script>`;
    const updated = rewriteNasaCompletedSet(html, ['1.0', '1.1']);
    expect(updated).toContain("'1.0'");
    expect(updated).toContain("'1.1'");
    // Verify parses back correctly.
    const parsed = parseNasaCompletedSet(updated);
    expect(parsed).toContain('1.0');
    expect(parsed).toContain('1.1');
  });
});

// ---- integration tests via CLI ----

describe('test 1: zero drift — all catalogs match on-disk degrees', () => {
  it('exits 0 and reports PASS for all tracks', () => {
    const degrees = ['1.0', '1.1', '1.2'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runCheck(tmpRoot);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('[PASS] NASA');
    expect(stdout).toContain('[PASS] MUS');
    expect(stdout).toContain('[PASS] ELC');
  });
});

describe('test 2: NASA Set missing 1 entry', () => {
  it('exits 8 and reports DRIFT for NASA', () => {
    const onDisk = ['1.0', '1.1', '1.2'];
    const inCatalog = ['1.0', '1.1']; // missing 1.2
    makeDegreeDirs(researchRoot, 'NASA', onDisk);
    makeDegreeDirs(researchRoot, 'MUS', onDisk);
    makeDegreeDirs(researchRoot, 'ELC', onDisk);
    makeNasaIndex(researchRoot, inCatalog);
    makeMUSIndex(researchRoot, onDisk);
    makeELCIndex(researchRoot, onDisk);

    const { exitCode, stderr } = runCheck(tmpRoot);
    expect(exitCode).toBe(8);
    expect(stderr).toContain('DRIFT');
    expect(stderr).toContain('NASA');
    expect(stderr).toContain('1.2');
  });
});

describe('test 3: MUS catalog missing 1 degree-card href', () => {
  it('exits 8 and reports DRIFT for MUS', () => {
    const onDisk = ['1.0', '1.1', '1.2'];
    const inMUSCatalog = ['1.0', '1.1']; // missing 1.2
    makeDegreeDirs(researchRoot, 'NASA', onDisk);
    makeDegreeDirs(researchRoot, 'MUS', onDisk);
    makeDegreeDirs(researchRoot, 'ELC', onDisk);
    makeNasaIndex(researchRoot, onDisk);
    makeMUSIndex(researchRoot, inMUSCatalog);
    makeELCIndex(researchRoot, onDisk);

    const { exitCode, stderr } = runCheck(tmpRoot);
    expect(exitCode).toBe(8);
    expect(stderr).toContain('DRIFT');
    expect(stderr).toContain('MUS');
    expect(stderr).toContain('1.2');
  });
});

describe('test 4: --write fixes NASA Set; second --check passes', () => {
  it('rewrites NASA catalog then exits 0 on re-check', () => {
    const onDisk = ['1.0', '1.1', '1.2'];
    const inCatalog = ['1.0', '1.1']; // missing 1.2
    makeDegreeDirs(researchRoot, 'NASA', onDisk);
    makeDegreeDirs(researchRoot, 'MUS', onDisk);
    makeDegreeDirs(researchRoot, 'ELC', onDisk);
    makeNasaIndex(researchRoot, inCatalog);
    makeMUSIndex(researchRoot, onDisk);
    makeELCIndex(researchRoot, onDisk);

    // First: check reports drift.
    const before = runCheck(tmpRoot);
    expect(before.exitCode).toBe(8);

    // --write should succeed for NASA.
    const wr = runWrite(tmpRoot);
    expect(wr.exitCode).toBe(0);

    // Verify the file was updated.
    const updatedHtml = readFileSync(join(researchRoot, 'NASA', 'index.html'), 'utf8');
    const parsed = parseNasaCompletedSet(updatedHtml);
    expect(parsed).toContain('1.2');

    // Second check should pass.
    const after = runCheck(tmpRoot);
    expect(after.exitCode).toBe(0);
  });
});

describe('test 5: --write refuses to invent MUS card content', () => {
  it('exits non-zero with a clear error message when MUS is drifted', () => {
    const onDisk = ['1.0', '1.1', '1.2'];
    const inMUSCatalog = ['1.0', '1.1']; // missing 1.2
    makeDegreeDirs(researchRoot, 'NASA', onDisk);
    makeDegreeDirs(researchRoot, 'MUS', onDisk);
    makeDegreeDirs(researchRoot, 'ELC', onDisk);
    makeNasaIndex(researchRoot, onDisk);
    makeMUSIndex(researchRoot, inMUSCatalog);
    makeELCIndex(researchRoot, onDisk);

    const { exitCode, stderr } = runWrite(tmpRoot);
    expect(exitCode).not.toBe(0);
    // Should mention 1.2 and instruct the user to author manually.
    expect(stderr).toContain('1.2');
    expect(stderr.toLowerCase()).toMatch(/author|manual/);
  });
});

describe('test 6: ELC catalog has extra entry with no on-disk dir', () => {
  it('exits 8 and reports extra-in-catalog drift for ELC', () => {
    const onDisk = ['1.0', '1.1'];
    const inELCCatalog = ['1.0', '1.1', '1.99']; // extra 1.99
    makeDegreeDirs(researchRoot, 'NASA', onDisk);
    makeDegreeDirs(researchRoot, 'MUS', onDisk);
    makeDegreeDirs(researchRoot, 'ELC', onDisk);
    makeNasaIndex(researchRoot, onDisk);
    makeMUSIndex(researchRoot, onDisk);
    makeELCIndex(researchRoot, inELCCatalog);

    const { exitCode, stderr } = runCheck(tmpRoot);
    expect(exitCode).toBe(8);
    expect(stderr).toContain('ELC');
    expect(stderr).toContain('1.99');
  });
});

describe('test 7: --json output in PASS case has expected shape', () => {
  it('emits valid JSON with tracks + summary when no drift', () => {
    const degrees = ['1.0', '1.1'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runJson(tmpRoot);
    expect(exitCode).toBe(0);

    let parsed;
    expect(() => { parsed = JSON.parse(stdout); }).not.toThrow();
    expect(parsed).toHaveProperty('tracks');
    expect(parsed).toHaveProperty('summary');
    expect(parsed.tracks).toHaveProperty('NASA');
    expect(parsed.tracks).toHaveProperty('MUS');
    expect(parsed.tracks).toHaveProperty('ELC');
    expect(parsed.summary.status).toBe('PASS');
    expect(parsed.summary.any_drift).toBe(false);
    expect(parsed.summary.total_drift_degrees).toBe(0);
    // NASA track shape.
    expect(parsed.tracks.NASA).toHaveProperty('on_disk_degrees');
    expect(parsed.tracks.NASA).toHaveProperty('in_catalog_set');
    expect(parsed.tracks.NASA.status).toBe('PASS');
    // MUS track shape.
    expect(parsed.tracks.MUS).toHaveProperty('in_catalog_hrefs');
    expect(parsed.tracks.MUS.status).toBe('PASS');
  });
});

// IC-613-1.4: TRS audit extension tests
describe('IC-613-1.4: TRS audit extension', () => {
  it('TRS SKIP when build-trs-edges.mjs missing in test env', () => {
    const degrees = ['1.0'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runJson(tmpRoot);
    const parsed = JSON.parse(stdout);
    expect(parsed.tracks).toHaveProperty('TRS');
    expect(parsed.tracks.TRS.status).toBe('SKIP');
    // SKIP doesn't fail the gate (soft-state until IC-613-1.2 lands)
    expect(parsed.summary.any_drift).toBe(false);
    expect(exitCode).toBe(0);
  });

  it('TRS DRIFT does fail the overall gate (composes with NASA/MUS/ELC)', () => {
    const fakeTools = join(tmpRoot, 'tools');
    mkdirSync(fakeTools, { recursive: true });
    writeFileSync(
      join(fakeTools, 'build-trs-edges.mjs'),
      `#!/usr/bin/env node\nif (process.argv.includes('--check')) {\n  console.error('[build-trs-edges] STALE: synthetic test failure');\n  process.exit(1);\n}\n`,
    );
    mkdirSync(join(researchRoot, 'TRS'), { recursive: true });
    writeFileSync(join(researchRoot, 'TRS', 'edges.json'), '{"schema":"trs-edges/v1"}');

    const degrees = ['1.0'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runJson(tmpRoot);
    const parsed = JSON.parse(stdout);
    expect(parsed.tracks.TRS.status).toBe('DRIFT');
    expect(parsed.summary.any_drift).toBe(true);
    expect(exitCode).toBe(8);
  });

  it('TRS PASS when build-trs-edges.mjs --check exits 0', () => {
    const fakeTools = join(tmpRoot, 'tools');
    mkdirSync(fakeTools, { recursive: true });
    writeFileSync(
      join(fakeTools, 'build-trs-edges.mjs'),
      `#!/usr/bin/env node\nif (process.argv.includes('--check')) process.exit(0);\n`,
    );
    mkdirSync(join(researchRoot, 'TRS'), { recursive: true });
    writeFileSync(join(researchRoot, 'TRS', 'edges.json'), '{"schema":"trs-edges/v1"}');

    const degrees = ['1.0'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runJson(tmpRoot);
    const parsed = JSON.parse(stdout);
    expect(parsed.tracks.TRS.status).toBe('PASS');
    expect(parsed.summary.any_drift).toBe(false);
    expect(exitCode).toBe(0);
  });

  it('TRS SKIP shown in human-readable output with [SKIP] prefix', () => {
    const degrees = ['1.0'];
    makeDegreeDirs(researchRoot, 'NASA', degrees);
    makeDegreeDirs(researchRoot, 'MUS', degrees);
    makeDegreeDirs(researchRoot, 'ELC', degrees);
    makeNasaIndex(researchRoot, degrees);
    makeMUSIndex(researchRoot, degrees);
    makeELCIndex(researchRoot, degrees);

    const { exitCode, stdout } = runCheck(tmpRoot);
    expect(exitCode).toBe(0);
    expect(stdout).toContain('[SKIP] TRS');
  });
});
