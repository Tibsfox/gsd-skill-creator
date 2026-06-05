# Shelfware Verdicts

Per-module wire-or-retire decisions for modules surfaced as test-only by
`tools/adoption-scan.mjs`. A verdict is a one-time decision that takes a
default-OFF substrate module out of the "is this shelfware?" bucket and
records the reasoning in a durable, auditable form.

Established by **T1.2 ship 3/3 (AUDIT-2026-05-26)** at v1.49.789.

---

## Why a per-module verdict log

The adoption telemetry shipped at v1.49.786 + v1.49.787 surfaces shelfware
candidates but does not by itself resolve them. The v786 baseline found
that 6/6 modules in the Math Foundations Refresh (v1.49.572) cluster were
test-only:

- `coherent-functors`
- `hourglass-persistence`
- `koopman-memory`
- `semantic-channel`
- `tonnetz`
- `wasserstein-hebbian`

All six ship default-OFF opt-in flags + HARD-preservation invariants — so
"0 real callers" is intentional substrate, not a bug. The adoption scanner
correctly flags them as test-only; the verdict log records what the
operator decides to do about each, with provenance and reasoning so future
audits inherit the context.

## Verdict types

| Verdict | Effect on the module | Effect on adoption scan |
|---------|---------------------|-------------------------|
| `WIRED` | Module gains ≥1 real (non-test) caller in `src/` / `tools/` / `scripts/` / `src-tauri/` / `desktop/` that respects the opt-in flag. Module remains default-OFF; HARD-preservation invariants must hold. | Status flips `test-only` → `living` on next scan; no allowlist entry needed. |
| `RETIRED` | Module + tests + namespace registrations removed. Companion docs note the retirement and what (if anything) replaced the artifact's purpose. | Module disappears from the scan entirely. |
| `ALLOWLISTED` | Module is intentionally test-only — e.g., a reference implementation, a documentation backing artifact, or a CLI-only surface that the static scanner can't see. | Entry added to `tools/adoption-scan.allowlist.json` with `reason`, `addedAt`, `addedBy`. Status flips `test-only` → `living (allowlisted)`. |

## Verdict format

Each verdict is one row in the table below. The reasoning column should be
short (≤2 sentences) and point to the durable artifact that backs the
decision — a release-notes file, a PROJECT.md GAP closure, an allowlist
entry, or the deletion commit.

## Verdicts

