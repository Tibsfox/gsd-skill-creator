# v1.49.653 Chapter 04 — Lessons

5 forward lessons emitted this milestone (#10260–#10264).

---

### Lesson #10260 — Counter-cadence cadence sustainability

**Surfaced at:** v1.49.653 ship.
**Pattern:** The first counter-cadence milestone (v1.49.585) shipped 2026-04-28. The second (v1.49.653) shipped 2026-05-15. Interval: 17 calendar days / 68 forward-cadence milestones (v586 → v652).

**Observation:** The original v1.49.585 retrospective (Lesson #10168) projected a counter-cadence cadence of "every ~30 forward-cadence milestones." The observed cadence is closer to **~60-68 milestones**, double the projection.

**Why the projection was off:** the original target was calibrated against the first ~30-milestone block when most operational-debt accumulation was front-loaded (the v1.49.585 work cleared 5 long-standing categories). After v585's cleanup, subsequent milestones accumulated less debt per ship, so the natural "when does the debt warrant a cleanup pass" trigger fires less frequently than ~30-milestone interval.

**Codify forward:** future cadence-planning should use ~60-milestone interval as the baseline, not 30. Counter-cadence is reactive (debt-triggered), not scheduled.

**Status:** EMITTED + IMPLICITLY-CLOSED (the actual cadence is the measurement).

---

### Lesson #10261 — Long-term roadmap closure in a single session is possible when well-scoped

**Surfaced at:** v1.49.653 execution.
**Pattern:** The `long-term-roadmap-2026-05-15.md` planning doc sized L-01 through L-05 as 5 separate counter-cadence milestones across 10-12 calendar days. The actual closure took ~6 hours of focused single-session work.

**Why the compression was possible:**

1. **The plan was clear** — each L-* item had defined scope, dependencies, and acceptance criteria authored at planning time. Execution didn't burn time on requirements discovery.
2. **Inter-item dependencies were thin** — L-04 used L-02's bypass vocabulary, but the items could be executed in any order. No serialization constraint forced multi-session.
3. **The codebase absorbed the new tooling cleanly** — vitest bench plugged into existing test infra, auto-render disciplines section used existing section-renderer registry, apply-diff followed the append-story-entry operator-confirm pattern.

**When this pattern works:** the plan is well-scoped and the items are mostly tooling/infrastructure additions that don't require deep substrate research.

**When this pattern DOESN'T work:** if any item required external research (e.g. archive inquiry, vendor data request, primary-source verification), the session would have hit a wall.

**Codify forward:** plan-first + thin-dependencies + infrastructure-shaped scope = single-session-feasible. Substrate-content scope (NASA degree advances, MUS/ELC research) is single-session-feasible only at small-substrate-density levels.

**Status:** EMITTED + CLOSED IN-CLUSTER.

---

### Lesson #10262 — Empirical-state verification catches stale CONCERNS findings

**Surfaced at:** v1.49.653 investigation phase.
**Pattern:** The May-15 codebase-mapping pass produced a CONCERNS doc that listed §8 (run-with-pg.mjs hardcoded path), §13 (ELC vs MUS regex drift), §16 (bounded-tape framing tests) as open. Verification against current source code revealed all three had shipped at v1.49.585 — the audit was 7 milestones stale on these items.

**Root cause:** the codebase-mapper appears to have ingested v1.49.585 mission specs (which describe to-be-shipped state) rather than verifying against the post-ship state of `tools/` and `src/`. Result: ~3 false-open findings per audit pass.

**Catch mechanism:** before executing each "fix" task in a multi-item plan, briefly inspect the current source. Stale findings appear as "this file already has the documented fix" within seconds.

**Codify forward:** add a verification step to the codebase-mapping process — for each "still-open" CONCERNS finding, the mapper should grep for the documented fix-marker (e.g. mission-spec citation, comment block) and downgrade the finding to "RESOLVED at v1.49.X" when found. Saves ~10-15 min per false-open per future audit.

**Suggested implementation:** `tools/codebase-mapper/verify-still-open.mjs` that takes a CONCERNS draft and re-checks each `still-open` claim against current source.

**Status:** EMITTED, codification deferred (would be a future counter-cadence component).

---

### Lesson #10263 — Formal-block markdown syntax beats LLM extraction for ledger automation

**Surfaced at:** v1.49.653 L-03 design.
**Pattern:** The original plan considered LLM-based extraction of V-flag emit/close events from retrospective prose. The final design uses a strict `### V-flag emit: V-NN` markdown header + `- key: value` bullets parser.

**Why strict parsing wins here:**

1. **Determinism** — the parser produces identical output across re-runs and across operators. LLM extraction would introduce variance even on the same input.
2. **Validation is cheap** — required-key checks, allowed-status enums, ID-format validation, collision detection against the ledger all fit in <50 lines of regex + map operations.
3. **The author is already writing the structured info** — when a retrospective says "this emit a new V-flag for the Tacha citation," the author knows the citation_target, reason, follow_up_action. Asking them to write 4 bullets vs writing the prose costs the same.
4. **Authoring discipline is reinforced** — the formal block makes the operator slow down and complete each required field. Prose-only emit allows missing data.
5. **No model dependency** — the tool runs on any machine with Node; LLM extraction would couple the ship pipeline to an inference endpoint.

**When LLM extraction WOULD be the right choice:** when the corpus is too large for retroactive formal-block backfill AND the cost of partial-coverage extraction is acceptable.

**Status:** EMITTED + CLOSED IN-CLUSTER (formal-block syntax landed at v1.49.653 L-03 with end-to-end round-trip test).

---

### Lesson #10264 — Discipline-as-data manifest curation surfaces real gaps

**Surfaced at:** v1.49.653 L-04 first audit run.
**Pattern:** The newly-authored `tools/render-claude-md/disciplines.json` manifest indexes 12 lesson IDs across 8 discipline domains. The accompanying `tools/check-discipline-coverage.mjs` audit scans all retrospective `04-lessons.md` files and classifies lesson references into COVERED (in manifest + cited in doc) / PARTIAL (in only one) / UNCODIFIED (carried forward 2+ times but not captured).

**First-scan results:** 6 COVERED, 10 PARTIAL, 31 UNCODIFIED across 95 unique lesson IDs.

**Why this is the right finding:** the 31 UNCODIFIED lessons are not a v1.49.653 regression — they are the **first measurement** of a pre-existing discipline-as-data gap. Operator memory and prose narratives carried these lessons forward without their being captured in a machine-readable form.

**Codification cadence:** future counter-cadence milestones can pick 3-5 of the 31 lessons per session and either:
- Add the lesson ID to a relevant `disciplines.json` `key_lessons` array if the lesson is sufficiently captured in an existing canonical doc.
- Author a new discipline-doc section if the lesson represents a discipline not yet documented.

**The audit is the lever:** measurement creates the pressure to close the gap. Without the audit, the 31 lessons would continue to be carried forward as prose without ever crystallizing into discipline.

**Status:** EMITTED + CLOSED IN-CLUSTER (manifest + audit + step 13/13 gate all shipped).

---

## Cumulative lesson state

After this milestone:
- Lessons emitted total: ~100 (counting from #10168 first cleanup-cluster origin through #10264).
- Lessons COVERED by discipline manifest: 6.
- Lessons UNCODIFIED but carried forward 2+ times: 31.
- Lessons PARTIAL: 10.

The bucket sizes are first-measurement signals. The trend across the next ~3 counter-cadence milestones should be: UNCODIFIED ↓, COVERED ↑.

---

*Lesson numbering picks up from #10259 (last assigned at v1.49.652). v1.49.654 will start at #10265 or higher.*
