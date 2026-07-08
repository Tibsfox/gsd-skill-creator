/**
 * CI cross-platform matrix — parity + load-bearing drift-guard
 * (milestone v1.49.923; supersedes the v1.49.920 two-file ci-macos-parity guard).
 *
 * History: v1.49.920 stood up a SEPARATE `.github/workflows/ci-macos.yml` lane,
 * decoupled from the ship gate, guarded by a two-file parity test. v1.49.923
 * folded `macos-latest` into `ci.yml`'s `test` job as a `strategy.matrix` over
 * `os` and RETIRED `ci-macos.yml` (the documented promotion path), in the STAGED
 * form: the macOS leg carried `continue-on-error` so it ran on every push for
 * signal WITHOUT yet being load-bearing for the ship gate. v1.49.928 FLIPPED it to
 * load-bearing — the readiness gate (`tools/ci/macos-flip-readiness.mjs`) reached
 * 3/3 organic-churn greens, so the `continue-on-error` line was deleted and the
 * macOS leg now blocks a ship exactly like the ubuntu leg.
 *
 * This guard pins four load-bearing invariants (cross-ref #10461 gate-enforce-
 * every-runnable-surface + drift-guard pairing; two-layer-closure-discipline):
 *
 *   PARITY — because all OSes are legs of ONE job definition, they run the exact
 *     same steps by construction (no two-file drift is possible anymore). We still
 *     assert the matrix includes ubuntu-latest, macos-latest, AND a windows leg and
 *     that the job runs the full test-command set, so a future edit that drops an OS
 *     or a test invocation is caught. NOTE: the windows leg is PINNED to windows-2022
 *     (see WINDOWS-PIN below), so the assertion checks `windows-2022`, not the bare
 *     `windows-latest` label.
 *
 *   LOAD-BEARING — the macOS leg MUST NOT carry `continue-on-error` (the v1.49.928
 *     flip deleted it). The pre-tag-gate ci-gate reads the run-level conclusion, and
 *     with nothing masking the macOS leg, a macOS-only failure now blocks a ship
 *     exactly like an ubuntu failure. REVERTING to non-blocking — re-adding a
 *     `continue-on-error` gated on `matrix.os == 'macos-latest'`, or a step-level one
 *     that masks BOTH legs — is a DELIBERATE act that must also update this test. If
 *     someone re-stages it silently, this guard forces the conversation. The flip was
 *     driven by a deterministic readiness verdict (`node tools/ci/macos-flip-
 *     readiness.mjs` -> READY 3/3 across organic churn; release/docs ships do not count).
 *
 *   LOAD-BEARING-WINDOWS — v1.49.985 (Phase 4) folded `windows-latest` into the SAME
 *     matrix as a STAGED `continue-on-error: ${{ matrix.os == 'windows-latest' }}` leg;
 *     Phase-4 rung-3 (2026-06-06) FLIPPED it to load-bearing once `node tools/ci/
 *     windows-flip-readiness.mjs` reached READY 3/3 across organic churn — the gated
 *     line was deleted. So the test job must now carry ZERO `continue-on-error`: all
 *     three legs (ubuntu, macOS, windows) are ship-blocking. RE-STAGING windows
 *     (re-adding the windows-gated line) — or any job-unconditional / step-level COE
 *     that masks a leg — is the deliberate reverse act and MUST update this test; a
 *     silent re-stage fails here.
 *
 *   WINDOWS-PIN — (2026-06-15) the windows leg runs on `windows-2022`, NOT
 *     `windows-latest`. The hosted `windows-latest` image rolled to Visual Studio 18
 *     (2026), which the bundled node-gyp 11.5 cannot recognize ("find VS unknown
 *     version 'undefined' ...\Visual Studio\18\Enterprise"), so `npm ci`'s native
 *     tree-sitter build fails. node-gyp 11.5 is already the newest release (no upgrade
 *     to take — VS-18 support must land upstream first), so the leg is pinned to
 *     windows-2022 (VS 2022 / v17, which node-gyp builds against). This is an
 *     image pin, NOT a masking: the windows leg stays fully load-bearing (ZERO
 *     continue-on-error). Flip back to windows-latest once node-gyp ships VS-18
 *     support; that flip MUST update the PARITY assertion below.
 *
 *   RETIREMENT — `ci-macos.yml` must NOT exist. A re-created separate lane would
 *     re-introduce the `.[0]` run-selection ambiguity the v1.49.922 ci-gate pin
 *     fixed, and would duplicate the macOS coverage now living in the matrix.
 */
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = process.cwd();
const ci = readFileSync(join(REPO_ROOT, '.github/workflows/ci.yml'), 'utf8');

