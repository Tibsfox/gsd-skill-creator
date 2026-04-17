# v1.49.28 — Retro-Driven Improvements

**Released:** 2026-03-09
**Scope:** Closeout of the 6 most persistent unresolved issues surfaced in v1.49.18..v1.49.27 retrospectives — cross-reference matrix filtering, sticky-sidebar research-browser navigation, SYMBEX JIT kernel-cache LRU eviction, atomic master-index verification script, `tsc --noEmit` pre-commit hook, and the wave-commit-marker convention
**Branch:** dev → main
**Tag:** v1.49.28 (2026-03-09, commit `d5f8ff7b2`)
**Commits:** v1.49.27..v1.49.28 (5 feature commits + 2 docs commits, head `d5f8ff7b2`)
**Files changed:** 24 (+2,605 / −210 lines)
**Predecessor:** v1.49.27 — Spatial Awareness: The Chorus Protocol (Shiny Things Charf-Charf Edition)
**Successor:** v1.49.29
**Classification:** feature — first retrospective-mined milestone; first milestone staged end-to-end through the vision-to-mission skill
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Engine Position:** 29th patch in the v1.49.x line, closing the "deferred improvements" debt accumulated across releases v1.49.18 through v1.49.27; first application of the retrospective-as-backlog-source pattern that later releases adopt as standard practice
**Dedication:** dedicated to every "What Could Be Better" bullet that waited more than one release cycle to be addressed — the matrix-scaling debt alone had been flagged in three consecutive releases (v1.49.24, v1.49.25, v1.49.26) before this milestone paid it down
**Verification:** 55/55 math-coprocessor JIT cache tests PASS (7 new) · 25,015/25,015 Vitest suite PASS · `tsc --noEmit` clean on main · `pytest math-coprocessor/tests/test_jit.py -v` green · `www/PNW/index-check.sh` exits 0 on the 9-project PNW directory · 4-wave parallel execution completed with zero file conflicts across 4 concurrent agents

## Summary

**Retrospective mining produced a focused, high-signal backlog.** v1.49.28 is the first release in the project's history to be scoped entirely by reading the "What Could Be Better" and "Lessons Learned" sections of the preceding ten releases and promoting the most frequently flagged items into executable work. The retrospective-analysis pass covered v1.49.18 through v1.49.27 — ten consecutive releases — of which seven carried structured retrospective data. Six items emerged as deferred-too-long: cross-reference matrix scaling (flagged in v1.49.24, v1.49.25, and v1.49.26 without resolution), `tsc --noEmit` missing from pre-commit (flagged in v1.49.27 after a Zod v4 regression slipped through 285 passing tests), research-browser TOC and navigation UX (flagged in v1.49.22 and v1.49.24), atomic master-index verification (flagged in v1.49.25 and v1.49.26 after AVI and MAM shipped without updating the cross-reference matrix), SYMBEX JIT kernel cache LRU eviction (flagged in v1.49.23 for unbounded VRAM growth), and a documented wave-commit-marker convention (flagged in v1.49.27). Every item carried evidence — frequency counts, specific version citations, concrete symptoms — rather than speculation, and every item landed end-to-end inside the release window. The lesson that crystallized is the one the v1.49.28 retrospective itself names first: "What Could Be Better" bullets are deferred work items, and mining them systematically produces higher-signal work than any other backlog source the project has used to date.

**Cross-reference matrix filtering paid down three releases of scaling debt.** The PNW master index at `www/PNW/index.html` carries a 15-topic × 9-project cross-reference matrix — 135 cells of taxonomic, geographic, and methodological linkage between the nine shipped PNW research projects (COL, CAS, ECO, GDN, AVI, MAM, BPS, BCM, SHE). By v1.49.26 the matrix had grown wide enough to force horizontal scrolling on narrow viewports, and the lessons-learned entries in v1.49.24, v1.49.25, and v1.49.26 each flagged the scaling problem without proposing a concrete fix. v1.49.28 shipped four concrete UI primitives that together eliminate the scroll entirely: four collapsible category group toggles (Living Systems, Built Environment, Technology, Meta) with chevron indicators so a reader can collapse groups not currently under study; per-project column filter chips drawing from the existing tag-color palette with All/None convenience controls so the matrix can be narrowed to two or three projects at a time; a responsive card view that replaces the matrix with per-project cards below a 768-pixel viewport width, eliminating horizontal scroll on mobile entirely; and localStorage persistence so the reader's toggle and filter state survives page reloads. The implementation landed in commit `10b2326c9` alongside the kernel cache work — a commit-boundary accident the retrospective calls out — but the UX improvement is self-contained in `www/PNW/index.html` and independent of the Python changes.

