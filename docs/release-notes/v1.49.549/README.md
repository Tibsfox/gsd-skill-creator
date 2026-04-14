# v1.49.549 — cartridge-forge Milestone

**Released:** 2026-04-14
**Type:** Milestone retrospective — cartridge-forge (Waves 0 → 3)
**Branch:** dev

## Summary

cartridge-forge ships the unified `Cartridge` / `Chipset` schema, a
`skill-creator cartridge …` CLI subcommand group, forge source modules
(loader, validator, scaffold, distill, dedup, eval, metrics, fork,
migrate), a dogfooded capability cartridge backing the forge's own
operations, and additive migrations of 43 existing department chipsets
— all without breaking any existing `src/bundles/cartridge/` consumer
and without editing the frozen schema after Wave 0.

Fifteen commits from `9e580c7c5` through `a4d1d3d89`. Full test suite
**23,645 passing** (+207 over the 23,438 floor; +105 over the 23,540
target). Zero new runtime dependencies. The cartridge-forge dogfood
cartridge evaluates itself successfully — the first cartridge shipped
under the new unified model is the cartridge that teaches the system
how to ship more.

## Key Features

| Deliverable | Shipped In | Tests |
|---|---|---|
| D1 Unified schema (`src/cartridge/types.ts`, 8-kind discriminated union) | `9579fb10f` | RT-01..10, VA-07..08 |
| D2 Legacy adapter + Space Between round-trip | `9e580c7c5` | SC-01..04, RT-01/02, MG-01 |
| D3 Loader + fragment resolver (`#/` syntax) | `5f800a9b7` | LD-01..08 |
| D4 Validator + cross-chipset consistency | `cb53f0104` | VA-01..08 |
| D5 Forge modules (scaffold, distill, dedup, fork, migrate, metrics, eval) | `1bfa14f20`, `d4cc3b814`, `14d0d18dc` | SF/DS/DD/FK/MG/MT/EV families |
| D6 Seven CLI subcommands + `--help` + `--allow-validation-debt` | `dd5a0a4cf`, `3260454a0`, `a4d1d3d89` | CL-01..15 + help smoke |
| D7 Dogfood cartridge-forge cartridge | `f2f4bf0db` | SC-05 |
| D8 Skills/agents/teams for the forge cartridge | `f2f4bf0db` | loader + validator green |
| D9 4 hand + 43 bulk migrations | `e6cfb9e02`, `685bfff0f` | MI-01..06 + 77-test bulk suite |
| D10 Docs (`docs/cartridge/*.md` + CORE-CONCEPTS + README + CLAUDE) | `a4d1d3d89` | SC-08 grep clean |
| D11 IN-01 full-lifecycle integration test | `14e99a856` | IN-01 (3 tests) |
| D12 Evaluation normalizer (loader-side pre-Zod flatten) | `f1e6dd570` | 4 normalizer tests |
| D13 KNOWN-VALIDATION-DEBT.md + quarantine flag | `a4d1d3d89` | CL-15 |

**Schema stability:** `src/cartridge/types.ts` last touched at the Wave 0
exit. No edits across Waves 1–3 despite 43 real-world migrations and two
legacy-shape normalizer passes. SC-06 guardrail held for the full
milestone.

**Dependencies:** zero additions. `package.json` untouched across Waves
1–3. SC-07 guardrail held.

**CLI surface:** `load`, `validate`, `scaffold`, `metrics`, `eval`,
`dedup`, `fork`, plus `--help`. Each subcommand has a happy-path and at
least one error-case test, all exit codes stable, `--json` on every
output, pure IO-sink injection for testability.

**Normalizer pattern:** `src/cartridge/normalizers/evaluation.ts`
flattens legacy `gates.pre_deploy: [{check, description, action}]` into
`pre_deploy: [check_name]` while preserving the full gate objects under
`metadata.gateDetails` via Zod `.passthrough()`. This establishes the
sanctioned bridge for future legacy shapes — no schema edits required,
each future normalizer drops in beside the existing one.