// Isolate the `test` job: from its header up to the NEXT top-level (2-space
// indented) job key — NOT to EOF. `test` happens to be the last job today, but
// bounding to the next job header means a future job appended after `test:`
// cannot leak into this view and cause a false pass/fail of the asserts below.
const testJobIdx = ci.indexOf('\n  test:\n');
const afterHeader = testJobIdx >= 0 ? ci.slice(testJobIdx + 1) : '';
const nextJobRel = afterHeader.search(/\n {2}[A-Za-z0-9_-]+:\n/);
const testJob = nextJobRel >= 0 ? afterHeader.slice(0, nextJobRel) : afterHeader;

// Extract the matrix `os:` list, e.g. `os: [ubuntu-latest, macos-latest]`.
const osListMatch = testJob.match(/os:\s*\[([^\]]*)\]/);
const osList = osListMatch ? osListMatch[1] : '';

// Isolate the `cargo` job the same way (CF4a, v1.49.936) — bounded to the next
// top-level (2-space) job header, or EOF if it is the last job.
const cargoJobIdx = ci.indexOf('\n  cargo:\n');
const cargoAfter = cargoJobIdx >= 0 ? ci.slice(cargoJobIdx + 1) : '';
const cargoNextRel = cargoAfter.search(/\n {2}[A-Za-z0-9_-]+:\n/);
const cargoJob = cargoNextRel >= 0 ? cargoAfter.slice(0, cargoNextRel) : cargoAfter;

describe('CI cross-platform matrix — parity + load-bearing drift-guard', () => {
  it('RETIREMENT — the separate ci-macos.yml lane no longer exists', () => {
    expect(existsSync(join(REPO_ROOT, '.github/workflows/ci-macos.yml'))).toBe(false);
  });

  it('ci.yml is push-triggered on main + dev (so the macOS leg gets per-push signal)', () => {
    expect(ci).toMatch(/^on:\n\s+push:\n\s+branches:\s*\[main, dev\]/m);
  });

  it('PARITY — the test job was located and is matrixed over the OS', () => {
    expect(testJob.length).toBeGreaterThan(0);
    expect(testJob).toMatch(/runs-on:\s*\$\{\{\s*matrix\.os\s*\}\}/);
    expect(testJob).toMatch(/strategy:/);
    expect(testJob).toMatch(/matrix:/);
  });

  it('PARITY — the matrix includes ubuntu-latest, macos-latest, AND a windows leg (pinned windows-2022)', () => {
    expect(osList).toContain('ubuntu-latest');
    expect(osList).toContain('macos-latest');
    // The windows leg is PINNED to windows-2022, NOT windows-latest: the hosted
    // `windows-latest` image rolled to Visual Studio 18 (2026), which the bundled
    // node-gyp 11.5 cannot recognize, breaking `npm ci`'s native tree-sitter build.
    // windows-2022 ships VS 2022 (v17) which node-gyp builds against. This assertion
    // is the drift-guard half of that pin — flipping back to windows-latest (once
    // node-gyp ships VS-18 support) is a DELIBERATE act that must update this line.
    expect(osList).toContain('windows-2022');
    expect(osList).not.toContain('windows-latest');
  });

  it('LOAD-BEARING — the macOS leg is ship-blocking (the staged continue-on-error is GONE)', () => {
    // v1.49.928 flip: the macOS-gated `continue-on-error` line was deleted, so the
    // macOS leg now contributes to the run-level conclusion the ship gate reads.
    // Re-adding it (reverting macOS to non-blocking) is the deliberate reverse act
    // and MUST update this test. A silent re-stage fails here.
    expect(testJob).not.toMatch(
      /continue-on-error:\s*\$\{\{\s*matrix\.os\s*==\s*'macos-latest'\s*\}\}/,
    );
  });

  it('LOAD-BEARING — the windows leg is ship-blocking (staged continue-on-error GONE; ZERO in the test job)', () => {
    // v1.49.985 staged windows with `continue-on-error: ${{ matrix.os == 'windows-latest' }}`.
    // Phase-4 rung-3 (2026-06-06) FLIPPED it to load-bearing: the gate (`node tools/ci/
    // windows-flip-readiness.mjs` -> READY 3/3 across organic churn) was met and the line
    // was deleted. Now ALL THREE legs (ubuntu, macOS, windows) are load-bearing, so the
    // test job must carry ZERO continue-on-error. Re-staging windows (re-adding the
    // windows-gated line), or any job-unconditional / step-level COE that masks a leg, is
    // the deliberate reverse act and MUST update this test — a silent re-stage fails here.
    expect(testJob).not.toMatch(
      /continue-on-error:\s*\$\{\{\s*matrix\.os\s*==\s*'windows-latest'\s*\}\}/,
    );
    const count = (testJob.match(/continue-on-error:/g) || []).length;
    expect(count).toBe(0);
  });

  it('LOAD-BEARING — fail-fast is disabled so neither leg cancels the other', () => {
    expect(testJob).toMatch(/fail-fast:\s*false/);
  });

  it('PARITY — the test job still runs the full test-command set', () => {
    // The three load-bearing test invocations mirrored from the pre-matrix job.
    expect(testJob).toContain('npx vitest run');
    expect(testJob).toContain('npx vitest run --config vitest.tools.config.mjs');
    expect(testJob).toContain('node tools/check-tools-test-coverage.mjs --run-node-test');
  });

  it('PARITY — the Grove arena fixture-gen prelude is present in the test job', () => {
    expect(testJob).toMatch(/import-filesystem-skills\.ts/);
  });
});