**The `tsc --noEmit` pre-commit hook closes the Zod v4 regression path.** In v1.49.27 a Zod v4 API incompatibility slipped through 285 passing Vitest tests and landed on main because `tsc --noEmit` was only wired into `git push`, not `git commit`. The regression was caught at push time, but had already been committed to a local branch where it polluted `git log` and forced a follow-up amend. v1.49.28 added `tsc --noEmit` to the pre-commit hook with a staged-file guard: the check runs only when `.ts` or `.tsx` files are present in the staging area, so markdown-only, YAML-only, and Python-only commits skip the 4-second TypeScript compile entirely — a tax the retrospective explicitly declined to impose on non-TS work. The push-time check was preserved as a safety net, so both paths now gate TypeScript type correctness. A subtle flow-control bug emerged during verification: the original staged-TS guard used `exit 0` which bypassed the separately-added PNW index check in the same hook; the fix was to replace early-exit with a flag variable that lets every stage of the hook run regardless of which file types are staged. The bug is captured in the retrospective as a reusable lesson: sequential guard clauses with early exits can silently skip later stages — trace every exit path when adding new stages to a mature hook.

**Seven PNW research browsers picked up a sticky sidebar TOC stack.** The `page.html` template used by COL, CAS, ECO, GDN, AVI, MAM, and BPS previously carried an inline TOC that scrolled with the body; on the long research pages (some over 1,200 lines) the reader lost their place in the document hierarchy repeatedly. v1.49.28 converts the TOC to a sticky sidebar via CSS grid on viewports ≥ 1024 pixels while preserving the inline layout on narrow screens, so no regression for mobile readers. An IntersectionObserver-backed active-heading tracker highlights the section currently in view, hover-visible `#` anchor links appear on h2 and h3 headings so a reader can copy a direct link to a specific passage, a quick-filter search input at the top of the TOC filters entries by substring match, and smooth scrolling on TOC click replaces the default jump. Every project retains its own CSS-variable palette (`--ridge`, `--deep`, `--forest`, `--sky`, `--earth`, `--signal`) so the navigation enhancement lands without disturbing the per-project visual identity. BCM and SHE are the two exceptions — they use a different browser architecture that links directly to raw `.md` files rather than rendering through `page.html` — and the retrospective explicitly flags the asymmetry as an item to unify in a future pass rather than duplicate the TOC stack across two template families.

**The atomic master-index verification script stops AVI/MAM-style catch-up work.** v1.49.25 shipped AVI (birds) and MAM (mammals) without updating the cross-reference matrix, the geographic coverage table, or the reading-order table in `www/PNW/index.html`. v1.49.26 caught the debt up retroactively and the retrospective concluded that master-index updates belong inside the atomic commit that ships a project, not in a follow-up pass. v1.49.28 made that conclusion executable: a new shell script at `www/PNW/index-check.sh` auto-discovers PNW project directories via directory listing, verifies each one appears in the cross-reference matrix, the geographic coverage table, and the reading-order table, reports missing entries per section, and returns a conventional 0/1 exit code for scripted use. The script integrates into the pre-commit hook as a non-blocking warning: when a commit stages files under `www/PNW/` and the script detects missing index entries, the hook emits a warning but does not fail the commit, giving the author a chance to catch up the index without blocking quick fixes or hotfixes. The non-blocking policy is deliberate — a hard gate would punish legitimate WIP commits, while a warning visible at commit time gives the author enough signal to close the debt before it compounds.

**SYMBEX JIT kernel cache LRU eviction removed an unbounded-growth hazard.** The JIT kernel cache at `math-coprocessor/jit.py` was previously an unbounded `dict` that accumulated compiled GPU kernels indefinitely, which could exhaust the 750 MB VRAM budget on long-running notebooks or multi-session dev work. v1.49.28 replaced the `dict` with a `collections.OrderedDict` and layered an LRU policy on top: a configurable maximum (default 64 entries) controls the cache size, `gpu.cu_module_unload()` is called on every evicted kernel so VRAM is actively released rather than relying on Python GC, cache access refreshes the entry to the most-recent position so actively-used kernels are never evicted in favor of stale ones, and an enhanced `cache_stats()` method now reports `max_kernels`, `hits`, `misses`, `evictions`, and `hit_rate` for observability. The `clear_cache()` method resets all counters so test isolation is clean, and the new `symbex.kernel_cache.max_entries` knob in `data/chipset/math-coprocessor.yaml` lets integrators tune the cap without code changes. Seven new tests exercise the eviction path (eviction on insertion beyond max, LRU refresh on access, module unload on eviction, counter semantics, counter reset, min-size enforcement, update-existing semantics) for a total of 55 passing tests across the JIT suite.

