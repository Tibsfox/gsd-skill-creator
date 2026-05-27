> Following v1.49.832 — _T1.3 Option C Integration (Selector 2nd-Caller Wire + tests/integration/ Cross-Rootdir Verification)_, v1.49.833 is the codify ship that closes the v830-833 chain. Promotes the Cross-Rootdir Wire Pattern from 5-instance observation (v823 + v829 + v830 + v831 + v832) to a codified discipline at `docs/cross-rootdir-wire-discipline.md` (Lesson #10435) — the new entry covers the 4-step declare/satisfy/bridge/verify wire shape, the local-interface redeclaration subordinate discipline, and the `Pick<T, K>` structural-handle narrowing pattern. Three other eligible patterns (substrate-consumer hook pair, onPredictions wire, #10433 LOC-band refinement) are carried forward to next codify ship with explicit notes — defers volume in favor of evidence-rich single-pattern codification.

# v1.49.833 — Codify Cross-Rootdir Wire Pattern as Discipline (Lesson #10435)

**Shipped:** 2026-05-27

Codifies the Cross-Rootdir Wire Pattern as a new discipline domain — Lesson #10435 — synthesizing 5 instances of evidence across two distinct contract families (`SkillActivationObserver` v823+v829; `ConceptFallbackProvider` v830+v831+v832) into a reusable 4-step pattern: **declare → satisfy → bridge → verify**. Manifest entries 22 → 23. Resets the codify-axis cadence (was 8 ships ago from v824).

## Why this ship

Per the v832 README forward path: "v833 — Codify ship for 4 eligible patterns: cross-rootdir wire (5 inst.) [most evidence-rich], substrate-consumer hook pair (2 inst.), onPredictions wire (2 inst.), #10433 LOC-band refinement (3 inst.)."

Scope decision: **focused codification.** The cross-rootdir wire pattern has the richest evidence (5 instances, 2 contract families, 4 wire shapes); the other 3 patterns have less differentiation and are tightly coupled to the cross-rootdir codification. Codifying just the strongest pattern in this ship preserves clarity; the other 3 land at the next codify ship (likely v840+ depending on cadence) with additional instances accumulated by then.

Codify cadence reset: was 8 ships ago (v824) at v832 close — at the upper edge of the 7-10 ship floor. v833 closes this codify window.

## What shipped

- **NEW** `docs/cross-rootdir-wire-discipline.md` (~125 LOC):
  - **Surface + trigger** declaration matching the existing discipline-doc shape (see `docs/architecture-retrofit-patterns.md` for the prior-art template).
  - **Why this discipline exists** — three failure modes that the pattern prevents: reaching across with relative paths, inlining `.college/` code into `src/`, skipping the wire entirely.
  - **The 4-step pattern (Lesson #10435):** (1) declare the interface in the CONSUMER rootdir; (2) implement the satisfier in the PROVIDER rootdir via duck typing; (3) bridge via an optional context field; (4) verify with a `tests/integration/` test.
  - **Subordinate pattern 1:** Local-interface redeclaration discipline — when the satisfier returns a typed value, the provider rootdir locally redeclares the result type byte-equivalently (drift is silent; mitigation: inline maintenance pairing notes + minimal interfaces).
  - **Subordinate pattern 2:** `Pick<T, K>` structural-handle narrowing — typing constructor opts as narrowed handles supports thin test mocks without losing subtyping for real instances.
  - **When this discipline applies / does NOT apply** — explicit scope: `src/ ↔ .college/` boundary, NOT Tauri or desktop-frontend boundaries.
  - **Lesson coverage** — names Lesson #10435 with its scope.
  - **Carried-forward observations** — explicitly tracks the 3 deferred eligible patterns + the 1-instance subordinate observations (fail-soft fallback) for next codify ship.
- **MODIFIED** `tools/render-claude-md/disciplines.json` (+15 LOC):
  - New entry with `domain`, `trigger`, `summary`, `canonical_docs` (6 cross-references covering both contract families + their integration tests + the discipline doc), `key_lessons` (`["#10435"]`), and `codified_at_milestone` (v1.49.833 with the 5-instance evidence anchor).
- **REGENERATED** `CLAUDE.md` (gitignored) via `npm run render:claude-md`. Manifest now lists 23 discipline entries (was 22).
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v832 → v833.

The new discipline doc cross-references 6 canonical paths:
- `docs/cross-rootdir-wire-discipline.md` (this discipline)
- `src/predictive-skill-loader/fallback.ts` (consumer-side interface declaration)
- `.college/integration/rosetta-concept-fallback.ts` (provider-side satisfier)
- `tests/integration/copper-rosetta-fallback-wire.integration.test.ts` (application-boundary verification)
- `.college/integration/observation-bridge.ts` (1st contract family's provider-side satisfier)
- `tests/integration/college-observation-bridge-wire.integration.test.ts` (1st contract family's verification)

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tools/check-discipline-coverage.mjs` | UNCODIFIED unchanged | 39 ≤ ceiling 41 (still within ceiling; new entry doesn't change UNCODIFIED count) |
| Full suite | 35,235+ | UNCHANGED (no new tests; codify ship is documentation + manifest only) |
| **LOC delta** | ~140 | 1 NEW doc + 1 manifest entry |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **51 consecutive ships at 1.178** — widest pressure margin of any open item, now even wider). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 23** (+1: new Cross-rootdir wire pattern domain).
Lessons in manifest: **76 → 77** (+1: #10435).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward:
- **Substrate-consumer hook PAIR pattern** (2 instances: v830 + v832) — DEFERRED to next codify ship.
- **`onPredictions` substrate-consumer wire pattern** (2 instances: v810 + v826) — DEFERRED to next codify ship.
- **#10433 LOC-band-by-callsite-count refinement** (3 instances: v825 + v827 + v828) — DEFERRED to next codify ship.
- **Verification/integration-only ships** (2 instances: v829 + v832) — DEFERRED; codification candidate for #10428 meta-cadence axis extension.
- **`Pick<T, K>` structural-handle narrowing**, **Fail-soft fallback pattern**, **Cross-rootdir local-interface redeclaration discipline** — all 1-instance observations subsumed into the new cross-rootdir-wire discipline as subordinate patterns; no separate carry-forward needed.

Wired calibratable thresholds: **6 of 6** (UNCHANGED).

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

Codify-axis cadence: RESET (last codify was v824 = 9 ships ago; v833 closes the window).

## What this ship is not

- Not a NASA degree advance.
- Not a code-axis ship (zero src/ source changes).
- Not a ProcessContext chokepoint chip.
- Not a comprehensive codify (intentionally focused on the strongest pattern; defers 3 others to preserve codify-doc clarity).
- Not a test surface change (UNCODIFIED stays at 39).

## Verification

- `npm run render:claude-md` → CLAUDE.md updated (gitignored local artifact).
- `node tools/check-discipline-coverage.mjs` → 23 domains / 77 lessons in manifest / 39 UNCODIFIED (≤ ceiling 41).
- `npm run build` → clean (manifest entry is a JSON change; no transpile impact).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling; step 13 should now report 39 UNCODIFIED — unchanged from v832, since cross-rootdir wire wasn't previously UNCODIFIED).

## v830-833 chain CLOSE

| Tag | Type | Tests | Notes |
|---|---|---|---|
| v1.49.830 | Framework | +4 | `ConceptFallbackProvider` interface + threshold + copper wire |
| v1.49.831 | Implementation | +9 | `RosettaConceptFallback` in `.college/integration/` |
| v1.49.832 | Integration | +8 | Selector 2nd-caller wire + tests/integration/ verification |
| **v1.49.833** | **Codify** | **0** | **Cross-rootdir wire pattern as discipline (Lesson #10435)** |

**Chain totals (4 shipped):** ~2h15m wall-clock / +21 net tests / 1 new discipline doc / 4 new src files / 5 NEW test files.

T1.3 GAP-2 fully closed. Codify-axis reset. NASA degree pressure now at 51 consecutive ships at 1.178.

## Forward path post-v833

1. **NASA 1.179 forward-cadence** (~60-90 min single ship) — 51 consecutive ships at 1.178; widest open pressure margin by a wide margin.
2. **Continued ProcessContext singleton chips** (~13 KNOWN_UNWIRED Process entries remain).
3. **Future codify ship** (v840+ likely; per cadence) — picks up the 3 deferred eligible patterns (substrate-consumer hook pair, `onPredictions` wire, #10433 LOC-band) plus whatever new patterns accrue.
4. **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
5. **Bounded-learning calibration of `lowConfidenceThreshold`** (the 6th wired calibratable threshold, from v830) — needs production observation data first.

## Most valuable single takeaway

**A 5-instance codification produces a stronger discipline doc than a 2-instance codification.** The cross-rootdir wire pattern's 5 instances let `docs/cross-rootdir-wire-discipline.md` distinguish 3 distinct shapes (declaration, framework, integration) and call out 2 subordinate patterns (local redeclaration, Pick<> narrowing). A 2-instance codification (e.g. `onPredictions` wire) would have to present each instance as a separate case study; a 5-instance codification can extract the SHAPE that all 5 share. This is the value of letting patterns accumulate beyond the #10426 threshold before codifying — at the cost of operating on uncodified patterns longer in the interim.
