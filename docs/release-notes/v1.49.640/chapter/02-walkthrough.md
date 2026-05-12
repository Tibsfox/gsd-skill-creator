# 02 — Walkthrough: v1.49.640 Housekeeping Cluster #7

Per-component walkthrough with commit anchors, files touched, and invariants.

## C0 — W0 closure-verification probes (Lesson #10199 first application)

**Wave:** W0
**Output:** probe records + CF-8 routing decision
**Files (gitignored, working-tree only):**
- `.planning/c0-cf7-closure-verification-record.md` — CF-7 still-real verdict + path b routing
- `.planning/c0-cf7-probe.json` — raw `npm audit --json` output (2,903 bytes)
- `.planning/c0-cf8-forward-cadence-decision.md` — option (b) continue counter-cadence
- `.planning/c0-cf9-cartridge-status-record.md` — unchanged; carry forward

### What happened

W0 ran 3 mechanical probes per Lesson #10199:

1. **CF-7 probe.** Command: `npm audit --audit-level=high --json > /tmp/cf7-probe.json`. Exit 1; 4 advisories surfaced (2 critical + 2 moderate). Pattern matched v1.49.639 chapter 05 §CF-7's catalogued GHSAs. **STATUS:** `still-real`. C1 dispatched.

2. **CF-9 probe.** Command: read `.planning/cartridge-migration-phase2.md` (147 lines) + content snapshot diff vs predecessor. **STATUS:** `unchanged`. Carry-forward routed to Cluster #8.

3. **CF-8 routing.** Operator AskUserQuestion presented three options (a/b/c). Chose **(b) continue counter-cadence**. STS-7 / Challenger NASA degree deferred to v1.49.641+.

The closure-verification gate fired correctly — CF-7 was not falsely retired despite the gate's whole point being "don't manufacture work for already-closed CFs". CF-7 was genuinely still real; the gate confirmed it; C1 proceeded.

### Apply-to-self

W0 was the canonical first application of the gate. The probe outputs became `.planning/c0-cf*-record.md` files. These are cited in `docs/MISSION-PACKAGE-DISCIPLINE.md` §1.5 as the canonical apply-to-self example.

## C1 — CF-7 Security Audit closure (hybrid path b+d)

**Wave:** W1A (single track)
**Commit:** `19b89620d` (`chore(deps): npm audit fix + remove unused gsd-pi to close CF-7`)
**Files touched:**
- `package.json` (REMOVED `gsd-pi`; ADDED `fast-xml-parser ^5.8.0`, `yaml ^x.x.x`)
- `package-lock.json` (regenerated; 1068 insertions / 4499 deletions; -302 packages)

### Path execution

**Stage 1 — Operator chose path (b).** After the W0 probe confirmed `still-real`, operator AskUserQuestion routed to path (b) `npm audit fix` non-breaking.

**Stage 2 — Path (b) dry-run.** `npm audit fix --dry-run --audit-level=high` proposed gsd-pi 2.62→2.82, removal of 19 octokit-family transitives, change of @anthropic-ai/sdk 0.73→0.90. Operator green-lit.

**Stage 3 — Path (b) apply.** `npm audit fix --audit-level=high` executed. Removed 19, changed 3, audited 565. Post-fix audit: 3 vulnerabilities remained (2 critical + 1 moderate). **Path (b) was partial.**

**Stage 4 — Source-level investigation.** `grep -rn "gsd-pi" src/ desktop/ src-tauri/ tools/` returned zero source-level imports. `package.json scripts.* | grep gsd-pi` returned nothing. `package.json bin.*gsd-pi` returned nothing. **gsd-pi is a phantom dependency.**

**Stage 5 — Origin trace.** `git log -S '"gsd-pi"' -- package.json` returned commit `1964b4011` `chore(deps): add gsd-pi ^2.62.0 for GSD-2 integration`. Empty body. Planned integration; never wired.

**Stage 6 — Operator pivoted to hybrid (b)+(d) via second AskUserQuestion.**

**Stage 7 — Path (d) overlay.** Edited `package.json` to remove `"gsd-pi": "^2.62.0"` line. Ran `npm install`. Removed 202 packages, audited 371. **Found 0 vulnerabilities.**

**Stage 8 — Vitest sanity check #1.** `npx vitest run --reporter=dot` → 14 test files FAILED with `Cannot find package 'fast-xml-parser' imported from src/scribe/namespace-conformance/checks/hierarchical-nesting.ts`. Hidden transitive used directly in 3 src/ files.

**Stage 9 — First recovery.** `npm install fast-xml-parser --save` (added at `^5.8.0`). Re-ran vitest. 10 test files still failed.

**Stage 10 — Second probe.** Ran one failing test file directly: `npx vitest run src/cli/commands/cartridge.test.ts` → `Cannot find package 'yaml' imported from src/cli/commands/cartridge.ts`. Another hidden transitive.

**Stage 11 — Second recovery.** `npm install yaml --save`. Re-ran full vitest in background.

**Stage 12 — Vitest sanity check #2.** Background task `barh27gm3` completed exit 0: **1895 test files pass, 30,503 tests pass, 0 failed.**

**Stage 13 — Single combined commit.** `git add package.json package-lock.json` + `git commit -m "chore(deps): npm audit fix + remove unused gsd-pi to close CF-7"` with body documenting hybrid path + 2 hidden-transitive recoveries.

### Final state

| Metric | Before | After |
|---|---|---|
| `npm audit --audit-level=high` exit | 1 | **0** |
| Total advisories surfaced | 4 (2 critical + 2 moderate) | **0** |
| Packages installed | 673 (407 prod + 191 dev + 138 optional) | 375 |
| Vitest passing | (would have failed on advisories) | **30,503 / 30,549** |

### Invariants asserted in meta-test