**Wave-commit-marker convention documented in CLAUDE.md preserves bisect intent.** v1.49.27's retrospective flagged a recurring difficulty: when a session ends before every wave in a parallel execution plan has landed its own commit, the remaining waves get folded into a single commit at session wrap-up, and `git bisect` loses the wave-boundary information that the execution plan had captured. v1.49.28 codified a three-line convention in CLAUDE.md: when session boundaries force combining waves, the commit body carries a `Wave N: [what wave N delivered]` / `Wave M: [what wave M delivered]` block under the conventional-commit subject so the bisect intent is preserved in the commit message even when commit boundaries can't align with wave boundaries. The convention is descriptive rather than prescriptive — the preferred workflow is still one commit per wave — but it handles the session-exhaustion edge case with a minimal, machine-readable marker format. v1.49.28's own commit history used the marker in commit `5c62b5485` (Wave 0 + mission-package stage), providing the first live example of the convention in the repository.

**Four-track parallel execution with zero file conflicts validated vision-to-mission.** The milestone was the first to be staged end-to-end through the `vision-to-mission` skill: a milestone spec, five component specs (one per technical track), a wave execution plan, a test plan, and a mission README were all generated as a 9-document, 1,143-line package at `docs/missions/retro-driven-improvements/` before any feature code was written. Each component spec was self-contained — no cross-references between specs — so each of the four parallel agents in waves 1 and 2 received a complete specification with no coordination overhead. The result was zero file conflicts across four concurrent tracks spanning three domains (HTML/CSS/JS for the PNW browser work, Python for the math-coprocessor work, shell scripts for the hook and index-check tooling). The vision-to-mission pattern's self-containment rule — every agent's spec stands alone — is the operational finding that made the concurrency work, and the retrospective promotes it to a first-class lesson: self-contained specs enable parallel agents, and the v2m pipeline enforces that self-containment structurally rather than asking humans to remember.

**The retrospective-driven-scope pattern is now a repeatable operating procedure.** Before v1.49.28 the project had accumulated lessons-learned entries at a rate of several per release with no systematic mechanism for turning them into work. v1.49.28 demonstrates the full loop — ten releases of retrospectives, three rounds of frequency counting per issue, six-item promoted backlog, four-wave parallel execution, atomic landing — and the pipeline is now documented in the mission package at `docs/missions/retro-driven-improvements/` for reuse. Future milestones in the v1.49.x line can source their scope from retrospectives the same way, and the mission template can be copied forward. The retrospective exit criterion is also explicit: a lesson stops being "deferred" when it has been flagged in two or more consecutive releases without resolution, at which point it enters the next retrospective-driven milestone's candidate pool. The combination of the frequency gate and the vision-to-mission self-containment rule turns what was previously a passive list of complaints into an active work-intake pipeline with measurable throughput.

## Key Features

