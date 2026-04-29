# gsd-skill-creator

Adaptive learning layer for Claude Code that creates, validates, and manages skills, agents, teams, and chipsets. Uses GSD for project management, skill-creator as the adaptive learning layer. See `.planning/PROJECT.md` for full project context.

## Tech Stack

- **Languages:** TypeScript (src/), Rust (src-tauri/), GLSL (shaders)
- **Build:** `npm run build`
- **Test:** `npm test` (Vitest, 21,298 tests)
- **Lint:** (no lint script configured)
- **Key deps:** Tauri v2, xterm.js, Vite v6, Vitest
- **Desktop frontend:** `desktop/` (Vite webview)

## Key File Locations

- `.planning/` -- GSD project management (ROADMAP.md, STATE.md, REQUIREMENTS.md, config.json)
- `.claude/skills/` -- auto-activating skills (gsd-workflow, skill-integration, session-awareness, security-hygiene, and others)
- `src/anytime-valid/` -- anytime-valid e-process martingale primitive (Ville's inequality; consumed by `src/orchestration/anytime-gate.ts` and future `src/ab-harness/` consumer per JP-029)
- `src/skill-promotion/` -- skill-promotion ROI gate via deployment-horizon math (Landauer floor at T=300K; JP-005)
- `$REPO/.claude/agents/` -- **52 subagents on disk** (49 from source-of-truth + 3 v1.50a-* paused-experiment local-only): **34 GSD-prefixed** (`gsd-*` — planner / executor / verifier + ~31 specialists), **9 Unit Circle Lab + Observatory team** (capcom, flight-ops, lab-director, watchdog, uc-brainstorm-engine, uc-perf-analyst, uc-proof-engineer, uc-retro-analyst, uc-skill-forger), **3 v1.50a-*** (paused experiment — KEEP-LOCAL until v1.50 unparking), **6 generic infra** (observer, doc-linter, codebase-navigator, changelog-generator, pipeline-reconciler, quality-drift-watcher). Source-of-truth lives at `$REPO/project-claude/agents/` (49 files post-v1.49.585 C12 reconciliation); install.cjs auto-discovers via `manifest.json` schema-v2 `autoDiscover` pattern `*.md` and replays into `.claude/agents/` (gitignored). After v1.49.585 the source matches on-disk reality; `node project-claude/install.cjs --dry-run` reports zero new agents.
- `.claude/commands/gsd/` -- GSD command definitions
- `.claude/hooks/` -- deterministic hooks (commit validation, session state, phase boundary)
- `project-claude/` -- source of project-specific Claude config (installed via `node project-claude/install.cjs`)
- `src/` -- TypeScript library and CLI
- `src/cartridge/` -- unified cartridge/chipset format + `skill-creator cartridge …` CLI (see `docs/cartridge/`)
- `src/sensoria/` -- M6 net-shift receptor substrate (Lanzara 2023; opt-in via `gsd-skill-creator.sensoria.enabled`)
- `src/umwelt/` -- M7 Markov-blanket boundary + variational free-energy minimiser (Friston 2010, Kirchhoff 2018)
- `src/symbiosis/` -- M8 teaching ledger, co-evolution ledger, Quintessence five-axis report
- `src/graph/` -- M1 Semantic Memory Graph (entity/edge schema, Leiden community detection, GraphRAG query patterns)
- `src/traces/` -- M3 Decision-Trace Ledger (AMTP-compatible append-only JSONL; extends `src/mesh/event-log.ts`)
- `src/branches/` -- M4 Branch-Context copy-on-write skill variants (fork/explore/commit lifecycle)
- `src/orchestration/` -- M5 multi-turn retrieval loop + selector (reads M1/M2/M3/M4)
- `src/cache/` -- M5 radix-tree prefix cache + KVFlow-style step-graph predictor + anticipatory preloader
- `src/output-structure/` -- ME-5 output-structure frontmatter + validator + migration (Zhang 2026)
- `src/reinforcement/` -- MA-6 canonical reinforcement taxonomy (5 channels) + emitters + writer
- `src/tractability/` -- ME-1 tractability classifier (keystone; gates MA-2 + ME-4)
- `src/eligibility/` -- MA-1 TD(λ) eligibility-trace layer over MA-6 events (Barto 1983 §III)
- `src/ace/` -- MA-2 ACE actor-critic wire (M7 ΔF → M5 selector, tractability-weighted)
- `src/lyapunov/` -- MB-1 Lyapunov-stable K_H adaptation (Sastry & Bodson 1989; V̇ ≤ 0 certified before each update)
- `src/projection/` -- MB-2 smooth projection operators keeping parameters inside admissible manifold (Sastry & Bodson 1989)
- `src/dead-zone/` -- MB-5 dead-zone bounded learning; suppresses updates inside noise band; composes with MB-1
- `src/stochastic/` -- MA-3+MD-2 softmax/ε-greedy stochastic selection on M5 (temperature-weighted sampler)
- `src/langevin/` -- MD-3 Langevin noise injection with SC-DARK floor guard (Welling & Teh 2011 SGLD lineage)
- `src/temperature/` -- MD-4 annealed temperature schedule driving MD-3 noise scale + MA-3+MD-2 softmax temperature
- `src/embeddings/` -- MD-1 shallow learned embeddings; skip-gram / negative-sampling trainer (Mikolov et al. 2013 word2vec)
- `src/learnable-k_h/` -- MD-5 per-(skill, task-type) learnable K_H heads; Lyapunov-gated gradient updates
- `src/representation-audit/` -- MD-6 audit trail for learned representations; effective-rank + community separability + collapse detection
- `src/model-affinity/` -- ME-2 per-skill model affinity + Haiku→Sonnet→Opus escalation on tractability mismatch
- `src/ab-harness/` -- ME-3 significance-gated A/B harness built on M4 fork/explore/commit
- `src/coprocessor/` -- TypeScript client for the math coprocessor runtime; spawns the Python MCP server from `coprocessors/math/` and exposes typed APIs for skill activation
- `src/memory/` -- Memory Arena stack (M1-M13 slices + IPC + Grove integration; ~710 Rust + ~393 TS tests at session 014; survey scorer + half-life decay + 9-type taxonomy classifier landed in W1 OGA-006/024/025)
- `src/vtm/` -- vision-to-mission deterministic intent → mission-package generator (semantic layer of the three-tier skills-as-md pipeline; see CLAUDE.md "External Citations" §arXiv:2604.21910)
- `src/dacp/` -- DACP runtime (Fox-aligned reference implementation: assembler, bus, fidelity, retrospective, schema-generator, templates; referenced by name only — Fox Companies IP stays in `.planning/`)
- `src/mathematical-foundations/` -- formal foundations (proof scaffolds backing M5/M7/MA-2 derivations)
- `src/coherent-functors/` -- categorical structure (composition, factory, invariants, silicon-layer-boundary; underpins the cartridge composition algebra)
- `src/predictive-skill-loader/` -- anticipatory skill preloader (predicts next likely skill activation from M5 selector traces; reduces cold-start latency)
- `src/runtime-hal/` -- runtime HAL registry; declares the 14 upstream + Pi runtimes the agent can be hosted under (claude-code is the only adapter implemented; others are registration-only — see `runtimes.ts`)
- `coprocessors/math/` -- **core Python GPU math coprocessor** (algebrus / fourier / statos / symbex / vectora chips + MCP server + CPU oracle fallback + 125 tests). Invoked via the `coprocessor` chipset kind. Promoted from `examples/chipsets/math-coprocessor/` 2026-04-19 to reflect first-class status
- `src-tauri/` -- Rust backend (Tauri)
- `desktop/` -- Vite webview frontend
- `.college/` -- College Structure: Rosetta Core, panels, departments (culinary-arts, mathematics, mind-body), calibration
- `docs/` -- 435+ markdown files, canonical documentation and release notes
- `docs/adr/` -- Architecture Decision Records (ADR 0001 vendoring policy, ADR 0002 dual-impl precedence)
- `www/tibsfox/com/Research/` -- 168 research projects (179 dirs), PNW Research Series

## Commit Convention

- Conventional Commits: `<type>(<scope>): <subject>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- Imperative mood, lowercase, no period, subject <72 chars
- A PreToolUse hook enforces this automatically

## Wave Commit Markers

When session boundaries force combining waves into a single commit, use this format:

```
feat(scope): summary of combined work

Wave N: [what wave N delivered]
Wave M: [what wave M delivered]
```

This preserves bisect intent in the commit message even when commit boundaries don't align with wave boundaries.

## Quick Reference

- Check project state: read `.planning/STATE.md` and `.planning/ROADMAP.md`
- Install project-claude files: `node project-claude/install.cjs`
- GSD skills and hooks handle workflow guidance automatically
- Strict boundary: `src/` never imports `desktop/@tauri-apps/api`; `desktop/` never imports Node.js modules

### Environment Variables (added in v1.49.585)

| Var | Default behavior | Override behavior |
|---|---|---|
| `SC_SELF_MOD` | unset → BLOCK self-mod writes | `=1` → allow `.claude/skills\|agents\|hooks/` writes |
| `SC_FORCE_ADD` | unset → BLOCK protected-path adds | `=1` → allow `git add` of `.planning/`, `.claude/`, `.archive/`, `artifacts/` paths |
| `SC_SKIP_PREPUSH` | unset → run completeness gate | `=1` → skip pre-push completeness check (emergency only) |
| `SC_INSTALL_CALLER` | (set by `project-claude/install.cjs` at process start) | `=project-claude` → install.cjs allowlist for self-mod-guard |
| `RH_ENV_FILE` | unset → use default `<repo-root>/.env` | `=<path>` → use override .env path for `tools/release-history/run-with-pg.mjs` |
| `ARTEMIS_REPO_ENV` *(deprecated)* | unset → ignored | `=<path>` → fallback alias for `RH_ENV_FILE`; emits deprecation notice |
| `PRE_TAG_GATE_QUIET` | unset → step labels printed | `=1` → suppress step labels (errors still printed) |

## Important Notes

- This is a self-modifying system -- the security-hygiene skill handles prose-level safety; v1.49.585 added deterministic gates (see "Operational Gates" subsection below)
- `.planning/patterns/` should be in `.gitignore`
- Skills load automatically based on context -- no explicit invocation needed
- **Session auto-init:** when starting a new mission, run `node tools/session-retro/observe.mjs start '<mission-name>'` as your first Bash call. This captures `started_commit` for `generate.mjs --since …` and gives the retrospective real event data. Close with `observe.mjs end` + `generate.mjs` before context dies. Token usage can be dual-logged via `observe.mjs event tokens <in> <out> [label]`.

### Operational Gates (added in v1.49.585)

The following deterministic gates BLOCK certain operations by default; each has a documented override env var for legitimate use:

| Gate | What it blocks | Override |
|---|---|---|
| `.claude/hooks/self-mod-guard.js` | Write/Edit/Bash to `.claude/skills/`, `.claude/agents/`, `.claude/hooks/` | `SC_SELF_MOD=1` env var, OR call from `node project-claude/install.cjs` (sets `SC_INSTALL_CALLER=project-claude` automatically) |
| `.claude/hooks/git-add-blocker.js` | `git add` / `git commit -a` of `.planning/`, `.claude/`, `.archive/`, `artifacts/` paths | `SC_FORCE_ADD=1` env var |
| `.git/hooks/pre-push` (installed via `tools/install-git-hooks.sh` + npm postinstall) | `git push origin main` if release-notes 5-file structure is missing or any file <200 bytes (`check-completeness.mjs --strict`) | `SC_SKIP_PREPUSH=1` env var (emergency only) |
| `src/dead-zone/__tests__/citation-invariants.test.ts` | (CI test) FAILS if `cooldownDays=7` / `diffThreshold=0.20` / `MAX_CORRECTIONS_BEFORE_BLOCK=3` / `SMALL_DATA_FLOOR=12` defaults are silently changed | Update `.planning/missions/v1-49-585-concerns-cleanup/work/specs/citation-anchors.md` AND `src/dead-zone/CITATION.md` in the same commit as the value change |
| `tools/pre-tag-gate.sh` (added 2026-04-29 v1.49.585+) | `git tag` if `npm run build` / `npx vitest run` / `check-completeness.mjs --current --strict` fails. Operator-invoked via `npm run pre-tag-gate` before each milestone tag. | (no override — fix the failing check; emergency: skip and tag manually, but expect CI red on push) |

The gates exist to convert prose-only social rules into deterministic enforcement. See `.planning/codebase/CONCERNS.md` (the audit they emerged from) and `.planning/missions/v1-49-585-concerns-cleanup/` for full design context. The gates' contract spec is at `.planning/missions/v1-49-585-concerns-cleanup/work/specs/hook-conventions.md`.

**Self-mod-guard known caveat (v1.49.585):** the hook's Bash detection can false-positive when a long compound command contains BOTH a write-operator (e.g. `mv`, `rm`, `cp`) AND a `.claude/skills|agents|hooks/` substring elsewhere in the same line, even when those are not adjacent. Workaround: split into multiple Bash calls. Long-term fix (proximity-aware matching) deferred to v1.49.586+.

## Ship Pipeline — Required Per-Milestone Artifacts

Every dev-line milestone (v1.49.NNN) MUST ship with the standard 5-file release-notes structure under `docs/release-notes/<version>/`:

```
docs/release-notes/v1.49.NNN/
├── README.md                      # ~40-60 lines summary + cross-track + thread state
└── chapter/
    ├── 00-summary.md              # 50-80 lines structural firsts + engine state
    ├── 03-retrospective.md        # 30-60 lines carryover lessons applied + new lessons
    ├── 04-lessons.md              # 30-60 lines forward lessons emitted
    └── 99-context.md              # 50-80 lines engine-state tables
```

**Gold reference:** `docs/release-notes/v1.49.581/` and `docs/release-notes/v1.49.582/` — mirror these file-for-file.

**Pre-ship gate (HARD RULE — do not skip):**

```bash
node tools/release-history/check-completeness.mjs --current
```

The gate runs against `package.json` `version`. It exits non-zero if any of the 5 required files is missing. Run it BEFORE: tagging the milestone, merging dev → main, pushing main, or creating the GH release. Add `--strict` to also check that each file has ≥200 bytes of content.

**Why this gate exists:** v1.49.577–v1.49.580 (4 milestones in 1 day, 2026-04-26) shipped without authoring release-notes because velocity was prioritized over docs discipline. The drift was caught at v1.49.582 ship and remediated 2026-04-27 by backfilling the 4 missing dirs + adding this gate. Subsequent ship pipelines must run the gate.

**Pre-tag composite gate (HARD RULE — do not skip):**

```bash
npm run pre-tag-gate
```

The composite gate (added 2026-04-29 in the v1.49.585+ post-ship CI-fix follow-up) wraps three checks the operator must run BEFORE `git tag`:

1. `npm run build` — catches TypeScript errors that vitest does not surface (e.g. TS2835 missing-`.js` extensions on relative ESM imports under node16/nodenext moduleResolution).
2. `npx vitest run` — runs the full vitest suite, mirroring CI exactly. Catches CI-shaped failures the lighter pre-push hook does not exercise (manifest-drift CF-MED-065b, harness-integrity hook-ref invariants, claude-md-truth CF-MED-063b, etc.).
3. `node tools/release-history/check-completeness.mjs --current --strict` — re-runs the release-notes structure gate so the operator sees both gates fire pre-tag.

Exit codes: 0 = all PASS; 1 = build failed; 2 = vitest failed; 3 = completeness failed. Self-tests at `tools/pre-tag-gate.test.sh` (6 cases verifying script structure + npm wiring).

**Why this gate exists:** v1.49.585 shipped with CI red on dev (run 25096343019) + main (run 25096349789) — 1 build error + 4 test failures, all v1.49.585-introduced. The W4 Phase 3 meta-test only ran completeness + chapter idempotent + pre-push BLOCK/ALLOW; CI-shaped tests slipped through the meta-test net. Forward lesson #10176 captured the gap; this gate closes it. Subsequent ship pipelines must run BOTH `check-completeness.mjs --current --strict` (lightweight, also enforced by pre-push hook on push-to-main) AND `npm run pre-tag-gate` (heavyweight, operator-invoked) before `git tag`.

**RELEASE-HISTORY.md refresh (post-tag):**

```bash
node tools/release-history/run-with-pg.mjs refresh --fast --quiet
```

The wrapper reads PG credentials from `<repo-root>/.env` (canonical location) and invokes `tools/release-history/refresh.mjs` with `RH_POSTGRES_URL` populated in the environment. If the `.env` has a pre-built `RH_POSTGRES_URL=postgresql://...`, that value is used verbatim; otherwise the wrapper constructs the URL from `PGHOST`/`PGPORT`/`PGUSER`/`PGDATABASE`/`PGPASSWORD` keys. Override the .env path via the `RH_ENV_FILE` env var.

**Historical note (v1.49.585 deprecation):** prior to v1.49.585 the wrapper read PG creds from a worktree-attached `.env` at `$ARTEMIS_REPO/.env` (the artemis-ii git worktree, not a separate dev-tools project) and used a legacy `PG_HOST`/`PG_PORT`/`PG_USER`/`PG_DB` key style plus an anonymous-password-list section. The artemis-ii worktree default and anonymous-password-list parsing were both removed in v1.49.585 component C08. The legacy `ARTEMIS_REPO_ENV` env var continues to be honored for backward-compat with operator setups, but emits a deprecation notice; new setups should use `RH_ENV_FILE`. Do NOT route work to the `artemis-ii` branch (merged 2026-04-14 PR #32, no longer active); the worktree directory at `$ARTEMIS_REPO/` is left in place but is not the canonical .env location anymore.

**Idempotent chapter generation (added in v1.49.585):**

`tools/release-history/chapter.mjs` now preserves hand-authored release-notes by default (checksum-skip when existing content has non-DB-derivable opener — first 200 bytes don't match the regenerated template's opener). To force regeneration of chapter files (e.g. when backfilling historical milestones from clean state), use:

```bash
node tools/release-history/chapter.mjs --version v1.49.NNN --force-regenerate
```

Without `--force-regenerate`, hand-authored release-notes in `docs/release-notes/<version>/chapter/*.md` are preserved across `refresh.mjs` runs. The v1.49.583 "defeat-checkout" pattern (`git checkout HEAD -- ...`) is no longer required for normal ship pipelines.

## External Citations (CS25–26 Sweep)

Three foundational papers from the v1.49.575 CS25–26 Sweep give published derivations for load-bearing GSD architectural choices. See `.planning/missions/cs25-26-sweep/work/synthesis/convergent-discovery.md` for the full four-anchor analysis.

- **Bounded-tape framing — `arXiv:2604.20874` Root Theorem of Context Engineering.** Formal foundation (two axioms, five derived consequences) for treating the agent's working context as a bounded lossy channel. Justifies CAPCOM gating on fidelity thresholds rather than capacity, fresh-context-subagent verification (C5 external-verification-gate), and the accumulate–compress–rewrite–shed milestone retrospective lifecycle. The 20% / 3-correction / 7-day cooldown bounded-learning caps are anchored on C1 (monotone decay independent of nominal window size) and do not relax with larger context models. See `convergent-discovery.md §4`. Convergent partners (JULIA-PARAMETER): arXiv:2604.20897 (deployment-horizon ROI quantifies when installing a new skill is energetically justified), arXiv:2604.20915 (causal-synchronization KL bound formalizes the 20%-rule statistically), arXiv:2511.18884 (DACP fidelity-tier codec operationalizes the fidelity-threshold gate), arXiv:2604.21851 (anytime-valid SD e-process operationalizes the C5 external-verification-gate statistically), and arXiv:2604.21101 (12-example small-data floor anchors the minimum bounded-learning sample count).
- **Override-the-prompt rule for Hard Constraints — `arXiv:2604.21744` GROUNDINGmd.** Published independent rediscovery of the CLAUDE.md + Safety Warden BLOCK pattern. The two-class taxonomy — Hard Constraints (non-negotiable invariants; the agent must refuse rather than violate) and Convention Parameters (community-agreed defaults; overridable with explicit typed override) — is the structural defence against prompt-injection. Safety Warden BLOCK authority overrides the user prompt and is non-negotiable; see `.claude/skills/security-hygiene/SKILL.md`. See `convergent-discovery.md §3`. Convergent partners (JULIA-PARAMETER): arXiv:2505.16737 (Safety-Aware Probing — training-time enforcement of Hard Constraints via contrastive probe + projection, composing with the inference-time BLOCK pattern).
- **Three-tier skills-as-md pipeline — `arXiv:2604.21910` Skills-as-md.** Foundation for the vision-to-mission (semantic layer; LLM intent extraction) → research-mission-generator (deterministic layer; identical-intent → identical-output guarantee) → skill-creator (knowledge layer; markdown skills authored by domain experts) pipeline. LLM non-determinism is confined to intent extraction; the deterministic layer is the gate-able surface. See `convergent-discovery.md §2`. Convergent partners (JULIA-PARAMETER): arXiv:2512.09111 (SAGES three-stage pipeline independently instantiates the same semantic/deterministic/knowledge architecture for safety-critical aerospace, achieving >90% semantic-behavioural consistency) and arXiv:2604.21187 (SAT → LLM-codegen → Lean three-step Ramsey-graph workflow, specializing the pattern for formal-mathematics discovery; both confine LLM non-determinism to the construction stage).

### JULIA-PARAMETER additions (v1.49.577)

Four further anchors land from the v1.49.577 JULIA-PARAMETER mission's deep-dive of 87 published papers (54 carded across 8 modules + 1 featured deep-dive), April 2026. They extend the bounded-tape framing into thermodynamic ROI, formalize the bounded-learning cap statistically, pin the formal-mathematics substrate the proof companion compiles against, and supply the published anchor for the small-data 12-example floor that v1.49 had been citing informally. See `.planning/missions/julia-parameter/synthesis/convergent-discovery.md` for the full cluster analysis.

- **Deployment-horizon ROI gate — `arXiv:2604.20897` Watts-per-Intelligence Part II: Algorithmic Catalysis.** Provides the deployment-horizon ROI mathematics that the bounded-tape framing's "skill installation cost" implies but does not quantify. The algorithmic-mutual-information speedup upper bound — a reusable computation's lifetime payoff is bounded by I_K(skill ; task) — and the Landauer installation-cost floor of k_B T ln 2 per bit jointly answer the skill-promotion gate's "is this skill worth installing?" question with a thermodynamically-grounded inequality. The bound is tight: a skill that is never reused recovers no installation energy, so gsd-skill-creator's promotion decision is fundamentally an ROI query, not a capability query. Anchors `src/skill-promotion/promotion-roi.ts` (JP-005); the deployment-horizon parameter is set at T=300K Landauer baseline. Convergent with arXiv:2604.20874: where Root Theorem motivates *that* there must be bounded-learning caps (C1 monotone decay), this paper motivates *when* installing a new skill is energetically justified. Cluster: C1 (bounded-tape extension). Cross-reference: `.planning/missions/julia-parameter/synthesis/convergent-discovery.md` §2 Cluster 1.
- **Causal-synchronization KL bound — `arXiv:2604.20915` Absorber LLM: Causal Synchronization.** Supplies the published statistical statement of the bounded-learning 20%-rule that gsd-skill-creator implements in `src/bounded-learning/`. The causal-synchronization objective — KL divergence between post-update and pre-update policy is monotonically bounded under the absorber's training regime — is the continuous probabilistic analog of the discrete byte-diff cap in `src/dead-zone/`. The absorber framing also explains *why* the 20% cap is not merely heuristic: it is the maximum single-update divergence that leaves the causal graph of previous skills intact under the synchronization constraint. This is the formal statement v1.50's proof companion needs to compile a Lean-verified bounded-learning chapter, depending on the Mathlib KL-divergence formalization (Anchor 6 below). Anchors `src/bounded-learning/CITATION.md` (JP-003). Convergent with arXiv:2604.20874 (the cap is necessary because of bounded-tape) and with arXiv:2510.04070 (the bound is formally statable). Cluster: C1. Cross-reference: convergent-discovery.md §2 Cluster 1.
- **Formal probability substrate — `arXiv:2510.04070` Markov kernels in Lean Mathlib (Degenne et al.).** Provides the formal probability and information-theory substrate that the v1.50 proof companion's chapters depend on for compilability. Degenne et al. upstream-merged into Lean Mathlib the formal definitions of Markov kernels, KL divergence, conditional entropy, the chain rule, the data-processing inequality, and Markov-kernel composition lemmas — every formal statement of the bounded-learning cap, the anytime-valid e-process gate, and the multi-calibration sample-complexity bound is now Lean-statable against this library. Anchors `src/mathematical-foundations/lean-toolchain.md` (JP-001). The proof companion's build hinges on a pinned Mathlib commit hash matching this formalization; without the pin the chapters are non-reproducible. Convergent with arXiv:2604.20915 (the formal target the synchronization bound compiles against). Cluster: C1 / C3 enabler. Cross-reference: convergent-discovery.md §2 Cluster 1.
- **12-simulations-suffice anchor — `arXiv:2604.21101` Hybridizable Neural Time Integrator.** Supplies the published anchor for the bounded-learning 12-example minimum in `src/dead-zone/` and the empirical justification that small-data structural-inductive-bias training is sample-efficient. The hybridizable architecture — numerical-conservation laws embedded in network topology with provable gradient bounds and 65× parameter reduction — and the finding that 12 high-fidelity simulations suffice for reference-accuracy match jointly close the citation gap. The paper's provable gradient-bound result also independently corroborates the MB-1 Lyapunov-stability guarantee: when the architecture is constrained to energy-preserving manifolds the gradient cannot escape the admissible region, converging with `src/projection/` MB-2. The 12-example threshold is the tightest published data-efficiency anchor for any system that enforces conservation-law structure; v1.49's 12-example floor is now citation-backed. Anchors `src/dead-zone/` 12-simulation floor (citation-only) and `src/lyapunov/` MB-1 provable gradient bounds. Cluster: C5 (small-data inductive bias). Cross-reference: convergent-discovery.md §6 Cluster 5.

### Mission-philosophical anchor (JULIA-PARAMETER) — arXiv:2604.21048

**Featured: Mandelbrot/Julia structures in 3-parameter rational-map slices (Suárez Navarro, 2026).** *Philosophical anchor — no `src/*` code anchor; methodological thesis only.* Demonstrates that classical fractal structures (Mandelbrot-like loci, Julia-like embeddings) emerge naturally in one-dimensional parameter slices of a three-parameter rational-map family. The "find the right slice" methodology is the JULIA-PARAMETER mission's organizing principle projected back onto research space: the mission triages 87 papers by choosing the right *slice* of arXiv where gsd-skill-creator's existing architecture becomes visible as already-rediscovered mathematics. The featured paper is the geometric image of the mission's own absorption practice — parameter space of rational maps is the analogy for the high-dimensional space of all published algorithmic-learning papers; the mission's triage is the slice selection; the four anchors above are the Julia sets that emerge in that slice. Pair conceptually with arXiv:2104.10277 (formal-mathematics complement: discrete vector bundles, Tier-elevated to Wave-2 absorption per Track C recommendation) and arXiv:2512.19156 (substrate-equivalence complement: classical billiards can compute, Turing-completeness as the Amiga Principle pedagogical anchor). Cluster: C6 (find-the-right-slice). Cross-reference: convergent-discovery.md §7.
