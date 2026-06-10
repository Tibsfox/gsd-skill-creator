# v1.49.1028 — Summary

## The ship

AUDIT-2026-06-09 §10 ship 2, the deploy-layer fix. Closes the audit's §3.2 MAJOR (the installed `.claude/`
tree silently stale vs source-of-truth `project-claude/`, with no gate observing parity) and the C5
follow-on (`.skill-index.json` empty since 2026-02-12, 4th consecutive audit flag). The 11 source-newer
stale files — including all 4 v974 research-skill wires — are deployed via a new marker-safe targeted
`--only` install; a 10-test install-parity drift-guard pins the deploy layer; and a new
`skill-creator activations` command populates the skill index with real per-skill activation counts mined
from the session corpus. Design pass at `.planning/SHIP-v1.49.1028-DESIGN.md`.

## What shipped

- **`install.cjs --only <target>`** (repeatable, win32-safe) + autoDiscover claimed-set dedupe fix (3
  SKILL.md files were double-processed every run). Blanket `--force` remains unsafe by design; never used.
- **11 stale files deployed** (working tree): differs 13 → 2, exactly the two intentional marker-block
  agents, untouched. The 4 research-skill wires (skill-counterfactual-audit, spectral-topology-preflight,
  intent-router, execution-grounded-selection) are live in installed consumers for the first time.
- **`tests/integration/install-parity.test.ts`**: differ-set pin, no-double-processing pin, marker-aware
  byte-equality (installed minus marker block == source) for both agents; `skipIf` CI-safe, enforced at
  local pre-tag-gate step 2 (#10461 layer 1, no new gate step).
- **Skill-index activation counter:** optional `activationCount`/`lastActivation` on `SkillIndexEntry`,
  preserved across `rebuild()`/`refresh()`; SET-semantics `recordActivations()`; CLI
  `skill-creator activations` (alias `act`) with dry-run default, `--json`, `--write`; CLI.md documented
  with JSON schema.
- **Schema-vs-corpus inversion fixed:** `TriggerPatternsSchema` widened to normalize the taxonomy
  array-form triggers (36/36 source skills) to `{ intents }`; `--write` rebuild no longer aborts on a
  single bad skill. Plus 2 latent YAML frontmatter defects repaired (image-to-mission, team-control).
- **Live outcome:** `.skill-index.json` populated — 37 entries, 5 skills with activation counts
  (context-handoff 4; cartridge-forge / security-hygiene / session-awareness / vision-to-mission 1 each),
  from 195 sessions scanned, 14 with activation signal; 9 mined-but-not-in-index names reported honestly.

## Verification

Full vitest 35,901 passed (1 known retention-substrate timing flake, 20/20 green in isolation);
ProcessContext + LoaderContext audits green (2,120); adversarial ship review (Workflow `wf_1dc557b5-3ca`,
base v1.49.1027) — 1 MAJOR confirmed → fixed (`16cfaef3a`); post-deploy parity proven live (differs ==
2 intentional, wires grep-verified, marker blocks intact); pre-tag-gate 21/21 at tag time.

## Engine state

NASA degree **1.217**, counter-cadence **29**, manifest lessons **152**, calibratable thresholds **8** —
UNCHANGED (code ship). cadence_advances: [consume, verify].
