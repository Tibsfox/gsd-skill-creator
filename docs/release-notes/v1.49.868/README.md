> Following v1.49.867 — _EgressContext singleton chip: src/alternative-discoverer/fork-finder.ts (Track 3 close + campaign close)_, v1.49.868 is the **first ship of an operator-directed v868-v882 follow-on campaign** (codify + pre-tag-gate integration + Process chip cluster + Egress chip cluster + verify-overdue scan, ~15 ships planned). Promotes **1 new tentative observation to ESTABLISHED lesson** (**#10444** — size-ascending chip-pick reveals wire-shape diversity) AND refines **#10443** with the operational continuous-verification mode that the v857-v867 campaign validated. Extends two existing manifest entries (`Architecture-retrofit patterns` and `KNOWN_UNWIRED allowlists as migration-debt ledger`). Doc-only ship.

# v1.49.868 — Codification Ship: Promote #10444 (Size-Ascending Chip-Pick Reveals Wire-Shape Diversity) + Refine #10443 (Continuous-Verification Mode)

**Shipped:** 2026-05-28

First codify ship after the v857-v867 eleven-ship campaign. Eleven ships past the v857 codify — at the upper bound of the #10428 codify-cadence (7-10 ships, upper-bound stretches when the candidate backlog is light). The v857 ship cleared the backlog so v868 lands with two promotion-eligible candidates accumulated during the v858-v867 chip cluster (continuous-verification + chip-pick-by-size). Doc-only ship per operator direction; no new tool surface required because the v857 tool already exists and the v444 lesson is a behavioral discipline.

## What shipped

- **MODIFIED** `docs/known-unwired-ledger-discipline.md`:
  - Added new `### Continuous-verification mode` subsection within the existing `## Inverse-audit: stale-entry detection (Lesson #10443)` section, between `### The cross-audit tool` and `### How to apply (when a third stale-shape surfaces)`.
  - Documents the v858-v867 ten-application operational discipline (build → cross-audit → ship), the v867 first-real-world-bug surfaced + fixed in-flight, and the sibling "tools-detecting-silent-failures must themselves fail loudly" pattern.
  - References #10427 (parent failure-mode-contracts), #10443 (parent inverse-audit), #10421 (static-analysis tool conventions).
- **MODIFIED** `docs/architecture-retrofit-patterns.md`:
  - Added new `### Size-ascending chip-pick reveals wire-shape diversity (Lesson #10444)` subsection within `## Discipline patterns`, after #10440 production-caller path-narrowing.
  - Updated `**Codified at:**` line at the top with v1.49.868 extension entry.
  - Extended `## When this discipline kicks in` with new bullet for KNOWN_UNWIRED ratchet-ledger chip-pick ordering.
  - Extended `## Anti-pattern summary` with two new bullets (highest-LOC-first picking; force-fitting one wire shape across a cluster).
  - Extended `## Lesson references` with #10444 entry.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - `Architecture-retrofit patterns` entry: appended `#10444` to `key_lessons` (`#10414, #10416, #10426, #10440` → `#10414, #10416, #10426, #10440, #10444`); extended `summary` with the size-ascending chip-pick paragraph; appended v1.49.868 codification record to `codified_at_milestone`.
  - `KNOWN_UNWIRED allowlists as migration-debt ledger` entry: extended `summary` with the continuous-verification mode + sibling-tool-fails-loudly paragraph; appended v1.49.868 codification record to `codified_at_milestone` (refinement of #10443, no new lesson number).
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. Both updated entries render the new content.

## Test impact

No new test surface. The doc-only ship updates two discipline docs + extends two manifest entries. The existing `tests/security/check-stale-known-unwired.test.ts` (6 cases, ships at v857) continues to verify the tool's behavior; the continuous-verification mode is a discipline around how the tool is invoked, not a new tool feature.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **86 consecutive ships at 1.178**; was 85 entering this ship — new widest pressure margin record at +1 over v867).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — extensions to two existing entries, not new domains).
Lessons in manifest (unique): **84 → 85** (+1: #10444; #10443 refinement adds no new lesson number).
Open lesson candidate backlog: **2 → 0** (continuous-verification + chip-pick-by-size both promoted/refined).
Tentative observations carried forward: ~5 (was ~6 at v867; 1 promoted as new + 1 refined into existing).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
KNOWN_UNWIRED Process: **6** (UNCHANGED). Egress: **6** (UNCHANGED).
UNCODIFIED: **39 ≤ ceiling 41** (UNCHANGED).
Operational axes: **4** (UNCHANGED).

## Promotion in detail

### #10444 — Size-ascending chip-pick reveals wire-shape diversity (new ESTABLISHED lesson)

**Evidence (2 instances; two distinct chokepoint surfaces):**

| Track | Ship range | Chips | LOC range (ascending) | Distinct wire shapes surfaced |
|---|---|---|---|---|
| Track 2 — Process cluster | v1.49.858-862 | 5 | 81 → 220 → 408 → 167 → 560 | hoist-at-top → hoist-outside-Promise+cleanup → internal-helper (#10433) → hoist-outside-Promise (no cleanup) → closure-capture |
| Track 3 — Egress cluster | v1.49.863-867 | 5 | 73 → 108 → 161 → 193 → 151 | hoist-at-top fetch → hoist-with-early-return-bypass → hoist-before-fetch (strict-fail) → DI-fetch-wrapper (#10441 Egress analog) → two-site hoisted-check |

10 chips across 2 chokepoint surfaces → 10 distinct wire shapes, no variant-coverage planning involved. The size-ascending heuristic surfaced #10433 and #10441 variants naturally at the LOC bands where those shapes structurally belong.

**Codification target:** any future KNOWN_UNWIRED chip cluster (or any ratchet-ledger chip cluster generalized per #10434). The discipline composes with #10422/#10423 lightest-wire and #10440 production-caller scope-reduction at the per-chip level.

**Cross-references:** #10422/#10423 (lightest wire at per-chip level), #10432 (parent — KNOWN_UNWIRED ratchet-ledger substrate), #10433 (internal-helper shape emerges at the mid-LOC band), #10440 (do not accrete wrapper-class scaffolding to force a shape from another chip), #10441 (DI-executor shape emerges at the higher-LOC bands with factory-built executors).

### #10443 refinement — Continuous-verification mode (no new lesson number)

**Evidence (10 consecutive applications + 1 self-bug-fix):**

The v857 cross-audit tool was authored with a single integration mode (ad-hoc). The v858-v867 chip campaign demonstrated a second mode — invoke after every chip ship as continuous-verification — and validated the tool's operational tightness at instance scale.

- v858-v866: 9 consecutive clean tool runs across Process + Egress chips.
- v867: 10th application surfaced the tool's first real-world parser bug (substring `all errors return []` in a wire-shape comment collided with the regex extractor's non-greedy `[\s\S]*?\]\s*\)` terminator; the tool reported 0 entries instead of 6 for Egress and was "clean" by vacuous truth). Regex hardened with line-start anchor + multi-line flag (`[\s\S]*?^\s*\]\s*\)/m`); fix shipped in same ship as the triggering chip.

The sibling pattern — "tools designed to surface silent-vs-loud asymmetry must themselves fail loudly" — is a #10427 corollary that hasn't reached promotion threshold (1 instance only). The codify ship notes it as a below-threshold forward observation.

**Codification target:** the per-ship chip-ship workflow now includes the cross-audit tool as the third step between `npm run build` and `pre-tag-gate`. The next ship (v1.49.869) promotes this from operator-invoked to a deterministic pre-tag-gate step.

**Cross-references:** #10421 (static-analysis tool conventions — fixture-based test coverage + sanity-check assertions), #10427 (load-bearing surfaces must fail loudly — the cross-audit tool is itself load-bearing), #10443 (parent — inverse-audit stale-entry detection).

## What this ship is not

- Not a NASA degree advance (still 1.178; now 86 consecutive ships — record extended by 1 over v867).
- Not a chokepoint chip (KNOWN_UNWIRED Process + Egress both UNCHANGED at 6 each).
- Not a new discipline domain (manifest stays at 23 entries — extensions to two existing entries).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).
- Not a tool-authoring ship (no new code; v857 tool already exists and is operationalized by this discipline).

## Verification

- `python3 -c "import json; json.load(open('tools/render-claude-md/disciplines.json'))"` → JSON OK (23 entries).
- `npm run render:claude-md` → CLAUDE.md updated cleanly; #10444 renders in the Architecture-retrofit entry; continuous-verification mode renders in the KNOWN_UNWIRED entry.
- `node tools/check-discipline-coverage.mjs` → 23 manifest entries / 85 lessons / 39 UNCODIFIED ≤ 41 ceiling.
- `node tools/security/check-stale-known-unwired.mjs` → exit 0 (clean against current allowlists; the continuous-verification mode discipline this ship codifies).

## Forward path post-v868

Track sequence of the operator-directed v868-v882 campaign:
1. **v1.49.869 — Pre-tag-gate integration** (cross-audit tool as deterministic step; promotes continuous-verification from operator-invoked to automatic).
2. **v1.49.870-875 — Process singleton chips** (~6 chips against the 6-entry KNOWN_UNWIRED Process list; size-ascending: version-manager → workflows/contribute → pic2html → gates/pre-flight → learn/acquirer → harness-integrity).
3. **v1.49.876-881 — Egress singleton chips** (~6 chips against the 6-entry KNOWN_UNWIRED Egress list; size-ascending: package-fetcher → index-fetcher → anthropic-chip → http-client → skill-installer → ipc).
4. **v1.49.882 — Verify-overdue forecast scan tool** (lists CalibratableThreshold members + ship counts; flags those past the 10-ship verify-axis trigger).

Other open items (carry-forward from v867 handoff):
- **NASA 1.179 forward-cadence** — strong-default standalone if the campaign pauses; 86 consecutive ships at 1.178 entering this ship (will be 87 at v868 close).
- **T2.1 v1.50 unblock-or-archive decision** (operator-bounded).
