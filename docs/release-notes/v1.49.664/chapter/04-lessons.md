# v1.49.664 — Lessons

## Lessons applied (load-bearing)

- **#10169 gate-not-vigilance** — Phase 1 converted `update-state-md-on-ship.mjs` silent-skip into a real `milestone_name` write. The cost of converting the offending behavior into a deterministic gate is paid back at the first re-violation; we hit it the second time in the v661→v663 cluster.
- **#10170 meta-test at ship time** — Phase 1's fix is meta-tested against cc-1's own STATE.md at T14: after T14 step that runs update-state-md-on-ship.mjs, STATE.md must end up with `milestone_name` describing this milestone (not stale v663 prose).
- **#10172 closure-verification + scope-expansion re-framing** — Mid-mission discovery of TRS pack-14..38 deficit was surfaced to operator with a re-framing question. Re-framed W0 brief captured the absorbed scope before any code landed.
- **#10193 sub-agent dispatch ceiling** — cc-1 stayed inline (no sub-agents needed for infrastructure work). cc-2 (parallel content authoring) is well-suited to bounded sub-agent dispatch.
- **#10265 cross-track scaffold-then-fill two-milestone pattern** — cc-1 = step 1 (scaffold + marker introduction). cc-2 = step 2 (parallel W2 content authoring + marker removal). The split avoids "scaffold-and-fill in one ship" rush patterns.
- **#10266 granular bypass token** — `SC_SKIP_DEPTH_AUDIT_SPS` + `SC_SKIP_DEPTH_AUDIT_TRS` are component-resolution granular (parallel to v654's `SC_SKIP_DEPTH_AUDIT_MUS_ELC`). When real depth scoring promotes from soak to BLOCKER, `pre-tag-gate.sh` bypass tokens `depth-audit-sps` + `depth-audit-trs` follow the same granular pattern.
- **#10356 counter-cadence-cluster scheduling threshold** — this cluster IS the threshold response. v663 closed the FOUR-CONSECUTIVE-SAME-CALENDAR-DAY-DEGREE-ADVANCE-CLUSTER substrate-form by recommending counter-cadence scheduling.

## Lessons emitted candidate (v1.49.664)

### Lesson #10361 candidate — Path-derived constants are invisible to CLI-spawn tests with cwd override

**Claim:** When a script reads from a path derived at module-load via `dirname(fileURLToPath(import.meta.url))`, that path is FIXED at the script's repo location and cannot be overridden by the calling CLI's cwd. Tests that spawn the script via `child_process.execSync` with `cwd: tmpRoot` will see the script writing to the REAL repo path, not the test's tmpdir — silently leaking test fixtures into production directories.

**Reproduction:** v1.49.664 cc-1 SPS scaffolder. Pre-refactor SPS test used the CLI-spawn pattern copied from `update-state-md-on-ship.test.mjs` (which DOES support cwd because it reads STATE.md from `resolve(process.cwd(), '.planning', 'STATE.md')`). The SPS scaffolder uses module-load path resolution, so the cwd override was a no-op. Tests ran successfully but leaked 5 fixture dirs (alpha, beta, gamma, partial, test-bird) into `www/.../SPS/`. Caught only when running depth-audit's new inventory.

**Resolution pattern:** When writing tests for scripts with module-load-derived paths, either (a) refactor the script to accept `--root`/`--<root-var>` CLI arg + add path-resolution helper, OR (b) refactor the test to import the exported function and call it directly with overridable root parameters. Pattern (b) is cheaper for hermetic tests; (a) is needed when CLI behavior itself is under test.

**Apply:** when adding tests for any new `tools/scaffold-*.mjs` or any script reading from REPO_ROOT-derived constants, prefer the exported-function-with-overridable-root pattern from `scaffold-sps-pages.test.mjs` / `scaffold-trs-packs.test.mjs` over CLI-spawn-with-cwd.

### Lesson #10362 candidate — Soak-mode informational scan is the safe extension shape for new audit tracks

**Claim:** When extending a depth-audit-style script to recognize a new track or marker class, the safe-by-default shape is a SOAK-MODE INFORMATIONAL SCAN: report findings but never contribute to FAIL/BLOCKER status. Real scoring (gold-standard threshold derivation + ratio comparison + status rollup integration) is a separate effort. The marker-recognition scan can ship in days; the depth scoring takes weeks. Splitting these unblocks visibility immediately without surprising existing pipelines.

