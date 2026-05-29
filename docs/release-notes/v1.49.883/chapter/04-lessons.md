# v1.49.883 — Lessons

## Promoted to ESTABLISHED in this ship (5 refinements)

The v868-v882 follow-on campaign accumulated 6 promotion-eligible candidates per the v882 retrospective. v883 promotes 5 of those 6; the 6th (`module-singleton`, 1 instance) holds at carry-forward in the #10448 catalog with an explicit anti-pattern note.

### #10445 — Spawn-site count as primary wire-shape predictor (NEW; refines #10444)

**Evidence (2 instances):**

| Ship | File | LOC | N | LOC-heuristic prediction | Actual shape |
|---|---|---|---|---|---|
| v1.49.872 | `cli/commands/pic2html.ts` | 311 | 1 | hoist-outside-Promise / closure-capture | hoist-at-top |
| v1.49.875 | `chipset/harness-integrity.ts` | 1440 | 1 | internal-helper / DI-executor | hoist-at-top |

Both ships used the simplest shape in the catalog because N=1, despite LOC bands that predicted richer shapes. N dominates LOC at the extremes; the LOC heuristic is the first-pass sort, the spawn-site count is the actual shape selector.

**Status:** PROMOTED to ESTABLISHED at v1.49.883. Codified in `docs/architecture-retrofit-patterns.md` under `## Discipline patterns` (new subsection after #10444). Updated header `**Codified at:**` and `## Lesson references` and `## Anti-pattern summary`. Manifest entry `Architecture-retrofit patterns` `key_lessons` extended (5 → 8 with #10445/#10447/#10448 all landed this ship).

**Codification target:** chip-ship effort estimation + wire-shape selection at the size-ascending second-pass. The first-pass sort is LOC (cheap, file-attribute-only); the second-pass shape selection requires opening the file and counting N.

**Cross-references:** #10444 (parent — size-ascending chip-pick), #10440 (do not accrete wrapper scaffolding to force a richer shape), #10433 (internal-helper shape for N≥3 with existing helper), #10441 (DI-executor shape for N≥3 with factory + injected executor).

### #10446 — Multi-catch helper for chokepoint denials (NEW; refines #10442)

**Evidence (~30 instances across v868-v882):**

Track 4 (ProcessContext, v870-v875): 24 re-throw instances across 6 chips (5 + 4 + 0 + 11 + 3 + 1).
Track 5 (EgressContext, v876-v881): 4 re-throw instances across 6 chips (1 + 1 + 1 + 1 + 0 + 0).
Plus the #10442 originating instances at v820 (`branch-manager.ts`) and v842 (`terminal.ts`).

Total ~28 per-catch single-class re-throws by v882 close. The boilerplate compounds across both ProcessContext + EgressContext chokepoint surfaces; centralization to one helper with one source-of-truth body is the operational productionization of #10442.

**Status:** PROMOTED to ESTABLISHED at v1.49.883. Codified in `docs/failure-mode-contracts.md` as new top-level section after #10442. Two forms documented: inline helper (`rethrowIfDenied(err)` at catch sites with bespoke reporting) and higher-order wrapper (`callOrRethrowDenial(fn)` for catch sites that collapse to `undefined`). Manifest entry `Failure-mode contracts` `key_lessons` extended (3 → 4).

**Codification target:** future LoaderContext chip-down when its campaign opens; the helper's body will gain `LoaderContextDenied` as a third re-throw line. Current Track 4+5 catch sites remain on the inline `if (err instanceof XContextDenied) throw err;` form; future ships migrating to the helper will pick the better form.

**Cross-references:** #10427 (parent — load-bearing-fails-loudly contract), #10442 (per-catch single-class re-throw that this generalizes), security-chokepoints (canonical home for the inline helper).

### #10447 — Router-with-conditional-bypass wire shape (NEW; refines #10444)

**Evidence (2 instances):**

| Ship | File | Router | Gated path | Bypassed path |
|---|---|---|---|---|
| v1.49.864 | `src/upstream-intelligence/git-collector.ts` | `collect()` | remote-clone branch | local-copy branch |
| v1.49.880 | `src/mcp/skill-installer.ts` | `installSkill()` | `installFromRemote()` | `installFromLocal()` |

Both ships kept the router unchanged; both threaded `ctx?` only into the gated path; both kept the bypassed path's signature unchanged. The chokepoint scope is a property of the destination branch (one branch performs egress, the other doesn't), not of the router itself.

