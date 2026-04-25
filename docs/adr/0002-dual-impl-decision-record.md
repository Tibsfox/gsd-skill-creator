# ADR 0002 — Dual-implementation hook pairs: precedence decision record

- **Status:** Accepted
- **Date:** 2026-04-25
- **Milestone:** v1.49.576 (OOPS-GSD Implementation, Phase 821 / Component C0)
- **Supersedes:** none
- **Superseded by:** none
- **Depends on:** ADR 0001 (vendoring policy)
- **Related:** OGA-048, OGA-049, OGA-050, OGA-051

## Context

Four hook lifecycles in `$REPO/.claude/hooks/` carry two scripts each — a `gsd-`-prefixed shell or `.js` script vendored from upstream `gsd-build/get-shit-done@1.38.3`, and a `.cjs` sibling added later as a local enhancer. In every case, both halves are currently registered in `$REPO/.claude/settings.json` and both fire on the relevant event (verified by the C0 settings-audit). This is the dual-implementation pattern catalogued by Part A as OGA-048 through OGA-051.

The C0 audit confirms the on-disk and registration state for each pair:

| Pair | Vendored half | Local half | Both registered? | Authority today |
|------|---------------|------------|------------------|-----------------|
| OGA-048 validate-commit | `gsd-validate-commit.sh` | `validate-commit.cjs` | YES (PreToolUse, Bash) | undefined (whichever errors first wins) |
| OGA-049 phase-boundary | `gsd-phase-boundary.sh` | `phase-boundary-check.cjs` | YES (PostToolUse) | split-by-matcher (Write\|Edit vs Write) |
| OGA-050 session-state | `gsd-session-state.sh` | `session-state.cjs` | YES (SessionStart) | ordering-determined (.cjs first, .sh last-writer-wins) |
| OGA-051 snapshot/recovery | `gsd-snapshot-session.js` | `pre-compact-snapshot.cjs` + `post-compact-recovery.cjs` | NO (only the vendored half registered) | SessionEnd-only; recovery half silently inert |

Without a precedence decision per pair, C2 (dual-impl triage) cannot retire the redundant half without the risk of silently changing behaviour. ADR 0001 made the marker policy possible; this ADR records the per-pair decisions so C2 has a fixed brief to execute against.

## Decision

For each pair, the decision below records: **(a)** which half is authoritative, **(b)** which half stays on disk after C2 retires the loser from `settings.json`, **(c)** the ADR 0001 marker state to apply to each.

The general rule across all four pairs: **the locally-authored `.cjs` enhancer is preferred over the vendored shell/`.js` original**, for these reasons:

1. The `.cjs` enhancers were added because the vendored versions were missing project-specific behaviour. Keeping the enhancer and retiring the vendored copy preserves that work.
2. Most `.cjs` enhancers have vitest companion tests already in tree (`gsd-inject-snapshot.test.ts`, `gsd-restore-work-state.test.ts`, `gsd-save-work-state.test.ts`, `gsd-snapshot-session.test.ts`); the vendored shell scripts do not. Retiring the tested half would be a regression in test coverage.
3. Per ADR 0001, the vendored half can stay on disk in **state A** (`local-modified: false`) so `gsd update` continues to track its upstream lineage without a write conflict. The local half stays on disk in **state C** (`gsd-skill-creator-hook-version`).

The exception is OGA-051, which is a triple, not a pair, and has a different shape (one Save script + one Restore-script-pair-with-no-current-event-binding). The decision for OGA-051 is to keep all three scripts but wire each to a distinct lifecycle event.

## Per-pair decisions

### OGA-048 — validate-commit

- **Authoritative:** `validate-commit.cjs` (the local `.cjs` enhancer)
- **Retire from settings.json:** the `gsd-validate-commit.sh` registration
- **On-disk fate:** `gsd-validate-commit.sh` stays on disk; per ADR 0001 it is in state A (`gsd-hook-version: 1.38.3`, `local-modified: false`, no `gsd-skill-creator-hook-version`). C6 may revisit it as part of the upstream-vendoring sweep.
- **Marker on the kept `.cjs`:** state C (`gsd-skill-creator-hook-version: v1.49.x`).
- **Rationale:**
  1. The `.cjs` already has both a vitest companion test in tree and a `bats` test under `.claude/hooks/tests/validate-commit.bats` (per M3 inventory). Retiring it would lose that coverage.
  2. The `.cjs` is the file that local maintainers edit when they need to extend the commit-validation policy (Wave Commit Markers, no-Claude-trailers rule, etc.); the vendored `.sh` is frozen at `1.38.3`.
  3. The current dual-fire state has been working but is undocumented — making an explicit choice now eliminates the "whichever errors first wins" non-determinism.
- **Risk:** low. C2 should run the existing test suite (validate-commit.bats + vitest) before and after the registration change to confirm no regression.

### OGA-049 — phase-boundary

- **Authoritative:** `phase-boundary-check.cjs` (the local `.cjs` enhancer)
- **Retire from settings.json:** the `gsd-phase-boundary.sh` registration
- **On-disk fate:** `gsd-phase-boundary.sh` stays on disk in ADR 0001 state A.
- **Marker on the kept `.cjs`:** state C.
- **Matcher correction:** when C2 makes the change, the `.cjs` registration must be widened from `Write` to `Write|Edit` to match the broader matcher the retired `.sh` was using. Per OGA-049, the asymmetric matchers were a drift symptom; the wider matcher is the correct one (phase boundaries can be triggered by Edit operations as well as Write).
- **Rationale:**
  1. Same general rule (prefer the local `.cjs`).
  2. STATE.md updates depend on phase-boundary detection firing on both Write and Edit. The `.cjs` currently only fires on Write — widening its matcher restores correct behaviour while retiring the `.sh`.