/**
 * CI cargo lane — LOAD-BEARING drift-guard (CF4a v1.49.936 staged → v1.49.939 flipped).
 *
 * The cargo lane is the FIRST CI job that compiles the Rust/Tauri crate. It was
 * introduced STAGED (the v1.49.923 macOS pattern, #10463): a separate job carrying a
 * job-level `continue-on-error` so it ran on every push for per-push Rust signal WITHOUT
 * being load-bearing for the ship gate. v1.49.939 FLIPPED it to LOAD-BEARING — the cargo
 * flip-readiness gate (`tools/ci/cargo-flip-readiness.mjs`, lane-stability model) reached
 * READY 3/3, so the job-level `continue-on-error` was DELETED and the cargo job (an
 * independent leaf, no `needs:`) now folds into the run-level conclusion the ship gate
 * reads. These asserts now pin the LOAD-BEARING property (the staged `continue-on-error`
 * is GONE) — mirroring the macOS pins above. RE-STAGING (re-adding a job- or step-level
 * `continue-on-error` to make the lane non-blocking again) is the deliberate reverse act
 * and MUST update this test; a silent re-stage fails here. The flip was driven by the
 * gate's deterministic READY verdict (release/docs greens count for cargo — every push
 * fully recompiles the crate — unlike the macOS organic-churn model).
 */
describe('CI cargo lane — load-bearing drift-guard (CF4a v1.49.936 → flipped v1.49.939)', () => {
  it('the cargo lane exists in ci.yml and runs on ubuntu-latest', () => {
    expect(cargoJob.length).toBeGreaterThan(0);
    expect(cargoJob).toMatch(/runs-on:\s*ubuntu-latest/);
  });

  it('LOAD-BEARING — the cargo lane is ship-blocking (the staged continue-on-error is GONE)', () => {
    // v1.49.939 flip: the job-level `continue-on-error: true` was DELETED, so the cargo
    // job's failure now folds into the run-level conclusion the ship gate reads. Re-adding
    // it (reverting the lane to non-blocking) is the deliberate reverse act and MUST update
    // this test. Anchored to a real YAML key (`\n<indent>continue-on-error:`) so the
    // explanatory comments that still quote `continue-on-error: true` do NOT satisfy the
    // match (the `#` breaks the `\n<ws>continue-on-error:` anchor) — a silent re-stage fails.
    expect(cargoJob).not.toMatch(/\n[ \t]+continue-on-error:[ \t]*true/);
  });

  it('INDEPENDENT — the cargo lane has no `needs:` key (a failure cannot move the run-level conclusion)', () => {
    // Per v1.49.923: an independent job-level continue-on-error job that FAILS still
    // yields run-level conclusion `success` UNLESS a `needs:[cargo]` downstream consumes
    // it. The ship ci-gate reads run-level, so the lane MUST stay a leaf. Anchored to a
    // real YAML key so the comment's prose mention of `needs:` is not a false positive.
    expect(cargoJob).not.toMatch(/\n[ \t]+needs:/);
  });

  it('INDEPENDENT (inverse) — no OTHER job consumes the cargo lane via `needs:`', () => {
    // The non-blocking guarantee also requires nothing DOWNSTREAM needs the cargo job:
    // a `needs: [..., cargo]` elsewhere would let the lane's failure fail that consumer
    // (and the run), making the lane load-bearing-by-proxy. Assert no `needs:` line
    // anywhere in ci.yml references cargo. (Scoped over the whole file, not just the job.)
    expect(ci).not.toMatch(/\n[ \t]+needs:[^\n]*\bcargo\b/);
  });

  it('SCOPE — the cargo lane runs `cargo test --no-default-features` on src-tauri', () => {
    // --no-default-features keeps the build minimal/explicit (cuda + postgres are
    // optional and already off — there is no `default` features list). The FULL command
    // string is asserted (not its fragments) so the comment's mention is not a match.
    expect(cargoJob).toContain('cargo test --no-default-features --manifest-path src-tauri/Cargo.toml');
  });

  it('PRELUDE — installs the Tauri webkit2gtk system deps before compiling', () => {
    // Tauri 2.x links webkit2gtk-4.1 on Linux; without the apt prelude the lane is
    // red-on-compile. Pins the dep so a silent removal is caught.
    expect(cargoJob).toContain('libwebkit2gtk-4.1-dev');
  });
});