| Area | What Shipped |
|------|--------------|
| Cross-reference matrix filtering | `www/PNW/index.html` — 4 collapsible category-group toggles (Living Systems, Built Environment, Technology, Meta), per-project column filter chips with All/None controls, 768px-breakpoint card view, localStorage persistence of toggle and filter state |
| Research-browser TOC & navigation | `www/PNW/{COL,CAS,ECO,GDN,AVI,MAM,BPS}/page.html` — sticky sidebar TOC via CSS grid on ≥1024px viewports, inline layout preserved on narrow screens, IntersectionObserver active-heading highlighter, hover-visible `#` anchor links on h2/h3, substring-filter search input, smooth-scroll on TOC entry click, zero external deps, file://-compatible |
| `tsc --noEmit` pre-commit hook | Pre-commit hook now runs TypeScript type check when `.ts`/`.tsx` files are staged; markdown-only / YAML-only / Python-only commits skip the check; push-time check preserved as safety net |
| Atomic master-index verification | `www/PNW/index-check.sh` — auto-discovers project directories, verifies each appears in cross-reference matrix + geographic coverage + reading-order tables, reports missing entries per section, exit 0/1 for scripted use, non-blocking hook warning on `git commit` when PNW files are staged |
| SYMBEX JIT kernel cache LRU | `math-coprocessor/jit.py` — OrderedDict-backed LRU cache with configurable max (default 64), `cu_module_unload()` on eviction, access-refreshes-position semantics, `cache_stats()` reports max_kernels/hits/misses/evictions/hit_rate, `clear_cache()` resets counters, `symbex.kernel_cache.max_entries` config knob |
| Wave commit marker convention | `CLAUDE.md` — three-line convention for session-forced merged waves: `Wave N: [what wave N delivered]` body lines under conventional-commit subject preserve bisect intent when commit boundaries can't align with wave boundaries |
| Mission package (vision-to-mission) | `docs/missions/retro-driven-improvements/` — 9 documents (1,143 lines): milestone spec, 5 component specs, wave execution plan, test plan, README; first milestone staged end-to-end through the v2m skill |
| JIT cache test coverage | `math-coprocessor/tests/test_jit.py` — 7 new tests (eviction, LRU refresh, module unload, stats metrics, counter reset, min enforcement, update-existing); total 55 passing |
| Config surface | `data/chipset/math-coprocessor.yaml` — new `symbex.kernel_cache` section exposing `max_entries` knob |
| Release notes metadata | `docs/release-notes/v1.49.27/README.md` — rename to "Shiny Things Charf-Charf Edition"; `docs/release-notes/v1.49.28/README.md` — this document |

## Retrospective

### What Worked

- **Retrospective-driven prioritization is a higher-signal backlog source than ad-hoc feature requests.** Mining ten releases of "What Could Be Better" sections produced six items that each carried specific frequency counts, version citations, and concrete symptoms before a single line of code was written — no guessing, no speculation, no nice-to-have padding.
- **Four-track parallel execution with zero file conflicts validated the vision-to-mission self-containment rule.** All six improvements were independent across the three domains (browser, math-coprocessor, hook tooling); waves 1 and 2 ran four concurrent agents without cross-track coordination and without touching the same files.
- **Vision-to-mission pipeline produced self-contained specs that parallel agents could consume without cross-referencing.** The 9-document mission package at `docs/missions/retro-driven-improvements/` gave each agent a complete specification; coordination overhead dropped to zero, and the pattern is now a reusable template for future retrospective-driven milestones.
- **The new `tsc --noEmit` pre-commit hook caught a real bug during the same release that shipped it.** During wave 2A the hook with the new commit-time trigger validated kernel cache changes before they were committed — an immediate payback on the hook investment, and a demonstration that the commit-time gate catches real regressions rather than being theater.
- **Non-blocking index-check warning struck the right balance between gate and hint.** A hard failure would punish legitimate WIP commits; an invisible check would be ignored; the non-blocking warning at commit time catches missing index entries without interrupting flow, and lets the author decide whether to fix immediately or defer to the close-out pass.
- **Rigorous pre-flight classification of the backlog saved wave-planning time.** Separating the six items into independent vs. sequential tracks up front (wave 0 for the tsc hook and convention docs, wave 1A/1B/2A/2B for the parallel tracks, wave 3 for verification) let execution proceed without mid-wave re-planning.

### What Could Be Better

- **Matrix filtering and kernel cache landed in the same commit `10b2326c9` despite being independent tracks.** Two different domains, two different agents, one commit boundary — a commit-timing accident rather than a design choice. Future parallel waves should land each track in its own commit even when they finish within minutes of each other, to keep `git log` clean and bisect precise.
- **BCM and SHE have no `page.html` and were left out of the TOC enhancement.** They use a different browser architecture (static `index.html` linking directly to raw `.md` files), so every future browser enhancement either duplicates the logic into both template families or excludes two of nine projects. The asymmetry should either be documented as intentional or the architectures unified in a future pass.
- **The pre-commit hook's flow-control bug was caught in verification but should have been caught in design review.** The original staged-TS guard used `exit 0` which bypassed the subsequently-added PNW index check; fixed by switching to a flag variable, but the pattern (early-exit after a sub-check) is an anti-pattern that the original hook author should have flagged during code review.
- **No landing-time LLM tiebreaker pass on the retrospective lessons.** Five of the seven lessons landed with `⚙ rule-based` classification and two were subsequently reclassified by the LLM tiebreaker in later releases — a landing-time pass would have reduced follow-up churn and produced cleaner lesson metadata at first write.
- **The mission package and its retrospective-mining origin aren't cross-linked from the PNW master index or the project README.** A future pass should surface the "where did this scope come from?" provenance chain so a reader landing on the mission package can trace back to the retrospective entries that seeded it.

