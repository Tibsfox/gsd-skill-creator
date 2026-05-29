# Context — v1.49.905

## Predecessor

- **v1.49.904** — Tenth LoaderContext chip (`events/skill-event-store.ts`), class-instance multi-method read-side form.
- Shipped at: `fd633ca07` (with post-ship rh refresh `b22775bda`).
- Counter-cadence: false.

## This ship

- **v1.49.905** — Eleventh LoaderContext chip (`atlas/spatial/pmtiles-reader.ts`), module-function two-site mixed sync+async form.
- Counter-cadence: false.
- NASA degree: 1.178 (UNCHANGED — 123 consecutive ships; pressure-margin record extended).
- KNOWN_UNWIRED Loader 5 → 4.

## Provenance

- Branch: `dev`.
- Pre-ship tip: `b22775bda` (post-v904 rh refresh).
- Multi-ship session continuation; v905 is the third of 7 in the multi-ship LoaderContext chip-down campaign.
- Per #10444, `pmtiles-reader.ts` (262 LOC) was the unique-smallest entry after v904 closed `skill-event-store.ts`.

## Engine state at close

- NASA degree: **1.178** (123 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 5 → 4** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).

## Forward path

- **v906 (next in this session)**: per #10444 size-ascending, `aminet/emulated-scanner.ts` (287 LOC) is the next pick. Scanner naming pattern — possible sibling of v892 dacp/bus/scanner.ts (async two-site).
- v907–v909 continue chipping down the remaining 3 entries (`memory/file-store.ts` 516 LOC, `memory/conversation-store.ts` 531 LOC, `intelligence/kb/store.ts` 1399 LOC).
