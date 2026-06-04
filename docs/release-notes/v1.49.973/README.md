---
title: "v1.49.973 — update sub-agent dispatch discipline for opus 4.8 harness"
version: v1.49.973
date: 2026-06-04
summary: >
  Ship 1.3 from the 2026-06-03 audit plan: stop the sub-agent dispatch
  discipline doc from misdirecting future work with now-false harness premises.
  The doc was codified for the v1.49.637-654 harness; on Claude Code / Opus 4.8
  (1M context) one premise genuinely changed (the "no SendMessage / one-way
  only" premise), while the ~60-70 tool-use band and output-size discipline
  still hold empirically. The doc now states only the empirically-defensible
  set, retains the constrained-harness machinery as the multi-runtime fallback,
  codifies Lesson #10158 (mid-flight corrections via main context), and adds a
  HAL note framing GUPP/Gastown polling as the non-Claude-Code fallback. No code
  behavior change.
tags: [docs, dispatch, harness, opus-4.8, multi-runtime, ship-1.3]
---

# v1.49.973 — update sub-agent dispatch discipline for opus 4.8 harness

**Shipped:** 2026-06-04

The sub-agent dispatch discipline now reflects the Claude Code / Opus 4.8 harness accurately — correcting the one genuinely-outdated premise while reaffirming the constraints that still hold.

## Why this ship

Ship 1.3 of the 2026-06-03 core-functions audit plan ("harness-obsolescence doc sweep"). `docs/sub-agent-dispatch-discipline.md` was codified for the v1.49.637-654 dispatch harness and asserted three premises as current architectural facts: "sub-agents lack SendMessage / spawn-task-return-result", "~60-70 tool-use ceiling", and "64K output-cap requires HTML/JSON pre-split". On Claude Code with Opus 4.8 (1M context) + the Workflow/Agent primitives, a future author reading those premises would mis-size and mis-architect dispatches. The plan framed all three as false; the pre-push adversarial review corrected that framing on verified evidence (see Verification) — **only the SendMessage premise genuinely changed.**

## What shipped

- **Narrowed the harness update to the defensible truth.** A new *Harness update* section documents the genuinely-new Claude Code capabilities, sourced from the Agent/Workflow tool contracts — background agents (`run_in_background` + main-loop re-invocation), orchestrator→agent **SendMessage continuation** of a single spawned agent, and resumable Workflows (`resumeFromRunId`) — plus the 1M-context window relieving context-exhaustion as a mid-flight-termination cause. It **reaffirms** what still holds: the ~60-70 tool-use band (empirically dispatches run ~28-54 tool uses, v729-v773) and the output-size / chunked-Write+Edit discipline (no evidence the per-dispatch output cap is lifted). Architectural Fact #1 is *refined* (orchestration), not superseded — spawn-task-return-result is still each agent's return contract and fan-out agents do not peer-message.
- **Codified Lesson #10158** (mid-flight fact corrections go via the main context, not queued to a finishing agent — SendMessage queueing risks delivery-after-completion; from v1.49.584) into the Sub-agent dispatch discipline's `key_lessons`, since it directly governs the SendMessage caveat. Manifest lesson count 151 → 152.
- **Retained the constrained-harness machinery as the multi-runtime fallback.** The chunked Write+Edit pattern and the post-trip salvage cleanup are reframed as fallback / content-filter-trip recovery — still correct on constrained / non-Claude-Code runtimes (per the runtime HAL, `claude-code` is the only first-class adapter; 14 others are registration-only). Nothing deleted.
- **HAL note** added to the gupp-propulsion skill's `references/runtime-strategies.md` (keeping `SKILL.md` within its CF-H-030 800-word budget — a lean pointer added) and the `gastown-orchestration` chipset, framing the `polling` strategy as the non-Claude-Code fallback (obsolete on Claude Code, do not delete).
- **disciplines.json** "Sub-agent dispatch" summary annotated (#10193 refined; #10194/#10214/#10240 reaffirmed; #10158 codified); CLAUDE.md re-rendered (gitignored).

## Verification

- All 20 pre-tag-gate checks PASS (full suite + discipline-coverage 0 uncodified / 0 partial). Budget tests (CF-H-030 30/30), discipline-coverage + render-parity (37/37), and gastown chipset + skill-schema (387) green locally.
- **CI on dev caught two real regressions before main** — the gate doing its job: (1) the first HAL-note draft pushed `gupp-propulsion/SKILL.md` to 889 words, over its 800-word budget → relocated the note into the references file per the CF-H-030 split contract; (2) writing "Lesson #10158" into the canonical doc surfaced #10158 as a PARTIAL (documented-but-not-codified) lesson → codified it into `key_lessons`. Both fixed and re-verified locally before re-push; main never saw the broken state.
- **Adversarial pre-push review (5 lenses → adversarial verify), two rounds.** Round 1 confirmed 4 doc-accuracy findings: the first pass over-claimed the tool-use/output ceilings as lifted and overstated SendMessage "context intact" — narrowed to the empirically-backed set. Round 2 confirmed 1 finding — a wrong lesson citation (#10168 → #10158) — fixed before push. The mechanism caught the exact failure mode this ship exists to prevent.

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged — forward audit-plan ship) · manifest lessons **152** (#10158 codified into Sub-agent dispatch).
