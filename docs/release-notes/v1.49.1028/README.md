---
title: "v1.49.1028 — Deploy-Layer Fix: Targeted Install, Parity Drift-Guard, Activation Counter"
version: v1.49.1028
date: 2026-06-10
cadence_advances: [consume, verify]
summary: >
  Ship 2 of AUDIT-2026-06-09: the unobserved deploy layer gets eyes and hands. install.cjs gains a
  marker-safe targeted --only deploy (plus an autoDiscover dedupe fix); the 11 source-newer stale
  installed files — including all 4 v974 research-skill wires — are deployed without touching the 2
  intentional marker-block agents; a new install-parity drift-guard pins source<->installed parity
  (the #10461 class at the deploy layer). Downstream, .skill-index.json — empty since 2026-02-12, a
  4th-consecutive-audit flag — is populated for the first time via a new per-skill activation counter
  mined from the real session corpus (37 entries, 5 skills with counts). En route the index's first
  real parse of the installed tree exposed and fixed a schema-vs-corpus inversion (array-form triggers
  used by every source skill were rejected by the validator) and 2 latent YAML frontmatter defects.
tags: [deploy-layer, install, drift-guard, skill-index, activations, audit-ship-2]
---

# v1.49.1028 — Deploy-Layer Fix: Targeted Install, Parity Drift-Guard, Activation Counter

**Shipped:** 2026-06-10

One-line: the deploy layer is now observed (parity drift-guard), operable (targeted `--only` deploy), and
measured (`.skill-index.json` carries real per-skill activation counts for the first time in 4 months).

## Why this ship

AUDIT-2026-06-09 §10 ship 2 (operator: "ship 2"). The audit's §3.2 MAJOR: `install.cjs`'s never-clobber
contract left 13 installed files differing from source — 11 stale (the 4 v974 research-skill wires
WIRED-in-source but UNDEPLOYED since 2026-05-03, the v973 HAL-note move, the v986 `pathToFileURL` Windows
fixes, taxonomy frontmatter) + 2 intentional installed-newer marker-block agents — with **no gate observing
source↔installed parity**. Sequenced behind it (C5): `.skill-index.json` empty since 2026-02-12, correctly
deferred until the wires it would measure were actually deployed. Design pass:
`.planning/SHIP-v1.49.1028-DESIGN.md`.

## What shipped

- **Targeted deploy (`4d3080296`).** `install.cjs --only <target>` (repeatable): per-file installs are
  restricted to matching targets; section-level handlers (CLAUDE.md, settings, extensions, git hooks,
  validation) are skipped; win32-safe path normalization. Combined with `--force` this is the marker-safe
  targeted deploy — blanket `--force` remains unsafe by design (C6) and was never used. Bonus fix: the
  autoDiscover claimed-set compared directory sources against file candidates, double-processing 3
  SKILL.md files every install run.
- **The 11 stale files deployed** (working tree; `.claude/` is gitignored). Differs went 13 → 2 — exactly
  the two intentional marker-block agents (gsd-executor `injected-skills`, gsd-planner
  `capability-inheritance`), each untouched. All 4 research-skill wires are now live in the installed
  consumers.
- **Install-parity drift-guard (`989e5cb35`).** `tests/integration/install-parity.test.ts` (10 tests,
  4 layers): spawns the real installer `--dry-run`; pins the differ set == exactly the 2 agents; pins
  no-double-processing; and a marker-aware layer asserts installed-minus-marker-block is byte-equal to
  source for both agents — so future source edits to the agents can't silently strand, and non-marker
  hand edits to installed can't hide. `skipIf` no `.claude/skills` → CI skips, local pre-tag-gate enforces
  (#10461 layer 1, no new gate step).
- **Skill-index activation counter (`1c724e07a`).** `SkillIndexEntry` gains optional
  `activationCount`/`lastActivation`, preserved across `rebuild()`/`refresh()` (both reconstruct entries —
  the carry-over is the load-bearing sub-task). `recordActivations()` is SET-semantics (full-corpus
  recompute, idempotent re-runs). New CLI `skill-creator activations` (alias `act`): mines the session
  corpus via the v1027-widened `extractActiveSkills` (Skill tool_use + `<command-name>` tags), reuses the
  LoaderContext-wired amiga transcript reader, session-granularity counts, dry-run default, `--json`,
  `--write`. Documented in `docs/CLI.md` including the JSON schema.
- **Schema-vs-corpus inversion fixed (`a7b11758a`).** The live populate's first real parse of the
  installed tree exposed that `TriggerPatternsSchema` accepted only the object form while the taxonomy
  array form is used by **every source skill** (36/36; 36/37 installed — uc-observatory has no triggers
  key). Widened with normalization `string[]` → `{ intents }`; one bad skill no longer aborts the whole
  `--write` rebuild (per-skill skip + honest report).
- **2 latent YAML defects repaired (`b8df6c3b2`).** image-to-mission (trailing text after a closed quoted
  scalar in a triggers entry) and team-control (unquoted `trigger:` inside the description = YAML mapping
  ambiguity) — both months old, surfaced by the first real YAML parse; fixed in source, redeployed via
  the new `--only` flag.
- **Live outcome:** `.skill-index.json` populated for the first time since 2026-02-12 — 37 entries, 5
  skills with real activation counts (context-handoff 4 sessions; cartridge-forge, security-hygiene,
  session-awareness, vision-to-mission 1 each), 9 mined-but-not-in-index names honestly reported, from
  195 sessions scanned / 14 with activation signal.

## Verification

- Full vitest: 35,901 passed / 1 failure = the known retention-substrate timing flake class, green 20/20
  in isolation (suite ran concurrently with the review workflow's agents). ProcessContext + LoaderContext
  chokepoint audits green (2,120).
- Adversarial ship review (T14 step P, Workflow `wf_1dc557b5-3ca`, base `v1.49.1027`, 5 lenses, 6 agents):
  1 MAJOR confirmed (stale prevalence counts in two comments — pre-repair measurement) → fixed in code
  (`16cfaef3a`); 0 findings rejected-and-ignored.
- Post-deploy parity proven live: `--dry-run` differs = exactly the 2 intentional agents, each once; all
  4 research-skill wires grep-verified in installed consumers; both marker blocks intact.
- Pre-tag-gate 21/21 before tag (see chapter/99-context).

## Engine state

NASA degree **1.217**, counter-cadence **29**, manifest lessons **152**, calibratable thresholds **8** —
UNCHANGED (code ship). cadence_advances: **consume** (the v1027-widened activation signal is now consumed
into a durable per-skill index; 4 research-skill wires deployed = their consumers finally observable),
**verify** (install-parity drift-guard closes the #10461 class at the deploy layer).