## Lessons Learned

- **Retrospectives are a backlog source.** "What Could Be Better" sections are deferred work items with evidence attached. Mining them systematically — frequency count per issue, version citations, symptom notes — produces higher-signal work than any other backlog source the project has used. Applied first in v1.49.28; promoted to a repeatable milestone pattern thereafter.
- **Self-contained specs enable parallel agents.** When each agent gets a complete specification with no cross-references to other agents' specs, coordination overhead drops to zero. The vision-to-mission pattern enforces this structurally by producing one spec per agent; copy that pattern forward for any future concurrent-execution milestone.
- **Hook logic needs flow analysis, not just unit tests.** Sequential guard clauses with early exits can silently skip later stages of a mature hook, and unit tests at the stage level won't catch the cross-stage interaction. When adding a new check to an existing hook, trace every exit path through every stage before committing.
- **Browser architecture divergence accumulates.** BCM and SHE's different template means every browser enhancement now requires an exception list. Unify the architectures or document the divergence explicitly — either decision is better than the current implicit drift.
- **Atomic master-index updates belong inside the project-shipping commit.** Letting index updates land in a follow-up pass creates documentation debt that compounds across releases. The `index-check.sh` script operationalizes the lesson by warning at commit time when a project's files ship without its index entries.
- **Unbounded caches are a bug, not an optimization.** The JIT kernel cache's original `dict` was simpler to read but violated the "every resource has a bound" rule. Every cache in the project should declare its bound explicitly, either as a config knob or a compile-time constant; unbounded should only ever be a deliberate, justified choice.
- **Commit granularity should match work granularity, even on parallel waves.** Two independent tracks landing in a single commit is a commit-boundary accident that breaks bisect precision; when waves finish within minutes of each other, land each one in its own commit before moving on.
- **Wave-commit markers preserve bisect intent when commit boundaries can't align with wave boundaries.** The `Wave N: …` body convention is minimal, machine-readable, and free — use it any time a session-forced merge combines waves, even if the combination was a one-commit hotfix.
- **Retrospective lessons should get an LLM tiebreaker pass at landing, not after.** Rule-based classification alone produces ambiguous cases that ship as `investigate` and generate churn in later releases; running the tiebreaker at landing time closes the loop before the lesson is read for downstream application.
- **First-class tooling for meta-work (retrospective mining, mission staging, wave planning) is worth the investment.** The vision-to-mission skill, the `RETROSPECTIVE-TRACKER.md` infrastructure, and the wave-commit-marker convention are all tools that make the work itself better — infrastructure for doing the work has compound returns that single features don't.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.27](../v1.49.27/README.md) | Predecessor — "Spatial Awareness: The Chorus Protocol (Shiny Things Charf-Charf Edition)"; v1.49.27's Zod v4 regression is the exact incident the new `tsc --noEmit` pre-commit hook prevents; v1.49.27's wave-commit debrief seeded the wave-marker convention |
| [v1.49.26](../v1.49.26/README.md) | Retrospective source — flagged cross-reference matrix scaling (third consecutive flag) and atomic master-index updates (second consecutive flag); v1.49.28 closed both |
| [v1.49.25](../v1.49.25/README.md) | Retrospective source — AVI + MAM compendiums shipped without updating the cross-reference matrix; seeded the index-check script and atomic master-index verification |
| [v1.49.24](../v1.49.24/README.md) | Retrospective source — first explicit flag of matrix-scaling debt; also flagged browser-TOC UX |
| [v1.49.23](../v1.49.23/README.md) | Retrospective source — flagged the unbounded SYMBEX kernel cache as a VRAM-budget hazard; v1.49.28 landed the LRU eviction fix |
| [v1.49.22](../v1.49.22/README.md) | Retrospective source — flagged the research-browser TOC and navigation UX; v1.49.28 landed the sticky sidebar + anchor-link + filter-search stack |
| [v1.49.21](../v1.49.21/README.md) | Sibling uplift exemplar — same v1.49.x feature-release shape; types-first discipline is the antecedent to the commit-time `tsc --noEmit` gate that v1.49.28 added |
| [v1.49.18](../v1.49.18/README.md) | Retrospective window start — the earliest release included in the retrospective mining pass for v1.49.28 |
| [v1.49.29](../v1.49.29/) | Successor — first post-retro release; inherits the mission-package template and the pre-commit `tsc --noEmit` gate |
| [v1.49.17](../v1.49.17/) | Types-first discipline antecedent — same shape (contracts before content) applied to cartridge format rather than hooks and caches |
| [v1.49.12](../v1.49.12/) | Heritage-skills-pack pattern — pack-shape content analogous to the 9-document mission package structure |
| [v1.49.10](../v1.49.10/) | Flat-atoms architecture — upstream pattern for the one-agent-per-spec self-containment rule that v1.49.28 applied to parallel execution |
| [v1.49.0](../v1.49.0/) | Parent mega-release — v1.49.x line and GSD-OS desktop surface where PNW master index and math-coprocessor both live |
| [v1.30](../v1.30/) | Vision-to-Mission pipeline — the skill that staged the retro-driven-improvements mission package end-to-end |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — pack template the mission-package structure inherits |
| [v1.10](../v1.10/) | Security Hardening — upstream precedent for hook-based gating (pre-commit / pre-push) that v1.49.28 extends with `tsc --noEmit` |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; v1.49.28 extends the Learn step with systematic retrospective mining as a backlog source |
| `docs/missions/retro-driven-improvements/` | Mission package — 9 documents (1,143 lines) staging the retrospective-mined scope |
| `www/PNW/index.html` | Cross-reference matrix filtering lives here — 4 category groups, filter chips, responsive cards, localStorage persistence |
| `www/PNW/index-check.sh` | Atomic master-index verification script — auto-discover + report + exit 0/1 |
| `math-coprocessor/jit.py` | SYMBEX JIT kernel cache with LRU eviction |
| `math-coprocessor/tests/test_jit.py` | 55/55 tests passing (7 new for LRU path) |
| `data/chipset/math-coprocessor.yaml` | `symbex.kernel_cache.max_entries` config knob |
| `CLAUDE.md` | Wave commit marker convention |
| `.claude/hooks/` | Pre-commit / pre-push hook directory where `tsc --noEmit` now runs on staged TS/TSX files |