**Status:** PROMOTED to ESTABLISHED at v1.49.883. Codified in `docs/architecture-retrofit-patterns.md` under `## Discipline patterns` (new subsection after #10445).

**Codification target:** future chip-down ships where a router branches between scope-distinct paths (LoaderContext + EgressContext common case; future Tier-E chokepoint expansion to broader patterns). The shape is a structural property; pre-naming it prevents the anti-pattern of threading `ctx` symmetrically into bypassed branches.

**Cross-references:** #10440 (router IS the production caller that narrows scope per branch), #10444 (router-with-conditional-bypass is a new entry in the wire-shape catalog), Security chokepoints (LoaderContext + EgressContext + ProcessContext are scope-distinct chokepoints that compose with router branches).

### #10448 — Shared-helper hoist sub-variant catalog (NEW; refines #10444)

**Evidence (12-chip cluster v868-v882 + 5+ distinct sub-variants):**

The catalog (codified in the table below) emerged across 12 chip ships without explicit variant-coverage planning, validating #10444's "size-ascending reveals diversity" claim at a second cluster scale.

| Sub-variant | Hoist location | First instance | Best fit |
|---|---|---|---|
| hoist-at-top | Top of entry function, OUTSIDE try/catch | v1.49.872 (N=1) | Single spawn/fetch site; high-LOC orchestrations with N=1. |
| two-site hoisted-check | Each of N sibling sites gets its own hoist | v1.49.876 (N=2) | N=2 sibling sites without a shared helper. |
| class-instance two-site | `ctx?` on instance field; methods hoist | v1.49.878 (N=2 methods) | Class-based file with multiple methods performing the gated op. |
| internal-helper-method | Private method on class wraps op | v1.49.870 (N=7) | Class with many sibling spawn-calls behind a private helper. |
| module-internal-helper | Free-function helper at module scope | v1.49.873 (N=12) | Module with a free-function helper; high N benefits from 1-LOC-per-callsite. |

Plus also-ran sub-variants: closure-capture (v1.49.871), safeExecFile wrapper (v1.49.874 — cross-ref #10449), and an explicit carry-forward note for `module-singleton` (v1.49.881, 1 instance below promotion bar).

Track 5 wire-shape table appended within the lesson body (parallel to the Track 4 retrospective table — addresses the v882-retro audit-flagged gap).

**Status:** PROMOTED to ESTABLISHED at v1.49.883. Codified in `docs/architecture-retrofit-patterns.md` under `## Discipline patterns` (new subsection after #10447). Sub-variant selection is N-driven (composes with #10445).

**Codification target:** every future chip-down ship's wire-shape decision. Operators consult the catalog to pick the shape rather than re-deriving; the catalog vocabulary becomes shared across release notes.

**Cross-references:** #10444 (parent — wire-shape diversity claim that this catalog substantiates), #10445 (companion — N-driven sub-variant selection), #10433 (internal-helper-method and module-internal-helper sub-variants), #10441 (DI-executor as another shape adjacent to but outside this catalog).

### #10449 — execFile vs shell-exec audit target accuracy (NEW; refines #10427)

**Evidence (2 instances):**

| Ship | File | Form before | Form after | Audit fidelity gain |
|---|---|---|---|---|
| v1.49.853 | `src/upstream-intelligence/git-collector.ts` | `exec("git clone ...")` audit `sh` | `execFile("git", ["clone", ...])` audit `git` | Direct git invocation distinguishable from shell-mediated callers. |
| v1.49.874 | `src/learn/acquirer.ts` | `exec(cmdString)` audit `sh` | `safeExecFile(binary, argv)` audit `<binary>` | 9 spawn sites now record their actual binary targets instead of all reading `sh`. |

Both ships replaced shell-mediated execution with direct-exec and gained audit-fidelity for the actual binary target. Neither lost required shell semantics — both commands were static binary invocations that did not need shell features.

**Status:** PROMOTED to ESTABLISHED at v1.49.883. Codified in `docs/security-chokepoints.md` as new top-level section after #10441. Manifest entry `Security chokepoints` `key_lessons` extended (5 → 6).

**Codification target:** every new ProcessContext wire that has a choice between `exec` and `execFile`. The default ship shape SHOULD be direct-exec; shell-exec remains appropriate only when the command genuinely requires shell features (pipes, globs, redirection, variable expansion).

**Cross-references:** #10427 (parent — audit fidelity is a property of the load-bearing audit surface), #10441 (DI-executor + tokenized-argv — tokenization is the structural prerequisite), #10433 (internal-helper pattern — safeExecFile is an internal-helper-with-wrapper variant combining tokenize + direct-exec + ensureProcessAllowed).

## Sustained observations (no change this ship)

### #10428 — Counter-cadence/meta-cadence

**Status:** SUSTAINED. v883 is the 15th codify-axis ship since v868, 5 ships past the #10428 7-10 ship upper bound. Acceptable to flex when the active campaign accumulates candidates; v868 was 11 ships past v857 (1 over the band) — the codify-cadence floor is the harder constraint than the ceiling. Codify-on-demand still beats codify-on-schedule.

### #10444 — Size-ascending chip-pick reveals wire-shape diversity

**Status:** SUSTAINED. v883 refines #10444 in three places (#10445 N-driven shape selector + #10447 router shape entry + #10448 sub-variant catalog). The parent lesson holds; the refinements expand its operational depth. Two-cluster evidence at v868 + 12-chip cluster confirmation at v882.

### #10442 — Re-throw ProcessContextDenied from CLI swallow-catch

**Status:** SUSTAINED. v883's #10446 multi-catch helper generalizes #10442 to handle ProcessContext + EgressContext together; the per-catch re-throw discipline is unchanged, the cross-class helper centralizes the boilerplate.

### #10427 — Forensic/dashboard/observability surfaces fail silently

**Status:** SUSTAINED. v883's #10449 refines #10427's audit-fidelity component (direct-exec produces a more useful audit record than shell-exec); the load-bearing-vs-accessory contract is unchanged.

### #10432 — KNOWN_UNWIRED ratchet-ledger

**Status:** SUSTAINED. Both Process + Egress KNOWN_UNWIRED held at 0 across the v868-v882 campaign close; the codify ship codifies the discipline that emerged FROM the migration without changing the migration-debt-ledger state itself.

## Forward observations (below promotion threshold)

### Module-singleton wire shape (1 instance)

**Surface ship:** v1.49.881 (`src/intelligence/ipc.ts`).

A `setIpcEgressContext(ctx)` setter writes a module-level singleton; `invoke()` reads it before its single fetch. Avoids threading `ctx?` through ~20 exported wrapper functions. Appropriate for N=1 high-wrapper-count files; anti-pattern for N≥2 or low-wrapper-count files (inverts the optional-`ctx?` discipline #10414 by moving chokepoint state into module-level mutable state).

**Below threshold (1 instance).** Documented as explicit carry-forward in #10448's anti-pattern note AND as a row in the Track 5 wire-shape table. If a second instance surfaces in a future ship, promote to the #10448 sub-variant table proper.

### Audit-fidelity inline-literal extraction (1 instance)

**Surface ship:** v1.49.872 (`cli/commands/pic2html.ts`).

Inline shell scripts (e.g., a magick command-line built as a template literal) get extracted to a local `const` for hoist+spawn audit fidelity. The audit record then names the actual binary; the hoist's `ensureProcessAllowed` call uses the same `const` for the allow-list check.

**Below threshold (1 instance).** Watch for a second instance — likely whichever future ship migrates an inline-template shell-exec to direct-exec under #10449 discipline. The pattern composes with #10449 (audit target accuracy) but is structurally distinct (a refactor pattern, not a shape choice).

### Fake-fixture test pattern (3 instances, but cross-cutting)

**Surface ships:** v1.49.872 + v1.49.874 + v1.49.875.

`fake.png` / `fake.zip` fixtures with correct extension; the wire check (`ensureProcessAllowed`) fires before the spawn would fail on the malformed content. Lets the audit-test fire without requiring a real test asset.

**Below threshold for chokepoint codification (cross-cutting test discipline).** Belongs in `docs/test-discipline/` not chokepoint docs. Carry as observation; promote to test-discipline docs when a 4th-or-later instance surfaces and the pattern fits the test-discipline canonical surface.

### Tools-detecting-silent-failures must themselves fail loudly (1 instance)

**Surface ship:** v1.49.867 (cross-audit tool parser bug; carried forward from v868 retro).

The v857 cross-audit tool's parser had a vacuous-true failure mode (regex hit different content than intended; reported 0 entries; "clean" by silent error). Hardened in-flight at v867 with a sanity-check assertion comparing structural-view count against actual file enumeration.

**Below threshold (1 instance).** Carry as observation. A second instance — another tool designed to surface silent-vs-loud asymmetry that itself fails silently — would promote.

### Codify-ship duration scales with composition (data point #4)

**Surface ships:** v1.49.847 + v1.49.857 + v1.49.868 + v1.49.883.

Per-codify wall-clock data: v847 5 lessons ~60-75 min; v857 1 lesson + tool ~50-60 min; v868 1 new + 1 refinement ~25-30 min; v883 5 refinements ~40-50 min. Revised model: `~7-12 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file`, with marginal cost dropping when lessons share a doc anchor.

**Below threshold (inconsistent units across data points).** Validate at next codify ship (likely v900+) before considering promotion.

## What's NOT changed this ship

- NASA degree: 1.178 (UNCHANGED — 101 consecutive ships at this widest pressure-margin record).
- Counter-cadence count: 6 (UNCHANGED — codify ships are forward-cadence, not counter-cadence).
- KNOWN_UNWIRED Process: 0 (UNCHANGED — chokepoint fully wired since v875).
- KNOWN_UNWIRED Egress: 0 (UNCHANGED — chokepoint fully wired since v881).
- Wired calibratable thresholds: 5 of 7 (UNCHANGED).
- Operational axes: 4 (UNCHANGED).
- Pre-tag-gate step count: 18 (UNCHANGED — v869's cross-audit gate remains the last step).