## Retrospective

### What went well

**Wave 0 schema freeze held across 43 migrations.** The schema was
designed to re-express every field in the old `src/bundles/cartridge/`
type and nothing else. That discipline survived four stress tests: the
hand migrations, the bulk migration of 43 `*-department` chipsets, the
dogfood cartridge-forge build, and the Wave 3 evaluation normalizer
work. No edits to `types.ts` after Wave 0. The few shapes that *couldn't*
parse were rescued by loader-side normalizers rather than schema
extensions.

**The normalizer pattern is the right tool.** Wave 2B.1 hit the
evaluation shape mismatch (`gates.pre_deploy` nested objects vs
`pre_deploy: [string]`) and the expedient fix was to drop evaluation
from math-department + rca-department. Wave 3 closed that expressivity
gap properly with a pure-function normalizer that runs in the loader
before schema parse. The pattern is additive — each future normalizer
drops beside the existing one, no schema change, no loader rewrite, no
cross-cutting refactor.

**Dogfood worked as advertised.** The cartridge-forge cartridge
evaluates itself through the same pipeline every user cartridge uses.
The SC-05 integration test (`IN-01` third case) loads the forge
cartridge, validates it, counts metrics (6 skills, 5 agents), and runs
eval — all green. This is the most load-bearing proof that the
unified format works: the system that forges cartridges *is* a
cartridge.

**Test isolation via IO sink.** The CLI subcommand group was built pure
from day one: `cartridgeCommand(args, io)` with an injected
`CartridgeCommandIO` interface. Every test is library-level — no subprocess
spawning, no filesystem races, no mocking of stdout. 16 CLI tests run
in ~230 ms. When Wave 3 added error-path tests and the debt flag, the
test structure absorbed them without shape changes.

### What was surprising

**Cross-chipset validation surfaced real tech debt.** Before the
unified validator existed, no tool in the repo cross-checked a
department's `agent_affinity` references against its `agents:` block,
or its evaluation `benchmark.domains_covered` list against its actual
skill domains. The validator found 22 departments with pre-existing
drift across the two categories. Those aren't regressions — they're
debt that was invisible until a tool could see them. We quarantined
them into `KNOWN_VALIDATION_DEBT` (cap 25) with a documented repair
plan and kept moving.

**Wave 2B.1 → Wave 3 feedback loop.** The first hand migration batch
had to drop the evaluation chipset from math + rca because the legacy
shape didn't parse. That expedient decision *created* the W3.T0
normalizer task, which then unlocked the evaluation chipset on all 37
bulk departments in one loader change. The hand-migration workaround
was the right short-term call because it surfaced the normalizer need
earlier than a green-field design would have.

**`.passthrough()` as a data-preservation channel.** Using Zod's
passthrough to stash the full legacy gate objects under
`metadata.gateDetails` (byte-for-byte, round-trip deep-equal verified)
means no information was lost during the flattening. Future consumers
can still reach the original shape without re-parsing source files.
That pattern generalizes: any legacy field that doesn't fit the
canonical schema can be preserved losslessly under `metadata` while the
schema sees the canonical form.

### What we'd do differently

**Validate the hand-migration targets against the unified schema
*before* writing the wrappers.** W2B.1 wrote four cartridges and then
discovered two of them (math, rca) couldn't include their evaluation
chipset under the current schema. An up-front `validateCartridge()`
dry-run against a stub wrapper would have surfaced the issue in an
hour instead of two commits. For future migration waves: scout first,
wrap second.

**The `--allow-validation-debt` flag was a W3 afterthought but it
should be a W0 primitive.** The flag is a documented escape hatch that
downgrades two specific error categories to warnings. It's useful
precisely because the cross-chipset validator is strict and
pre-existing debt is real. A future unified format should ship the
quarantine mechanism from day one, with the *default* being strict —
same shape, just earlier.

### Shipping metrics