| Module | Verdict | Ship | Backing artifact | Reasoning |
|--------|---------|------|------------------|-----------|
| `semantic-channel` | WIRED | v1.49.789 | `src/cli/commands/dacp-drift-check.ts`; `.planning/PROJECT.md` GAP-6 row | Exposed the read-only adapter, capacity bound, and advisory drift checker through the existing `skill-creator dacp` CLI namespace as a new `drift-check`/`dc` subcommand. First operator-visible surface for the GAP-6 closure artifact; HARD-preservation invariants intact (read-only adapter, advisory-only exit codes, default-OFF opt-in flag). |
| `tonnetz` | ALLOWLISTED | v1.49.791 | `tools/adoption-scan.allowlist.json` `tonnetz` entry | Substrate-level reference implementation for the SoPS (Sound of Puget Sound) surface per arXiv:2604.19960 (Boland 2026, MATH-20 Phase 752). The SoPS mapping is the substrate; ALLOWLIST rather than RETIRE because the substrate is preserved, not filtered out. Default-OFF + G6 standard CAPCOM preservation invariants intact. |
| `wasserstein-hebbian` | ALLOWLISTED | v1.49.791 | `tools/adoption-scan.allowlist.json` `wasserstein-hebbian` entry; `docs/substrate-references/wasserstein-hebbian.md` | Substrate-level runtime backing for the canonical reader's reference to arXiv:2604.16052 (Tan 2026, 75pp, MATH-19 Phase 751). Companion to the substrate doc; advisory-only audit-finding emitter; CAPCOM retains gate authority. |
| `koopman-memory` | WIRED | v1.49.792 | `src/cli/commands/koopman-check.ts` | Exposed the three advisory retention invariants (`checkIdentityRetention`, `checkZeroInputRetention`, `checkLipschitzBound`) plus operator construction + spectral-data through a new top-level `skill-creator koopman-check`/`kc` CLI. Three-tier output (text/quiet/JSON). HARD-preservation invariants intact: `src/memory/` runtime untouched; only `import type` references; G8 HARD-preservation gate preserved; advisory-only exit-code 0 invariant. |
| `coherent-functors` | WIRED | v1.49.793 | `src/cli/commands/coherent-check.ts` | Exposed the four coherence predicates (`checkNaturality`, `checkIdentity`, `checkComposition`, `checkDirectSum`) plus the aggregate `checkCoherence` and `identityFunctor` factory through a new top-level `skill-creator coherent-check`/`cc` CLI. Three-tier output (text/quiet/JSON). G6 HARD-preservation gate preserved; advisory-only exit-code 0 invariant. |
| `hourglass-persistence` | WIRED | v1.49.793 | `src/cli/commands/hourglass-check.ts` | Exposed the topological-hole detector + contraction-index computation + waist detection + audit-finding emitter through a new top-level `skill-creator hourglass-check`/`hc` CLI. Canonical fixtures (hourglass / chain / empty) provide no-arg smoke check. Three-tier output (text/quiet/JSON). Standard CAPCOM preservation gate preserved; advisory-only exit-code 0 invariant. |
| MA/MB/MD control-theory island (`ace`, `eligibility`, `lyapunov`, `projection`, `dead-zone`, `langevin`, `temperature`, `learnable-k_h`) | ALLOWLISTED | v1.49.972 | `docs/learning-substrate-parked.md`; 8 `tools/adoption-scan.allowlist.json` entries (`addedBy: v972 D3 control-theory island park`) | D3: 8-module control-theory learning-substrate island; `ace` (MA-2) is the import sink (the others import it). Flag-gated default-OFF, flag-off byte-identical. **Reachability-v2 (Ship 3.1, v1.49.977)** now confirms the dormancy in tooling: 7/8 report `reachableFromProduction:false` — `lyapunov`/`projection` read `living` only via intra-island imports; the 5 MA-1/MB/MD leaves are test-only. `ace` (the sink) reports `reachableFromProduction:true`: its one non-island edge — the static **value**-import of `applyActorSignalToScore` from the production M5 selector `orchestration/selector.ts` — is statically reachable (the default-OFF guarantee is *runtime*, via the `aceSignal !== null` guard, not static, so a static scanner correctly reports it reachable). Parked not wired (`ace` is the sink → wiring it advances only 1/8) and not retired (latent tested capability). Generic resume (a learning-loop runtime consumes the substrate, not v1.50-specific); retire-or-resume review by 2027-06-04. |
| `intrinsic-telemetry` | RETIRED | v1.49.972 | deletion commit (`src/intrinsic-telemetry/` removed); `docs/learning-substrate-parked.md` | D3: genuine shelfware (LEJEPA-18 / Phase 733), 0 production importers, superseded by the static `tools/adoption-scan.mjs` import-surface scanner (which shipped and is gated) rather than the never-consumed runtime-telemetry approach. Removal un-registered it from `heuristics-free-skill-space` (settings union + `HEURISTICS_FREE_MODULES` registry + integration test). |
| `git` | WIRED | v1.49.978 | `src/cli/commands/git.ts`; `src/cli/dispatch.ts` `git` entry | Ship 3.2 (🚩D3). Registered the authored-but-unwired `registerGitCommands()` (`git/cli.ts:312`) under a new `skill-creator git <sub>` router (install/status/sync/work/gate merge\|pr/worktree list). Routed under `git` (not top-level) to avoid colliding with the existing `install` skill-installer command. Module now reachable from `src/cli.ts`. |
| `skill` | WIRED | v1.49.978 | `src/cli/dispatch.ts` `skill-inventory`/`inventory`/`inv` entry | Ship 3.2. Registered the authored-but-unwired `skillInventoryCommand` (`src/cli/commands/skill-inventory.ts`, commit 88fcd5656); it imports `src/skill/version-backfill` + `frontmatter-types`, so the module is now reachable from `src/cli.ts`. |
| `upstream` | RETIRED | v1.49.978 | deletion commit (`src/upstream/` removed, 14 files / 2,039 LOC) | Ship 3.2. Orphan SENTINEL/ANALYST/TRACER/PATCHER/HERALD monitoring-and-patch agent pipeline (v1.49.422-423); **0 importers anywhere** in src/tools/scripts/src-tauri/desktop, never wired, allowlisted-but-pending-triage for ~180 ships (since v786). The genuine shelfware the 2026-06-03 audit named. |
| `upstream-intelligence` | RETIRED | v1.49.978 | deletion commit (`src/upstream-intelligence/` removed, barrel + 6 G14 composition tests) | Ship 3.2. 91-line Half-B registry barrel (v1.49.573, Gate G14) imported only by its own `__tests__/` composition suite; the 10 constituent modules retain their individual coverage and keep their `gsd-skill-creator.upstream-intelligence.*.enabled` config namespace (config-key strings in 10 `settings.ts`, distinct from the module — preserved). Companion to `upstream`; same v786 pending-triage now resolved. |
| `amiga` | ALLOWLISTED | v1.49.978 | allowlist `amiga` entry | Ship 3.2. Mission-orchestration substrate (45 files / 10,104 LOC); only edge is a single test-only import in `knowledge/event-bridge.ts`. Operator-chosen park (dated 2027-06-05 retire-or-resume gate) over a large irreversible retire. |
| `audio-engineering` | ALLOWLISTED | v1.49.978 | allowlist `audio-engineering` entry | Ship 3.2. Educational content cartridge (v1.49.16) — content cluster like `holomorphic`; type-only enrichment refs + one test, both unreachable. |
| `bayes-ab` | ALLOWLISTED | v1.49.978 | allowlist `bayes-ab` entry | Ship 3.2. Bayesian A/B substrate (IPM-BOED + Wasserstein per arXiv:2604.21849); reachable only via `ab-harness/wasserstein-boed.ts`, which the shipped sign-test coordinator doesn't invoke. Reference substrate like tonnetz/wasserstein-hebbian. |
| `cache` | ALLOWLISTED | v1.49.978 | allowlist `cache` entry | Ship 3.2. M5 orchestration substrate (PrefixIndex/StepGraph/Preloader; JP-007); reachable only via the unexported, test-only `orchestration/draft-verify-router.ts` (the unwired predictive-skill-loader frontier). Wiring would manufacture a path to dormant code. |
| `commands` | ALLOWLISTED | v1.49.978 | allowlist `commands` entry | Ship 3.2. CLI orchestrators (sc-learn/scan-arxiv/sc-install/sc-unlearn/security-init) consumed via `tools/ingest-*.mts` + standalone `npx tsx` (shell-invoked, like `initialization`/`retro`/`interpreter`); first-class dispatch registration deferred to a follow-up. |
| `components` | ALLOWLISTED | v1.49.978 | allowlist `components` entry | Ship 3.2. SecurityPanel dashboard render fns (Phase 372); re-exported by `security/index.ts` (zero non-test importers) but TS half of a TS↔Rust IPC contract mirrored in `src-tauri/src/security/types.rs`. Preserved (not retired) to avoid orphaning the cross-language contract (Rust/Tauri out of scope). |
| `dependency-auditor` | ALLOWLISTED | v1.49.978 | allowlist `dependency-auditor` entry | Ship 3.2. Era-D dependency-audit substrate; **not shelfware** — its npm/cargo/conda/pypi/rubygems adapters carry wired EgressContext/ProcessContext security chokepoints (v1.49.806-809). Retiring would delete egress enforcement. |
| `engines` | ALLOWLISTED | v1.49.978 | allowlist `engines` entry | Ship 3.2. Math-foundations engine substrate (v1.49.570); reachable only via the test-only `integration/mfe-skill-type.ts` chain, explicit future activation path (`wireMfeIntoExistingPipeline`). |
| `health-diagnostician` | ALLOWLISTED | v1.49.978 | allowlist `health-diagnostician` entry | Ship 3.2. Era-D health-diagnosis substrate; part of the same latent dependency island as `dependency-auditor`. Its `DiagnosisResult`/`DiagnosisReport` contract types are consumed by the kept `alternative-discoverer`, so parked with the island rather than retired (a node-level retire would relocate domain types into a kept consumer). |
| `learn` | ALLOWLISTED | v1.49.978 | allowlist `learn` entry | Ship 3.2. Document-acquisition/processing pipeline (v1.35.0) consumed by `commands/sc-learn.ts` (value imports); reachable from production once the sc-learn CLI is registered (deferred with `commands`). Tested, maintained infrastructure. |
| `scan-arxiv` | ALLOWLISTED | v1.49.978 | allowlist `scan-arxiv` entry | Ship 3.2. ArXiv fetch/rank/ingest bridge (v1.49.659) consumed via the standalone `commands/scan-arxiv.ts` `npx tsx` entrypoint + five `tools/*.mts` scripts; first-class CLI registration deferred with `commands`. |
| `skill-isotropy` | ALLOWLISTED | v1.49.978 | allowlist `skill-isotropy` entry | Ship 3.2. Skill-Space Isotropy Audit (SSIA, LEJEPA Half-B, Phase 728); read-only default-OFF audit substrate consumed only by `sigreg` (test-only). Wiring a CLI would contradict the default-OFF design. |
| `skill-promotion` | ALLOWLISTED | v1.49.978 | allowlist `skill-promotion` entry | Ship 3.2. Thermodynamic ROI gate (JP-005 / arXiv:2604.20897, Wave 2); consumed only by the Wave-3 `ab-harness/bo-autotune.ts` skeleton (test-only); meant to be consumed by the BO loop, not a CLI. |
| `umwelt` | ALLOWLISTED | v1.49.978 | allowlist `umwelt` entry | Ship 3.2. M7 Umwelt core Living-Sensoria substrate (v1.49.640/647); type-only re-exports in `types/index.ts` (safe); only impl consumer (`symbiosis/m7-adapter.ts`) is test-only. |

