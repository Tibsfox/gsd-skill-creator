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
- `$REPO/.claude/agents/` -- 49 subagents on disk (per `INVENTORY-MANIFEST.json` + `.planning/missions/oops-gsd-alignment/m3/local-inventory.json`): 33 GSD-prefixed (planner / executor / verifier + 30 specialists), 8 Unit Circle Lab team agents (capcom, flight-ops, lab-director, uc-* analysts), 3 v1.50a-* (paused experiment), 5 generic infra (observer, watchdog, doc-linter, codebase-navigator, changelog-generator, pipeline-reconciler, quality-drift-watcher). Source-of-truth lives at `$REPO/project-claude/agents/`; install.cjs replays into `.claude/agents/` (gitignored).
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

## Important Notes

- This is a self-modifying system -- the security-hygiene skill handles safety
- `.planning/patterns/` should be in `.gitignore`
- Skills load automatically based on context -- no explicit invocation needed
- **Session auto-init:** when starting a new mission, run `node tools/session-retro/observe.mjs start '<mission-name>'` as your first Bash call. This captures `started_commit` for `generate.mjs --since …` and gives the retrospective real event data. Close with `observe.mjs end` + `generate.mjs` before context dies. Token usage can be dual-logged via `observe.mjs event tokens <in> <out> [label]`.

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

**RELEASE-HISTORY.md refresh (post-tag):**

```bash
node tools/release-history/run-with-pg.mjs refresh --fast --quiet
```

The wrapper reads the artemis-ii sibling repo's `.env` (`$ARTEMIS_REPO/.env` — same parent dir as `$REPO`) for PG_HOST/PORT/USER/DB plus the anonymous-password-list section, builds `RH_POSTGRES_URL`, and invokes `tools/release-history/refresh.mjs`. The wrapper exists because the `.env` file's anonymous-password-list section breaks shell `source` due to special characters in passwords. Use the wrapper, never `source .env` directly. (The wrapper itself resolves the absolute path; CLAUDE.md keeps the placeholder per CF-MED-063b.)

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
