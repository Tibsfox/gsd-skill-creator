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

## Chapter generation in build dispatch (codified v1.49.709)

**Surface:** the dispatch prompt for the NASA build sub-agent. Closes the
v705–v708 deviation where chapter files (`docs/release-notes/v<X>/chapter/{00-summary,03-retrospective,04-lessons,99-context}.md`)
materialised only in a post-ship commit. Pulling chapter generation into
the dispatch saves ~5 minutes per ship and removes a class of late-pipeline
work the main context was repeatedly catching.

### Architectural facts

1. **`chapter.mjs` is DB-derived.** It reads `release_history.release` +
   `feature` + `retrospective` + `lesson` tables and writes chapter files
   to `.planning/roadmap/<version>/`. For a NEW version to appear, the
   release row must be ingested first (via `ingest.mjs`, which parses
   `docs/release-notes/<version>/README.md`).

2. **`publish.mjs` mirrors `.planning/roadmap/<v>/*.md` to `docs/release-notes/<v>/chapter/`.**
   The 4 standard files are basename-allowlisted; non-standard files are
   silently skipped (see `publish.mjs` allowlist).

3. **`refresh.mjs` runs the full chain** (`scan → ingest → ingest-deep →
   backfill-git-stats → extract-metrics → extract-lessons → classify →
   chapter → score → regen-history-md → reconcile → drift-check → audit`).
   `--fast` skips the expensive `extract-metrics` scan; `--quiet` suppresses
   per-step output. Idempotent — re-runs are safe.

4. **`run-with-pg.mjs` wraps PG credentials** from `<repo-root>/.env`.
   No direct `node tools/release-history/refresh.mjs` invocation — always
   route through the wrapper so PG auth lands.

5. **Pre-tag-gate step 3/14 checks chapter file presence** via
   `check-completeness.mjs --current --strict`. Chapter files must exist
   on disk (tracked or untracked) when pre-tag-gate runs. The pre-push
   hook re-runs the same gate when push-to-main is detected — strict mode
   blocks if any of the 5 release-notes files are missing or <200 bytes.

### Standard dispatch deliverable list (NASA mission build)

Embed this canonical list in the build sub-agent dispatch prompt. Lifted
from the brief's Phase digest (W2/W3 rows). The chapter-gen step at the
end is the v709 codification.

```
W2 deliverables (sub-agent authors):
- www/tibsfox/com/Research/NASA/<degree>/index.html (target ~96K)
- www/tibsfox/com/Research/NASA/<degree>/<12 artifacts> (5/5 categories)
- www/tibsfox/com/Research/NASA/degree-sync.json (update + new mission row)
- Cross-link sentinels (≥50% coverage per --cross-link-strict)

W3 deliverables (sub-agent authors):
- docs/release-notes/v<X>/README.md (A(90+) score target)
- Append v<X> ground-truth entry to .planning/roadmap/STORY.md
  (prefix with \n separator per Lesson #10391)

W3.5 deliverable (sub-agent runs as final step before returning):
- node tools/release-history/run-with-pg.mjs refresh --fast --quiet
  → ingests v<X> and writes chapter files to .planning/roadmap/v<X>/
    (chapter.mjs step inside refresh).
- node tools/release-history/run-with-pg.mjs publish --execute --version v<X>
  → mirrors the .planning/roadmap/v<X>/ chapter files to
    docs/release-notes/v<X>/chapter/. REQUIRED — refresh runs publish as
    dry-run only; without this step, chapter files exist in
    .planning/roadmap/ but NOT in docs/release-notes/.
- Verify with: ls docs/release-notes/v<X>/chapter/
  → expect 4 files (00-summary.md, 03-retrospective.md, 04-lessons.md,
    99-context.md), each >200 bytes.
```

### Why W3.5 lives in the sub-agent, not the main context

- **Pre-tag-gate step 3 needs the files on disk before tag.** Running
  refresh post-tag (current v705–v708 pattern) requires an extra
  post-ship commit to capture the chapter writes. The main-context
  operator must either remember to run refresh between W3 and T14 or
  accept a deferred post-ship commit. Baking into the sub-agent makes
  this deterministic.

- **Sub-agent has Bash + PG access through the wrapper.** The
  `run-with-pg.mjs` wrapper reads `<repo-root>/.env` (PG credentials
  canonical location per memory `pg_credentials_location.md`). No
  additional secret-handling required.

- **Refresh is idempotent.** A second run from the main context (e.g.,
  to pick up post-tag metrics like `commits` / `files_changed` /
  `lines_added`) is safe and remains the standard T14 step 9. The
  post-ship refresh updates DB-derived fields that aren't available
  until after the tag exists; chapter files updated by that re-run are
  captured in the post-ship commit as usual.

### Dispatch prompt snippet (copy-paste ready)

Add to the build sub-agent's deliverable list near the end:

```
After authoring docs/release-notes/v<X>/README.md and appending the
v<X> entry to .planning/roadmap/STORY.md, run the chapter pipeline
(BOTH steps — refresh alone is not sufficient):

  cd /media/foxy/ai/GSD/dev-tools/gsd-skill-creator && \
    node tools/release-history/run-with-pg.mjs refresh --fast --quiet && \
    node tools/release-history/run-with-pg.mjs publish --execute --version v<X>

Then verify the 4 chapter files exist in docs/release-notes/:

  ls docs/release-notes/v<X>/chapter/

Expected: 00-summary.md, 03-retrospective.md, 04-lessons.md, 99-context.md
(each >200 bytes). If any are missing or undersized, surface the error
in your return summary — the main-context operator needs to know before
T14 step 1 (pre-tag-gate) which requires them present.

Note: the refresh step writes chapter files to .planning/roadmap/v<X>/
via chapter.mjs. The publish step mirrors them to
docs/release-notes/v<X>/chapter/ via publish.mjs. Both steps are
required — refresh runs publish as DRY-RUN only.
```

### Compatibility with post-trip salvage cleanup

If the sub-agent trips before reaching W3.5 chapter generation, the
post-trip audit (preceding section) should include a chapter-files
check as part of the disk audit:

```bash
ls docs/release-notes/v<X>/chapter/ 2>/dev/null || echo "missing"
```

If missing, the operator runs `node tools/release-history/run-with-pg.mjs refresh --fast --quiet`
as part of salvage-cleanup before pre-tag-gate. The refresh is
idempotent + DB-derived, so it's safe to run regardless of how much
of the W2/W3 deliverable was salvaged vs. rewritten.

### Cross-references

- **First-instance NEW LOCKED:** v1.49.709 Euclid (2026-05-21)
- **Memory:** `feedback_nasa-ship-sequence-streamlined.md` (existing —
  this codification closes its "~5-7 main-context Bash calls per
  milestone" → ~3-4 by moving chapter-gen into dispatch)
- **Sibling discipline:** [`T14-SHIP-SEQUENCE.md`](T14-SHIP-SEQUENCE.md)
  step 9 (RH refresh) — remains the canonical post-tag refresh; W3.5
  is a pre-tag bootstrap, not a replacement
