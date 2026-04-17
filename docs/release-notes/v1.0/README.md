# v1.0 — Core Skill Management

**Released:** 2026-01-31
**Scope:** foundational milestone — the 6-step adaptive learning loop (Observe → Detect → Suggest → Apply → Learn → Compose)
**Branch:** dev → main
**Tag:** v1.0 (2026-01-31T11:53:21-08:00) — "Compliance Audit"
**Successor:** v1.1 — Semantic Conflict Detection
**Classification:** milestone — foundation of the project
**Phases:** 1-5 (5 phases) · **Plans:** 15 · **Requirements:** 43
**Verification:** Official Claude Code format compliance · skill + agent schema validated · user-level scope supported

## Summary

**v1.0 defined what the system is, not what it has.** The architectural through-line of this release is the 6-step adaptive learning loop — Observe, Detect, Suggest, Apply, Learn, Compose — that every subsequent version extends rather than restructures. The loop is the invariant. It describes how the system adapts to how it's used: capture usage patterns at session boundaries, analyze those patterns when a threshold hits, propose skill creation with evidence, load relevant skills within a token budget, refine under bounded parameters, and eventually compose frequently co-activated skills into stable agents. Getting the loop right at v1.0 was worth the five phases and fifteen plans it took to land.

**Bounded learning parameters are the design decision that makes the loop safe.** Minimum three corrections before a skill can be refined. Seven-day cooldown between refinements. Maximum 20% change per refinement. Stable skill clusters need five-plus co-activations over seven-plus days to be composed into agents. These specific numbers are engineering assertions about how learning should work, not optimization details. They encode a philosophy of conservative adaptation — the system is allowed to learn, but only when there's enough signal to trust the change. A runaway-drift scenario isn't available in this architecture because the parameters are all hard-coded bounds, not configurable thresholds.

**Pattern storage as append-only JSONL was the right v1.0 primitive.** Immutable append gives audit trail, crash recovery, and debuggability for free. No database, no migration path, no ORM. The patterns live in `.planning/patterns/` as line-delimited JSON records — you can `tail -f` them, grep them, delete them, copy them between projects. Every later version that needed richer query patterns could layer on top without changing the underlying primitive. This is the Amiga principle in action: solve the problem with the simplest tool that compiles in one's head.

**Skill inheritance via `extends:` frontmatter with circular-dependency prevention shipped at v1.0.** This is the kind of feature that gets bolted on badly in version two or three after someone realizes they need it. Shipping it at v1.0 with the cycle check built in means every later skill composition is safe by construction. The specific guarantee: any skill's full merged frontmatter can be computed in finite time and produces a deterministic result regardless of which skill file is the entry point.

**v1.0 stayed close to official Claude Code format.** Skills use the official fields at their root; custom fields are namespaced under `metadata.extensions.gsd-skill-creator` so the skills remain round-trippable with the upstream tooling. Reserved name validation, character-budget enforcement, directory-structure checks, description-quality heuristics, and comma-separated-tools validation all ran at v1.0. User-level scope support was present from day one with conflict detection and explicit precedence rules. The tag message is literally titled "v1.0 Compliance Audit" because the audit was a deliverable, not an afterthought.

## Key Features

| Component | What Shipped |
|-----------|--------------|
| Adaptive loop | 6-step cycle: Observe → Detect → Suggest → Apply → Learn → Compose |
| Pattern storage | Append-only JSONL in `.planning/patterns/` — audit trail, crash recovery, simple primitives |
| Skill storage | Markdown with YAML frontmatter in `.claude/skills/` |
| Skill index | Fast discovery, creation workflow, search/list CLI |
| Detection threshold | 3+ occurrences trigger skill-suggestion consideration |
| Apply budget | Token budget 2–5% of session for loaded skills |
| Learn bounds | ≥3 corrections, ≥7-day cooldown, ≤20% change per refinement |
| Compose threshold | 5+ co-activations over 7+ days promotes a cluster to an agent |
| Skill inheritance | `extends:` frontmatter with circular-dependency prevention |
| Agent generation | Automatic synthesis for stable skill clusters in `.claude/agents/` |
| Token accounting | Usage tracking, savings estimation, cost-benefit flagging |
| Format compliance | Official Claude Code skill + agent schema; custom fields namespaced |
| Scope support | User-level scope with conflict detection and precedence rules |

