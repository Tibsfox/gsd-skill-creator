# Lessons — v1.49.574

11 lessons extracted: 5 feed-forwards from the original retrospective + 6 post-review corrections.

## Feed-forwards (forward-looking process improvements)

1. **Pre-stage verification matrices in W0.**
   v1.49.574 built `verification-matrix.md` template + `numerical_attribution.md` index during the W0/W1 wait window. Both paid for themselves at W3. Future research missions should include verification-matrix templating in the W0 foundation deliverables, not leave it to W3.

2. **Half B candidate enumeration belongs in the keystone synthesis module.**
   M5 §6 housed the 7-candidate list and produced the `synthesis/half-B-candidate-list.md` summary as its natural output. This is cleaner than a separate "tier-the-candidates" task at handoff. Future research-and-substrate missions should put the substrate enumeration inside the synthesis module, with the standalone summary file derived from it.

3. **Citation-style normalization belongs in W0.**
   The mid-stream audit finding (M2's mixed `mk_*` / `\cite{}` style) traces back to W0 not specifying citation style mechanics in the spec templates. Adding a single line to W0 spec templates ("citations in this module use only `\cite{key}` form, never bare backtick keys") would have prevented the inconsistency.

4. **The substrate test as a gate, not a guideline.**
   Half B substrate-boundary discipline held in v1.49.574 because RAVEN-INTEG explicitly tested every candidate against the boundary in M5 §6. Future synthesis modules should formalize this as `substrate-boundary-check: PASS` per candidate, machine-checkable rather than narrative.

5. **Architectural-rhyme findings deserve the through-line slot.**
   v1.49.574 found the SIGReg / counter-sync rhyme; v1.49.573 found seven convergent-discovery anchors. These external-validation findings are the most durable artifacts of research-heavy milestones — they predate, and survive, any specific code that ships. Future research milestones should designate one synthesis-section-equivalent slot for "architectural-rhyme" findings rather than leaving them to surface ad-hoc in M5. Calibration: present these as productive analogies at the design-discipline level, not as theorems.

## Post-review corrections (issues raised at the explicit "review the work" gate, addressed in-tree)

6. **M3 architectural-rhyme rhetoric tempered.**
   The M3 keystone prose said "this is not metaphor" three times. Tempered to "structural rather than mathematical" + "shared design discipline rather than mathematical equivalence". The same correction was propagated to the College of Knowledge concept (`megakernel-architecture-rhyme.ts`), the public hub HTML, the milestone README, and the STATE.md keystone block. The PDF was not rebuilt — markdown sources are the corrected canonical form; a future regenerate-PDF pass picks the corrections up.

7. **Byte-identical fixture test added.**
   `src/cartridge/megakernel/__tests__/disabled-byte-identical.test.ts` (4 tests) snapshots the JSON-canonicalized disabled-result for every megakernel-substrate public surface. If the disabled-result shape changes for any of HB-01/02/03/04/05/07, the fixture fails, making the surface change visible.

8. **Wall-clock time corrected from observatory log.**
   Pre-review claim was "~80 minutes total"; observatory log shows 65m 47s. Health-metrics table updated to read from the observatory.

9. **arXiv ID provenance disclosure added to bibliography.**
   18-line provenance header in `work/sources/megakernel.bib` distinguishing 2025-dated IDs (within recall window, project-known) from 2026-dated IDs (post-cutoff, inherit from mission package's attribution). Recorded the network-cross-check as a prerequisite for any external publication.

10. **Preservation-tracker rotation enumerated.**
    v1.49.574 added 6 file-paths to `src/upstream-intelligence/__tests__/fixtures/preserved-modules-hashtree.json`: 3 in `src/orchestration/jepa-planner/`, 3 in `src/orchestration/sol-budget/`. Per-file hashes of v1.49.573-tracked files unchanged (zero deletions, zero modifications); rootDigest naturally rolls up the expanded tree from `ace3a90...` to `09bce6c...`. v1.49.573 byte-identicality holds at per-file level.

11. **CI build-vs-test divergence surfaced.**
    Local `vitest run` was permissive about `Object.freeze([])` narrowing to a mutable array type; CI's `tsc --noEmit` correctly rejected it. Pre-push checklist for substrate-shipping milestones must include `npm run build && npx vitest run`, not just the vitest pass.