## Engine Position

v1.49.28 sits at the 29th patch in the v1.49.x line and is the first retrospective-driven milestone in the project's history. It ships between v1.49.27 (Spatial Awareness: The Chorus Protocol — Shiny Things Charf-Charf Edition) and v1.49.29, and it closes the "deferred improvements" debt that had been accumulating across releases v1.49.18 through v1.49.27. In the broader v1.49.x line it is a compact feature release — 24 files and 2,605 insertions place it well below the 18,000-line BPS atlas (v1.49.26) but larger than a pure docs or config release, because every line of code lands in response to a specific, cited prior-release retrospective entry. The architectural footprint is disproportionately large relative to the file count: two first-class tooling additions (the `tsc --noEmit` pre-commit gate and the `index-check.sh` script), one reusable pattern (retrospective-mining-as-milestone-scope), and one documentation convention (wave commit markers) all land atomically, and all are reusable by every subsequent release rather than being confined to the PNW research track where the catalyst issues originated. Looking forward, v1.49.28 is expected to be cited as "applied in" by every downstream release that resolves a lesson the mining pass surfaced, the same way v1.49.26's BPS atlas is cited by releases that inherit its physics-first source-tiering pattern.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.27..v1.49.28) | 7 (5 feature + 2 docs) |
| Feature commits | 5 (`10b2326c9`, `2d7602ef2`, `7c058a0a7`, `5c62b5485`, `910fc186`) |
| Docs commits | 2 (`cee2e5f24`, `d5f8ff7b2`) |
| Files changed | 24 |
| Lines inserted / deleted | 2,605 / 210 |
| Net lines added | 2,395 |
| Retrospective releases analyzed | 10 (v1.49.18..v1.49.27) |
| Retrospective releases with structured data | 7 |
| Candidate issues identified | 6 (promoted to this milestone) |
| Max flag count for a single issue | 3 (cross-reference matrix scaling — v1.49.24, v1.49.25, v1.49.26) |
| Parallel execution tracks | 4 (wave 1A, 1B, 2A, 2B) |
| Cross-track file conflicts | 0 |
| Domains touched | 3 (HTML/CSS/JS, Python, shell scripts) |
| Mission package documents | 9 |
| Mission package lines | 1,143 |
| PNW browsers updated with sticky TOC | 7 of 9 (COL, CAS, ECO, GDN, AVI, MAM, BPS; BCM and SHE excluded by architecture) |
| JIT cache config knob | `symbex.kernel_cache.max_entries` (default 64) |
| JIT cache tests (before → after) | 48 → 55 |
| New tests | 7 (eviction, LRU refresh, module unload, stats metrics, counter reset, min enforcement, update-existing) |
| Vitest suite | 25,015 / 25,015 PASS |
| TypeScript compile | clean on main, gated at commit and push |
| Pre-commit hook stages | 2 (staged-TS-only `tsc --noEmit` + PNW index check) |
| Index-check script coverage | 3 index tables × N projects (N auto-discovered) |
| Lessons documented (this release) | 7 initial + 3 escalated from retrospective = 10 total in this README |