## Retrospective

### What Worked

- **The 6-step loop is a clean architecture.** Observe → Detect → Suggest → Apply → Learn → Compose maps the full adaptive lifecycle without overcomplicating any single step. Each step has a clear input and output, and each subsequent version extends rather than restructures it.
- **Bounded learning parameters prevent runaway drift.** The minimum 3 corrections, 7-day cooldown, and maximum 20% change per refinement are specific engineering constraints that make the learning loop predictable rather than chaotic.
- **Pattern storage as append-only JSONL is the right primitive.** Immutable append gives you audit trail, crash recovery, and simplicity. No database, no migration path needed at v1.0.
- **Skill inheritance via `extends:` frontmatter with circular-dependency prevention shipped at v1.0.** This kind of feature gets bolted on badly in version two or three; shipping it early means every later composition is safe by construction.
- **Compliance audit as a deliverable.** Tagging v1.0 as "Compliance Audit" kept the official Claude Code format alignment as a first-class concern from day one — not a retrofit.

### What Could Be Better

- **43 requirements across 15 plans is a lot for a v1.0.** The scope is ambitious for a foundation release — the risk is building more surface area than can be validated before real usage patterns emerge.
- **Token budget tracking is speculative at this stage.** Without real session data, the savings estimation and cost-benefit flagging are necessarily theoretical.
- **The 2–5% token budget is a range, not a measured value.** The correct number will depend on session shape, which v1.0 cannot know yet. Treat the range as a placeholder, not a result.
- **No dogfooding data yet.** v1.0 ships the loop but hasn't run the loop against real user work. Every parameter (thresholds, cooldowns, budget bounds) will need post-v1.0 calibration from actual session observations.

## Lessons Learned

1. **Start with the loop, not the features.** The 6-step cycle defines what the system IS. Getting the loop right at v1.0 means every subsequent version extends rather than restructures.
2. **Bounded parameters are a design decision, not an optimization.** The specific numbers (3 corrections, 7-day cooldown, 20% max change) are assertions about how learning should work — they encode a philosophy of conservative adaptation.
3. **Agent generation from stable skill clusters is the natural composition endpoint.** The 5+ co-activations over 7+ days threshold means agents emerge from evidence, not speculation.
4. **Ship inheritance + cycle checks together or don't ship either.** Skill `extends:` without circular-dependency prevention is a foot-gun waiting to happen. Shipping both at v1.0 made composition safe by construction.
5. **Append-only JSONL is the simplest durable store that works.** Every v1.0 should choose the simplest primitive that survives a crash. JSONL survives; SQL schemas require migrations.
6. **Compliance audit as a deliverable, not a retrofit.** Calling v1.0 "Compliance Audit" forced the team to treat format alignment as work-to-be-done, not paperwork-after-the-fact. Every later release inherits the clean compliance baseline.
7. **Namespace custom extensions deliberately.** Putting project-specific fields under `metadata.extensions.gsd-skill-creator` keeps skills round-trippable with upstream tools. This costs one level of nesting and saves every future integration effort.
8. **Validate inputs at authoring time, not just execution time.** Reserved-name checks, character-budget enforcement, description-quality heuristics — running all of these at skill-creation time makes v1.0 the gate that keeps the ecosystem clean.
9. **User-level scope matters from day one.** Adding scope support later forces retrofitting every skill-resolution path. Shipping it at v1.0 with precedence rules built in means every subsequent version inherits correct behavior.
10. **43 requirements was ambitious; 15 plans was the right number.** Spreading requirements across too few plans makes each plan unverifiable; too many plans makes the release unshippable. Fifteen plans for v1.0 struck the balance.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.1](../v1.1/) | Successor — Semantic Conflict Detection, the first extension of the Apply step |
| [v1.5](../v1.5/) | Pattern Discovery — deepens the Observe → Detect pipeline |
| [v1.8](../v1.8/) | Capability-Aware Planning — extends the Compose step |
| [v1.8.1](../v1.8.1/) | First adversarial audit against the v1.0 foundation |
| [v1.10](../v1.10/) | Security Hardening — pays down v1.0's path-handling debt |
| [v1.25](../v1.25/) | Ecosystem Integration — 20-node dependency DAG over the v1.0 substrate |
| [v1.49](../v1.49/) | Mega-release that consolidated many post-v1.0 tracks |
| `.planning/patterns/` | Append-only JSONL store — the load-bearing v1.0 primitive |
| `.claude/skills/` | Skill storage directory — v1.0 schema still intact in v1.49 |
| `.claude/agents/` | Agent directory — populated by the Compose step |
| `.planning/MILESTONES.md` | Full milestone detail per the v1.0 tag message |
| `docs/EXTENSIONS.md` | Custom-field documentation (linked from README in v1.0 tag commit) |