- **Commits:** 15 (`9e580c7c5` → `a4d1d3d89`)
- **New tests:** +207 (23,438 → 23,645)
- **Cartridge-specific tests:** 181 across 15 files
- **New runtime dependencies:** 0
- **Schema edits after W0 freeze:** 0
- **Cartridges migrated:** 43 (4 hand + 39 bulk)
- **New docs:** 6 files under `docs/cartridge/` + CORE-CONCEPTS
  subsection + README row + CLAUDE bullet

## Lessons Learned

1. **Freeze the schema early and defend it.** Wave 0 produced a narrow,
   expressive schema. Waves 1–3 repeatedly tried to add fields. Every
   time, the right answer was "use `metadata` or a loader normalizer,"
   not "edit the schema." Schemas that stabilize early enable
   everything downstream; schemas that keep moving break everyone's
   tests every commit.

2. **Build the escape hatch on day one, not when you need it.**
   `KNOWN_VALIDATION_DEBT` and `--allow-validation-debt` were added in
   Wave 3 because the validator's strictness collided with pre-existing
   source defects. If the quarantine pattern had been part of the Wave
   0 design, Waves 1 and 2 wouldn't have hit the "do we loosen the
   validator or skip the test?" false choice.

3. **Dogfooding is the shortest path to schema validation.** The
   cartridge-forge cartridge forced every schema decision to meet a
   real workload early. The moment the forge cartridge had to declare
   its own skills, agents, and teams, a half-dozen schema ambiguities
   collapsed into obvious answers. "Use the system you're building" is
   cheaper than "write a test plan for the system you're building."

4. **Legacy data shapes surface in unpredictable places.** The
   `wings_covered` field in electronics + spatial-computing departments
   was invisible until the unified loader tried to parse their
   evaluation chipsets. The right move was to exclude those two
   cartridges from the evaluation binding and document the Phase-2
   source repair — not to weaken the schema to accommodate a typo in
   two source files.

5. **Separate "known debt" from "unknown failures."** The
   migrations test skips cross-chipset validation for any cartridge in
   `KNOWN_VALIDATION_DEBT`. Any *new* failure outside that set is still
   a hard error. This distinction is the difference between
   documentation and negligence. The cap at 25 means the debt set
   cannot quietly grow.

## Follow-Ups

Three items for the roadmap:

1. **22-department validation-debt repair** — `docs/cartridge/KNOWN-VALIDATION-DEBT.md`
   enumerates per-category fixes. Category A (10 departments,
   `agent_affinity` drift): add the missing agents to each department,
   or rewrite the offending `agent_affinity:` entries. Category B (12
   departments, `domains_covered` drift): broaden skill domain coverage
   or narrow the benchmark's advertised domains. All fixes are
   source-chipset edits — no format change, no schema change. Separate
   follow-up milestone.

2. **electronics + spatial-computing Phase-2 source repair** — both
   cartridges currently ship with the evaluation chipset omitted
   because their source uses `wings_covered` instead of
   `domains_covered`, incompatible with `BenchmarkSchema`. Repair
   option (a): rename the field in the source chipsets and add the
   evaluation binding back to the wrapper cartridges. Repair option
   (b): add a second loader normalizer that rewrites `wings_covered` →
   `domains_covered` under `metadata.wingsLegacy`. Either is trivial;
   both are out of cartridge-forge scope.

3. **harness-integrity local-skill pollution triage** —
   `src/chipset/harness-integrity.test.ts` walks
   `.claude/skills/` and validates every skill it finds, including
   gitignored local scratch directories
   (`.claude/skills/test-skill/`, `.claude/skills/adversarial-pr-review/`).
   Three failures observed during the W3 final verify all trace to
   local pollution, not repo state. Fix option (a): test excludes the
   `.claude/` walker from gitignored paths. Fix option (b): user
   cleans up local pollution. Either resolves cleanly; this is a
   test-harness configuration issue, not a cartridge-forge
   regression.
