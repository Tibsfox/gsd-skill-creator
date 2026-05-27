# v1.49.840 — Lessons

## Promoted to ESTABLISHED in this ship

### #10436 — Two-layer closure generalizes to file-overwrite drift

The two-layer-closure pattern (source-eliminator + detector) — codified at v814 under #10431 from the v807+v813 STATE.md procedure-rooted drift case study — generalizes to a sibling drift class. A tool that blindly overwrites destination files containing hand-authored content not present in the source produces drift with the same structural shape; both layers remain necessary.

**Trigger:** Designing a closure for a drift class where a tool writes a destination file from a source location, and the destination may contain hand-authored content not in the source. Symptoms include manual recovery procedures (`git checkout HEAD -- <files>`, `cp .backup-*`) that operators run after each tool invocation.

**Evidence (2 instances, 2nd-instance threshold per #10426):**

- **v1.49.813** STATE.md drift (operator-procedure-rooted). Source eliminator: `tools/state-md-set-shipped.mjs` (atomic-writer replacing the prior hand-edit-then-normalize procedure). Detector: `tools/pre-tag-gate.sh` step 0.5 (post-write canonical-form check).
- **v1.49.836** publish.mjs chapter-overwrite drift (tool-procedure-rooted). Source eliminator: `chapter.mjs` `writeChapterIdempotent` + `openerMatches` (since v585 C04 — source-side preservation existed for 251 ships before the destination-side layer closed). Detector: `publish.mjs` `shouldPublishToDestination` (destination-side preservation gate; this ship's contribution).

The structural shape is identical: BOTH layers required, source-eliminator alone leaves the destination-side window open, detector alone leaves the source-side window open. The naming distinction (procedure-rooted vs file-overwrite) is descriptive of the drift *origin*, not a structural change to the discipline. A future ship that closes a third drift class with both layers present should treat it as an additional case study under #10431 + #10436 rather than as a separate discipline.

**Discipline location:** `docs/two-layer-closure-discipline.md` § File-overwrite drift sub-class (Lesson #10436).

**Manifest:** Added to Two-layer closure for procedure-rooted drift entry key_lessons; added `tools/release-history/publish.mjs` + `tools/release-history/chapter.mjs` to canonical_docs.

**Operational impact:** v836's destination-side preservation gate fired 9 times across v837 + v838 + v839's T14 publish steps (3 PRESERVED log lines per ship — `00-summary.md` + `03-retrospective.md` + `99-context.md`). Zero hand-authored chapters clobbered after v836. The fix is sticky; the 251-ship-old manual-recovery friction is gone for good.

### #10437 — Subscriber-gated observability-only context-hook pattern

A specific 5-element structural shape recurs across substrate-consumer context hooks. The hook exists to let a future consumer subscribe to an observability event emitted by the producer, but the hook MUST cost zero when no consumer is attached AND MUST never tear down the producer when the consumer errors. This is a refinement of #10427's accessory-surface contract — the hook is observability-only, the producer's load-bearing path doesn't depend on the consumer's output, silent failure is correct.

**Trigger:** Adding a subscriber-gated observability hook on a context/options type; reviewing whether an existing hook follows the subscriber-gated shape; designing the catch block when a surface has multiple subscriber-gated hooks (PAIR co-location).

**Evidence (4 instances, 2nd-instance threshold per #10426 already exceeded; unified codification):**

- **v1.49.810** `onPredictions` 1st instance — copper `_emitPredictions`. Establishes the 5-element shape: optional `?` field + subscriber gate + fire-and-forget Promise + .catch() + two-argument signature.
- **v1.49.826** `onPredictions` 2nd instance — selector `_emitPredictions`. Reaches threshold for `onPredictions` standalone under #10426.
- **v1.49.830** `fallbackProvider` 1st instance — copper `ActivationContext`. Cross-rootdir variant (src/ ↔ .college/); same 5-element shape.
- **v1.49.832** `fallbackProvider` 2nd instance — selector `ActivationContext`. Co-located with `onPredictions` — PAIR pattern (single try/catch shared across both hooks).

Rather than codifying as two parallel lessons (one per hook), the v840 promotion unifies them as a single discipline (per v830's explicit suggestion: _"potentially as a unified 'subscriber-gated observability-only context-hook' discipline rather than two separate codifications"_). The 5-element structural shape is the load-bearing abstraction; the hook name is the irrelevant detail.

**The 5 elements** (all required for the shape):

1. **Optional `?` field** on the context/options type — default-unset, no default-attached subscriber.
2. **Subscriber gate** at the call site — producer skips the call when no consumer is attached.
3. **Fire-and-forget Promise wrapper** — `Promise.resolve(hookResult).catch(...)` normalizes sync and async consumers without awaiting.
4. **`.catch(() => {})`** — consumer-thrown errors swallowed at the producer boundary.
5. **Two-argument shape** — `(currentSubject, derivedData)` — never producer's internal state.

**The PAIR co-location refinement** (sub-section): when a surface has multiple subscriber-gated hooks (v830 + v832 selector has both `onPredictions` and `fallbackProvider`), share a single try/catch block. Reduces boilerplate; prevents per-hook error-handling drift.

**Discipline location:** `docs/failure-mode-contracts.md` § Subscriber-gated observability-only context-hook pattern (Lesson #10437).

**Manifest:** Added to Failure-mode contracts entry key_lessons; extended trigger to include subscriber-gated hooks.

**Cross-references:** #10427 (parent discipline — accessory surfaces fail silently); #10426 (second-instance promotion rule — both hook families independently met threshold); #10435 (cross-rootdir wire pattern — `fallbackProvider` is also a cross-rootdir wire instance, but the hook shape is orthogonal to the rootdir partition).

## New lesson candidates (0)

No new lesson candidates opened this ship — codification ships consolidate existing observations rather than generating new ones.

## Forward-test of existing lessons

### #10428 — Meta-cadence

**Status:** RESPECTED. Codify-axis tick at the 7-ship mark since v833 — within the 7-10-ship floor (last codify was v833 at 6 ships before; v824 was 10 ships before that). The cadence drifts within bounds; no overdue trigger fired.

### #10431 — Two-layer closure for procedure-rooted drift

**Status:** EXTENDED. v840 promotes #10436 as a sub-class of #10431 (file-overwrite drift). The discipline doc now documents both origin types (procedure-rooted + file-overwrite); the structural shape (both layers required) is unchanged.

### #10427 — Failure-mode contracts

**Status:** EXTENDED. v840 promotes #10437 as a refinement of #10427 (subscriber-gated hooks are a specific shape of accessory surface). The discipline doc now has the 5-element shape codified; the broader silent-vs-loud contract from #10427 is unchanged.

### #10426 — Second-instance threshold

**Status:** RESPECTED 2× over. Both #10436 (2 instances) and #10437 (4 instances across 2 hook families) met or exceeded the threshold. The unified codification of `onPredictions` + `fallbackProvider` under #10437 is itself an application of #10426's principle (when two patterns converge on the same structural shape, extract the shape).

### #10433 — Internal-helper pattern

**Status:** NOT EXERCISED this ship (no `ctx?` parameter threading; no security-context call). Sustained at 4 instances (v825 + v827 + v828 + v839).

### #10434 — Ratchet-ledger pattern (KNOWN_UNWIRED generalization)

**Status:** NOT EXERCISED this ship (no chokepoint chip; no discipline-coverage threshold movement).

### #10435 — Cross-rootdir wire pattern

**Status:** REFERENCED. `fallbackProvider` is a cross-rootdir wire instance (src/ ↔ .college/). #10437 explicitly notes that the subscriber-gated hook shape is orthogonal to the rootdir partition — some subscriber-gated hooks cross rootdirs (`fallbackProvider`), others stay in-rootdir (`onPredictions`). The two disciplines remain independent.

## Tentative observations carried forward

### Below 2-instance threshold (deferred)

| Observation | Instances | Notes |
|---|---|---|
| Codify-ship-as-recon-consolidator pattern | 1 (v840) | NEW THIS SHIP. When per-ship retrospectives during a chain pre-analyze each candidate, the codify ship's recon collapses to "pick + synthesize". Wait for 2nd. |
| Deferral-by-classification-ambiguity | 1 (v840) | NEW THIS SHIP. When a tentative observation has 2 viable parent disciplines, defer until 3rd instance disambiguates. Wait for 2nd. |
| Auto-run-on-import as bootstrap-time tax | 1 (v836) | Wait for 2nd. |
| Polarity convention for inverted-mechanic thresholds | 1 (v837) | Wait for 2nd. |
| DI-executor + hoisted-check refinement of #10433 | 1 (v827) | Wait for 2nd. |
| `'spawn'` op-tag at family scale | 1 (v828) | Wait for 2nd. |
| Threading config-derived constants through result objects | 1 (v830) | Wait for 2nd. |
| Stale-entry cleanup chip pattern | 1 (v834) | Wait for 2nd. |
| Scaffold ship pattern | 1 (v835) | Wait for 2nd. |
| Paired arc | 1 (v834+v835) | Wait for 2nd. |
| Type-registered vs observation-source-wired vs runtime-wired | 1 forward-flag (v835) | Operationally clearer at v837 close. |

### Eligible for next codify ship (2 still tracked at 2+ instances, deferred from v840)

| Observation | Instances | Notes |
|---|---|---|
| Verification/integration-only ships axis | 2 (v829 + v832) | DEFERRED in v840 — no existing canonical-doc home; would need a new sub-doc structure. Next codify ship can pick this up if a 3rd instance lands. |
| Bidirectional enforcement completeness | 1-2 (v838 audit inverse-check + v836 publish preservation) | DEFERRED in v840 — classification ambiguous between "specific case of #10436" and "new pattern about gate-direction-symmetry". Wait for 3rd instance to disambiguate. |

## Cadence observation

This is the codify ship 7 ships after v833 (which was 9 ships after v824, which was 10 ships after v814). Cadence cumulative:

| Codify ship | Ships since prior codify | Lessons promoted |
|---|---|---|
| v1.49.802 | (initial) | 1 new domain (#10427 Failure-mode contracts) |
| v1.49.805 | 3 | 3 new domains (#10428 + #10429 + Substrate opt-in paths) |
| v1.49.806 | 1 | 1 new domain (#10406 Security chokepoints; extension) |
| v1.49.814 | 8 | 2 new domains (#10431 + #10432) |
| v1.49.824 | 10 | 2 lessons in existing domains (#10433 + #10434) |
| v1.49.833 | 9 | 1 new domain (#10435 Cross-rootdir wire pattern) |
| **v1.49.840** | **7** | **2 lessons in existing domains (#10436 + #10437)** |

The pattern: codify ships average ~7-9 ships apart; alternate between "new domain" (new manifest entry) and "extend existing domain" (extend key_lessons). v840 is an extend-existing ship; the next codify ship (~v847-850) is likely a new-domain ship if the verification/integration-only ships axis reaches threshold of substantive infrastructure (it currently has 2 instances but no canonical-doc home).
