# v1.49.973 — Summary

## The ship

Ship 1.3 of the 2026-06-03 audit plan ("harness-obsolescence doc sweep"). `docs/sub-agent-dispatch-discipline.md` was codified for the v1.49.637-654 dispatch harness and asserted premises that misdirect work on Claude Code / Opus 4.8 (1M context). The doc now states only the empirically-defensible set: it **refines** the one premise that genuinely changed (orchestrator→agent SendMessage continuation + resumable Workflows now exist) and **reaffirms** the constraints that still hold (the ~60-70 tool-use band and the output-size discipline). No code behavior change.

## What shipped

- **Harness update section** documenting the genuinely-new Claude Code capabilities (background agents, SendMessage continuation of a single spawned agent, resumable Workflows via `resumeFromRunId`, 1M context relieving context-exhaustion) — and reaffirming the still-active ~60-70 tool-use band (empirically ~28-54 tool uses, v729-v773) and output-size / chunked-Write+Edit discipline. Architectural Fact #1 refined, not superseded; fan-out agents still do not peer-message.
- **Codified Lesson #10158** (mid-flight corrections via the main context, not queued to a finishing agent; from v1.49.584) into the discipline's `key_lessons` — manifest lessons 151 → 152.
- **Retained constrained-harness machinery** (chunked Write+Edit, post-trip salvage) as the multi-runtime / content-filter-trip fallback. Nothing deleted.
- **HAL note** in gupp-propulsion `references/runtime-strategies.md` + the gastown-orchestration chipset, framing `polling` as the non-Claude-Code fallback.

## Verification

- Pre-tag-gate all 20 PASS; discipline-coverage 0/0; CF-H-030 budget (30/30), render-parity (37/37), gastown + skill-schema (387) green.
- CI on dev caught two real regressions before main (gupp word-budget overflow → note relocated to references; #10158 PARTIAL → codified); both fixed and re-verified before re-push.
- Adversarial pre-push review (two rounds): round 1 narrowed first-pass over-claims about the tool-use/output ceilings; round 2 fixed a wrong lesson citation (#10168 → #10158).

## Engine state

NASA degree **1.178** (frozen) · counter-cadence **29** (unchanged) · manifest lessons **152** (#10158 codified).