## Taxonomic State

As of v1.49.28 the PNW research series catalog is held at nine shipped projects (COL, CAS, ECO, GDN, AVI, MAM, BPS, BCM, SHE) with the cross-reference matrix now navigable at any viewport width. The math-coprocessor's SYMBEX JIT kernel cache moved from "unbounded dict" to "LRU-OrderedDict with configurable cap"; the math-coprocessor chipset at `data/chipset/math-coprocessor.yaml` gained a `symbex.kernel_cache` section with `max_entries: 64` as the default. The hook taxonomy now carries a two-stage pre-commit flow (staged-TS `tsc --noEmit` → PNW index warning) gated by a flag variable rather than early-exit semantics, and the repository convention vocabulary gained the wave-commit-marker (`Wave N: …`) body-line format. The mission-package archetype at `docs/missions/retro-driven-improvements/` becomes the first reference implementation of a retrospective-mined, vision-to-mission-staged milestone; later retrospective-driven releases are expected to copy this archetype rather than reinventing the pipeline.

## Files

- `docs/missions/retro-driven-improvements/` — 9-document, 1,143-line mission package: `00-milestone-spec.md` (101 lines), `01-matrix-filtering-spec.md` (104), `02-tsc-precommit-spec.md` (106), `03-browser-navigation-spec.md` (138), `04-atomic-index-spec.md` (135), `05-kernel-cache-spec.md` (231), `06-wave-execution-plan.md` (144), `07-test-plan.md` (133), `README.md` (51)
- `www/PNW/index.html` — cross-reference matrix filtering: 4 category group toggles, per-project filter chips with All/None, 768px card-view breakpoint, localStorage persistence (+461 net lines)
- `www/PNW/index-check.sh` — 74-line atomic master-index verification script: auto-discovers project directories, checks all 3 index tables, exit 0/1
- `www/PNW/{COL,CAS,ECO,GDN,AVI,MAM,BPS}/page.html` — sticky sidebar TOC + IntersectionObserver active-heading tracking + hover anchor links + section filter + smooth scroll on 7 PNW research browsers
- `math-coprocessor/jit.py` — OrderedDict-backed LRU cache with `cu_module_unload()` eviction, `cache_stats()` metrics, `clear_cache()` counter reset, `symbex.kernel_cache.max_entries` config
- `math-coprocessor/tests/test_jit.py` — 7 new tests for the LRU path, 55/55 total passing
- `data/chipset/math-coprocessor.yaml` — new `symbex.kernel_cache` section
- `CLAUDE.md` — wave commit marker convention (3-line body format for session-forced merged waves)
- `docs/release-notes/v1.49.27/README.md` — renamed to "Shiny Things Charf-Charf Edition"
- `docs/release-notes/v1.49.28/README.md` — this document
- `docs/release-notes/v1.49.28/chapter/00-summary.md` — auto-generated parse of this README
- `docs/release-notes/v1.49.28/chapter/03-retrospective.md` — retrospective chapter (What Worked / What Could Be Better)
- `docs/release-notes/v1.49.28/chapter/04-lessons.md` — 7 lessons extracted with tracker status (applied / investigate / needs review)
- `docs/release-notes/v1.49.28/chapter/99-context.md` — release context chapter

Aggregate: 24 files changed, 2,605 insertions, 210 deletions, 5 feature commits + 2 docs commits across the v1.49.27..v1.49.28 window (head `d5f8ff7b2`).
