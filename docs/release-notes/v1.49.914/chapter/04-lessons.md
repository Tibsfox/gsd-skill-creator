# Lessons Codified — v1.49.914

No manifest codification this ship (it is a gate-hardening ship, not a codify ship). No change to `tools/render-claude-md/disciplines.json`; CLAUDE.md unchanged; the live discipline-coverage state stays at UNCODIFIED 0 / PARTIAL 0. The one carry-forward candidate (#10461, opened v913) advances from 1-instance to 2-instance below.

## Candidate advanced — #10461 (1-instance → 2-instance)

**A test suite that runs nowhere enforced silently rots; gate-enforce every suite, and pair the gate with a drift-guard so the enforced set cannot silently shrink.**

Opened at v913 (tools vitest suite). This ship is the **second instance**, applied to the `node:test` side, plus a new facet on the "enforce" half of the rule.

**Instance evidence:**

| Instance | Ship | Suite | Layer 1 (enforce) | Layer 2 (drift-guard) |
|---|---|---|---|---|
| 1 | v1.49.913 | `vitest.tools.config.mjs` (~40 tools/+scripts/ vitest tests) | pre-tag-gate step 2.5 `tools-suite` | `check-tools-test-coverage.mjs` + `tools-config-coverage.test.mjs` (explicit include-list, exact coverage) |
| 2 | v1.49.914 | the 2 `tools/` `node:test` files (21 tests) | pre-tag-gate step 2.7 `tools-node-test` + CI step | `--print-node-test` exact-set `toEqual` test (a new node:test file forces acknowledgement) |

**New facet surfaced this ship (strengthens sub-rule 1 — "an unenforced suite is unobserved"):** *enforcement reach matters, not just enforcement existence.* The v913 tools-suite was enforced at the pre-tag-gate but not in CI — so a red introduced on a dev push would not surface until tag-time. "Enforced" is not binary; a suite enforced only at one chokepoint (tag) leaves the other (dev/PR push) blind. v914 folds both the vitest tools config and the node:test runner into CI, so the same suite is now enforced at both reaches. This is the same lesson viewed along a second axis (where, not just whether).

**Subtle structural note for the promotion writeup:** the node:test side's Layer 1 uses *dynamic discovery* (the gate runs whatever the classifier finds), so the **runner** cannot drift — a new node:test file is auto-covered. Drift can only enter as a *silent addition* (a new node:test file appearing unnoticed), which the exact-set `--print-node-test` test catches. Contrast the vitest side, whose Layer 1 uses an *explicit include list* that CAN omit a file, so its drift-guard catches *omission*. Two structurally-distinct drift shapes (omission vs silent-addition) under one rule — useful contrast for the eventual manifest entry.

**Promotion path (UNCHANGED bar — 3 instances):** promote #10461 into the manifest on a THIRD instance of either "a test/observability surface ran nowhere enforced and silently rotted" OR "an explicit enforced-set drifted out of sync with disk." Its natural home remains `docs/known-unwired-ledger-discipline.md` (the #10443 discipline), which already treats explicit allowlists as drift-bearing migration debt; the v913+v914 two-instance evidence (omission-drift + silent-addition-drift) is the contrast that entry should carry.

## Disciplines applied (existing — no new codification)

| Lesson | How it was applied this ship |
|---|---|
| #10461 (candidate) | Second instance — gate + drift-guard for the node:test side; + the gate-reach-vs-CI-reach facet |
| #10431 / #10436 | Two-layer closure — gate step (enforcement) paired with a drift-guard (detection); applied to the node:test side |
| #10450 | Static-analysis robustness — the new modes reuse the v913-hardened runner classifier rather than re-deriving it |
| #10417 / #10421 / #10427 | spawnSync runner + no-silent-caps (empty node:test set → notice, not silent skip) + fail-loudly (exit with the child's real status) |
| #10430 | Finer-grained ~5-ship maintenance cadence — the rationale for taking this counter-cadence (#15) ship |

## Cross-references

- #10461 (the candidate this ship advances to 2-instance; opened v913)
- #10431 / #10436 (two-layer closure — the gate-step + drift-guard structure)
- #10443 (KNOWN_UNWIRED ledger / inverse-audit — explicit enforced-sets as drift-bearing debt; #10461's promotion home)
- #10450 (static-analysis tool robustness — the runner classifier reused here)
- #10430 (counter-cadence — finer-grained ~5-ship maintenance cadence; this is counter-cadence #15)
- v1.49.913 (instance 1 of #10461 — the tools-suite gate + Layer-2 drift-guard this ship completes)