## Reachability dimension (Ship 3.1, v1.49.977)

`tools/adoption-scan.mjs` carries a second, stricter dimension alongside the
import-surface status: **`reachableFromProduction: boolean`**. It is a FILE-level
static-import walk from the project's *declared, shipped* entry points — the npm
`bin`/`main` roots (`src/cli.ts`, `src/index.ts`), the two registered Claude Code
hooks (`src/hooks/session-{start,end}.ts`), and the `src/` frontier imported by the
shipped desktop/Tauri app (`desktop/`, `src-tauri/`). Dev/CI tooling (`tools/`,
`scripts/`) is deliberately **NOT** a root: a module reachable only from the build
tooling is `living` in the import-surface dimension but not in any shipped artifact.

Why a separate dimension: import-surface answers "does *anything* import this?",
which over-reports liveness. A module can be `living` yet `reachableFromProduction:false`
when every file that reaches it is itself unreachable from a shipped entry — the
motivating case being the MA/MB/MD island (`lyapunov`/`projection` are imported only
by other, unreachable island members). Reachability is computed at file granularity
then lifted to modules (a module is reachable iff ≥1 of its non-test files is
reachable) — module-level reachability would over-report (e.g. `orchestration` is
reachable AND imports `ace`, but the reachable *files* of `orchestration` do not).
The dimension is telemetry + a drift-guard oracle; it does **not** feed
`--shelfware-threshold` (which stays import-surface), so it cannot trip the gate.

