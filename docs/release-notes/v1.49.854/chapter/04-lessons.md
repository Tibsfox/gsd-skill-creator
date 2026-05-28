# v1.49.854 — Lessons

## Tentative observations (below promotion threshold)

### Real-git temp-repo integration-test pattern

**Instances: 1 (v854)**

**Observation:** The pattern for integration tests that exercise real git (vs mocked executors) follows a specific shape:

```ts
beforeEach(() => {
  originalCwd = process.cwd();
  tempDir = mkdtempSync(join(tmpdir(), '<prefix>-'));
  execFileSync('git', ['init', '-q', tempDir]);
  process.chdir(tempDir);
  // Configure local user identity for commits without global config
  execFileSync('git', ['config', 'user.email', '<test>@test'], { cwd: tempDir });
  execFileSync('git', ['config', 'user.name', '<Test Name>'], { cwd: tempDir });
  // Optional: initial empty commit for HEAD reference
  execFileSync('git', ['commit', '--allow-empty', '-q', '-m', 'init'], { cwd: tempDir });
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(tempDir, { recursive: true, force: true });
});
```

Could be extracted to `tests/integration/helpers/temp-git-repo.ts` once a second integration test needs the same setup. Currently 1 instance; defer extraction.

**Why below threshold:** First instance. v854 is the first integration test in the gsd-skill-creator codebase that needs a real-git harness.

**Promotion gate:** 2nd instance of integration-test-needing-real-git-temp-repo.

**Likely classification:** Test-infrastructure pattern — would slot under Test authoring discipline ([docs/test-discipline/audit-method-corrections.md](../../test-discipline/audit-method-corrections.md) or a new test-discipline doc for integration-test scaffolding).

## Carried-forward codification-ready

- Stale-entry detection inverse-audit tool (v834 + v852, 2 instances) — UNCHANGED.

## No promotions this ship

v854 is verify-ship scope (per #10438), not codification scope.
