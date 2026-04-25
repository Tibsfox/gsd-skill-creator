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
- `.claude/agents/` -- GSD executor, verifier, planner subagents
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
- `coprocessors/math/` -- **core Python GPU math coprocessor** (algebrus / fourier / statos / symbex / vectora chips + MCP server + CPU oracle fallback + 125 tests). Invoked via the `coprocessor` chipset kind. Promoted from `examples/chipsets/math-coprocessor/` 2026-04-19 to reflect first-class status
- `src-tauri/` -- Rust backend (Tauri)
- `desktop/` -- Vite webview frontend
- `.college/` -- College Structure: Rosetta Core, panels, departments (culinary-arts, mathematics, mind-body), calibration
- `docs/` -- 435+ markdown files, canonical documentation and release notes
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

## External Citations (CS25–26 Sweep)

Three foundational papers from the v1.49.575 CS25–26 Sweep give published derivations for load-bearing GSD architectural choices. See `.planning/missions/cs25-26-sweep/work/synthesis/convergent-discovery.md` for the full four-anchor analysis.

- **Bounded-tape framing — `arXiv:2604.20874` Root Theorem of Context Engineering.** Formal foundation (two axioms, five derived consequences) for treating the agent's working context as a bounded lossy channel. Justifies CAPCOM gating on fidelity thresholds rather than capacity, fresh-context-subagent verification (C5 external-verification-gate), and the accumulate–compress–rewrite–shed milestone retrospective lifecycle. The 20% / 3-correction / 7-day cooldown bounded-learning caps are anchored on C1 (monotone decay independent of nominal window size) and do not relax with larger context models. See `convergent-discovery.md §4`.
- **Override-the-prompt rule for Hard Constraints — `arXiv:2604.21744` GROUNDINGmd.** Published independent rediscovery of the CLAUDE.md + Safety Warden BLOCK pattern. The two-class taxonomy — Hard Constraints (non-negotiable invariants; the agent must refuse rather than violate) and Convention Parameters (community-agreed defaults; overridable with explicit typed override) — is the structural defence against prompt-injection. Safety Warden BLOCK authority overrides the user prompt and is non-negotiable; see `.claude/skills/security-hygiene/SKILL.md`. See `convergent-discovery.md §3`.
- **Three-tier skills-as-md pipeline — `arXiv:2604.21910` Skills-as-md.** Foundation for the vision-to-mission (semantic layer; LLM intent extraction) → research-mission-generator (deterministic layer; identical-intent → identical-output guarantee) → skill-creator (knowledge layer; markdown skills authored by domain experts) pipeline. LLM non-determinism is confined to intent extraction; the deterministic layer is the gate-able surface. See `convergent-discovery.md §2`.