## Engine Position

v1.0 is the zero-point of the project. Every version in the v1.x line extends it; no version replaces it. The 6-step loop (Observe → Detect → Suggest → Apply → Learn → Compose) is the invariant. The append-only JSONL pattern store, the `.claude/skills/` Markdown schema, the `extends:` inheritance rules, the 2–5% token budget, the 3/7/20% learning bounds — all of these remain load-bearing at v1.49. Every retrospective patch, audit, feature addition, and research project in the project's history traces back to the shape v1.0 set. The foundation compiled once, and everything after was additive.

## Files

- `.claude/skills/` — skill storage schema (Markdown + YAML frontmatter)
- `.claude/agents/` — agent composition output
- `.planning/patterns/` — append-only JSONL pattern store
- `.planning/MILESTONES.md` — canonical milestone detail
- `src/skills/` — skill management + validation (schema, index, creation workflow)
- `src/learn/` — learning loop with bounded parameters
- `src/compose/` — agent composition from stable clusters
- `src/cli/` — search/list/suggest/apply commands
- `docs/EXTENSIONS.md` — custom-field documentation (linked from v1.0 tag commit)

---

## Version History (preserved from original release notes)

The table below lists the v1.x line that followed v1.0, with the actual shipped summaries for each version once delivered. This version history was preserved in the original v1.0 release notes and is retained here for archival continuity.

