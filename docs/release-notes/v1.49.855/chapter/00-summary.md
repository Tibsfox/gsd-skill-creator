# v1.49.855 — Quality-drift scorer refinement: `task` sub-type for T-prefix/S-prefix work

**Released:** 2026-05-28

## Why this ship

Eighth ship of the operator-directed v848-v856 nine-ship campaign. Closes the v841 forward-flag explicitly named in its retrospective: add a `task` sub-type to `classify-types.mjs` for T-prefix and S-prefix titles so that task-shaped ships (which carry minimal release notes by design) get baselined separately from substantive-feature ships and stop firing false `recent_all_F` alerts.

## The change

**Three files; ~60 LOC delta.**

`classify-types.mjs`:
```js
// Priority order: degree → milestone → patch → chip → task → feature.
// ...
const taskMarkers = /^[TS]\d+(\.\d+)?\s/;
if (taskMarkers.test(name)) {
  return { type: 'task', confidence: 0.80, reason: 'name starts with task-ID prefix (T1.x/T2.x/Sn)' };
}
```

`quality-drift-check.mjs`:
```js
const KNOWN_TYPES = ['degree', 'milestone', 'feature', 'chip', 'task', 'patch'];
// authoredTypes still = ['feature', 'milestone', 'patch'] — task excluded
// alongside chip (F-by-design) and degree (prose-by-design).
```

`__tests__/classify-types-chip.test.mjs`: existing T-prefix assertions updated; new `v1.49.855: task classification` describe block (5 cases).

## Surface delta

- 3 files modified
- +30 source LOC + +30 test LOC
- 8/8 direct classify() verifications PASS
- 0 manifest changes
- KNOWN_UNWIRED counts UNCHANGED (this ship is a scorer/discipline refinement, not a chip)

## Engine state

NASA degree at **1.178** (UNCHANGED — **73 consecutive ships at 1.178**, new widest pressure margin record by 1 over v854's 72).
Counter-cadence count UNCHANGED at 6.
Operational axes UNCHANGED at 4.
