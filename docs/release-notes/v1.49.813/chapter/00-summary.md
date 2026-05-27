# v1.49.813 — Post-T14-reset STATE.md Drift Closure: Atomic Writer Tool

**Released:** 2026-05-27
**Type:** counter-cadence ship (operational-debt closure; new tooling, no new substrate)
**Predecessor:** v1.49.812 — First ProcessContext Chip: intelligence/analyzer/git.ts
**Engine state:** NASA UNCHANGED at 1.178; counter-cadence count 5 → 6
**Wedge:** convert the hand-edit + manual normalize procedure that was the v805→v806 drift source into a deterministic single-command tool, structurally eliminating the drift class at source rather than detecting it after.

## Summary

Fourth ship of the v810-814 chain. Counter-cadence ship: gate-not-vigilance discipline applied to the v805→v806 STATE.md drift class.

The wedge: after each T14, the operator hand-writes a fresh STATE.md for the next milestone, then runs the normalizer to ensure canonical form. The v805→v806 drift was caused by hand-editing without then running the normalizer. v807's S5 ship added a post-write check at the next pre-tag-gate's step 0.5 — informational closure (the regression detector exists), but the drift origin (hand-edit window) was unaddressed.

This ship closes the drift origin: `tools/state-md-set-shipped.mjs` takes milestone metadata as CLI args and emits a fully-normalized STATE.md atomically. The tool runs `state-md-normalizer --write` + `--check` internally as part of its post-write contract, so a successful exit guarantees canonical form. No hand-edit window; no drift possible.

The closure is structurally complete:
- **Source** (v813, this ship): atomic-writer eliminates hand-edit window
- **Detector** (v807, prior ship): pre-tag-gate step 0.5 catches operators who bypass the tool

Both layers ship; either alone is insufficient. Together they convert a process-discipline rule ("remember to normalize after hand-edit") into a gate-not-vigilance pattern per the counter-cadence-discipline doc.

## Deliverables

| Path | Change | Notes |
|---|---|---|
| `tools/state-md-set-shipped.mjs` | NEW | ~220 LOC; arg parsing + content builder + main CLI. Atomic write + spawn normalizer for post-write canonical-form confirmation. Idempotent. Exit codes: 0 written + check pass; 1 invalid args / check fail; 2 I/O error. |
| `tools/__tests__/state-md-set-shipped.test.mjs` | NEW | 7 tests: 3 buildShippedStateContent unit tests (canonical schema, idempotency, version-strip); 3 CLI arg validation tests (missing --version, bad semver, non-hex SHA); 1 end-to-end write + check via tmpdir-isolated mini-repo. |
| `vitest.tools.config.mjs` | MODIFIED | +1 line: adds the new test file to the tools test suite. |
| `docs/T14-SHIP-SEQUENCE.md` | MODIFIED | Adds step 11.5 documenting the atomic-writer tool as the replacement for hand-edit + manual normalize. Cross-references the v807 step-0.5 post-write check as the regression detector. |

## Lessons applied (no new lesson IDs promoted this ship)

| Lesson | Application |
|---|---|
| #10412 (recon-first) | Read `tools/state-md-normalizer.mjs` for the canonical schema reference, `docs/STATE-MD-SCHEMA.md` for the field definitions, the prior ships' hand-authored STATE.md files for the format-by-example, and `docs/T14-SHIP-SEQUENCE.md` for the procedure context. Recon caught: (a) the normalizer is single-pass-idempotent post-v783 (so the tool's belt-and-suspenders spawn is cheap insurance, not a workaround); (b) the schema includes `predecessor.counter_cadence` separately from `counter_cadence` (two independent flags); (c) the `last_updated` field needs ISO-8601 with `.000Z` suffix for the validator. |
| #10414 (gate-not-vigilance) | THE central application of this ship. The hand-edit + normalize rule was a process discipline (operator must remember). The atomic-writer is the deterministic gate (operator runs one command, can't forget the second step). |
| #10416 (lightest wire) | Resisted: a `state-md-template.json` schema-driven generator (premature — the inline template captures all required fields); a `--milestone-name "..."` interactive prompter (mission-creep); a `state-md-update-shipped.mjs` that diffs from current state (more complex than write-from-scratch); integrating into pre-tag-gate (separate concern — pre-tag-gate runs BEFORE ship, this tool runs AFTER ship). Chose: 1 CLI tool + 7 tests + 1 T14 doc step. |
| #10427 (failure-mode contracts) | The atomic-write is followed by a normalize-check spawn that EXITS NON-ZERO if the post-condition fails. Per #10427, when the contract is load-bearing (post-condition: STATE.md is canonical), surface failures loudly. The exit codes are documented in the docstring and tested. |
| #10428 (meta-cadence — codify axis) | This ship is on the consume axis (consumes the v807-introduced regression detector + extends it with the source closure). The codify axis is overdue per #10428's ~7-10-ship spacing; queued for v814. |
| #10430 (5-1-1 counter-cadence alternation) | This is the 5-1-1 alternation in action: 3 forward-cadence ships (v810 substrate-consumer, v811 batch chip, v812 first ProcessContext chip) + 1 counter-cadence (this ship) + a planned 1 codification (v814). The micro-cadence matches the discipline's intent. |

## What this ship is not

- Not a NASA degree advance. NASA sustains at 1.178.
- Not a new chokepoint or substrate. Tool surface only.
- Not a backfill of past STATE.md files. v813 onward uses the tool; v812 and earlier remain as-shipped.
- Not a pre-tag-gate integration. The atomic-writer is post-ship (T14 step 11.5); pre-tag-gate continues to detect drift if the tool is bypassed.

## Verification

- `npm run build` → PASS.
- `npx vitest run --config vitest.tools.config.mjs tools/__tests__/state-md-set-shipped.test.mjs` → 7/7 PASS.
- `bash tools/pre-tag-gate.sh` → all 17 steps PASS. PROJECT.md drift PASS after pre-bump refresh from v809 → v812.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — 31 consecutive ships at 1.178). Counter-cadence count **5 → 6** (this is a counter-cadence ship).

Manifest entries: **20 → 20** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: **8 → 8** (UNCHANGED).

## Migration progress

| Surface | At v812 | At v813 |
|---|---|---|
| Egress `KNOWN_UNWIRED` | 11 | 11 (UNCHANGED) |
| Process `KNOWN_UNWIRED` | 37 | 37 (UNCHANGED) |
| STATE.md drift class | partial closure (v807 detector) | **complete closure (source + detector)** |

## Forward path

- **Codification audit** (overdue per #10428) — promote 8 tentative observations to lesson-candidate status as warranted.
- **Batch chip aminet family** — 5 ProcessContext callers; same shape as v812.
- **NASA 1.179** — 31 consecutive at 1.178.
