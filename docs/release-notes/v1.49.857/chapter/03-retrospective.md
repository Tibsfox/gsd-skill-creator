# v1.49.857 — Retrospective

**Wall-clock:** ~50-60 min from session pickup (v856 handoff read + operator order/cadence decision) to release-notes draft complete. Lower end of the codify-ship range — v847 took ~60-75 min for 5 lessons; v857 ships 1 lesson + 1 tool + 1 test file in roughly the same envelope because the tool authoring offset the lesson count drop.

## What went as expected

- **The v856 handoff identified the candidate explicitly.** v856 close listed exactly one eligible codify candidate (stale-entry inverse-audit, 2 instances from v834 + v852). Per-ship recon during v834+v852 had already pre-validated the pattern. No discovery time wasted.
- **The codify-ship template was directly applicable.** Same shape as v847: extend existing discipline doc + extend disciplines.json key_lessons + render CLAUDE.md. The added scope was a single-file tool + a test surface — both followed established patterns (`tools/*.mjs` shape per #10421; `tests/security/*.test.ts` with spawnSync + temp-fixture pattern per v854).
- **The discipline doc already had the right home.** `docs/known-unwired-ledger-discipline.md` had a placeholder "## Forward observations / ### Unidirectional enforcement asymmetry" section from v812. v857 replaces it with the formal `## Inverse-audit: stale-entry detection (Lesson #10443)` section. No restructuring of unrelated content needed.
- **Render-claude-md passed cleanly.** #10443 appears in the rendered Operative-disciplines section under KNOWN_UNWIRED entry alongside the new tool path.

## What I noticed

- **The cross-audit tool consolidates without duplicating.** The v838 inline inverse-check inside `process-context-audit.test.ts` + `egress-context-audit.test.ts` remains for defense-in-depth + automatic vitest enforcement. The new tool re-implements the same logic at the cross-audit layer so pre-tag-gate or ad-hoc invocations can verify allowlist health without booting vitest. Both surfaces stay in sync because they both regex-extract from the same source — the audit-test files.
- **Shape A vs Shape B asymmetry teaches the META-pattern.** Shape A was closed inline at v838 (4 ships after v834 surface). Shape B remained undetected for 18 ships after v852 surface — until this codify ship. The contrast between "fast inline closure" + "slow META codification" shows that single-shape closures don't preempt the discipline; the META pattern emerges from cross-shape evidence.
- **EgressContext shape-B equivalence was already in place.** EgressContext's existing "KNOWN_UNWIRED contains `fetch(`" check at line 199 of `egress-context-audit.test.ts` IS the shape-B equivalent for signature-driven chokepoints. Documenting this in the new discipline section is honest scope-clarification — the tool doesn't need a redundant shape-B check for Egress.
- **The 6-test fixture-based test surface is the lightest reliable wire.** Each fixture creates a tmpdir + writes synthetic audit-test files + invokes the tool via spawnSync. No mocking of `readFileSync` etc; the real I/O exercises the real regex parser. Each test is ~10 LOC of fixture setup + ~5 LOC of assertions.

## What surprised me

- **The shape-B detection regex needed careful handling of `type` imports.** `import type { ChildProcess }` is a type-only import that doesn't need a runtime use; if I'd flagged it as shape-B-stale, false positives would have surfaced. The tool's regex is permissive — it captures the import names whether or not the `type` modifier is present, then checks usage in the body. Type-only names that aren't used at the type level WOULD be flagged; but in practice all type imports get referenced as type annotations, which the regex finds. Worked out, but worth a closer look if the test set ever expands.
- **The codify + tool same-ship pattern feels lighter than the v847 codify-only ship.** v847 promoted 5 lessons but had no runtime-enforcement deliverable; the ship was pure documentation. v857 promotes 1 lesson + ships a deterministic enforcement tool — feels more concrete + the test surface gives faster feedback than waiting for the next per-ship recon to catch a Shape C drift. Worth tracking as a below-threshold observation.
- **Lessons in manifest count: 83 → 84.** Adding #10443 increments the count by exactly 1. The UNCODIFIED count of 39 is unchanged at this ship (per the scanner's "2+ retrospective emissions" rule).

## Risk that didn't materialize

- **No false positives from the tool's first run.** Both KNOWN_UNWIRED lists (Process 11 + Egress 11) are clean against both shape checks. The tool's first deployment doesn't surface any stale entries that would require a chip ship before the v858 campaign can proceed.
- **No CLAUDE.md render conflict.** The `<!-- AUTO:disciplines:* -->` markers handled the JSON extension cleanly — the KNOWN_UNWIRED entry's longer summary + new lesson ID render without manual touch-up.
- **No vitest test failure.** The new test file (`tests/security/check-stale-known-unwired.test.ts`) ran 6/6 PASS on first invocation. No flakes; no temp-dir cleanup races.
- **No discipline-coverage regression.** 23 manifest entries / 84 lessons / 39 UNCODIFIED ≤ ceiling 41. Holds.

## Carried forward (post-v857)

NEW this ship: 1 below-threshold observation.

- **Codify + tool same-ship pattern** — 1 instance from this ship. When a codify candidate's forward-observation explicitly names a tool that would close the gap, shipping the codification + the tool together is faster than splitting. Wait for 2nd instance to disambiguate from "this was just the right time" vs "a recurring shape."

Inherited from v847 close (UNCHANGED below-threshold observations carry forward):
- Full-backlog-clear codify ship pattern (v847, 1 instance).
- Fire-and-forget over awaited for observability writes (v846, 1 instance).
- Canonical-doc-decision ship pattern (v844, 1 instance).
- Recent-vs-baseline-recent comparison pattern (v841, 1 instance).
- Drift-check noise as scoring-system feedback loop (v841, 1 instance).
- Codify-ship-as-recon-consolidator pattern (v840, 1 instance).
- Deferral-by-classification-ambiguity (v840, 1 instance).
- Auto-run-on-import as bootstrap-time tax (v836, 1 instance).
- Polarity convention for inverted-mechanic thresholds (v837, 1 instance).
- Bidirectional enforcement completeness (v838 + v836, 1-2 instances; ambiguous; DEFERRED v840 — UNCHANGED v847 + v857).

## Process retrospective

- **Codify ships invest in the codify axis.** v857 is the 1st codify ship after v847's full-backlog-clear — within the 7-10 ship cadence floor + upper bound; landing at the upper bound matches the operator's preference for closing the codify backlog before opening the next chip cluster.
- **Doc + tool same-ship is defensible for single-file tools.** The tool was 1 file ~210 LOC + a 6-case test file. For larger tools (e.g., the proposed `tools/security/refactor-known-unwired-allowlist.mjs` if one ever surfaces), splitting codification from implementation would be the right default.
- **Next session pickup is the Track 2 Process chip cluster** (v858-v862; 5 chips from KNOWN_UNWIRED Process 11 → ~6). Each chip ship re-runs `node tools/security/check-stale-known-unwired.mjs` post-edit to verify the new chip doesn't leave a stale entry. Track 3 Egress cluster (v863-v867) follows.

## Verdict on scope

This ship invests in the **codify axis**. It is the 10th forward-cadence tick of codification since the codify-axis cadence reset at v847 (within the 7-10 ship upper bound of #10428). Per the meta-cadence discipline, codifying the stale-entry inverse-audit BEFORE the next chip cluster is correct — the tool catches any regressions the chip cluster might introduce. The discipline pays the small upfront cost of running the tool per chip (sub-second) in exchange for deterministic stale-entry detection across the cluster.
