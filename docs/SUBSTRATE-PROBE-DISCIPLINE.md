# Substrate-Probe Discipline

**Created:** 2026-05-11
**Component:** C3 — Substrate-Probe Discipline Doc (v1.49.638 housekeeping cluster #5)
**Codifies:** Lesson #10192 (Substrate-probe before component-spec finalization) from `docs/release-notes/v1.49.637/chapter/04-lessons.md:9-53`
**See also:** `.planning/test-discipline/perf-assertion-warmup.md`, `.planning/test-discipline/fragile-test-pattern.md` (sibling scratch notes, working-tree only)

---

## 1. Lesson narrative

Mission-package component specs are written against a *named substrate*: a file shape, a cargo feature gate, an npm export surface, a fixture replacement scope, a pipeline-script ordering. When the spec is finalized **without** mechanical enumeration of that substrate, the spec encodes the author's *belief* about the substrate rather than the substrate's *actual* shape. The cost of this gap surfaces twice:

1. **Best case** — W0a substrate-probe at execution start catches the gap; spec is reworked before W1 begins (~hours of replan, but no shipped damage).
2. **Worst case** — gap is missed at W0a, W1 begins against the spec's belief, and the divergence surfaces mid-execution as failed tests, broken assumptions, or operator-decision routing that should have been resolved at design time.

This discipline doc codifies the rule: **the spec author runs the substrate probe themselves, in the authoring loop, before the spec is finalized.** W0a probe remains as fallback (substrate may drift between spec authoring and W1 start), but the first line of defense moves upstream.

### 1.1 The pattern — three v1.49.637 instances

From `docs/release-notes/v1.49.637/chapter/04-lessons.md:28-39`:

1. **C1 cargo feature gating.** Spec assumed `#[cfg(feature = "...")]` was a single-site gate. Substrate at W0a probe: **3 gated modules + a re-export**. Spec rewrite required before W1A.
2. **C3 `@zxcvbn-ts/language-en` export shape.** Spec assumed the package exports `adjacencyGraphs`. Substrate at W0a probe: the export surface is `dictionary` + `translations` only — `adjacencyGraphs` is not exported. Spec adjusted.
3. **C3 fixture replacement scope.** Spec/audit estimated **2-3 `hunter2` sites** in `passphrase-flow.test.ts`. Actual count surfaced at W1A: **8 sites** across the singleton-init refactor. (Generalizes v1.49.635 Meta-Lesson #10180 — audit underestimates fixture scope.)

All three were caught by flight-ops at W0a — but only *after* spec authoring. Each cost a replan cycle that could have been avoided by a 5-15 min `grep`/`find` enumeration at authoring time.

### 1.2 Why this happens — the cost asymmetry

Spec authoring is interpretive (synthesis from briefing notes, prior milestones, mental model of the substrate). Substrate enumeration is mechanical (`grep -rn`, `find`, `ls`, `git log -S`, package-export reads). The author's incentive at spec time is to compress: a single grep can be substituted with an assumption ("the gate is single-site"), and the assumption flows downstream untested.

The discipline removes the substitution: every named substrate gets enumerated, and the enumeration output is **pasted into the spec** as evidence — not summarized, not paraphrased.

---

## 2. The discipline rule

> **Mission-package component specs that name a substrate (file, function, feature gate, package export, fixture scope, pipeline script) MUST include a Stage-1 substrate-evidence section enumerating that substrate's actual shape, authored before the spec is finalized.**

### 2.1 What counts as "naming a substrate"

A spec names a substrate when it asserts ANY of:
- "the X gate is at `<path>`"
- "the test currently asserts Y"
- "the API exports Z"
- "this fixture appears in N sites"
- "the pipeline runs A → B → C in order"
- "the caller surface is M files"
- "this module is reached from N upstream paths"

Every one of these is a falsifiable claim that a mechanical probe can verify or refute in minutes.

### 2.2 What probe output to capture

The substrate-evidence section is **mechanical, not interpretive**. Copy-paste the actual output of the probe commands; do not summarize.

- File-path + line-number citations (`atlas.rs:569-641`, `tools/pre-tag-gate.sh:377-388`)
- Counts from `grep -rn '<symbol>' | wc -l` (3 matches, 13 call sites, 8 fixture sites)
- Literal source-code shapes when the spec depends on a shape
- Sibling-pattern observations ("`scripts/post-bump-X.mjs` doesn't exist; only `scripts/append-story-entry.mjs` does")
- Negative findings (NO `scripts/ship.sh`, NO `Makefile ship` target — Stage 1 of v1.49.638 C2 found this)

### 2.3 When the probe is OK to skip

The discipline is calibrated for substrate-touching components, not greenfield work:

- Pure-new files (no existing substrate to probe) — discipline is N/A
- Pure-doc components (no code substrate named) — discipline is N/A
- Components that explicitly defer substrate decisions to the executing agent ("flight-ops at W0a will enumerate and choose") — must say so explicitly so the spec reader knows the gap is intentional

---

## 3. Template — substrate-evidence section

Paste this scaffold into any component spec touching existing substrate. Replace bracketed slots with mechanical-probe output.

```markdown
## Substrate evidence (Stage 1 — pre-spec finalization)

**Probe date:** YYYY-MM-DD
**Probe author:** [team-lead | flight-ops at W0a | spec author name]
**Probe scope:** [what substrate this section enumerates]

### Enumeration

- `grep -rn '<key-symbol>' <target-path>` → N matches across F files
  - `<path>:<line>` — <one-line shape description>
  - `<path>:<line>` — <one-line shape description>
- `ls <directory>` → relevant siblings: <file1>, <file2>
- `git log -S '<symbol>' --oneline -5` → <recent provenance, if relevant>

### Integration points (caller surface)

- `<file:line>` — caller of the target surface (1 of N)
- `<file:line>` — sibling implementing a comparable pattern
- `<file:line>` — caller that depends on a contract the spec touches

### Existing test surface

- `<test-file>` — N tests touching the target
- (sibling pattern from a comparable component, if applicable)

### Component-spec calibration (derived from above)

- **Test-delta projection:** <N to N> net, calibrated against actual fixture-site / cfg-site / assertion-site enumeration above
- **File-touch projection:** <N files>, listed: <file1>, <file2>
- **Risk classification:** <LOW | MED | HIGH> with rationale from substrate (NOT generic)
- **Decision-tree branches the spec must address:** [list, derived from negative findings]
```

The shape is intentionally similar to `c1-atlas-lru-architectural-fix-design.md:11-75` and `c2-story-gate-ordering-design.md:11-72`, both of which adopted this discipline at v1.49.638 W0.

---

## 4. Apply-to-self check (optional, exploratory)

A future `scripts/apply-to-self.mjs` pattern *could* grep-verify component specs have substrate-evidence sections:

```js
{
  id: 'mission-spec-missing-substrate-evidence',
  scope: '.planning/missions/*/components/*.md',
  detector: (componentSpecContent, path) => {
    // Heuristic: spec names a substrate (mentions an existing file path,
    // grep'd symbol, or cfg gate) but lacks a "Substrate evidence" or
    // "Substrate findings" section.
    const namesSubstrate = /src-tauri\/|src\/|tools\/|scripts\/|@\w+\//.test(componentSpecContent);
    const hasEvidence = /## (Substrate evidence|Substrate findings|## \d+\. Substrate)/i.test(componentSpecContent);
    return namesSubstrate && !hasEvidence;
  },
  // High false-positive risk: not all specs need substrate evidence at
  // the same rigor level (pure-doc, pure-greenfield components are exempt).
  // Default delivery for C3: doc-only. Pattern is exploratory.
}
```

**This apply-to-self pattern is OPTIONAL.** False-positive risk is hard to bound (some specs reference paths casually without depending on their shape). The discipline doc is the primary deliverable; the mechanical pattern is exploratory carry-forward for Cluster #6+ if the heuristic stabilizes.

If the pattern is added in a future milestone, it MUST ship with negative-test fixtures per v1.49.637 Lesson #10190 (negative fixtures co-located with positive).

---

## 5. Concrete v1.49.638 W0 examples (this milestone's application of its own discipline)

The v1.49.638 mission package claims to have applied substrate-probe discipline at W0 for components C1-C5. Verify mechanically:

### 5.1 C1 — Atlas LRU architectural fix (`.planning/c1-atlas-lru-architectural-fix-design.md`)

Section 1 ("Substrate findings — mechanical enumeration") covers lines 11-75 and enumerates:

- **The failing test:** `src-tauri/src/intelligence/atlas.rs:2566-2613` — exact `#[ignore]` test with line citation and literal source quote (sec 1.1).
- **The batch-load API:** `src-tauri/src/intelligence/atlas.rs:569-641` — `get_all_project_conns()` surface, behavior at lines 613-638 documented step-by-step (sec 1.2).
- **The caller surface:** **13 call sites** enumerated at exact line numbers `753, 802, 832, 851, 876, 901, 929, 957, 985, 1013, 1042, 1080` — every caller listed, not summarized (sec 1.3).
- **The test contract mismatch:** root-cause analysis derived from substrate, not assumed (sec 1.4).

C1 design tradeoffs (Option a vs Option b) are then grounded in this enumeration. The Option b recommendation explicitly cites the 13-caller probe ("no real caller needs per-project access — substrate probe sec 1.3 shows all 13 callers use cross-project batch-load") rather than asserting it.

### 5.2 C2 — STORY-gate pipeline ordering (`.planning/c2-story-gate-ordering-design.md`)

Section 1 ("Substrate findings") covers lines 11-72 and surfaces a divergence the spec author would have missed without probing:

- **Current STORY-gate position:** `tools/pre-tag-gate.sh:369-389` — exact line range with literal bash quoted at lines 377-388 (sec 1.1).
- **No T14 orchestration script exists.** Probe found **NO `scripts/ship.sh`**, **NO `Makefile ship` target**, **NO `npm run ship` aggregator** (sec 1.4 + 1.6). The T14 sequence is operator-driven, documented per-milestone in release-notes `99-context.md:97-110`.
- **Cause-of-no-op derived from substrate:** the pre-tag-gate composite runs BEFORE `bump-version.mjs` in operator T14 sequence; the script reads `package.json.version` which is still the predecessor's value at pre-tag-gate time → finds the predecessor's STORY entry already present → reports no-op → PASS. The current milestone's entry is never written (sec 1.3).

This negative finding (no orchestration script) reframed the entire design space. Without the probe, the spec might have proposed "move STORY-gate to step N of scripts/ship.sh" — a fix against a substrate that doesn't exist. With the probe, the spec produced three viable options (document-only-in-99-context + invariant test / minimal wrapper script / wire-into-bump-version) all grounded in the actual operator-driven T14 sequence.

### 5.3 What C1 and C2 demonstrate

Both W0 docs cite the substrate **before** asserting a design. Both derive their option-space from the citations. Both flag negative findings ("no caller needs this", "no ship script exists") that re-shape the spec. This is the discipline applied correctly.

---

## 6. Forward applicability

### 6.1 When the discipline triggers

- **Any new mission package**, especially counter-cadence clusters where the substrate is the project's own operational debt
- **Any component spec touching existing substrate** (vs greenfield) — most housekeeping work
- **Any test-delta projection** in a component spec — must be calibrated from enumeration, not estimated from briefing intuition (this is where Meta-Lesson #10180 + Lesson #10192 both bite)
- **Any pipeline-position constraint** ("X must run AFTER Y, BEFORE Z") — must enumerate where X currently runs and what Y/Z surfaces actually exist

### 6.2 Authoring-loop integration

Spec author workflow when this discipline is active:

1. Draft component spec from briefing notes (interpretive).
2. **Stop before finalization.** For each named substrate in the draft, run the mechanical probe.
3. Paste probe output into a "Substrate evidence" section using the §3 template.
4. Reconcile the draft against the probe. Adjust assertions, counts, file-paths, and decision-trees to match enumeration.
5. Finalize — spec ships with evidence section intact.

### 6.3 Failure modes this catches

From v1.49.637 retrospective patterns:

- **Assumed-single-site-but-multi-site** (C1 cargo gates: 1 assumed → 3 actual)
- **Assumed-export-shape-but-different** (C3 zxcvbn: `adjacencyGraphs` assumed → `dictionary`+`translations` actual)
- **Assumed-N-sites-but-N+k-sites** (C3 fixtures: 2-3 audit → 8 actual; generalizes Meta-Lesson #10180)
- **Assumed-orchestration-script-exists** (v1.49.638 C2: `scripts/ship.sh` assumed → operator-driven T14 actual)
- **Assumed-per-project-API-semantics** (v1.49.638 C1: per-project access assumed → cross-project batch-load actual)

### 6.4 Cost expectation

Per Lesson #10192: **5-15 min per substrate per component.** The cost-of-NOT-doing-it is W0a delta-finding rework (hours) or W1 mid-execution corrections (worst case, shipped surprises).

---

## 7. Cross-references

- **Lesson source:** `docs/release-notes/v1.49.637/chapter/04-lessons.md:9-53` (#10192)
- **Generalizes:** v1.49.635 Meta-Lesson #10180 (audit underestimates fixture scope)
- **Sibling discipline doc:** `perf-assertion-warmup.md` (perf-test cold-start failure pattern; same lesson-→-doc codification structure)
- **Sibling discipline doc:** `fragile-test-pattern.md` (test-flake taxonomy)
- **v1.49.638 W0 application:** `.planning/c1-atlas-lru-architectural-fix-design.md` §1, `.planning/c2-story-gate-ordering-design.md` §1
- **Wave plan template:** mission-package component specs at `.planning/missions/v1-49-638-housekeeping-cluster-5/components/`

---

*This doc itself was authored under the discipline it codifies: §5.1 and §5.2 cite concrete file paths, line numbers, and commit-evidence from real v1.49.638 W0 design docs rather than abstract patterns.*
