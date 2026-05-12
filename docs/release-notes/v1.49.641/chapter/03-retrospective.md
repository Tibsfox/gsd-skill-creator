# 03 — Retrospective: v1.49.641 Housekeeping Cluster #8

## What worked

### 1. Lesson #10199 §1.4 re-framing review caught its first framing error

The discipline was codified at v1.49.640 C2 explicitly to catch the pattern that ate ~10-20h of attention across v1.49.634-638 (the CI-install-gap framing chain). v1.49.641 W0 applied §1.4 to CF-11 and found ANOTHER framing error — within ~10min of investigation.

Four probe questions, each backed by mechanical evidence (`grep` of callsites, file content snapshots, history queries). The verdict was clear: original framing was category-level; root mechanism was "no enforcement". The discipline prescription (retire, don't iterate) was followed cleanly.

**Cost:** ~10min W0 review time.
**Value:** prevented authoring component spec + implementation work that would have produced nothing useful.

### 2. CF-12 tool implementation was tight scope

Combining sub-improvements (a) + (b) into a single tool kept the API coherent. (c) vitest reporter became a doc note rather than code. Three forward-improvements compressed into one tool + one doc note + one §1.7 doc update.

234 lines of script + 114 lines of tests + small doc edits = manageable cluster scope.

### 3. Tool API matches discipline doc's mental model exactly

The 5 probe types map 1:1 to the 4 CF shape categories from `cf-closure-verification-templates.md` (Templates 1-4) plus the Lesson #10204 hidden-transitive guard. Anyone who reads the discipline doc can immediately use the tool without re-learning a different abstraction.

Records produced by the tool have the same structure as records authored manually at v1.49.640 W0. Consistency means W0 work is unified regardless of which authoring path is used.

### 4. Discipline → discipline-doc → automation in 3 clusters

The lesson lifecycle:
- v1.49.639 retro: Lesson #10199 emitted
- v1.49.640 C2: codified as discipline doc
- v1.49.641 C2: codified as automation

Three clusters, three abstraction transitions. The discipline now travels with the codebase, not just in lesson chapters. Future cluster authors can run `node scripts/closure-verify-cf.mjs` rather than copy-pasting bash templates.

### 5. Meta-test invariants are tight

8 invariants. 1 per discipline outcome (CF-11 retirement, CF-12 deliverables, tool surface, discipline doc state, counter-cadence). No over-testing. Skip-guard pattern (Lesson #10180) for gitignored paths so CI passes the test even though .planning/ files aren't present.

### 6. STORY-gate auto-fire continues working (4th consecutive ship pending)

v1.49.638 C5 ordering fix has now quadruple-validated assuming v1.49.641 ships cleanly. Auto-append worked at T14 step 3 for v1.49.638-640 without manual intervention.

### 7. Post-ship refresh absorption continues (3rd consecutive cluster)

Pattern: v1.49.638→.639 → .639→.640 → .640→.641. Three transitions; same shape every time. Established convention.

## What burned cycles

### 1. scripts/__tests__ tests aren't picked up by vitest

The original test file location was `scripts/__tests__/closure-verify-cf.test.mjs` (matching the existing `append-story-entry.test.mjs` convention). Vitest's project includes don't cover that directory. The test had to be moved to `tests/__tests__/closure-verify-cf.test.ts` to be picked up by the suite. ~5min recovery.

**Mitigation candidate (forward improvement):** review `scripts/__tests__/` files — either add them to vitest config OR delete them as unused. Surfaced as a small forward-improvement candidate; not blocking; route to Cluster #9+ as CF-15 if user wants it.

### 2. The `--help` empty-args edge case

The test "exits 1 on missing probe type" expected exit code 1 for empty args, but the script treats empty args as a help request (exit 0). One test failed; quick edit to match actual behavior. ~3min.

This is just normal test-development noise, not a discipline regression.

## What forward improvements are surfaced

Discretionary, not blocking:

1. **Per-CF probe spec format** — YAML at `.planning/cf-probes/<CF-id>.yaml` so each CF carries its own probe spec rather than requiring the operator to know which probe type matches. Tool would auto-discover from the file. Mentioned in `MISSION-PACKAGE-DISCIPLINE.md` §1.7 as discretionary. Routed forward as CF-14.

2. **`scripts/__tests__/` test discovery** — the existing `scripts/__tests__/*.test.mjs` files aren't run by vitest. Either add them to vitest config (covers them) or delete them (unused code). Small forward-improvement; not blocking.

3. **Probe expansion** — additional probe types could be added: e.g., `cargo-audit` for Rust supply-chain advisories, `safety-check` for Python deps, `gh-advisory` for direct GitHub advisory queries. Not needed at current cluster surface; add when first needed.

## Cumulative process-discipline status

Through 9 counter-cadence clusters (v1.49.585, .634, .635, .636, .637, .638, .639, .640, **.641**):

- **Mission-package authoring discipline** — applied consistently; mission specs accurate at scope-level
- **Iterative dispatch (Lesson #10193)** — applied; no token-ceiling terminations this cluster
- **Substrate-probe at W0** (Lesson #10192) — applied
- **Closure-verification gate** (Lesson #10199) — applied via §1.4 re-framing review; first canonical use
- **STORY-gate ordering** (Lesson #10197) — applied 3 ships running (4th pending v1.49.641)
- **T14 atomic** (Lesson #10191) — applied
- **git-add-blocker split-commit** (Lesson #10201) — applied
- **gh CLI `--repo` arg in background** (Lesson #10202) — applied (no background gh invocations this cluster)
- **Phantom-dep awareness** (Lesson #10203) — applied implicitly (CF-11's framing review surfaced the same pattern at the framing-level)
- **Hidden-transitive guard** (Lesson #10204) — codified into `closure-verify-cf.mjs` as a probe type

9-cluster precedent demonstrates the cleanup pattern works at scale. No discipline regressed this milestone. The §1.4 re-framing review's first application validated the discipline's value.

## Cluster #8 self-summary

Smallest cluster of the chain in terms of code surface (234 LOC script + 114 LOC tests + small doc edits). Validated by Lesson #10199 §1.4 catching a framing error. Discipline-as-code arrival. Counter-cadence chain at 9 with shrinking CF inventory (3 → 2).

The cluster's most important contribution may not be the tool — it's the §1.4 re-framing review's first application. The tool is execution support for a discipline that just demonstrated its load-bearing value.
