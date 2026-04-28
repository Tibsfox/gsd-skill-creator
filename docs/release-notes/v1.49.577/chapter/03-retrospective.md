# v1.49.577 — Retrospective

**Reads:** v1.49.575 (CS25–26 Sweep → GSD Integration) + v1.49.576 (OOPS-GSD Alignment & gsd-skill-creator Update Pass)

## Carryover lessons applied at v1.49.577

### From v1.49.576 — Two-part single-milestone shape

v1.49.576 was the first milestone to ship Part A (audit) and Part B (implementation) on the same milestone version rather than splitting them across consecutive milestones. v1.49.577 reuses the shape verbatim: Part A research absorption (phases 821–826) followed by Part B implementation (phases 827–TBD) under a single `v1.49.577` tag. The pattern keeps research-to-implementation traceability tight: the FINDINGS.md that gates Part B is a build artifact of Part A's same milestone, not a hand-off across versions.

### From v1.49.576 — "Mission package replaces discuss/plan-phase"

v1.49.576 normalized the pattern that a vision-to-mission package (PDF + .tex + index.html + paper-card directory tree) replaces the standard GSD `gsd-discuss-phase` + `gsd-plan-phase` invocations when the mission has been authored upstream. v1.49.577 carries the pattern: the mission package landed as a 4-file zip from the user (`~/Downloads/files(26).zip`, 478KB) on 2026-04-25 and was extracted directly into `.planning/missions/julia-parameter/`. Wave 0–3 of Part A executed the mission's own wave plan verbatim; no separate `gsd-discuss-phase` or `gsd-plan-phase` was run.

### From v1.49.575 — CLAUDE.md External Citations as a section, not scattered

v1.49.575 created the "External Citations (CS25–26 Sweep)" section in CLAUDE.md as a single consolidated section with 3 anchor papers. v1.49.577 inherits the structural decision: the 4 new anchors landed in v1.49.577 extend the **same** section with a new cluster subsection (per user-locked decision: "extend existing section with new cluster subsection, not sibling"). The featured philosophical anchor lands as a separate sub-subsection ("Mission-philosophical anchor (JULIA-PARAMETER) — arXiv:2604.21048") under the same parent section. The single-section discipline keeps the citation surface scannable at the top of CLAUDE.md and prevents drift into multiple sibling sections that would require cross-referencing.

### From v1.49.576 — Anti-pattern: no re-research of FINDINGS-classified items in Part B

v1.49.576 enforced the rule that once Part A's FINDINGS.md classifies an item (BLOCK / HIGH / MEDIUM / LOW + named anchor papers + named GSD subsystem), Part B implements against that classification without re-opening the research question. v1.49.577 honored the rule: every Part B commit message references the JP-NNN finding ID, and no Part B phase re-read the underlying arXiv abstracts. The one exception was the f-divergence DRO BLOCK avoidance documented in `synthesis/retro-seed.md §1` — that was a Wave 2 INTEG decision inside Part A, not a Part B re-research event.

### From v1.49.575 — Anti-pattern: no `wasteland` branch / muse content in research absorption

v1.49.575 first formalized the rule that research-absorption missions never import from the `wasteland` branch or the `data/chipset/muses/` content. v1.49.577 honored it: 0 muse references in the 54 paper-cards, 0 wasteland imports in the synthesis-matrix, and the `--exclude` defaults on `tools/import-filesystem-skills.ts` continued to block the `wasteland` path segment.

### From v1.49.576 — Anti-pattern: no `.planning/fox-companies/` IP exposed

The synthesis-matrix and FINDINGS.md were authored against `.planning/missions/julia-parameter/` (gitignored). The CLAUDE.md citation extension and any user-facing release-notes content reference paper anchors and `src/*` subsystem paths only — no `.planning/fox-companies/*` content leaked into upstream-facing artifacts. v1.49.577 compliance verified.

### From v1.49.575 + v1.49.576 — `/media/foxy/...` path scrubbing

User-facing copy in this release-notes file uses `$REPO/...` or relative paths from repo root only. The CLAUDE.md citation block authored in v1.49.577 likewise scrubs absolute paths.

## New lessons emitted forward

### "All candidates" Part B scope is workable but produces component-count overshoot

The user-locked "all candidates" scope decision at the Part A → Part B handoff produced a Part B that landed 14 components against a vision-to-mission target of 6–10. The overshoot was visible in the test-delta as well (+279 vs +50 target = 5.6×). The shape is workable — every BLOCK/HIGH/MEDIUM finding got a real deliverable, not a backlog defer — but future "all candidates" missions should adjust component-count expectations upward at intake, not at landing time. Forward operational rule: when "all candidates" scope is locked at handoff and FINDINGS surfaces ≥ 30 candidates, expect 12–18 components and ≥ 200 net tests, not the standard 6–10 / +50.

### Self-review pass after closing wave is a reproducibly useful gate

The self-review pass at commit `268950204` caught two MEDIUM citation-overclaim findings (`wasserstein-boed.ts` and `sages-consistency.test.ts`) that the closing wave had not surfaced. The pass had no behavioral change (28,345 passing unchanged) but did real work reframing language to match what the code actually does. Forward operational rule: the self-review pass is now a normative closing-wave addendum for milestones with ≥ 5 new components or ≥ 100 test delta. Find-and-fix language drift before the milestone is read by anyone else.

### Featured-paper handling as user-interest signal, not synthesis priority

The featured-paper handling pattern v1.49.577 used (arXiv:2604.21048 anchored a *philosophical* through-line, not a *src/\* code anchor*) is reproducible. The featured paper produced one paragraph of CLAUDE.md content under "Mission-philosophical anchor (JULIA-PARAMETER)" but did not displace the convergent-discovery clusters in the synthesis matrix. Forward operational rule: when the user flags a featured paper at mission intake, treat it as an interest-signal influencing W2 framing, not as a synthesis priority that overshadows convergent-discovery clusters in the matrix. The W2 INTEG agent's authority to recommend a final milestone name from the cluster matrix (not from the featured paper alone) is the correct discipline.

### CLAUDE.md citation extension should be a single commit at synthesis time

JP-011 + JP-014 both modified CLAUDE.md. Per the `synthesis/retro-seed.md §3.4` recommendation, both edits consolidated into commit `57bce4bb2`. Future research-absorption missions should plan for a single CLAUDE.md commit at the W2 → W3 boundary, not multiple scattered edits across Part B implementation phases. Keeps the diff scannable and preserves the "External Citations" section's structural integrity.

---

*v1.49.577 retrospective. Reads v1.49.575 + v1.49.576. Emits to v1.49.578+ carryover.*
