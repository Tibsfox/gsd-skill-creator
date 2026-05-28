> Following v1.49.856 — _Verify ship: substrate-auto-emit → calibration-loop end-to-end (campaign closes 9/9)_, v1.49.857 is the **first ship of an operator-directed v848-v856 follow-on campaign** (codify + Process chip cluster + Egress chip cluster, ~11 ships planned). Promotes **1 tentative observation to ESTABLISHED lesson**: **#10443** (Inverse-audit: stale-entry detection — KNOWN_UNWIRED ledger refinement). Extends the existing `KNOWN_UNWIRED allowlists as migration-debt ledger` manifest entry with the inverse-audit stale-entry pattern. Doc + tool implementation: ships `tools/security/check-stale-known-unwired.mjs` as the cross-audit inverse-check + extends the discipline doc with the Shape A + Shape B catalog. Closes the v812 "unidirectional enforcement asymmetry" forward-observation flagged at v834 (Shape A) and v852 (Shape B).

# v1.49.857 — Codification Ship: Promote #10443 (Inverse-audit Stale-Entry Detection)

**Shipped:** 2026-05-28

First codify ship after the v848-v856 nine-ship campaign. One ship past the v847 codify (10-ship codify cadence per #10428 upper bound; the v847 ship cleared the full 5-candidate backlog so v857 lands with only the v834+v852 stale-entry candidate). Doc + tool implementation per operator direction at session start.

## What shipped

- **MODIFIED** `docs/known-unwired-ledger-discipline.md`:
  - Replaced "## Forward observations / ### Unidirectional enforcement asymmetry" with a new top-level `## Inverse-audit: stale-entry detection (Lesson #10443)` section.
  - The new section names both stale-shapes (Shape A wired-but-still-in-allowlist surfaced v834; Shape B import-without-use surfaced v852), references the v838 inline closure for Shape A + the v857 cross-audit tool for Shape B, and documents the "one inverse-check per stale-shape" scaling rule.
  - Added cross-references to #10421 / #10427 / #10432 (parent) / #10434.
  - Restored "## Forward observations" header above the two remaining sub-sections (block-comment consolidation; audit-test as observability surface).
- **NEW** `tools/security/check-stale-known-unwired.mjs` — cross-audit inverse-check tool:
  - Regex-extracts `KNOWN_UNWIRED` from both `process-context-audit.test.ts` and `egress-context-audit.test.ts`.
  - Runs Shape A check against both audits (file calls `ensure*Allowed`).
  - Runs Shape B check against ProcessContext only (file imports `child_process` via named imports but uses none of the imported names).
  - Human-readable output by default; `--json` for machine consumption. Exit 0 if clean, 1 if any stale entries.
- **NEW** `tests/security/check-stale-known-unwired.test.ts` — 6 test cases:
  - 2 sanity tests: tool exits clean against real files; tool emits structured JSON via `--json`.
  - 4 fixture tests: detects Shape A; detects Shape B; clean state when import+used; reports missing files separately.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - `KNOWN_UNWIRED allowlists as migration-debt ledger` entry: appended `#10443` to `key_lessons` (`#10432, #10434` → `#10432, #10434, #10443`); extended `summary` with the inverse-audit stale-entry detection paragraph; appended `tools/security/check-stale-known-unwired.mjs` to `canonical_docs`; appended v1.49.857 codification record to `codified_at_milestone`; extended `trigger` with "adding inverse-audit coverage for a newly-surfaced stale-entry shape".
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. The KNOWN_UNWIRED entry now references #10443 + the new tool.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/security/check-stale-known-unwired.test.ts` | NEW; +6 cases | Verifies tool exits clean against current files + detects both stale shapes via temp fixtures + reports missing files |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **75 consecutive ships at 1.178**; was 74 entering this ship — new widest pressure margin record).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — extension to one existing entry, not a new domain).
Lessons in manifest (unique): **83 → 84** (+1: #10443).
Open lesson candidate backlog: **1 → 0** (stale-entry inverse-audit promoted).
Tentative observations carried forward: ~8 (was ~9 at v856; 1 promoted).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **11** (UNCHANGED). Egress: **11** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Promotion in detail

### #10443 — Inverse-audit: stale-entry detection

**Evidence (2 instances; two distinct stale-shapes):**

| Stale-shape | Surface ship | Source file | Detection rule |
|---|---|---|---|
| Shape A — wired-but-still-in-allowlist | v1.49.834 | `src/intelligence/analyzer/git.ts` | file calls `ensure*Allowed` AND is still in `KNOWN_UNWIRED` |
| Shape B — import-without-use | v1.49.852 | `src/scan-arxiv/bridge.ts` | file imports the chokepoint module via named imports AND none of the imported names is referenced in the body |

Shape A was closed at v838 (~4 ships after first surface) by adding inline inverse-checks to `process-context-audit.test.ts` and `egress-context-audit.test.ts`. Shape B was surfaced 18 ships later at v852 and remained without a deterministic detector until this ship.

**Codification target:** any future audit-test introducing a `KNOWN_UNWIRED` allowlist. The discipline scales by adding one inverse-check per stale-shape; a third shape extends the catalog rather than creating a new discipline. The cross-audit tool `tools/security/check-stale-known-unwired.mjs` consolidates both shape checks into one ad-hoc + pre-tag-gate-invocable surface.

**Cross-references:** #10421 (static-analysis tool conventions — spawnSync-not-execSync, JSON output, exit-code-as-signal), #10427 (failure-mode contracts — stale entries are silent-vs-loud), #10432 (parent — KNOWN_UNWIRED as migration-debt ledger), #10434 (KNOWN_UNWIRED generalization beyond chokepoints — inverse-audit shape generalizes too).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 75 consecutive ships).
- Not a chokepoint chip (KNOWN_UNWIRED Process + Egress unchanged).
- Not a new discipline domain (manifest stays at 23 entries — extension to one existing entry).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).

## Verification

- `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` → JSON OK (23 entries).
- `npm run render:claude-md` → CLAUDE.md updated cleanly; #10443 renders in the KNOWN_UNWIRED entry.
- `node tools/check-discipline-coverage.mjs` → 23 manifest entries / 84 lessons / 39 UNCODIFIED ≤ 41 ceiling.
- `node tools/security/check-stale-known-unwired.mjs` → exit 0 (clean against current allowlists).
- `npx vitest run tests/security/check-stale-known-unwired.test.ts` → 6/6 PASS.

## Forward path post-v857

Track 2 of the operator-directed v857-v867 campaign:
1. **v1.49.858-862 — Process singleton chips** (~5 chips against the 11-entry KNOWN_UNWIRED Process list).
2. **v1.49.863-867 — Egress chip campaign** (~5 chips against the 11-entry KNOWN_UNWIRED Egress list; first Egress chip cluster since v811).
3. Each chip ship re-runs `node tools/security/check-stale-known-unwired.mjs` post-edit to verify the new chip doesn't introduce a stale entry.

Other open items (carry-forward from v856 handoff):
- **NASA 1.179 forward-cadence** — strong-default standalone if the campaign pauses; 75 consecutive ships at 1.178 entering this ship (will be 76 at v857 close).
- **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