/**
 * CI desktop lane — STAGED drift-guard (frontend build+test).
 *
 * Closes the desktop-frontend CI blind spot: the Tauri webview's ~84 vitest files plus
 * its `tsc && vite build` never ran in CI (the root vitest config excludes desktop/**,
 * and only the intelligence-ui project covered ~30 desktop/intelligence/ files). The
 * lane was introduced STAGED — a job-level `continue-on-error: true` — following the
 * cargo lane's staged→load-bearing promotion (v1.49.936 → v1.49.939): it runs on every
 * push for per-push frontend signal WITHOUT ship-blocking power while it proves itself.
 *
 * FLIP: after 3 consecutive green desktop runs across organic churn (lane-stability
 * model, like cargo — every push fully rebuilds the frontend), DELETE the
 * `continue-on-error: true` line so a desktop failure folds into the run-level
 * conclusion the ship gate reads. That flip is DELIBERATE and MUST invert the STAGED
 * assertion below (PRESENT → GONE) — a silent flip, or a silent removal of a build/test
 * step, fails here.
 */
// Isolate the `desktop` job the same way — bounded to the next top-level (2-space) job
// header, or EOF if it is the last job.
const desktopJobIdx = ci.indexOf('\n  desktop:\n');
const desktopAfter = desktopJobIdx >= 0 ? ci.slice(desktopJobIdx + 1) : '';
const desktopNextRel = desktopAfter.search(/\n {2}[A-Za-z0-9_-]+:\n/);
const desktopJob = desktopNextRel >= 0 ? desktopAfter.slice(0, desktopNextRel) : desktopAfter;

describe('CI desktop lane — staged drift-guard (frontend build+test)', () => {
  it('the desktop lane exists in ci.yml and runs on ubuntu-latest', () => {
    expect(desktopJob.length).toBeGreaterThan(0);
    expect(desktopJob).toMatch(/runs-on:\s*ubuntu-latest/);
  });

  it('SCOPE — the desktop lane installs, builds, and tests the webview', () => {
    // The three load-bearing frontend invocations. `run build` is `tsc && vite build`
    // (type-check + bundle); `run test` is the ~84-file jsdom vitest suite.
    expect(desktopJob).toContain('npm --prefix desktop ci');
    expect(desktopJob).toContain('npm --prefix desktop run build');
    expect(desktopJob).toContain('npm --prefix desktop run test');
  });

  it('STAGED — the desktop lane is non-blocking (continue-on-error: true is PRESENT)', () => {
    // Introduced STAGED to close the blind spot without ship-blocking power while it
    // proves itself. FLIPPING to load-bearing DELETES this line — a DELIBERATE act that
    // MUST invert this assertion to `.not.toMatch`. A silent flip fails here. Anchored to
    // a real YAML key so the explanatory comment prose does not satisfy the match.
    expect(desktopJob).toMatch(/\n[ \t]+continue-on-error:[ \t]*true/);
  });

  it('INDEPENDENT — the desktop lane has no `needs:` and nothing downstream needs it', () => {
    // While staged/non-blocking, the lane must stay an independent leaf: an independent
    // job's failure yields run-level `success` UNLESS a downstream `needs:[desktop]`
    // consumes it. Assert no `needs:` in the job and none referencing desktop anywhere.
    // Anchored to real YAML keys so comment prose is not a false positive.
    expect(desktopJob).not.toMatch(/\n[ \t]+needs:/);
    expect(ci).not.toMatch(/\n[ \t]+needs:[^\n]*\bdesktop\b/);
  });
});
