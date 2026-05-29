# Retrospective — v1.49.911

## What Worked

**The v910 handoff pre-staged the entire scope decision.** v910's 04-lessons and 99-context named the exact two drain options (new NASA domain vs reusable-subset promotion) and even pre-identified which lessons were reusable (#10367 protected-path, #10378/#10383/#10387 content-filter, #10369/#10388 dispatch cadence). The codify ship inherited a fully-framed fork; the only open work was the per-lesson canonicalization and the structural choice between the two options. The operator chose the hybrid (both), which the handoff had implicitly endorsed.

**Fan-out extraction made 39 jargon-dense lessons tractable.** A 9-batch parallel extraction over the v652–v716 release-notes (grouped by first-emission version) produced de-jargonized, actionable summaries for all 39 in one pass, plus a completeness-critic verification that confirmed no missing/duplicate IDs and that all 12 pinned homes were honored. The "substrate" vocabulary that makes these lessons opaque in their original retrospectives was translated into plain English a non-NASA author can act on.

**Adversarial source-checking caught a number-reuse landmine.** The one extraction error — #10402 summarized as the abandoned "Mars rover lifetime" candidate instead of the live "secondary-trip-vocab → Path B" discipline — was caught by noticing the agent's first_version (v699) disagreed with the coverage tool's first-ref (v737), then grepping the live "Lesson #10402" occurrences directly. The completeness critic, working only on the inventory, could not have caught this. Codifying the wrong meaning would have put a Mars-trivia fact into the Sub-agent dispatch domain.

**The coverage tool is its own acceptance test.** The whole ship reduces to one assertion: `check-discipline-coverage.mjs` → UNCODIFIED 0, PARTIAL 0. Running it after the manifest + doc edits confirmed all 39 drained IDs are COVERED (in manifest AND in a cited canonical doc) with zero PARTIAL leakage — the failure mode where an ID lands in the manifest but not in any cited doc.

**The #10367 home was friction-free despite being self-mod-relevant.** Its natural canonical home (`project-claude/hooks/self-mod-guard.js`) is NOT under the self-mod-guard's protected path (`.claude/{skills,agents,hooks}`), and the file already carried `// Lesson #10174` in its header — so adding `// Lesson #10367` was both convention-consistent and required no `SC_SELF_MOD=1` override.

## What Could Be Better

**The UNCODIFIED ceiling is now slack at 41 with 0 in the bucket.** With UNCODIFIED drained to 0, the `--max-uncodified=41` gate has 41 entries of headroom — it will not fire until a large new backlog reaccumulates. A future ship could ratchet the ceiling down (e.g. to 5 or 10) so new UNCODIFIED drift surfaces as a near-term WARN rather than silently filling toward 41. Noted as a forward candidate, not done this ship (scope discipline; ratcheting a gate is its own deliberate change).

**16 of 27 NASA-domain lessons are reusability-general but NASA-homed.** The hybrid split pinned only the 12 most-obviously-cross-cutting lessons to existing domains; the operator consciously kept the rest in the NASA home for cluster coherence. The "Generalizable beyond NASA" callout mitigates the discoverability cost, but a future author of generic high-volume authoring work may still not think to open a NASA-named doc. If those lessons see repeated cross-domain reference, a follow-on promotion is warranted.

**Automated extraction quality is summary-bounded, not source-bounded.** The #10402 catch shows the extraction is only as good as which occurrences an agent happens to read. The mitigation applied (cross-check first_version vs the tool's first-ref; grep live "Lesson #N" occurrences for any anomaly) should be the default codify-process step, not an ad-hoc save.

## Decisions

- **Hybrid drain over single-domain absorption.** Operator-selected via AskUserQuestion. Maximizes discoverability (reusable disciplines in their generic homes) while giving the campaign-specific lessons a coherent dedicated domain. Drains 39 → 0.
- **#10402 codified as the live "secondary-trip-vocab → Path B" meaning**, not the abandoned candidate. Source-verified.
- **#10366 homed in Mission package framing** (brief accuracy), **#10367 in Self-modification safety** (protected-path), per the operator's pinned split.
- **All 5 release-note files hand-authored directly** (the codify-ship convention; the README intentionally omits the parse-able retrospective headings, matching v910).
- **No FTP sync, no GH release** — consistent with the v903–v910 pattern; git tags remain authoritative.

## Surprises

- **Lesson #10402 was a reused number** across two unrelated disciplines — the only such collision in the 39-lesson set, and exactly the lesson whose pinned home depended on which meaning was correct.
- **The 39-entry backlog drained in a single doc-only ship.** The work was canonicalization + wiring, not original authorship, because the lessons already existed in retrospective prose — the same "free work-list" property the v910 PARTIAL drain exploited, at larger scale.

## Lessons Learned

(see `04-lessons.md` for the per-lesson detail and the codify-process lessons)
