> Following v1.49.882 — _Verify-overdue forecast scan tool (campaign CLOSE; v868-v882 15-ship campaign delivered)_, v1.49.883 is the **post-Track-5 codify ship** for the v868-v882 follow-on campaign. Promotes **5 new ESTABLISHED lessons** from the 6 promotion-eligible candidates the v882 retrospective enumerated: **#10445** (spawn-site count as primary wire-shape predictor; refines #10444), **#10446** (multi-catch helper for chokepoint denials; refines #10442), **#10447** (router-with-conditional-bypass wire shape; refines #10444), **#10448** (shared-helper hoist sub-variant catalog with Track 5 wire-shape table; refines #10444), **#10449** (execFile vs shell-exec audit target accuracy; refines #10427). The sixth candidate — `module-singleton` variant (v881 ipc.ts) — held at 1 instance and is carried forward as an explicit anti-pattern note in #10448. Doc-only ship.

# v1.49.883 — Codification Ship: Promote 5 Refinements from the v868-v882 Campaign (Post-Track-5 Codify)

**Shipped:** 2026-05-28

Post-Track-5 codify ship. The v868 ship was the prior codify (15 ships back, one over the #10428 7-10 cadence band's upper bound, but within the natural "codify when the candidates pile up" cadence). The v878-v881 chip cluster accumulated 4 additional candidates beyond what the mid-campaign handoff predicted (the handoff named 4; the v882 retro named 6 — module-singleton + router-with-conditional-bypass surfaced during Track 5, and the shared-helper-hoist count grew from carry-forward to a full 5+ variant catalog). v883 lands 5 of those 6 as new ESTABLISHED lessons; the 6th (module-singleton, 1 instance) is carry-forward.

## What shipped

- **MODIFIED** `docs/architecture-retrofit-patterns.md`:
  - Added 3 new subsections in `## Discipline patterns` after #10444:
    - `### Spawn-site count as primary wire-shape predictor (Lesson #10445)` — N-driven shape selection refines #10444's LOC heuristic; high-LOC files with N=1 take hoist-at-top regardless of LOC band.
    - `### Router-with-conditional-bypass wire shape (Lesson #10447)` — chokepoint scope is a property of the destination branch, not the router; thread `ctx?` only into the gated path.
    - `### Shared-helper hoist sub-variant catalog (Lesson #10448)` — 5 sub-variants surfaced by the v868-v882 12-chip campaign + Track 5 wire-shape table appendix + module-singleton carry-forward note.
  - Updated `**Codified at:**` header with v1.49.883 extension entry.
  - Extended `## Anti-pattern summary` with 4 new bullets (LOC-only estimation when N=1; router non-gated branch ctx threading; sub-variant name proliferation; module-singleton over-application).
  - Extended `## Lesson references` with #10445, #10447, #10448 entries.
- **MODIFIED** `docs/failure-mode-contracts.md`:
  - Added 1 new top-level section after #10442:
    - `## Multi-catch helper for chokepoint denials (Lesson #10446)` — `rethrowIfDenied` inline form + `callOrRethrowDenial` higher-order wrapper form; centralizes the ~30-instance per-catch boilerplate accumulated across v868-v882 Track 4+5 into a single source of truth.
  - Updated `**Codified at:**` header with v1.49.883 extension entry.
  - Extended `## Lesson reference` with #10446 entry.
- **MODIFIED** `docs/security-chokepoints.md`:
  - Added 1 new top-level section after #10441:
    - `## execFile vs shell-exec audit target accuracy (Lesson #10449)` — prefer `execFile` (direct binary) over `exec` (shell-mediated) for ProcessContext wires when no shell features are required; tighter allow-list, greppable audit records, narrower over-grant blast radius.
  - Updated `**Codified at:**` header with v1.49.883 extension entry.
  - Extended `## Cross-references` with #10449 entry.
- **MODIFIED** `tools/render-claude-md/disciplines.json`:
  - `Architecture-retrofit patterns` entry: appended `#10445`, `#10447`, `#10448` to `key_lessons` (5 → 8 lessons); extended `summary` with three new paragraphs; appended v1.49.883 codification record to `codified_at_milestone`.
  - `Failure-mode contracts` entry: appended `#10446` to `key_lessons` (3 → 4 lessons); extended `summary` with the multi-catch helper paragraph; appended v1.49.883 codification record to `codified_at_milestone`.
  - `Security chokepoints` entry: appended `#10449` to `key_lessons` (5 → 6 lessons); extended `summary` with the execFile-vs-shell paragraph; appended v1.49.883 codification record to `codified_at_milestone`.
- **MODIFIED** `CLAUDE.md` — regenerated via `npm run render:claude-md`. All three updated entries render the new content.
- **MODIFIED** `tests/security/check-stale-known-unwired.test.ts` — fixed stale assertion exposed by the campaign close. The pre-existing assertion `expect(processReport.entryCount).toBeGreaterThan(0)` (line 51) became wrong at v875 when Process KNOWN_UNWIRED hit 0, but v875-v882 ships did not surface the failure (likely vitest-skip override during the chip campaign). Replaced with `expect(typeof processReport.entryCount).toBe('number')` + `toBeGreaterThanOrEqual(0)` — preserves the test's structural intent (parser produces a numeric entryCount field) while accepting the now-valid zero state. Sibling of #10443 "tools-detecting-silent-failures must themselves fail loudly" (v867); below-threshold carry-forward observation in this ship's lessons doc.

## Test impact

One existing test updated (`tests/security/check-stale-known-unwired.test.ts`) — see above. No new test surface. Doc-only ship for the 5 new lessons; they document behavioral disciplines on top of existing tooling, so no new tool or test surface is required.

The existing audit tests (`src/security/process-context-audit.test.ts`, `src/security/egress-context-audit.test.ts`, `src/security/loader-context-audit.test.ts`) continue to enforce chokepoint wire discipline at vitest time per #10417. The #10446 multi-catch helper is a forward-shape; the first wired implementation will land in a future chip ship (likely a v883+N LoaderContext chip when that campaign opens).

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **101 consecutive ships at 1.178**; was 100 entering this ship — extends the widest pressure-margin record by +1 to 101 ships).
Counter-cadence count UNCHANGED at 6.

