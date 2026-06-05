# v1.49.977 — Retrospective

## What went right

- **Recon-first, then verify-the-output.** A 4-agent read-only recon confirmed the
  plan's three premises before any code was written, but the real catch came from the
  implementation: running the file-level BFS revealed `ace` is *statically reachable*
  from the production M5 selector — refuting the plan's blanket "the island reports
  unreachable" for the sink. Rather than special-case the `ace` edge to force a
  `false` verdict (which would make the scanner lie), the honest result was shipped:
  7/8 unreachable, `ace` reachable-via-flag-gated-edge, documented. This vindicated
  the v972 D3 framing ("`ace` is the sink with one flag-gated production edge").
- **A real false-positive caught before it discredited the tool.** The first BFS
  (strict npm-only roots) flagged live desktop modules — `intelligence` (26 callers),
  `atlas`, `keystore` — as "unreachable / shelfware review." Seeding the BFS from the
  shipped desktop/Tauri `src/` frontier (consistent with the scanner's existing
  treatment of `desktop/` as a real-caller dir) removed all three false positives
  while leaving the island verdict untouched.
- **File-vs-module granularity got the hard case right.** `orchestration` is reachable
  AND imports `ace`, but its *reachable files* do not — only file-level reachability
  reports the island correctly. This is encoded as a dedicated unit test (T20).
- **Additive, gate-respecting.** The new field broke no existing baseline consumer
  (36 consumer tests green), and both drift-guards landed in existing suites — no new
  pre-tag-gate step, denominator stays 20.

## What went well in process

- **step P held.** The adversarial review's single MAJOR ("unit tests not
  discoverable") was adjudicated with evidence — `adoption-scan.test.mjs` runs in the
  `vitest.tools.config.mjs` tools-suite gate step (2.5/20, BLOCKER since v1.49.913) —
  and the review's own rejected finding already contradicted it. Resolving the
  contradiction with evidence (not the verdict label) avoided a needless "fix" of a
  false finding.
- The drift-guard was made to **run the scanner live** rather than read the committed
  baseline, sidestepping the ship-ordering chicken-and-egg (pre-tag-gate runs before
  the v977 baseline refresh).

## What to watch

- **Ship 3.2 is now unblocked and scoped.** The scan surfaces **16 non-allowlisted**
  `living`-but-`reachableFromProduction:false` modules (`amiga`, `audio-engineering`,
  `bayes-ab`, `cache`, `commands`, `components`, `dependency-auditor`, `engines`,
  `git`, `health-diagnostician`, `learn`, `scan-arxiv`, `skill`, `skill-isotropy`,
  `skill-promotion`, `umwelt`) — the genuine reachability-only shelfware candidates
  the import-surface dimension missed. These are the Ship 3.2 triage input
  (dispose / wire / allowlist each), not verdicted here.
- **`ace` is reachable-but-runtime-gated.** Pinned `true` with an explanatory
  drift-guard; if a future ship rewires or removes the M5 `applyActorSignalToScore`
  edge, the guard will flag the flip — which is the correct behavior.
- **Reachability is static.** It follows type-only and flag-gated edges (conservative;
  biases toward reachable). It does not model runtime flags — by design, so the
  scanner stays a deterministic static tool.