| Version | Summary |
|---------|---------|
| **v1.40** | sc:learn Dogfood Mission: PDF extraction pipeline, checkpoint ingestion harness, dual-track concept learning, 3-track verification engine (coverage/consistency/progression), refinement with patches/tickets/skill updates, safety validation |
| **v1.39** | GSD-OS Bootstrap & READY Prompt: IPC foundation (29 event types), Rust SSE API client, CLI chat with streaming, 5-level magic verbosity, 7-service launcher with health checks, staging intake, self-improvement lifecycle |
| **v1.38** | SSH Agent Security: OS-level sandbox (bubblewrap/Seatbelt), zero-knowledge credential proxy, CVE-informed staging scanner, per-agent worktree isolation, security dashboard, bootstrap Phase 0 |
| **v1.37** | Complex Plane Learning Framework: SkillPosition (theta,r) with tangent-line activation, angular promotion pipeline, chord detection, Euler composition, versine/exsecant metrics, plane-status CLI, migration system |
| **v1.36** | Citation Management: multi-format extraction, 6-adapter resolution cascade, 5 bibliography formats (BibTeX/APA7/Chicago/MLA/custom), provenance chains, learn pipeline integration, "The Space Between" bibliography, citation chipset (6 skills, 4 agents) |
| **v1.35** | Mathematical Foundations Engine: 451 primitives across 10 domains, 8 mathematical engines, sc:learn generalized knowledge ingestion, sc:unlearn reversible sessions, 6 safety-critical tests |
| **v1.34** | Documentation Ecosystem: canonical docs/ source, narrative spine, 7 gateway documents, 4 extractable templates, site architecture |
| **v1.33** | GSD OpenStack Cloud Platform: NASA SE methodology, 19 skills, 3 crew configurations (31 agents), ASIC chipset, documentation pack, V&V infrastructure |
| **v1.32** | Brainstorm Session Support: 8 specialized agents, 16 techniques, 5 pathways, Osborn's rules, adaptive facilitation |
| **v1.31** | GSD-OS MCP Integration: MCP Host Manager, Gateway Server (19 tools), 3 template generators, agent bridge, security pipeline |
| **v1.30** | Vision-to-Mission Pipeline: document parsers, wave planner, model assignment, cache optimizer, test plan generator, template system |
| **v1.29** | Electronics Educational Pack: MNA simulator, logic simulator, safety warden, learn mode, 15 modules, 77 labs |
| **v1.28** | GSD Den Operations: filesystem message bus, 10 staff positions, 5 divisions, topology profiles, integration exercise |
| **v1.27** | Foundational Knowledge Packs: 35 packs across 3 tiers, GSD-OS dashboard, observation infrastructure, pathway adaptation |
| **v1.26** | Aminet Archive Extension Pack: INDEX parser, mirror engine, virus scanner, archive extraction, FS-UAE integration |
| **v1.25** | Ecosystem Integration: 20-node dependency DAG, EventDispatcher spec, dependency philosophy, integration test strategy |
| **v1.24** | GSD Conformance Audit: 336-checkpoint matrix, 4-tier audit, zero-fail conformance, 9,355 tests passing |
| **v1.23** | Project AMIGA: mission infrastructure (MC-1/ME-1/CE-1/GL-1), Apollo AGC simulator, DSKY interface, RFC Reference Skill |
| **v1.22** | Minecraft Knowledge World: local cloud infrastructure, Fabric server, platform portability, Amiga emulation, spatial curriculum |
| **v1.21** | GSD-OS Desktop Foundation: Tauri v2 shell, WebGL CRT engine, PTY terminal, Workbench desktop, calibration wizard |
| **v1.20** | Dashboard Assembly: unified CSS pipeline, topology/activity/budget/staging collectors, console page |
| **v1.19** | Budget Display Overhaul: LoadingProjection, dual-view display, configurable budgets, dashboard gauge |
| **v1.18** | Information Design System: shape+color encoding, status gantry, topology views, three-speed layering |
| **v1.17** | Staging Layer: analysis, scanning, resource planning, approval queue for parallel execution |
| **v1.16** | Dashboard Console & Milestone Ingestion |
| **v1.15** | Live Dashboard Terminal |
| **v1.14** | Promotion Pipeline |
| **v1.13** | Session Lifecycle & Workflow Coprocessor |
| **v1.12.1** | Live Metrics Dashboard |
| **v1.12** | GSD Planning Docs Dashboard |
| **v1.11** | GSD Integration Layer |
| **v1.10** | Security Hardening |
| **v1.9** | Ecosystem Alignment & Advanced Orchestration |
| **v1.8.1** | Audit Remediation (Patch) |
| **v1.8** | Capability-Aware Planning + Token Efficiency |
| **v1.7** | GSD Master Orchestration Agent |
| **v1.6** | Cross-Domain Examples |
| **v1.5** | Pattern Discovery |
| **v1.4** | Agent Teams |
| **v1.3** | Documentation Overhaul |
| **v1.2** | Test Infrastructure |
| **v1.1** | Semantic Conflict Detection |
| **v1.0** | Core Skill Management |
