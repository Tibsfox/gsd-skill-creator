# Artifact Ecosystem Review — 2026-07-06

Comprehensive review of gsd-skill-creator's **skills, agents, teams, chipsets, and
cartridges** (default-installed core + `examples/` library + `infra/` packs +
orchestration chipsets). Produced by a 37-agent review workflow (16 graders →
synthesis → 20 adversarial verifiers, `wf_d55e6f70-fc3`) plus deterministic
validator runs. 120 raw findings; the 20 highest-impact were adversarially
verified (9 confirmed, 9 partial/corrected, 2 refuted).

## Scope reviewed

| Tier | Location (tracked source) | Counts |
|------|---------------------------|--------|
| Default operational core | `project-claude/` → installs to `.claude/` | 37 skills, 51 agents, 4 teams, 4 cartridges |
| Examples library | `examples/` | ~312 skills, ~343 agents, 12 team configs (+33 README-only), 90 chipsets, 60+ cartridges |
| Infra + orchestration | `infra/`, `data/chipset/`, `cartridges/` | packs (agc/aminet/knowledge/rfc), gastown, muses, etc. |

**Key structural fact:** `.claude/` is gitignored (0 tracked files). The tracked,
shipped source of the default core is `project-claude/`; `install.cjs` copies it into
`.claude/`. Every default-core fix must land in `project-claude/` or the next install
re-clobbers it. `project-claude/` and the local `.claude/` have already drifted.

## Verified findings (acted on)

### Default-core correctness bugs — CONFIRMED
1. **C1** `agents/gsd-executor.md` instructs a `Co-Authored-By: Claude Opus 4.6` trailer on every commit — but `.claude/hooks/validate-commit.cjs:55` hard-blocks exactly that trailer (v1.49.621 policy). Live agents author commits their own hook rejects. → remove + prohibit.
2. **C2** Five flagship agents (gsd-executor, gsd-planner, gsd-nyquist-auditor, gsd-security-auditor, gsd-verifier) use YAML-array `tools:` — `docs/OFFICIAL-FORMAT.md:426` names this "the #1 mistake"; must be a comma-separated string. → convert.
3. **C3** `agents/gsd-user-profiler.md:41,55` hardcodes `/media/foxy/ai/GSD/dev-tools/...` for its authoritative rubric — resolves to nothing on any other machine/CI, ships via install. → repo-relative.
4. **C4** `skills/adversarial-pr-review/SKILL.md:163` asserts a "250 chars (upstream enforcement)" description cap that is invented; the real bound is 1-1024 (`OFFICIAL-FORMAT.md:64`). A reviewer following it wrongly fails compliant skills. → correct.
5. **C5** `skills/commit-style/SKILL.md:48` lists `Co-Authored-By` as an allowed footer with no caveat about the Claude-trailer hard-block. → add caveat.
6. **C6** `skills/cartridge-forge/SKILL.md` contradicts itself: line 148 says metrics is "informational, not a gate"; lines 195-196 call it a 4th mandatory gate. → three-gate model.
7. **C7** `skills/gsd-workflow/SKILL.md:48` (+ `references/command-routing.md:42`) routes "add a phase" to `/gsd:add-phase`, which does not exist; the shipped command is `/gsd:phase`. → repoint.
8. **C8** `agents/gsd-framework-selector.md:3` references a nonexistent `/gsd-select-framework` orchestrator. → drop.
9. **C9** `agents/gsd-orchestrator.md` routing table lists ~10 removed commands and omits shipped ones (drifted from the 67-command set). → regenerate.

