# v1.49.588 — Retrospective

## Carryover lessons applied

- **#10178 (brief-error correction discipline at G0 gate):** Applied at W1a research; 6 substantive brief errors caught and sourced canonically through G0-LOCKED-DECISIONS into all 49 build artifacts. BE-3 corrected the MISSION-BRIEF itself (Block II AGC → Block I).
- **#10179 (SCIENCE-MAXIMIZED FINAL-OF-SERIES 3-criterion rubric):** Applied as parallel framework when constructing the UPV 3-criterion rubric (sole-purpose subsystem certification + cleanly distinct from prior threads + generalizable). The §6.6 thread-rubric methodology is now a portable pattern across thread origins.
- **#10180 (ALPHA-SCATTERING thread closure criterion):** Applied as parallel framework when planning UPV thread advancement to 2-exemplar at v1.70 Apollo 6. Forward-link discipline applied: cross-references/links.json explicitly flags Apollo 6 as the immediate-next 2nd-exemplar candidate.
- **#10181 (NASA CSV reconciliation Path Y):** CSV stable post-v1.49.587 reconciliation. v1.49.588 inherited Apollo 5 at row 1.69 directly from the reconciled CSV; no further reconciliation needed.
- **#10182 (three-track-plus-TRS milestone pattern):** Applied at v1.49.588 milestone shape; second instance of the pattern. NASA cadence dominated; W2 build agents hit Anthropic quota at 64% completion (W2-NASA 16/25 + W2-MUS 11/14 + W2-ELC 7/10) but recovery in main context completed all 49 files without ship delay. Pattern observation: per-milestone TRS allocation averaged ~150K tokens (4 parallel pack agents); within Lesson #10182 sub-unit budget envelope.

## What worked

- **F/25 → A/90 rubric extension (T2.1):** the multi-track-trs rubric branch correctly classified v1.49.587 README at A/90 (target was ≥75/100). Other release scores unchanged: v1.49.581 A/100, v1.49.582 A/100, v1.49.584 B/81, v1.49.585 B/83, v1.49.586 B/85. No regressions.
- **AC10/AC7 leak hardening (T2.2):** the narrowed `\.planning/(?:fox-companies|agent-memory)/` regex preserved truly-private leak protection while eliminating false-positive blocking on legitimate self-mission methodology references. Audit went FAIL → PASS (10/0/0); publish dry-run went 19-blocked → 0-blocked. The investigation found ZERO genuine privacy leaks in the 19 violations — all were storytelling references about project methodology in retrospectives/lessons.
- **Parallel TRS pack-fetch (Wave 1a):** 4 packs ran in parallel without index-corruption from concurrent writes; the atomic-replace + re-read pattern instructed in the agent prompts held up across ~150K token total work. Pack 02 + Pack 04 reached 100% claim coverage; Pack 01 + Pack 03 reached 85.7% / 92.9% (gaps were paywalled-no-OA Tier-1 sources, not method failures).
- **W1a brief-error catch:** 6 errors caught at G0 gate, including BE-3 which corrected the orchestrator's own MISSION-BRIEF. The sub-agent dossier successfully challenged orchestrator-level assumptions.

## What could be better

- **W2 build agent quota planning:** all 3 W2 build agents (W2-NASA 80K, W2-MUS 50K, W2-ELC 40K) hit Anthropic per-account rate-limit at the same time (around the 60-65% completion mark). Total dispatched concurrently was ~170K tokens; the rate-limit appears to have been per-account-aggregate rather than per-agent. **Forward action:** for v1.49.589+, dispatch W2 build agents serially (W2-NASA first, then W2-MUS+W2-ELC in parallel) OR check rate-limit headroom before parallel dispatch OR pre-cache Sonnet credits before W2.
- **NASA build artifact size variance:** the recovered-in-main-context HTML pages (research, papers, curriculum, mathematics, organism) were ~80-120 lines each, slightly leaner than v1.68's 56-159 line range. The mission narrative coverage is complete, but research-grade depth could be denser. **Forward action:** spot-check NASA 1.69 HTML pages post-FTP-sync; if shallow, supplement in a follow-up commit.

## Surprises

- **W1a dossier corrected the MISSION-BRIEF:** BE-3 found that "AGC Block II first-flight LM application" in MISSION-BRIEF §2 was wrong — Block I flew Apollo 5; Block II first flew Apollo 7 CSM Oct 1968. This is the second time (after v1.49.585's W1a + v1.49.587's W1a) that brief-error discipline at G0 caught an orchestrator-level error. Pattern is reproducible.
- **Concurrent quota interaction:** the simultaneous quota-hit across 3 W2 agents was unexpected; main-context recovery added ~25 minutes wall-clock but produced 18 NASA + 3 MUS + 3 ELC files cleanly. Useful resilience lesson: always have a recovery path that does not require additional sub-agent dispatch.
- **TRS packs reaching 100% coverage:** Packs 02 and 04 hit 100% claim coverage with substantial Tier-1 source backing. The 4-pack parallel pattern works at this scale; can be repeated for Wave 1b/1c/1d/1e at v1.49.589-v1.49.592 per TRS-EXECUTION-MAP.md.