- **Risk:** medium. C2 must add a regression test that runs an Edit-only sequence which should advance phase and asserts STATE.md updated, per OGA-049's proposed action.

### OGA-050 — session-state

- **Authoritative:** `session-state.cjs` (the local `.cjs` enhancer)
- **Retire from settings.json:** the `gsd-session-state.sh` registration
- **On-disk fate:** `gsd-session-state.sh` stays on disk in ADR 0001 state A.
- **Marker on the kept `.cjs`:** state C.
- **Rationale:**
  1. Same general rule.
  2. The current ordering (`.cjs` first, `.sh` second) means `.sh` already last-writer-wins for any state file both touch. Retiring the `.sh` makes the `.cjs` the only writer, eliminating the silent race.
  3. Per OGA-020, this consolidation also saves ~50–200 ms of SessionStart latency.
- **Risk:** low–medium. C2 must verify the `.cjs` covers any state-file paths the `.sh` was writing — the OGA-050 evidence flagged "if they disagree on canonical state file location" as the failure mode.

### OGA-051 — snapshot/recovery (triple, not pair)

OGA-051 is structurally different from the three pairs above. There are three on-disk scripts that together implement the Save/Restore lifecycle, and the current settings.json registers only one of them (at the wrong event). The decision is **wire all three; retire none**.

- **`gsd-snapshot-session.js`** stays at SessionEnd. It writes a full session archive on session close; this is its existing role and remains correct. ADR 0001 marker: state A initially (vendored, unmodified) — C2 should triage whether any local edits exist; if so, flip to state B.
- **`pre-compact-snapshot.cjs`** must be **newly registered** at `PreCompact`. It is the lightweight save that runs immediately before a context-window compaction, so the post-compaction restore has something to read. Currently unregistered (silently inert). ADR 0001 marker: state C (locally authored, never came from upstream `1.38.3`).
- **`post-compact-recovery.cjs`** must be **newly registered** at `PostCompact`. It is the restorer that reads what `pre-compact-snapshot.cjs` wrote. Currently unregistered (silently inert). ADR 0001 marker: state C.
- **Common state-file path:** `pre-compact-snapshot.cjs` and `post-compact-recovery.cjs` must agree on a single state-file path (per OGA-051 proposed action; e.g., `.planning/snapshots/pre-compact.json`). C2 must verify this in the implementation.
- **Rationale:** OGA-013 is a BLOCK-severity ticket because PostCompact recovery is currently absent in production. The wire-up here is the implementation half of that BLOCK. There is no half to retire — the three scripts implement three distinct lifecycle roles.
- **Risk:** medium. C2 (or the eventual implementer of OGA-013) must add a regression test that triggers compaction in a long session and asserts `STATE.md` is restored after the PostCompact event fires.

## Consequences

### Positive

- C2 now has a deterministic brief: for the three pairs, retire the vendored half from `settings.json`; for the triple, wire two new event slots.
- The "whichever errors first wins" / "ordering-determined" / "split-by-matcher" non-determinisms in the current settings.json all collapse to single-author authority.
- Per OGA-048's performance note, retiring the redundant PreToolUse-on-Bash hook saves ~22–40 ms per Bash call (≈1.3–2.4 s/session at observed 60 Bash calls/session). The PostToolUse and SessionStart consolidations save additional latency.
- PostCompact recovery becomes operative for the first time, closing the OGA-013 BLOCK.

### Negative

- C2 must run the relevant regression tests carefully; the dual-fire state has been masking any divergence between the two halves of each pair, and retiring one half exposes the surviving half as the sole authority. Any subtle behaviour the retired half was performing must be confirmed present in the surviving half.
- Three on-disk scripts (`gsd-validate-commit.sh`, `gsd-phase-boundary.sh`, `gsd-session-state.sh`) become dormant — present on disk for `gsd update` to track but not registered in `settings.json`. This is the intended state per ADR 0001 (state A: upstream-unmodified vendor copy). It is not dead code and should not be deleted; deleting it would orphan the upstream lineage.

### Neutral

- The general rule "prefer `.cjs` enhancer over vendored shell" may not apply forever. If a future ADR establishes a "no local edits to vendored files" policy (ADR 0001 Alternative 4), the choice flips. This ADR is correct under the current ADR 0001 (Alternatives 1–4 considered; option a chosen).

## Alternatives considered

### Alternative — keep both halves in all four pairs (status quo, rejected)

Documented as the OGA-048 through OGA-051 finding. Rejected for the reasons given in those rows: undocumented authority, performance tax, and audit/evidence problem.

### Alternative — prefer the vendored shell in every pair (rejected)

Would simplify `gsd update` (every vendored file is state A) but would lose the project-specific enhancements baked into the `.cjs` files and would lose vitest test coverage. Rejected as a net regression.

### Alternative — fold each `.cjs` into its `.sh` and retire the `.cjs` (rejected)

Would require porting `.cjs` logic back into shell, which is a significant rewrite for behaviour that is already tested in TypeScript/Node. Rejected as a poor tradeoff between policy purity and delivered work.

## References

- ADR 0001 — Vendoring policy (the marker policy this ADR cites for state A / state B / state C)
- OGA-048 — Dual-impl hook pair: validate-commit
- OGA-049 — Dual-impl hook pair: phase-boundary
- OGA-050 — Dual-impl hook pair: session-state
- OGA-051 — Snapshot-pair status (PreCompact/PostCompact)
- OGA-013 — BLOCK PostCompact recovery (the impact wrapper for OGA-051)
- OGA-020 — SessionStart consolidation (the latency-budget context for OGA-050)
