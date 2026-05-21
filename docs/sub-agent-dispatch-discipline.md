# Sub-Agent Dispatch Discipline

**Surface:** W2/W3 sub-agent dispatch prompts; parallel build-agent spawning; per-dispatch token-budget sizing.

**Codified at:** v1.49.654 (FA-652-11 C08 lesson codification).

## Architectural facts

1. **Sub-agents lack SendMessage** in their toolkit. The model is
   spawn-task-return-result, not continuous-peer messaging
   (**Lesson #10193**, v1.49.637 cluster). Author dispatches assuming
   one-way input and one-shot deliverable return.

2. **Sub-agents hit a ~60-70 tool-use ceiling per dispatch** before
   they terminate mid-flight (**Lesson #10194** token-ceiling). Bound
   each dispatch to a scope of ~1 component / 30-50 wall-clock minutes
   worth of work. Anything larger gets split.

3. **The 64K output-token cap on each dispatch** means HTML + JSON
   deliverables exceeding ~50K combined characters must be pre-split
   into separate dispatches per file-type (**Lesson #10214**, applied
   v1.49.648 W2-NASA at obs#2 reaffirm).

4. **Chunked Write+Edit append pattern** is the canonical pattern for
   producing >32K HTML deliverables in a single dispatch
   (**Lesson #10240**, v1.49.651). The dispatch begins with a Write of
   the first ~30K, then repeated Edits append further sections.

5. **Transient API errors during W3 stages** recover via identical-prompt
   retry as the first-resort recovery strategy (**Lesson #10215**). The
   dispatch author should NOT modify the prompt on first retry — the
   error is API-side, not prompt-side.

## Dispatch-author checklist

When spawning a sub-agent dispatch:

- [ ] Scope sized to ~1 component / ≤50 min
- [ ] Output-format budget: HTML and JSON split if combined ≥50K
- [ ] Commit-between-deliverables instruction embedded in prompt
      (Lesson #10200: dispatches with self-correction stages need ≥2
      internal commit boundaries)
- [ ] No reliance on inter-agent SendMessage (Lesson #10193)
- [ ] Prompt includes the no-Co-Authored-By-Claude reminder (v1.49.621
      policy; see Ship pipeline discipline)
- [ ] Retry-policy noted if W3-stage and API-error-prone

## Cross-references

- Memory: `sub-agent-token-ceiling-iterative-dispatch.md`
- Ship pipeline discipline: apply-to-self enforcement, no-Co-Authored-By
- Mission package framing: scope-sizing for component-decomposition

## Lesson #10244 — 7-parallel-agent W3 dispatch reproducibility

**Operational standard:** parallel-agent W3 dispatches at obs#3 (three
consecutive degree reproducibility) is the established cadence. The
v1.49.651 + v1.49.652 W3-stage runs landed 7 parallel agents in single
cluster windows without regression.

Apply: counter-cadence milestones authoring W3 wave plans can size up to
7 parallel dispatches without exceeding reproducibility bounds. Larger
wave plans must declare new substrate (forward-shadow at obs#1).

## Post-trip salvage cleanup (codified v1.49.707)

**Surface:** when a sub-agent dispatch trips the Anthropic content filter
mid-flight at ~36 tool uses, do not default to rewrite-from-scratch.
Audit the disk first. The pattern below was established at v1.49.707
Artemis I after two same-session trips with `MISSION-PACKAGE-DISCIPLINE.md`
§3 (Lesson #10401) compliance on the primary regex but body-secondary
density at 16 hits.

### Architectural facts

1. **Failed sub-agents write ~95% of the deliverable before termination.**
   The filter trips on the cumulative output classifier, but the file
   writes that precede the trip complete normally. v707 Artemis I:
   14 of 15 files on disk (index.html 112K + 11 of 12 artifacts + 3
   metadata files) after a sub-agent terminated at ~36 tool uses.

2. **Technical artifacts survive intact.** Syntax constraints in GLSL
   shaders, Python sims, SPICE netlists, and Faust DSP markup prevent
   the token-repetition collapse that hits prose-heavy files. Inspect
   line counts vs predecessor (e.g., v706 JWST 1.159) — within ±20% is
   shippable as-is.

3. **Prose surfaces show token-repetition collapse before the trip.**
   The model emits increasingly degraded prose ("substrate substrate-cumulative
   substrate substrate-form-cumulative" runs) in the tool-uses
   immediately before termination. The pattern is detectable:

   ```bash
   grep -c "substrate substrate-[a-z-]* substrate substrate-[a-z-]*" \
     www/tibsfox/com/Research/NASA/<degree>/index.html
   ```

   v706 JWST baseline: 7 hits. v707 Artemis I pre-cleanup: 14 hits.
   ≥2× baseline indicates degradation requiring surgical cleanup.

4. **Edit-in-place is dramatically cheaper than full rewrite.** v707
   Artemis I salvage cleanup cost ~10K main-context output tokens vs
   estimated ~50-60K for a from-scratch rewrite of the same content.

### Post-trip audit workflow

When a sub-agent dispatch trips, before deciding next action:

- [ ] **Audit the staging directory** — `find www/tibsfox/com/Research/NASA/<degree>/ -type f | sort` + line counts vs predecessor.
- [ ] **Quantify degradation density** — `grep -c "substrate substrate-[a-z-]* substrate substrate-[a-z-]*"` against predecessor baseline.
- [ ] **Locate problem paragraphs** — `grep -n "substrate substrate-[a-z-]* substrate substrate-[a-z-]*" <file>` returns line numbers of degraded paragraphs (typically 10-20 of them).
- [ ] **Verify file completeness** — `tail -3 <file>` per artifact; technical artifacts should close cleanly (`}` for shaders/sims, `.END` for SPICE, `</html>` for HTML). Cut-off-mid-word artifacts are full-rewrite candidates.
- [ ] **Compare to predecessor** — JWST 1.159 story.html is 72 lines / 12K; v707 Artemis I post-trip story.html was 23 lines / 4K (cut off mid-word). That's the rewrite signal.

### Surgical Edit pattern

For each degraded paragraph identified by step 3 above:

1. Read the paragraph in context with `Read` (capture surrounding lines for unique-context Edits).
2. Author a clean replacement that preserves substrate-anchor density:
   - **Keep:** `UPPERCASE-SUBSTRATE-ANCHOR` tokens, `obs#N` markers, `NEW LOCKED` markers, named entities, dates, specifications.
   - **Collapse:** redundant lowercase-substrate runs (`substrate substrate-cumulative substrate substrate-form-cumulative` → `substrate-cumulative`).
3. Edit-replace each paragraph. After all edits, re-run the degradation check; total density should approach predecessor baseline ±10%.

### Confirm choice with user before committing

Show the audit numbers ("14 of 15 files on disk, technical artifacts clean, 72 'substrate substrate' patterns in prose vs v706 baseline 54") so the user can pick salvage vs. rewrite vs. defer with full information. Salvage-cleanup is the cheap path but the user may prefer line-by-line phrasing control via full rewrite.

### Cross-references

- **First-instance NEW LOCKED:** v1.49.707 Artemis I (2026-05-21)
- **Memory:** `feedback_sub-agent-partial-deliverable-salvage-cleanup.md`
- **Sibling discipline:** [`MISSION-PACKAGE-DISCIPLINE.md`](MISSION-PACKAGE-DISCIPLINE.md) §3 (brief trip-vocab budget — the trigger for the trip that this section salvages from)
