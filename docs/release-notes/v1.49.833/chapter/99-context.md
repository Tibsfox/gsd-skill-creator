# v1.49.833 — Context

## Provenance

Codify ship at v830-833 chain close. Operator authorization at this session: "v833 codify ship" selected from the post-v832 next-direction prompt. Predecessors: v830-832 Option C arc (4 codification-eligible patterns accrued).

## What this ship adds

```
docs/cross-rootdir-wire-discipline.md                   [NEW ~125 LOC]
tools/render-claude-md/disciplines.json                 [+15 LOC, 1 new entry]
CLAUDE.md                                                [regenerated, gitignored]
```

No src/ files modified. No tests added. No .college/ files modified.

## Recon trail (per #10422 ledger-driven work discipline)

1. **Confirm 4 patterns are eligible:** Cross-rootdir wire (5 inst.), substrate-consumer hook pair (2 inst.), `onPredictions` wire (2 inst.), #10433 LOC-band refinement (3 inst.). Verified from v830 + v831 + v832 04-lessons.md entries.
2. **Read existing discipline doc templates:** `docs/architecture-retrofit-patterns.md`, `docs/security-chokepoints.md`, `docs/counter-cadence-discipline.md`. Architecture-retrofit is the closest structural template (multi-pattern codification with subordinate sections).
3. **Identify the strongest pattern:** Cross-rootdir wire at 5 instances clearly dominates the other 3 (2-3 instances each). Codify it; defer others to preserve doc clarity.
4. **Check `tools/render-claude-md/disciplines.json` structure:** JSON array of `{ domain, trigger, summary, canonical_docs, key_lessons, codified_at_milestone }` objects. Append a new entry; run `npm run render:claude-md` to regenerate CLAUDE.md.
5. **Determine next available Lesson ID:** Latest in manifest is #10434 (v824). #10435 is the next.
6. **Author the discipline doc:** 4-step pattern + 2 subordinate patterns + when-it-applies + carried-forward observations section.
7. **Append manifest entry:** With 6 canonical_docs covering both contract families' interfaces + impls + tests.
8. **Regen + verify:** `npm run render:claude-md` → CLAUDE.md updated; `node tools/check-discipline-coverage.mjs` → 23 domains / 77 lessons / 39 UNCODIFIED (UNCHANGED, ≤ ceiling 41).
9. **`npm run build`:** clean.

## Discipline-extension vs new-domain choice

NEW DOMAIN. The cross-rootdir wire pattern doesn't fit cleanly into existing entries:
- NOT a security chokepoint (`docs/security-chokepoints.md` is for `ctx?` parameter threading; cross-rootdir wire is structural).
- NOT an architecture retrofit (`docs/architecture-retrofit-patterns.md` is about N-call-site refactors; cross-rootdir wire is N-line additions to specific surfaces).
- NOT a meta-cadence axis (`docs/meta-cadence-discipline.md` is about codify/consume/calibrate balance; cross-rootdir wire is a structural pattern, not an axis).

A new domain is justified by the evidence base (5 instances) and the absence of a fitting parent.

## What was deferred

- **Codification of 3 other eligible patterns** — substrate-consumer hook pair (2 inst.), `onPredictions` wire (2 inst.), #10433 LOC-band refinement (3 inst.). Carried forward to next codify ship (likely v840+) with explicit notes in `docs/cross-rootdir-wire-discipline.md` § "Carried-forward observations".
- **Verification-only ships extension to `docs/meta-cadence-discipline.md`** — 2 instances (v829 + v832); defer.
- **NASA 1.179 forward-cadence** — 51 consecutive ships at 1.178 at v833 close; widest open margin. Post-codify ship.
- **Continued ProcessContext singleton chips** — ~13 entries remain.

## Verification trail

| Step | Result |
|---|---|
| `npm run render:claude-md` | CLAUDE.md updated (line 113-114 contains new Cross-rootdir wire pattern entry) |
| `node tools/check-discipline-coverage.mjs` | 23 domains / 77 lessons in manifest / 39 UNCODIFIED (UNCHANGED, ≤ ceiling 41) |
| `npm run build` | PASS (JSON edit + new doc; no transpile impact) |
| Pre-tag-gate (full) | expected 17/17 PASS (step 13 within-ceiling) |

## T14 ship sequence (operator-only authorization)

Per Lesson #10191 (atomic directive state) + Lesson #10184 (single-step main FF) + Lesson #10197 (STORY-gate post-bump-version). Canonical sequence at `docs/T14-SHIP-SEQUENCE.md`.

Milestone-specific notes:
- No deviations from the canonical sequence.
- Codify ship at chain close (4th ship of v830-833 chain).

## Forward path

- **NASA 1.179 forward-cadence** — STRONG-DEFAULT post-v833 (51 consecutive ships at 1.178; widest open pressure margin).
- **Continued ProcessContext singleton chips** — ~13 entries; small ships ~30-45 min each.
- **Future codify ship** (likely v840+) — picks up the 3 deferred eligible patterns.
- **T2.1 v1.50 unblock-or-archive decision** — operator-bounded.
- **Bounded-learning calibration of `lowConfidenceThreshold`** — the 6th wired calibratable threshold (from v830). Needs production observation data first.

## References

- Predecessor: v1.49.832 (`docs/release-notes/v1.49.832/`)
- v827-829 chain handoff: `.planning/HANDOFF-2026-05-27-v1.49.827-829-chain-3-of-5-ships-shipped.md`
- This ship's discipline doc: `docs/cross-rootdir-wire-discipline.md`
- Lesson #10435 evidence anchors: v1.49.823 + v1.49.829 + v1.49.830 + v1.49.831 + v1.49.832 release-notes directories
- Manifest source: `tools/render-claude-md/disciplines.json`
- CLAUDE.md regenerator: `tools/render-claude-md.mjs`
- Coverage checker: `tools/check-discipline-coverage.mjs`
- Closest structural template: `docs/architecture-retrofit-patterns.md`
