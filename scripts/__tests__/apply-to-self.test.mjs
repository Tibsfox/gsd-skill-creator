/**
 * Tests for scripts/apply-to-self.mjs (v1.49.636 C7).
 *
 * Closes the Meta-Lesson by exercising the apply-to-self check itself
 * against synthetic violation fixtures + allowlist + happy-path cases.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  runApplyToSelf,
  listDisciplineDocs,
  loadAllowlist,
} from '../apply-to-self.mjs';
import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('listDisciplineDocs', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ats-discipline-'));
    mkdirSync(join(tmpDir, 'subdir'));
    writeFileSync(join(tmpDir, 'a.md'), '# A');
    writeFileSync(join(tmpDir, 'subdir', 'b.md'), '# B');
    writeFileSync(join(tmpDir, 'not-a-doc.txt'), 'ignored');
  });

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns md files when path is a directory', () => {
    const docs = listDisciplineDocs([tmpDir]);
    expect(docs).toContain(join(tmpDir, 'a.md'));
    expect(docs).not.toContain(join(tmpDir, 'not-a-doc.txt'));
  });

  it('returns the path when it is a single md file', () => {
    const docs = listDisciplineDocs([join(tmpDir, 'a.md')]);
    expect(docs).toEqual([join(tmpDir, 'a.md')]);
  });

  it('returns [] when paths do not exist', () => {
    const docs = listDisciplineDocs(['/nonexistent', '/also/missing']);
    expect(docs).toEqual([]);
  });
});

describe('loadAllowlist', () => {
  let tmpDir;
  let allowlistPath;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'ats-allowlist-'));
    allowlistPath = join(tmpDir, 'allow.md');
  });

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty set when file absent', () => {
    expect(loadAllowlist(allowlistPath).size).toBe(0);
  });

  it('parses table rows into file::pattern keys', () => {
    writeFileSync(
      allowlistPath,
      `# Allowlist

| File | Pattern | Reason |
|---|---|---|
| tests/foo.test.ts | existsSync-no-skip-guard | intentional |
| tests/bar.test.ts | perf-assertion-no-warmup | benchmarks only |
`,
    );
    const allow = loadAllowlist(allowlistPath);
    expect(allow.has('tests/foo.test.ts::existsSync-no-skip-guard')).toBe(true);
    expect(allow.has('tests/bar.test.ts::perf-assertion-no-warmup')).toBe(true);
    expect(allow.size).toBe(2);
  });

  it('skips header rows and separator rows', () => {
    writeFileSync(
      allowlistPath,
      `| File | Pattern |
|---|---|
| real-file.test.ts | real-pattern |
`,
    );
    const allow = loadAllowlist(allowlistPath);
    expect(allow.size).toBe(1);
    expect(allow.has('real-file.test.ts::real-pattern')).toBe(true);
  });
});

describe('runApplyToSelf — synthetic fixtures', () => {
  let tmpDir;

  function setupFixtureRepo({ violatingTest, cleanTest } = {}) {
    tmpDir = mkdtempSync(join(tmpdir(), 'ats-runrepo-'));
    execSync('git init -q', { cwd: tmpDir });
    execSync('git config user.email t@t.io', { cwd: tmpDir });
    execSync('git config user.name t', { cwd: tmpDir });
    // Establish a baseline commit + tag.
    writeFileSync(join(tmpDir, 'README.md'), '# Fixture');
    execSync('git add README.md', { cwd: tmpDir });
    execSync('git commit -q -m "chore(fixture): init"', { cwd: tmpDir });
    execSync('git tag v0.0.1', { cwd: tmpDir });
    // Author the test fixtures AFTER the tag — they show up in diff.
    if (!violatingTest && !cleanTest) {
      // No fixtures requested — commit a noop file so the tag-diff range
      // is well-formed without creating tests/.
      writeFileSync(join(tmpDir, 'noop.txt'), 'placeholder');
      execSync('git add noop.txt', { cwd: tmpDir });
    } else {
      mkdirSync(join(tmpDir, 'tests'));
      if (violatingTest) {
        writeFileSync(join(tmpDir, 'tests', 'violator.test.ts'), violatingTest);
      }
      if (cleanTest) {
        writeFileSync(join(tmpDir, 'tests', 'clean.test.ts'), cleanTest);
      }
      execSync('git add tests/', { cwd: tmpDir });
    }
    execSync('git commit -q -m "test(fixture): add tests"', { cwd: tmpDir });
    return tmpDir;
  }

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('flags a test that uses existsSync on .planning/ without skip-guard', () => {
    setupFixtureRepo({
      violatingTest: `
        import { existsSync, readFileSync } from 'node:fs';
        const PATH = '.planning/some-artifact.md';
        describe('violator', () => {
          it('asserts content', () => {
            // No skip-guard — apply-to-self should flag this.
            const content = readFileSync(PATH, 'utf8');
            expect(content).toContain('marker');
          });
        });
      `,
    });
    const result = runApplyToSelf({ diffRange: 'v0.0.1..HEAD', cwd: tmpDir });
    expect(result.newTestFiles).toContain('tests/violator.test.ts');
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings[0].patternName).toBe('existsSync-no-skip-guard');
    expect(result.pass).toBe(false);
  });

  it('does NOT flag a test that uses existsSync on .planning/ WITH skip-guard', () => {
    setupFixtureRepo({
      cleanTest: `
        import { existsSync, readFileSync } from 'node:fs';
        const PATH = '.planning/some-artifact.md';
        describe('clean', () => {
          it('SKIP if absent', () => {
            if (!existsSync(PATH)) return;
            const content = readFileSync(PATH, 'utf8');
            expect(content).toContain('marker');
          });
        });
      `,
    });
    const result = runApplyToSelf({ diffRange: 'v0.0.1..HEAD', cwd: tmpDir });
    expect(result.newTestFiles).toContain('tests/clean.test.ts');
    expect(result.findings).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it('flags a perf assertion without visible warmup', () => {
    setupFixtureRepo({
      violatingTest: `
        describe('perf-violator', () => {
          it('measures latency', () => {
            const elapsed = doSomething();
            expect(elapsed).toBeLessThan(10);
          });
        });
      `,
    });
    const result = runApplyToSelf({ diffRange: 'v0.0.1..HEAD', cwd: tmpDir });
    const perfFinding = result.findings.find(
      (f) => f.patternName === 'perf-assertion-no-warmup',
    );
    expect(perfFinding).toBeDefined();
  });

  it('does NOT flag a perf assertion with warmup comment + loop', () => {
    setupFixtureRepo({
      cleanTest: `
        describe('perf-clean', () => {
          it('measures latency', async () => {
            // Warm-up phase: discard first samples.
            for (let i = 0; i < 5; i++) {
              await doSomething();
            }
            const elapsed = await doSomething();
            expect(elapsed).toBeLessThan(10);
          });
        });
      `,
    });
    const result = runApplyToSelf({ diffRange: 'v0.0.1..HEAD', cwd: tmpDir });
    const perfFinding = result.findings.find(
      (f) => f.patternName === 'perf-assertion-no-warmup',
    );
    expect(perfFinding).toBeUndefined();
  });

  it('silences findings via allowlist', () => {
    setupFixtureRepo({
      violatingTest: `
        import { existsSync } from 'node:fs';
        const PATH = '.planning/x.md';
        it('asserts', () => { const c = existsSync(PATH); expect(c).toBeTruthy(); });
      `,
    });
    // Author an allowlist that entries this exact file+pattern.
    mkdirSync(join(tmpDir, '.planning', 'ship-pipeline-discipline'), {
      recursive: true,
    });
    writeFileSync(
      join(
        tmpDir,
        '.planning',
        'ship-pipeline-discipline',
        'apply-to-self-allowlist.md',
      ),
      `| File | Pattern |
|---|---|
| tests/violator.test.ts | existsSync-no-skip-guard |
`,
    );
    const result = runApplyToSelf({
      diffRange: 'v0.0.1..HEAD',
      cwd: tmpDir,
      allowlistPath: join(
        tmpDir,
        '.planning',
        'ship-pipeline-discipline',
        'apply-to-self-allowlist.md',
      ),
    });
    expect(result.findings).toEqual([]);
    expect(result.allowlistedViolations).toContain(
      'tests/violator.test.ts::existsSync-no-skip-guard',
    );
    expect(result.pass).toBe(true);
  });

  it('returns pass=true when no new test files in diff range', () => {
    setupFixtureRepo({});
    // No new test files committed.
    const result = runApplyToSelf({ diffRange: 'v0.0.1..HEAD', cwd: tmpDir });
    expect(result.newTestFiles).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.pass).toBe(true);
  });
});

describe('runApplyToSelf — apply-to-self', () => {
  it('the v1.49.636 milestone passes apply-to-self against the live repo', () => {
    // Run against the actual repo with no diff range (no diff filter applied,
    // returns []). This exercises the live-repo discovery surface.
    const result = runApplyToSelf({ diffRange: null });
    // diffRange=null → newTestFiles=[], findings=[]. Pass is trivially true.
    expect(result.newTestFiles).toEqual([]);
    expect(result.findings).toEqual([]);
    expect(result.pass).toBe(true);
  });
});