Manifest entries: **23 → 23** (UNCHANGED — three existing-entry extensions, zero new manifest domains).
Lessons in manifest (unique): **85 → 90** (+5: #10445, #10446, #10447, #10448, #10449).
Open promotion-eligible candidate backlog: **6 → 1** (5 promoted; module-singleton held at 1 instance as explicit carry-forward in #10448 catalog).
Tentative observations carried forward: ~3 (audit-fidelity inline-literal extraction at 1 instance; fake-fixture test pattern is a test-discipline candidate not chokepoint-discipline; tools-failing-loud at 1 instance from v867).
Wired calibratable thresholds: **5 of 7** (UNCHANGED).
**KNOWN_UNWIRED Process: 0 ✓** (UNCHANGED — chokepoint fully wired since v875).
**KNOWN_UNWIRED Egress: 0 ✓** (UNCHANGED — chokepoint fully wired since v881).
UNCODIFIED count: depends on scorer; expected to drop by ~5 since 5 promotion-eligible observations now codified.
Operational axes: **4** (UNCHANGED).
Pre-tag-gate step count: **18** (UNCHANGED).

## Composition with prior codify ships

| Codify ship | Lessons | New tool surface | Wall-clock | Notes |
|---|---|---|---|---|
| v1.49.847 | 5 (#10437, #10440, #10441, #10442 + #10443 first instance) | None | ~60-75 min | Cluster codify after the v810-v832 substrate-consumer arc. |
| v1.49.857 | 1 (#10443 inverse-audit) + tool + 6 tests | `tools/security/check-stale-known-unwired.mjs` | ~50-60 min | Tool-authoring + lesson codify. |
| v1.49.868 | 1 new (#10444) + 1 refinement (#10443 continuous-verification) | None | ~25-30 min | Doc-only after v858-v867 10-chip campaign. |
| v1.49.883 | **5 refinements** (#10445, #10446, #10447, #10448, #10449) | None | _this ship_ | Doc-only after v868-v882 12-chip + tool campaign. |

v883's 5-lesson scope at doc-only is the largest single-ship codify scope since v847. The retrospective analyzes the wall-clock against the v868 estimate (`~15 min/lesson + ~20 min/new-tool-surface + ~10 min/test-file`).

## Most-valuable single takeaway

**Two complete chokepoint surfaces (Process + Egress) are now fully wired with zero KNOWN_UNWIRED, and the v868-v882 campaign's wire-shape catalog is codified.** The two surfaces ship under a shared 5-sub-variant shape grammar (#10448), an N-driven shape selector (#10445), a router specialization (#10447), an audit-fidelity refinement (#10449), and a multi-catch helper for the propagation contract (#10446). The next chokepoint campaign (LoaderContext chip-down when it opens) inherits this discipline as a turnkey playbook: identify N, pick the sub-variant from the catalog, apply the helper, document the chosen shape in release notes.

This is the second time in this project's history that a chokepoint surface has been fully wired with zero KNOWN_UNWIRED (first: LoaderContext at v782 ship); this ship is the codify-axis follow-through that turns the engineering into discipline.