**Ship 3.2 — CLOSED (v1.49.978):** Ship 3.1 surfaced **16 non-allowlisted**
`living`-but-`reachableFromProduction:false` modules as the triage input for Ship 3.2.
All 16 are now verdicted (rows above): **2 WIRED** (`git`, `skill` — authored-but-unwired
CLI surfaces registered into dispatch), **14 ALLOWLISTED** (substrate / reference /
security-latent / content, each with a dated 2027-06-05 retire-or-resume gate), and the
long-stale `upstream` + `upstream-intelligence` legacy pair **RETIRED** (the 180-ship-open
v786 triage, finally resolved). After this ship the generated baseline's `## Living but
unreachable from production` section contains **zero non-allowlisted rows** — the
reachability-only shelfware set is empty. This invariant is pinned by the Ship 3.2
drift-guard block in `tests/integration/learning-substrate-parked.test.ts`.

## Open candidates

The Math Foundations Refresh (v1.49.572) cluster is **fully closed** as of v1.49.793 — all 6 modules verdicted (4 WIRED + 2 ALLOWLISTED).

Future shelfware candidates from non-Math-Foundations clusters should be appended above this section as the adoption-scan surfaces them.

## When to add a verdict

After any ship that converts a test-only module's status (in either
direction): add the row here, link to the backing artifact, write one
sentence of reasoning. Do not add a verdict for transient test-only
status (a module that exists for less than 1 milestone before its first
real caller lands).

## Source of truth

The adoption scanner (`tools/adoption-scan.mjs`) is the source of truth
for whether a module is currently `living`, `test-only`, or `isolated`.
This document is the source of truth for *why* each module's status is
what it is. The two together form the shelfware closure loop.
