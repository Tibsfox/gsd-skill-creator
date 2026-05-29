# v1.49.883 — Codification Ship: Promote 5 Refinements from the v868-v882 Campaign

**Released:** 2026-05-28

## Why this ship

Post-Track-5 codify ship for the v868-v882 follow-on campaign. The v882 retrospective enumerated 6 promotion-eligible candidates; v883 lands 5 of them as new ESTABLISHED lessons and holds the 6th (`module-singleton`, 1 instance) as carry-forward in the #10448 catalog.

Doc-only per operator direction (matches v868 codify scope shape). 15 ships past v868 (1 over the #10428 7-10 cadence band's upper bound, within the natural "codify when the candidates pile up" cadence).

## What's in this ship

- **5 new ESTABLISHED lessons:**
  - **#10445** — Spawn-site count (N) as primary wire-shape predictor. 2-instance evidence: v872 (311 LOC, N=1) + v875 (1440 LOC, N=1), both hoist-at-top despite LOC band. Refines #10444's LOC heuristic.
  - **#10446** — Multi-catch helper for chokepoint denials (`rethrowIfDenied` inline form + `callOrRethrowDenial` wrapper form). ~30-instance evidence across Track 4+5. Refines #10442 generalized across multiple chokepoint classes.
  - **#10447** — Router-with-conditional-bypass wire shape. 2-instance evidence: v864 (git-collector) + v880 (skill-installer). Refines #10444's catalog with the router specialization.
  - **#10448** — Shared-helper hoist sub-variant catalog (5 sub-variants + module-singleton carry-forward). 12-chip evidence from the v868-v882 campaign. Refines #10444 with the sub-variant grammar.
  - **#10449** — execFile vs shell-exec audit target accuracy. 2-instance evidence: v853 (git-collector) + v874 (safeExecFile). Refines #10427's audit-fidelity component.

- **Track 5 wire-shape table** appended to #10448 (parallel to the Track 4 retrospective table in the v867 handoff — addresses one of the gaps the v882 retro audit flagged).

## What this ship is

- A codify ship per the #10428 cadence (15 ships past v868 codify).
- Doc + manifest update only; no test/code changes.
- Three existing-entry extensions (Architecture-retrofit patterns + Failure-mode contracts + Security chokepoints), zero new manifest domains.

## What this ship is not

- Not a NASA degree advance (still 1.178; now 101 consecutive ships at the widest pressure margin record).
- Not a chokepoint chip (Process + Egress KNOWN_UNWIRED both UNCHANGED at 0; both surfaces fully wired).
- Not a counter-cadence ship (counter-cadence count unchanged at 6).
- Not a tool-authoring ship (no new code; the campaign tools already exist).

## Engine state

NASA degree sustains at 1.178 (UNCHANGED — 101 consecutive ships).
Counter-cadence count UNCHANGED at 6.
Manifest entries 23 (UNCHANGED).
Lessons in manifest 90 (+5: #10445, #10446, #10447, #10448, #10449).
KNOWN_UNWIRED Process UNCHANGED at 0.
KNOWN_UNWIRED Egress UNCHANGED at 0.
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED count: ~34 ≤ ceiling 41 (5 promotion-eligible observations now codified; subtraction depends on scorer).