**Reproduction:** v1.49.664 cc-1 Phase 4. MISSION-BRIEF.md said "extend depth-audit to recognize SPS+TRS SCAFFOLD-PENDING" — read on close inspection as marker-only recognition. depth-audit.mjs is fundamentally version-keyed; SPS+TRS aren't. A full depth-scoring extension would need gold-standard threshold derivation (substantial scope creep). Shipped a focused soak-mode informational scan instead (`inspectScaffoldPendingSpsTrs` + 10 tests + 2 env vars), promoting visibility without introducing new blockers.

**Apply:** when extending depth-audit / pre-tag-gate / similar gate scripts to new tracks or marker classes, default to SOAK MODE first. Promote to BLOCKER mode only after thresholds are validated against real data and operator wants the promotion (analogous to v1.49.591 depth-audit BLOCKER promotion + v1.49.594 cross-link soak pattern).

### Lesson #10363 candidate — Over-flagging inventory degrades signal; restrict to explicit markers only

**Claim:** When introducing an inventory function that surfaces "pending" or "partial" state, the temptation is to flag anything that doesn't match the canonical full-content schema. This produces noisy output that includes legitimate pre-existing content on alternative schemas. Restrict the inventory to dirs/files explicitly carrying the marker class (e.g., HTML SCAFFOLD-PENDING comment, JSON `scaffold_pending: true`). Pre-existing content without the marker is real, even if it doesn't match the canonical structure — it's not this audit's concern.

**Reproduction:** v1.49.664 cc-1 Phase 4. First version of `inspectScaffoldPendingSpsTrs` flagged any SPS dir missing data-sources.json + knowledge-nodes.json + artifacts/ as "partial." That caught ~10 real pre-existing SPS species dirs on a different schema. Tightened to flag only when explicit marker is present. Removed false-positives; restored signal-to-noise.

**Apply:** for any new audit/inventory surface added to a gate script, restrict the surfaced findings to explicit-marker-only by default. Define "real content on alternative schemas" as out-of-scope until the canonical schema is enforced repo-wide.

## Forward action items (FA-664-N)

### FA-664-1: 32 SCAFFOLD-PENDING markers must be removed during cc-2
**Status:** OPEN-NEW at cc-1 close. cc-2 dispatch authors substrate-tracked depth per page; marker removal happens as content lands.

### FA-664-2: TRS pack-14..38 theme assignment
**Status:** OPEN-NEW at cc-1 close. Current manifest marks `theme: "pending"` for packs 14-20 + 23-27 + 29-32 + 34-35 + 38 (with weak-confidence guesses on 21, 22, 33, 36, 37 from v657 brief context). cc-2 research extracts canonical themes from each pack's bound milestone release-notes if available; pages where no milestone-bound theme exists may need on-the-fly theme selection.

### FA-664-3: TRS packs 01-04 + pack-39 deep-dive review
**Status:** OPEN-FORWARD. Pre-existing packs 01-04 + pack-39 are not in cluster scope but may have non-canonical depth profiles. Surface at cc-3 cluster-close for next-cluster forward-notes per Lesson #10196.

### FA-664-4: Phase 4 depth-scoring promotion path
**Status:** OPEN-FORWARD. Real SPS+TRS depth scoring needs gold-standard threshold derivation. Scoping: analyze pack-39 (225 lines) + stellers-jay (570 lines) as reference; derive line/byte/section ratios; integrate with version-keyed auditVersion or build sister auditSpsTrsPages. Wire `depth-audit-sps` + `depth-audit-trs` bypass tokens to pre-tag-gate.sh at BLOCKER promotion.

### FA-664-5: cc-2 carry-forward — FA-663-3 STS-51-I LEASAT-3 forward-shadow
**Status:** OPEN-SHADOW (inherited from FA-663-3). 21d residual to 1985-08-27. HIGH-PROBABILITY-VALIDATION at next-degree per Lesson #10348. Activates after cc-3 closes at v1.49.666 + resume of degree-cadence at v1.49.667.

## Lessons NOT triggered this milestone

- Most carry-forward NASA degree-advance lessons sustain (#10341 / #10345 / #10346 / #10347 / #10348 / #10349 / #10350 / #10351 / #10352 / #10353 / #10354 / #10355 / #10356 / #10357 / #10358 / #10359 / #10360) — no NASA engine advance this milestone.
