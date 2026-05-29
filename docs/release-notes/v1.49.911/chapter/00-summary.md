# v1.49.911 — Counter-Cadence Codify Ship: UNCODIFIED Drain

**Released:** 2026-05-29

## Why this ship

Counter-cadence codify ship per #10428 meta-cadence (codify-axis budget). v910 drained the discipline-coverage PARTIAL bucket to 0 but deliberately left the 39-entry UNCODIFIED backlog — the dominant codify-axis debt — for a dedicated ship, because draining it requires *authoring*, not just *wiring*. This is that ship.

The 39 UNCODIFIED lessons were NASA mission-authoring campaign telemetry (#10250–#10408, first-emitted v652–v716): substrate-axis rotation, same-day-degree cluster thresholds, content-filter mitigation, dispatch-vs-direct-author cadence, substrate-cohort observation accounting. They accumulated in release-note retrospectives but were never wired into the discipline manifest. The discipline-coverage gate only blocks on UNCODIFIED > 41 (the backlog sat at 39, two under the ceiling), so it drifted without surfacing.

The operator selected the **hybrid drain** (the v910 handoff's recommended option): a new discipline domain for the NASA-campaign-specific lessons + selective promotion of the genuinely-reusable subset into existing entries. This maximizes discoverability — generic dispatch/content-filter disciplines live where a non-NASA author will find them, while the campaign-specific substrate-tracking lessons get a coherent dedicated home.

Doc-only ship — no source code, no test additions. The lessons already existed in retrospective prose; this ship canonicalizes them (de-jargonizing the in-house "substrate" vocabulary into plain actionable English) and wires the IDs into the manifest so the rendered CLAUDE.md trigger-line lesson list reflects them.

## What's in this ship

### New domain — NASA mission authoring (27 lessons)

- **`docs/nasa-mission-authoring-discipline.md`** NEW. Surface/Codified-at header + intro framing (campaign frozen at 1.178, disciplines preserved for resume + a flagged general subset) + a "Generalizable beyond NASA" callout + 8 thematic sections + a cross-reference table for the 12 promoted-elsewhere siblings:
  1. Authoring cadence — direct-author vs dispatch vs hybrid (#10341, #10350, #10352, #10374, #10376)
  2. Same-day cluster-length monitoring & counter-cadence triggers (#10348, #10354, #10356, #10371)
  3. Dispatch coordination across concurrent mission work (#10268, #10271, #10349)
  4. Substrate-axis rotation & stability discipline (#10270, #10345, #10381, #10394, #10395)
  5. Substrate-cohort & substrate-anchor observation accounting (#10389, #10397, #10398, #10399)
  6. Mission-brief accuracy & forward-reference state tracking (#10250, #10346)
  7. Content-filter & memorial-substrate framing — NASA-specific (#10269, #10380)
  8. Operator-directed departures & pivots (#10384, #10390)

### Reusable-subset promotion (12 lessons → existing homes)

- **`docs/sub-agent-dispatch-discipline.md`** UPDATED — new "Content-filter & dispatch-cadence lessons (NASA campaign)" section: #10406 (positive-framing / don't-enumerate-forbidden-tokens), #10407 (dispatch-prompt density budget), #10402 (secondary-trip-vocab → Path B), #10387 (content-filter-safe phrasing), #10383 (content-filter mitigation), #10378 (dual-direction hard-block), #10388 (foreground-author full-rewrite recovery), #10369 (dispatch as cadence alternative), #10385 (shared filename manifest), #10408 (per-mission rebuild template).
- **`project-claude/hooks/self-mod-guard.js`** UPDATED — #10367 added to the codified-lessons header: sub-agent destination-directory ambiguity propagates a protected-path bypass; mitigation is upstream of the hook (briefs must state destination + commit pattern unambiguously).
- **`docs/MISSION-PACKAGE-DISCIPLINE.md`** UPDATED — #10366 added to Lesson coverage: mark mission-brief historical assertions "(preliminary; verify)", delegating the check to the first sub-agent step.

### Manifest updates

- **`tools/render-claude-md/disciplines.json`** UPDATED:
  - NEW entry **"NASA mission authoring"** (24th domain): 27 key_lessons, canonical doc `docs/nasa-mission-authoring-discipline.md`.
  - **Sub-agent dispatch**: +10 key_lessons; summary extended with the content-filter & dispatch-cadence cluster; codified_at += v911.
  - **Self-modification safety**: +#10367; summary extended; codified_at += v911.
  - **Mission package framing**: +#10366; codified_at += v911.

`CLAUDE.md` regenerated from `disciplines.json` via `npm run render:claude-md` (gitignored — local-only).

## A note on the #10402 number-reuse catch

Lesson #10402 was a reused number: at v699/v700 it briefly tagged a "multi-decade Mars rover lifetime" *candidate* (only ever written as bare `#10402` in status tables, never carried forward), then from v1.139 onward it became the **SECONDARY-TRIP-VOCAB-DENSITY → Path B selection** discipline (referenced 6× as "Lesson #10402", which is what the coverage tool counts). The extraction pass initially grabbed the abandoned meaning; a direct source check corrected it to the live dispatch-safety discipline, which is why #10402's pinned home (Sub-agent dispatch) is correct.

## Verification

- `node tools/check-discipline-coverage.mjs` → **COVERED 131, PARTIAL 0, UNCODIFIED 0**. All 39 drained IDs verified COVERED (in manifest AND in a cited canonical doc).
- `npm run render:claude-md` → CLAUDE.md updated; manifest parses (24 entries, 147 unique lessons).
