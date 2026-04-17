# v1.49.7 — Optional tmux with Graceful Degradation

**Released:** 2026-03-01
**Scope:** runtime tmux detection, raw-PTY fallback, service-graph optional dependencies across Rust + TypeScript + shell + packaging
**Branch:** dev → main
**Tag:** v1.49.7 (2026-03-01T09:36:30-08:00)
**Commits:** v1.49.6..v1.49.7 (1 commit: `c500ec063`)
**Files changed:** 17 (+242 / −98)
**Predecessor:** v1.49.6 — macOS Compatibility & Dependency Hardening
**Successor:** v1.49.8
**Classification:** feature — optional-dependency contract across language boundaries
**Upstream issue:** PR #24 (@PatrickRobotham) — ENOENT crash when tmux absent
**Verification:** 5 Rust launcher/registry tests updated · cross-platform detection (`command -v` / `where.exe`) · bootstrap flow continues on optional failure · shell scripts guard tmux calls

## Summary

**An undocumented hard dependency on tmux crashed GSD-OS with a raw ENOENT on machines that didn't have it installed.** PR #24 from @PatrickRobotham reported that the desktop stack assumed tmux as an invariant of the environment — the launcher would try to spawn the Tmux service during startup, the spawn would fail with `ENOENT` because the binary wasn't on `PATH`, and the error would bubble up as an opaque kernel-level no-such-file-or-directory without any indication of what was missing or that the user could do anything about it. tmux is the right default where it exists — session multiplexing, detach/reattach, scrollback, the whole inherited-Unix toolkit — but it is not the only way to run a terminal, and most macOS users, many minimal Linux installs, and essentially all Windows users will not have it. v1.49.7 fixes the contract: tmux is now a recommended-but-optional service, every call site has a fallback path, and the service graph knows the difference between a hard dependency and a soft one.

**The fix crosses four language boundaries and stays honest at every one of them.** Rust changes in `src-tauri/src/services/types.rs` added an `optional: bool` field to `ServiceDef`, so the orchestration layer can reason about which services are load-bearing and which are nice-to-have. `src-tauri/src/services/registry.rs` marked the Tmux service optional and corrected a long-standing Rust/TypeScript divergence in FileWatcher's dependency list. `src-tauri/src/services/launcher.rs` learned to skip optional dependencies in `start_service` and `start_all` rather than treating a missing optional as a fatal startup error. TypeScript changes in `desktop/src/main.ts` added a raw-PTY fallback when tmux isn't available; `desktop/src/pipeline/bootstrap-flow.ts` handles optional service failures by lighting a grey LED and continuing rather than aborting the launch. Shell-script changes in `scripts/bin/gsd-stack` and `scripts/check-prerequisites.sh` guard every tmux invocation with `command -v tmux` and demote tmux from required to optional in the prerequisites check. Packaging changes in `packaging/debian/control` and `packaging/rpm/gsd-os.spec` document tmux as recommended rather than required so the distro-level dependency solver matches what the app actually needs.

**Runtime detection beats build-time feature flags when the target environment is heterogeneous.** The alternative design — ship two builds, one `with-tmux` and one `without-tmux` — would have doubled CI cost, doubled the release matrix, and forced users to pick the right artifact before they had any reason to know what tmux was. Runtime detection via `command -v tmux` on Unix and `where.exe tmux` on Windows means the same binary works everywhere, and the "do we have tmux" decision happens at the moment it matters (when the terminal is about to open) rather than at the moment it doesn't (when the download URL was chosen). `src-tauri/src/tmux/detector.rs` is the cross-platform detection module; `src-tauri/src/lib.rs` gates the tmux monitor and auto-detect on the detector's result so the monitor loop doesn't start spinning against a non-existent binary.