### Corrected via adversarial verification — PARTIAL (acted on the corrected form)
- **P1/P2** uc-observatory skill + uc-* agents reference `src/packs/engines|holomorphic/` (real: `src/engines/`, `src/holomorphic/`) and `src/platform/observation/` (real: `src/observation/`) and nonexistent `scripts/uc-observatory/*.py`. → repoint the real paths; neutralize the dead script refs.
- **P5** `skills/gsd-guide/SKILL.md:83` hardcodes `/home/foxy/.claude/...` → repo-relative `.claude/get-shit-done/workflows/` (keep the `/gsd:research-phase` section — the finding's removal was wrong).
- **P6** Truncated `triggers` fragments (batch-rewrite-pattern:9, research-mission-generator:7, env-setup:7, gsd-workflow:8, decision-framework-invoker) are real data-hygiene defects (a description→triggers extractor cutting at delimiters). → repair fragments; this motivates the new `skill-frontmatter-doctor` guard.
- **P9** `skills/spectral-topology-preflight/SKILL.md` instructs the LLM to hand-compute matrix inverse/eigenvalues — but a tested `topologySignature()` already exists in `src/learn/generators/team-generator.ts`. → wire the skill to it; stop instructing manual linear algebra.

### Refuted — NOT acted on (verification saved us)
- **R1** "path-traversal via skill names is asserted-only" — FALSE. `src/validation/path-safety.ts` + `path-safety.test.ts` + `validateSkillNameStrict` in `skill-store.ts` already enforce and drift-test it. (Optional: add a cross-ref in security-hygiene.)
- **R2** "gsd-* agents omit `model:` by oversight" — FALSE. The omission is the documented GSD model-profile-resolution convention; adding `model:` would break profile routing.

## Structural repair — 22 example department cartridges (documented debt)

Independently traced with the live validator (`docs/cartridge/KNOWN-VALIDATION-DEBT.md`).
Not random drift:
- **Category A (10 depts):** each chipset `agents:` block wired only 3 of the designed
  7 agents; the other 4 specialists (Christensen, Ford, Mintzberg; Julia Child, Piaget,
  Vygotsky, Audubon, Rumi, …) **already exist as full agent files on disk** but were never
  registered. Fix = wire the existing agents in, restoring the 7-agent roster.
- **Category B (12 depts):** the evaluation benchmark advertises `domains_covered` not
  worded by any skill. Fix = broaden the closest skill's description (only when truthful)
  or trim the benchmark.
Then: remove repaired depts from `KNOWN_VALIDATION_DEBT` in `migrations.test.ts` (so the
suite now *validates* them), update the debt doc, re-run the validator (expect 0 fail).

## Coverage gaps → new artifacts built

- **skill-frontmatter-doctor** (new default skill) — guards the #1 recurring defect class
  (truncated/echo triggers, array `tools:`, out-of-range descriptions) at author time.
- **physical-chemistry** (chemistry example skill) — equilibrium/kinetics/electrochemistry;
  the largest STEM content gap. Binds existing `pauling`+`lavoisier` agents.
- **analog-circuit-design** (electronics example skill) — op-amps/feedback/active filters/
  regulators; fills the "analog systems" wing the `shockley` router names. Binds `horowitz`+`shockley`.

## Follow-ups — status

Addressed in a second pass:

- **Team configs (done).** `tools/generate-team-configs.mjs` extracts each README's Composition
  table into a `config.json`; all 135 example teams now validate (was 12; 123 generated — larger
  than the review's 33-team sample). team-validator/team-store suites pass.
- **`media` cluster (done).** Completed as a valid production/tooling cartridge — added the missing
  `media-department` chipset + cartridge binding the audio/video/ffmpeg/latex/publishing skills and
  their agents. Validates clean.
- **STEM skills (done, 4 of 5).** Added `stellar-structure-and-evolution` (astronomy),
  `polymers-ceramics-composites` (materials), `control-systems-and-dynamics` (engineering), and
  `time-series-analysis` (statistics), each bound to a previously skill-less department agent.
  `mlops-and-deployment` was the lowest-priority proposal and is left for later.
- **artifact-path-linter (done, narrowed).** `tools/artifact-path-linter.mjs` guards `@`-include
  directives (load-bearing, expanded at runtime) — reports 0 dangling. A broader linter over
  free-form `src/…`/`scripts/…` literals was prototyped but not shipped: those are overwhelmingly
  illustrative example paths or skill-relative script refs, indistinguishable from real references
  without instruction-context parsing. It did surface real rot — `uc-perf-analyst`/`uc-retro-analyst`
  pointing at `src/platform/observation/` — now fixed to `src/observation/`.
- **create-* command refs (done).** `gsd-orchestrator` no longer suggests nonexistent
  `/gsd:create-skill|agent|team` slash commands; it points at the `skill-creator create` CLI and the
  `cartridge-forge` skill.

Deliberately not done:

- **Commit-skill consolidation — declined (not a defect).** `commit-style` is a *default* skill,
  `beautiful-commits` is an *example* skill (`examples/skills/dev/`), and `git-commit` is not in this
  repo at all — different tiers, no runtime collision, so forcibly merging them would be wrong.
- **Default-cartridge benchmark corpus — deferred (milestone-sized, gate risk).** The proven pattern
  (rca-department) needs a `benchmark/test-cases.yaml` corpus *plus a dedicated enforcing test per
  cartridge* asserting ≥0.85 trigger accuracy (`eval.ts` does not run `benchmark` generically). Corpus
  with no test that runs it is shelfware; four enforcing tests risk a flaky/failing gate without
  iterative trigger tuning. Best done as its own scoped milestone.