1. `package.json` no longer declares gsd-pi
2. `package.json` declares fast-xml-parser + yaml as direct deps
3. `.planning/c0-cf7-closure-verification-record.md` cites still-real + path b
4. `.planning/c1-cf7-fix-record.md` cites hybrid path + gsd-pi removal + 0 vulns

## C2 — Lesson #10199 closure-verification gate codification

**Wave:** W1B (single track)
**Commit:** `33df8ec0c` (`docs(test-discipline): codify Lesson #10199 closure-verification gate`)
**Files touched:**
- `docs/MISSION-PACKAGE-DISCIPLINE.md` (NEW — discipline doc)
- `docs/test-discipline/cf-closure-verification-templates.md` (NEW — companion probe templates)
- `docs/SUBSTRATE-PROBE-DISCIPLINE.md` (EDIT — added sibling cross-ref)

### What landed

**`docs/MISSION-PACKAGE-DISCIPLINE.md`** (NEW) — 184 lines + a concrete bash probe example added at the meta-test feedback step:

- §1.1 Pattern statement — when CFs route through N+k clusters without closure, framing may be wrong
- §1.2 Source incident — v1.49.634-638 5-cluster chain framing error (CI install gap → actual: skip-guarded tests)
- §1.3 Mechanical W0 step — 5-step probe protocol (read source → identify SHAPE → run probe → record → route) + concrete bash example
- §1.4 Re-framing review for chains ≥4 clusters — alternative framings checklist
- §1.5 Apply-to-self template — copy-paste W0 component spec table + W0 deliverable structure
- §1.6 Bayesian discipline — null results as falsifying evidence
- §1.7 Tooling support (future) — `scripts/closure-verify-cf.mjs` candidate
- §2 Cross-references — 7+ source artifacts cited

**`docs/test-discipline/cf-closure-verification-templates.md`** (NEW) — 171 lines:

- Template 1: tool-output shape (npm audit / cargo audit / pip audit)
- Template 2: test-marker shape (vitest run + gh CI check)
- Template 3: config-state shape (file read + grep)
- Template 4: upstream-spec shape (npm view / cargo info)
- Hidden-transitive guard — NEW pattern from C1 experience; helps future path-d-style removals avoid the fast-xml-parser/yaml double recovery
- Usage instructions for selecting + customizing templates

**`docs/SUBSTRATE-PROBE-DISCIPLINE.md` §7 cross-references** (EDIT) — added 1-line sibling pointer to `MISSION-PACKAGE-DISCIPLINE.md` with framing note ("Substrate-probe verifies the SHAPE of what's being worked on; closure-verification verifies whether the WORK is still needed").

### Invariants asserted in meta-test

5. `docs/MISSION-PACKAGE-DISCIPLINE.md` exists
6. Discipline doc references Lesson #10199 + source incident
7. Discipline doc defines at least 1 mechanical probe (bash code block + SHAPE categories listed)
8. `cf-closure-verification-templates.md` exists with all 4 template categories
9. `SUBSTRATE-PROBE-DISCIPLINE.md` cross-references the new sibling doc

## C3 — Integration + ship pipeline

**Wave:** W3
**Commits:**
- `65d47b72e` — Stage 0 post-ship refresh absorption (RH + dashboard for v1.49.639)
- `da1ef38e1` — Stage 2 meta-test (`tests/integration/v1-49-640-meta-test.test.ts`)
- (T14) — Stage 6 ship commit

### Stage breakdown

**Stage 0 — Post-ship refresh absorption.** v1.49.639's working-tree changes (`dashboard/index.html` 26 lines + `docs/RELEASE-HISTORY.md` 5 lines) landed as the first commit of v1.49.640. Splits `git add` + `git commit` per Lesson #10201.

**Stage 2 — Meta-test.** 12 invariants:
- 4 for C1 (package.json state, closure records, fix record content)
- 5 for C2 (discipline doc, templates, cross-ref)
- 1 for CF-8 routing decision
- 1 for CF-9 carry record
- 1 for counter-cadence engine state in STATE.md

Skip-guard pattern (Lesson #10180) used for `.planning/` paths so CI gracefully skips gitignored working-tree files. Tracked-file assertions (`docs/`, `tests/`, `package.json`, `STATE.md`) run unconditionally.

Local vitest run: 12/12 pass in 195ms.

**Stages 3-5 — Release-notes + STORY-gate pre-author + pre-tag-gate.**

**Stage 6 — T14 atomic ship pipeline.** Per Lesson #10191: ship sequence executes against directive state at authorization time. STORY-gate auto-fires (3rd consecutive verification of v1.49.638 C5 fix).

### Invariants asserted in meta-test

10. CF-8 routing decision documents option (b)
11. CF-9 cartridge status routes to Cluster #8
12. counter-cadence: engine state UNCHANGED (NASA 108 + counter_cadence: true + no_engine_state_advance: true)

## Mission package vs actual work mapping

| Mission spec | Actual outcome |
|---|---|
| C0 W0 closure-verification (3 CFs) | DONE — all 3 probes ran; produced 3 record files |
| C1 path tree (a/b/c/d/e) | Hybrid (b)+(d) — operator-routed mid-component pivot |
| C2 doc placement (§3 vs NEW) | NEW file chosen (Sonnet pre-decision per scope criteria) |
| W3 Stage 0 absorb post-ship refresh | DONE — `65d47b72e` |
| W3 Stage 2 meta-test (5-7 tests) | 12 tests authored (exceeded target due to broader coverage) |
| W3 Stage 3 release-notes 7+1 | DONE (this chapter set) |
| W3 Stage 6 T14 ship | (pending operator G3) |

12 net-new test cases vs 5-7 expected — proportional to the broader CF-routing surface area C1 hybrid path required.
