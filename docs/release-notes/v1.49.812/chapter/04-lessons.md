# v1.49.812 — Lessons

## New lesson candidates (0)

No new candidates this ship. Backlog: 0 candidates + 8 tentative observations (UNCHANGED from v811).

## Lessons applied (existing)

| # | Lesson | Application |
|---|---|---|
| #10412 | Recon-first per file | Read `src/intelligence/analyzer/git.ts` + `src/security/process-context.ts` + existing test + the single src/ caller `core.ts` BEFORE writing the chip. Recon caught: (a) `ProcessOp` is kebab-case (`'exec-file'`, not `'execFile'`) — build caught this on first try; (b) `hasGitRepo` early-return means denial tests must use a real temp git repo. |
| #10414 | Chokepoint retrofit pattern | Mirrored v806 LoaderContext / v809 EgressContext shape: optional `ctx?`, ensure*Allowed() outside try, default = call-site-provided permissive. |
| #10416 | Tolerant-generator / lightest wire | Resisted: chipping the `core.ts` caller; batch-chipping git/core/* (separate family); extracting a shared `reThrowSecurityDenials(err)` helper (premature at 2 instances). Chose: 1 file + 2 tests + 1 KNOWN_UNWIRED removal. |
| #10422 | Verdict-pattern surface separation | Chokepoint enforcement lives in `src/security/`; wire decision lives in operator judgment + release notes. KNOWN_UNWIRED entry removal is the audit's BehaviorViewpoint update. |
| #10427 | Failure-mode contracts | THE central application. The existing `catch {}` (parameter-less swallow) was the right shape for "best-effort observability" — preserved. New `catch (err)` form checks `instanceof ProcessContextDenied` first and re-throws so security denial propagates while accessory git errors continue to swallow to null. |

## Tentative observations carried forward (8 — UNCHANGED from v811)

No changes this ship.

## New observations flagged this ship (not promoted; not in count)

**Audit-test KNOWN_UNWIRED unidirectional shape.** The audit-test enforces "files NOT in KNOWN_UNWIRED but containing child_process imports must call ensureProcessAllowed" but does NOT conversely enforce "files in KNOWN_UNWIRED must NOT call ensureProcessAllowed." A wired file can carry a stale KNOWN_UNWIRED entry indefinitely without any test failure. Forward observation: worth a future audit enhancement adding the inverse check. Not urgent — the manual chip cadence (per release notes) catches this. Tentative; not a candidate yet (~1 instance noticed).

**`instanceof ProcessContextDenied` pattern is now at 2 instances** (audit-orchestrator.ts:116 from v809 + git.ts from v812). Per #10426's "extract at 2nd-3rd instance" rule, this is borderline. If a 3rd instance lands (likely the first time a future ProcessContext chip touches another swallow-catch site), extract a shared `reThrowSecurityDenials(err)` helper. For now, the 2-line pattern is below the abstraction threshold per #10416.

## Cross-references

- #10412 + ProcessOp kebab-case → recon-first caught the build error before any test-author work
- #10414 + v809 pattern transfer → cross-chokepoint shape consistency lets v812 inherit v809's design decisions without rethinking
- #10422 + #10427 → audit-test is observability AND enforcement (load-bearing per #10427)
- #10416 + 2-instance pattern → resisted shared `reThrowSecurityDenials` helper at exactly the right threshold

## What this ship illustrates about cross-chokepoint pattern transfer

The v806 chokepoint extension introduced two sibling chokepoints (EgressContext + ProcessContext) sharing a common shape:
- Optional `ctx?` parameter
- `ensure*Allowed()` enforcement helper
- Typed `*ContextDenied` error class
- Audit sink with record(record) signature

v809 wired the first EgressContext consumer (npm.ts). v812 wired the first ProcessContext consumer (git.ts). The wire shape is structurally identical at the Token level — every line of v812's git.ts wire corresponds to a line in v809's npm.ts wire with one symbol substitution.

This validates the v806 design decision to make the chokepoints structurally siblings rather than ad-hoc per-domain APIs. The "three sibling chokepoints" framing in `docs/security-chokepoints.md` (v806) accurately predicts how chips would look once they happen — every future first-chip of LoaderContext, EgressContext, or ProcessContext can use the established sibling's template verbatim.

For the remaining 37 process callers, the v812 template is now the default. Family-batch ships (v811-style for ProcessContext) can apply the template 4-5× per ship after the first per-family chip establishes the family-specific shape.
