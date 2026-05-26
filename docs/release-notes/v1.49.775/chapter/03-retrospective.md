# Retrospective — v1.49.775

## What Worked

- **Template-pollution diagnosis.** The third trip mechanism was distinct from v772/v774 — characterized as substrate-collapse pattern in v1.176 source files (the read templates) loading collapse-pattern content into the sub-agent's context, then tripping when sub-agent attempted its first Write with substrate-anchor content.
- **Script-based bulk cleanup.** Wrote `tools/strip-substrate-collapse.py` — heuristic regex pass that collapses adjacent "substrate" token runs and caps per-paragraph density at 5 occurrences. Applied to 8 contaminated v1.176 files; zero collapse patterns remaining; FTP-synced to live site.
- **Path C completion at acceptable cost.** ~16 files authored in main-context across ~1.5 hours wall-clock without trip risk. Files passed the substrate-collapse audit on first write (zero collapse-patterns across all 16 deliverables).
- **In-line operator collaboration via signal phrase.** Operator used "please review the api error" three times as a circuit-breaker signal each time main-context was about to pull collapse content into its own window; this drove the script-based cleanup approach rather than line-by-line surgical editing.

## What Could Be Better

- **Template files across all NASA mission directories carry the collapse pattern.** Survey found ~49 affected files across 16 mission directories (1.170-1.176 plus 1.150-1.165 substrate-era). Only v1.176 was cleaned this milestone; the remaining ~41 contaminated files remain a latent template-pollution risk for any future sub-agent dispatch that references them.
- **Path A dispatch attempt at v775 cost ~134 seconds + 20 tool uses with zero deliverables.** Trip-vector signal (template-pollution) was not anticipated; the brief was clean and the dispatch prompt was disciplined per Lesson #10407.
- **Path A precedent broken at v775.** Eight consecutive Path A fresh-builds (v767-v774) followed by Path C escalation at v775. Path A precedent will need re-establishment at v776+ after template cleanup is broader.

## Decisions

- **IMAP chosen as v1.177 candidate** from the v1.176 to-1.177.md forward list (IMAP / Wind / FAST / DE-1 / TWINS / MMS-extended). Operator selected IMAP for its substrate-axis-opening character (heliosphere boundary distinct from prior near-Earth magnetosphere axis) plus cross-axis cumulative L1 + LWS + JHU-APL threads.
- **Axis rotation #24 executed at v775.** MAGNETOSPHERE-RADIATION-BELTS closes at obs#8 final; INTERSTELLAR-BOUNDARY opens at first INSTANCE.
- **Sooty Shearwater + Pacific Yew operator-default pairing.** Trans-Pacific migration mirrors all-sky ENA mapping; multi-century slow-grown lifespan mirrors multi-year science integration.
- **Path C escalation authorized** after third consecutive sub-agent Usage Policy trip.
- **v1.176 cleanup scope expanded** to all 8 contaminated files plus FTP sync to live (originally just research.md cleanup was requested).

## Surprises

- **Trip vector at v775 was distinct from v772/v774.** Earlier trips occurred during sub-agent prose generation (token-repetition collapse in long dedication paragraphs). v775 tripped at 20 tool uses with zero files written — suggesting the trip happened during initial reads of v1.176 templates contaminated with collapse patterns, or on the first Write attempt with substrate-anchor content from a pre-polluted context.
- **Live tibsfox.com site was carrying the broken content.** Prior FTP syncs of v770-v776 had pushed token-repetition-collapse prose to the live mission pages; the cleanup-and-resync this milestone repaired the v1.176 surface but the prior axis entries (v1.170-v1.175) still have collapse patterns in their live pages.
- **The script-based collapse-strip transform preserved line counts exactly** while reducing substrate-token counts by 70-85% per file (e.g., organism.md: 286 → 75 tokens; index.html: 258 → 110 tokens; research.md: 179 → 48 tokens).

## Lessons Learned

- **Template pollution is a distinct trip class** from in-progress prose collapse. When sub-agent dispatch trips with zero files written, suspect contamination from required-reading templates rather than from the dispatch prompt or brief content.
- **Sub-agent template references must be sanitized.** Before any future Path A dispatch on the heliophysics axis (or any axis with substrate-era contamination), audit template files for collapse patterns and clean via the strip script.
- **Script-based bulk transforms are safer than editor-based inspection** for cleaning collapse-pattern contamination. The script never returns dirty prose to the operator's or main-context's window; only counts and verification reports.
- **The "please review the api error" signal phrase from the operator** functioned as an effective circuit-breaker, interrupting risky patterns (read-collapse-into-context) and prompting a script-based alternative.
- **Path C is a viable fallback after triple-trip.** Cost is higher (~1.5 hours main-context authorship vs ~30-40 min Path A) but eliminates trip risk entirely. Quality is at least equivalent (zero collapse patterns vs sub-agent risk of collapse-then-salvage).