**The FileWatcher dependency correction caught a Rust/TypeScript graph divergence that had been silently wrong.** The service graph in Rust declared `FileWatcher.deps = [Tmux]` while the equivalent TypeScript graph declared `FileWatcher.deps = []`. That mismatch meant Rust-side orchestration would wait for tmux before starting the file watcher while TypeScript-side orchestration wouldn't, so the same logical graph produced two different startup orders depending on which side was driving. The correct answer is `[]` — FileWatcher doesn't actually depend on tmux — and fixing it in Rust brought the two sides back into agreement. Five Rust launcher/registry tests needed updating to match the corrected graph, which is itself evidence that the tests were anchored to the wrong graph and the fix was load-bearing.

**tmux_ensure_session returns a clear error instead of a raw ENOENT now.** Before the patch, if the desktop tried to ensure a tmux session when tmux wasn't installed, the user would see the Unix-level "No such file or directory" string with no context. After the patch, `src-tauri/src/commands/tmux.rs` checks the detector first and returns a message the UI can render meaningfully — "tmux is not installed on this system; the terminal will use a raw PTY" — so the failure mode is informative rather than cryptic. Paired with the try/catch wrapper that v1.49.3 put around `createTmuxTerminal`, the failure path is now fully instrumented from kernel to pixel.

**Bootstrap flow now distinguishes between "this failed and we can continue" and "this failed and we must stop."** `desktop/src/pipeline/bootstrap-flow.ts` previously treated every service failure as terminal: if anything in the startup sequence returned an error, the whole flow aborted and the user saw a stuck splash. The new logic checks whether the failing service is optional; if it is, the UI lights a grey LED for that service (meaning "unavailable, not broken") and continues to the next step. This is the right shape because it surfaces the degraded mode visibly — the user can see exactly which services aren't running — without pretending everything is fine and without refusing to launch over a non-essential gap.

**The shell-level guards matter because the Rust service graph isn't the only entry point.** Users who run `scripts/bin/gsd-stack` directly, or whose CI invokes `scripts/check-prerequisites.sh`, bypass the desktop service orchestration entirely. Before the patch, those scripts assumed tmux on `PATH` and would fail silently or noisily depending on the shell's `set -e` discipline. After the patch, every tmux invocation is guarded with `command -v tmux` and the prerequisites check demotes tmux from required to optional — so the CLI surface matches the desktop surface and there is no path where the assumption reappears.

**Packaging descriptions now match runtime behavior.** Debian and RPM packaging previously declared tmux as a hard dependency in `packaging/debian/control` and `packaging/rpm/gsd-os.spec`, meaning the distro-level dependency solver would refuse to install GSD-OS on systems that didn't have tmux or that couldn't install it. Changing `Depends:` to `Recommends:` in Debian terms (and the RPM equivalent) tells the packaging ecosystem the truth: tmux is nice to have, the app works without it, and the solver shouldn't block installation over its absence. This is a small two-line change per file, but it's the difference between "the app won't install" and "the app installs and tells you what it can't do."

**This release is the template for every future optional-dependency fix in the project.** The pattern — add an `optional` flag to the service-graph type, teach the launcher to skip optional deps, add a runtime detector with cross-platform probes, wrap call sites with the detector result, update shell guards, update packaging — is reusable for every external tool the system touches. Redis, PostgreSQL, ChromaDB, specific CLI tools, specific model backends: any of them could be the next "undocumented hard dependency" report, and the answer will follow this shape. Shipping the pattern as a complete cross-boundary implementation rather than a one-off Rust-only patch is what makes it load-bearing for the work that follows.

## Key Features

| Area | What Shipped |
|------|--------------|
| Service graph types | Added `optional: bool` field to `ServiceDef` in `src-tauri/src/services/types.rs`; orchestration layer can now distinguish hard from soft dependencies |
| Service registry | Marked Tmux service optional in `src-tauri/src/services/registry.rs`; corrected FileWatcher deps from `[Tmux]` to `[]` (Rust/TypeScript graph parity) |
| Launcher | `start_service` and `start_all` in `src-tauri/src/services/launcher.rs` now skip optional deps rather than treating absence as fatal |
| Desktop terminal | `desktop/src/main.ts` falls back to raw PTY when tmux is unavailable; no more blank terminal on non-tmux systems |
| Bootstrap flow | `desktop/src/pipeline/bootstrap-flow.ts` handles optional service failures with grey LED + continue rather than aborting launch |
| Cross-platform detection | `src-tauri/src/tmux/detector.rs` uses `command -v` on Unix and `where.exe` on Windows; same binary works everywhere |
| Runtime gating | `src-tauri/src/lib.rs` gates tmux monitor + auto-detect loop on detector result (no spin against non-existent binary) |
| Error clarity | `src-tauri/src/commands/tmux.rs` `tmux_ensure_session` returns informative error instead of raw ENOENT |
| Claude session | `src-tauri/src/claude/session.rs` gated tmux-dependent paths on detector availability |
| PTY commands | `src-tauri/src/commands/pty.rs` handles PTY path when tmux is absent |
| Shell script guards | `scripts/bin/gsd-stack` wraps tmux invocations with `command -v tmux`; 25 lines touched |
| Prerequisites check | `scripts/check-prerequisites.sh` demotes tmux from required to optional; warns but does not fail |
| Debian packaging | `packaging/debian/control` moves tmux from `Depends:` to `Recommends:` |
| RPM packaging | `packaging/rpm/gsd-os.spec` makes tmux a soft dependency |
| Test coverage | 5 Rust tests updated in `launcher_tests.rs` and `registry_tests.rs` for corrected graph structure |

## Retrospective

### What Worked

- **Runtime detection over build-time feature flags.** Using `command -v` on Unix and `where.exe` on Windows means the same binary works regardless of what's installed; no separate `with-tmux` and `without-tmux` build artifacts, no CI matrix doubling, no user-facing "pick the right download" decision.
- **FileWatcher dependency correction caught a Rust/TypeScript graph divergence.** FileWatcher declared `[Tmux]` as a dependency in Rust but `[]` in TypeScript. Fixing this in the same patch keeps the service-graph contract honest across language boundaries — the five test updates are direct evidence the divergence was load-bearing.
- **The `optional: bool` flag on `ServiceDef` is the reusable primitive.** Before the patch there was no way for the service graph to express "this is nice to have, skip if missing." Adding the flag once lets every future optional-service fix follow the same pattern — one field, one launcher check, one detector probe.
- **Cross-stack coverage landed in a single commit.** Rust types, Rust registry, Rust launcher, TypeScript main, TypeScript bootstrap, shell scripts, prerequisites, Debian packaging, RPM packaging, and test updates all in one commit means no intermediate state where only some layers agree.
- **Packaging changes matched runtime behavior.** Debian `Recommends:` and the RPM equivalent mean the distro-level solver tells the truth about the dependency, so users don't get blocked at install time over something the app can run without.
- **The PR came with a concrete reproduction.** @PatrickRobotham's PR #24 had the raw ENOENT trace, which pointed at `tmux_ensure_session` directly and made the scope of the fix obvious from the start.

### What Could Be Better

- **This should have been part of v1.49.6 (macOS compatibility).** The tmux-optional work is a natural companion to the Bash 3.2 macOS fixes in v1.49.6 — both are about making the system work on environments that don't have Linux-centric tooling. Shipping them separately cost a user-visible crash between releases.
- **The Rust/TypeScript graph divergence predates this release by an unknown margin.** FileWatcher declared `[Tmux]` in Rust while TypeScript declared `[]`, and no test caught it until the tmux-optional work forced the corrected graph. A cross-language service-graph equivalence test would have caught this earlier.
- **tmux was assumed as an invariant of the dev environment.** Every developer on the project had tmux installed, so the dependency was invisible until an external user (PR #24) hit it. Opinionated tooling that matches the team's dev setup creates blind spots for users with different setups.
- **The packaging `Depends:` → `Recommends:` change was a two-line fix that should not have taken until v1.49.7.** Packaging is traditionally the last thing anyone looks at; it's also the first thing a new user encounters. Packaging manifests deserve the same scrutiny as source code.
- **No integration test exercises the "tmux is missing" path end-to-end.** The five updated Rust tests cover the service-graph logic, but there's no test that actually removes tmux from `PATH` and runs the desktop bootstrap to verify the degraded-mode UX. That's the gap the next optional-dependency fix should close before it ships.

## Lessons Learned

- **Every external tool dependency should have a fallback path.** tmux, like any CLI tool, may not be installed on the target system. The raw-PTY fallback pattern in `desktop/src/main.ts` is reusable for any optional external dependency — the shape is detect, branch, degrade gracefully, surface the degraded state to the user.
- **Dependency graphs must be identical across language boundaries.** When Rust and TypeScript both model the same service dependency graph, divergences are silent bugs that corrupt orchestration logic. FileWatcher declared `[Tmux]` in one side and `[]` in the other for an unknown length of time; the startup order was silently wrong depending on which side was driving.
- **Optional dependencies need a first-class type, not a convention.** Adding `optional: bool` to `ServiceDef` is load-bearing because it lets the launcher reason about what "dependency failed" means. Without the flag, every skip-or-fail decision would have to be encoded ad hoc at every call site.
- **Runtime detection scales across platforms; build-time feature flags don't.** `command -v` on Unix and `where.exe` on Windows are standard, cheap, and idempotent. Build-time features would require a CI matrix, separate artifacts, and a mechanism for users to pick the right one — all of which are expensive relative to a one-line runtime probe.
- **Packaging descriptions are the contract with the distro solver.** Debian `Depends:` and the RPM equivalent tell the package manager whether the app can install without the dep. Changing them from hard to soft is a two-line fix that's the difference between "the app won't install" and "the app installs and tells you what it can't do."
- **Opinionated dev environments create blind spots.** Every developer on the project had tmux installed, so the hard dependency was invisible until an external user reported it. Deliberately running the stack on a minimal environment before release would have caught this; adding minimal-env CI is the structural fix.
- **Default-deny error paths force honest fallbacks.** Returning a clear error from `tmux_ensure_session` instead of letting the raw ENOENT bubble is the same discipline as Tauri v2's default-deny capability model from v1.49.3 — making failure modes loud and informative rather than silent and opaque.
- **Cross-stack fixes should land in a single commit when possible.** The 17-file, 242-insertion commit for v1.49.7 kept every layer in agreement from the first moment the patch existed. Splitting it into "Rust patch, then TypeScript patch, then packaging patch" would have produced an intermediate state where only some layers agreed, which is worse than the original bug.
- **The `Recommends:` relationship is the right default for developer tooling deps.** Unless the app literally cannot function without a dep, packaging should express the dep as recommended. `Depends:` is for things without which the binary won't run at all; everything else is `Recommends:` or `Suggests:`.
- **External PRs are the best source of environment diversity.** The project's contributors collectively cover more OSes, shells, and install patterns than any internal CI matrix. PR #24 from @PatrickRobotham did more to expose this bug than any internal test could have, because his environment wasn't the team's.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.6](../v1.49.6/) | Predecessor — macOS Compatibility & Dependency Hardening; the Bash 3.2 fixes are thematic siblings to the tmux-optional work and should have shipped together |
| [v1.49.8](../v1.49.8/) | Successor — continues the v1.49.x polish line after the optional-dependency pattern is established |
| [v1.49.3](../v1.49.3/) | First-run polish patch that added the try/catch wrapper around `createTmuxTerminal`; this release completes that failure-path instrumentation with an informative error upstream |
| [v1.49.2](../v1.49.2/) | Earlier v1.49.x patch that added desktop indicator wiring; the grey-LED-on-optional-failure behavior in bootstrap-flow.ts extends that model |
| [v1.49.0](../v1.49.0/) | Parent mega-release where GSD-OS first shipped and where the tmux dependency was originally introduced |
| [v1.49](../v1.49/) | Consolidated mega-release notes for the v1.49 line |
| [v1.21](../v1.21/) | GSD-OS Desktop Foundation — original Tauri shell and PTY terminal where tmux became the implicit default |
| [v1.0](../v1.0/) | Foundation — the 6-step adaptive loop and bounded-parameter philosophy the optional-service pattern inherits from |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG that this release extends with the `optional` primitive |
| [v1.24](../v1.24/) | GSD Conformance Audit — cross-language parity checks that FileWatcher's Rust/TypeScript divergence escaped |
| `src-tauri/src/services/types.rs` | New `optional: bool` field on `ServiceDef` |
| `src-tauri/src/services/registry.rs` | Tmux marked optional; FileWatcher deps corrected |
| `src-tauri/src/tmux/detector.rs` | Cross-platform detection probe |
| `desktop/src/pipeline/bootstrap-flow.ts` | Grey-LED-on-optional-failure UX |
| `scripts/check-prerequisites.sh` | Prerequisites check demotes tmux to optional |
| `packaging/debian/control` + `packaging/rpm/gsd-os.spec` | Packaging manifests updated to `Recommends:` |
| PR #24 (@PatrickRobotham) | Upstream issue that triggered the release |

## Engine Position

v1.49.7 is the first release in the v1.49.x line to formalize the optional-dependency contract across every layer of the stack. Every later release that touches external tool dependencies inherits this pattern: the `optional: bool` flag on `ServiceDef`, the runtime-detection module shape in `tmux/detector.rs`, the `command -v` / `where.exe` cross-platform probe, the grey-LED degraded-mode UX in bootstrap-flow.ts, the `Recommends:` packaging posture, and the cross-language graph-parity discipline forced by the FileWatcher correction. Looking forward from v1.49.7, any future "this tool is assumed but not everyone has it" report — Redis, PostgreSQL, ChromaDB, specific model backends, domain-specific CLI tools — follows this template rather than inventing a new shape. Looking back, v1.49.7 closes the loop on the Tauri v2 migration work of v1.49.2 and v1.49.3: those patches made first-run failure modes loud and informative at the UI layer, and this release does the same at the service-graph and packaging layers. The pattern is now complete from kernel syscall (ENOENT) through service orchestration (launcher skip) through UI state (grey LED) through distro installer (`Recommends:`) — a single honest contract, traceable end to end.

## Files

- `src-tauri/src/services/types.rs` — added `optional: bool` field to `ServiceDef` (+9 lines)
- `src-tauri/src/services/registry.rs` — marked Tmux optional; corrected FileWatcher deps from `[Tmux]` to `[]` (+16 lines / −6 lines)
- `src-tauri/src/services/launcher.rs` — `start_service` and `start_all` skip optional deps (+25 lines)
- `src-tauri/src/services/tests/launcher_tests.rs` — 5 tests updated for corrected graph (+53 lines / −26 lines)
- `src-tauri/src/services/tests/registry_tests.rs` — tests updated for new `optional` field (+14 lines)
- `src-tauri/src/tmux/detector.rs` — cross-platform detection probe (`command -v` / `where.exe`) (+12 lines)
- `src-tauri/src/commands/tmux.rs` — `tmux_ensure_session` returns clear error instead of raw ENOENT (+10 lines)
- `src-tauri/src/commands/pty.rs` — PTY command handles tmux-absent path (+8 lines)
- `src-tauri/src/claude/session.rs` — Claude session gated on detector availability (+12 lines)
- `src-tauri/src/lib.rs` — tmux monitor + auto-detect gated on detector result (+65 lines / −27 lines)
- `src-tauri/Cargo.lock` — dependency lockfile refresh (+2 lines)
- `desktop/src/main.ts` — raw-PTY fallback when tmux unavailable (+22 lines)
- `desktop/src/pipeline/bootstrap-flow.ts` — optional service failures → grey LED + continue (+38 lines)
- `scripts/bin/gsd-stack` — `command -v tmux` guards on every tmux call (+25 lines)
- `scripts/check-prerequisites.sh` — tmux demoted from required to optional (+11 lines)
- `packaging/debian/control` — tmux moved from `Depends:` to `Recommends:` (+9 lines / −3 lines)
- `packaging/rpm/gsd-os.spec` — tmux as soft dependency (+9 lines / −3 lines)

Aggregate: 17 files changed, 242 insertions, 98 deletions, single commit `c500ec063`.
