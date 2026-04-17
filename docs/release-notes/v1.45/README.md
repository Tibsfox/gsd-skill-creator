# v1.45 — Agent-Ready Static Site

**Released:** 2026-02-26
**Scope:** milestone — custom static site generator for tibsfox.com with parallel agent-discovery layers (llms.txt, llms-full.txt, AGENTS.md, Schema.org JSON-LD) built alongside the human-readable HTML output
**Branch:** dev → main
**Tag:** v1.45 (2026-02-26T18:16:45-08:00) — "Agent-Ready Static Site"
**Predecessor:** v1.44 — SC Learn PyDMD Dogfood
**Successor:** v1.46 — Upstream Intelligence Pack
**Classification:** milestone — first self-published site with first-class AI-agent discovery surface
**Phases:** 408–415 (8 phases) · **Plans:** 22 · **Commits:** 41 · **Tests:** 243
**Files changed (release window v1.45~5..v1.45):** 7 (final integration + docs + audit) · **Full milestone footprint:** 87 files, ~9,247 insertions
**Verification:** quality audit runner enforces CSS ≤15 KB + JS ≤5 KB + internal-link integrity + Schema.org JSON-LD validity + agent-file/sitemap URL consistency + deterministic build structure; 243 tests across the generator pipeline; 700+ word generator README shipped with architecture, quick-start, and API reference

## Summary

**v1.45 made the project's public face machine-first by construction, not as a retrofit.** Most static sites treat AI discovery as a marketing checkbox — drop a `robots.txt`, maybe an `llms.txt`, call it a day. The Phase 408–415 arc rejected that framing and built the opposite: a custom static site generator whose output pipeline produces the human-readable HTML and the agent-discovery layers in the same pass, from the same frontmatter, with the same citation resolver. A markdown file in `content/` produces both an HTML page with a CSS design system (dark/light/print modes, responsive layout, Mustache-style partials) and a matching entry in `llms.txt`, `llms-full.txt`, `AGENTS.md`, a Schema.org JSON-LD graph, and a `.md` mirror for any agent that prefers raw markdown to parsed HTML. No post-processing step stitches these together. No second tool keeps them in sync. The generator emits both surfaces because the pipeline treats both surfaces as first-class output.

**The milestone closed the "where does tibsfox.com live?" question that v1.34 left open.** v1.34 (Documentation Ecosystem) established the canonical `docs/` source and the 7 gateway documents. That release mapped the narrative but not the publishing substrate — the 5-phase incremental migration plan sat as an intent without a concrete implementation. v1.45 is that implementation. The static site generator at `src/site/` compiles the v1.34 gateway documents (plus everything else in `content/`) into the live `www/tibsfox/com/` tree that rsync deploys to production. The execution closes a loop that had been open for eleven releases.

**The 8-phase wave structure (Phase 408 → 415) sequenced the build as foundation → parallel specialist tracks → integration.** Phase 408 landed the shared types and utilities that every later phase depended on. Phases 409, 410, 411 ran as parallel specialist tracks — generator core (markdown processor, template engine, build orchestrator), agent discovery (llms.txt + llms-full.txt + AGENTS.md + JSON-LD + markdown mirror), and design system (CSS custom properties, 7 page variants with shared partials) — because their interfaces were declared in Phase 408 and their work could proceed without contention. Phases 412 (search + citations), 413 (WordPress sync + feed + FTP/rsync deploy), 414 (content + assembly), and 415 (integration + verification + quality audit + generator documentation) layered on top in a narrowing dependency cone. The wave sequencing is the reason 22 plans landed across 41 commits without cross-track collisions.

**The quality audit runner at `src/site/audit.ts` is the exit gate that makes the whole pipeline enforceable.** Six verification passes run at build time before output is allowed to deploy: CSS weight (total site CSS ≤ 15 KB), JS weight (total client-side JS ≤ 5 KB — the search system is deliberately kept small), internal-link integrity (every in-site link resolves to a real file in the output tree), Schema.org JSON-LD validity (the structured-data blocks parse and name the expected schema types), agent-file URL consistency (every URL named in `llms.txt`, `llms-full.txt`, `AGENTS.md` matches the sitemap), and deterministic build structure (two successive builds of the same source produce byte-identical output). The 6-test `test/site/audit.test.ts` suite exercises each pass against synthetic fixtures, and the real build runs the audit against the full content tree. The audit uses injectable `readFile` and `walkDir` primitives so the tests exercise the logic without I/O — the same runner executes against real files in production.

**Client-side search under 3 KB JavaScript is a design choice, not a limitation.** The search index is built at generator time, emitted as a static JSON blob, and consumed by a small client that reads the blob and filters — no API, no server, no runtime dependencies. A 3 KB JS budget rules out most off-the-shelf search libraries (Lunr alone is ~25 KB gzipped), which forced a bespoke implementation matched to the actual content shape: titles, headings, short excerpts, tag arrays. The resulting code is ~2.8 KB gzipped and finishes query processing in under 10 ms on the test corpus. The audit's 5 KB total-JS ceiling reserves the remaining budget for site-widget JavaScript (comment widget, a small interaction helper) and blocks accidental bloat.

**Agent discovery shipped as five coordinated artifacts, not one.** `llms.txt` gives AI agents a terse structured table of contents with direct links. `llms-full.txt` gives the same agents the full content inline for zero-hop consumption. `AGENTS.md` names the site's capabilities and policies in the emerging AGENTS.md convention (what the site is, what content types live here, who authored it, how to cite it, what's off-limits). Schema.org JSON-LD embeds structured metadata into each HTML page for search engines and any agent that can parse JSON-LD. A `.md` mirror tree publishes the raw markdown of every page so agents that prefer parsing markdown to HTML can skip the HTML layer entirely. The five artifacts serve overlapping audiences — different agents prefer different surfaces — and the generator emits all five from a single authoring flow, which is the load-bearing property.

**Citation integration wires `sc:learn`-era citation surface into the static site without duplicating the resolver.** v1.36 shipped the 6-adapter citation resolution cascade (DOI, arXiv, ISBN, URL, BibTeX, manual). v1.45's site generator reuses that resolver directly — `{cite:key}` syntax in markdown resolves through the v1.36 cascade during the markdown-processing pass and produces both inline HTML citation links and a generated bibliography page. Citations in `AGENTS.md` and `llms.txt` carry the same resolved identifiers, so an agent downloading the agent-discovery layer sees the same canonical cite keys a human sees in the rendered HTML. The citation chipset (6 skills, 4 agents) shipped in v1.36 did not need rebuilding; v1.45 consumed it.

**WordPress integration via MCP bridges the static site to the pre-v1.45 dynamic surface.** tibsfox.com previously ran on WordPress. The static-site cutover could not orphan the comment stream or the post archive, so v1.45 shipped a WordPress MCP bridge with push/pull content sync (pushing generated HTML metadata into WordPress as reference posts; pulling comments and any still-WordPress-authored content into the static build) and a comment widget that embeds WordPress comment threads into static pages. The integration is not a migration — both systems remain live — but it lets the static pipeline consume and emit into the WordPress API without bespoke HTTP glue.

**FTP/rsync deployment with dry-run and verification is the shipping endpoint, with honest caveats.** The deploy layer in `src/site/deploy.ts` supports both FTP (for legacy hosts) and rsync (for modern hosts), runs a `--dry-run` mode that reports what would change without writing, and runs a post-deploy verification pass that checks the live URLs return the expected content hashes. The retrospective flags the honest gap: this is a direct production deployment — there is no staging environment. The first real deploy is also the first deploy against production traffic. A follow-up release will add a staging tier; v1.45 did not.

**The 243-test count is adequate but thin relative to the surface area.** The pipeline spans markdown processing, template rendering, CSS generation, search indexing, citation resolution, agent-file emission, WordPress sync, FTP/rsync deployment, and quality auditing. Nine subsystems against 243 tests averages out to ~27 tests per subsystem, which is enough to exercise the happy paths but light on adversarial fixtures. The retrospective names this as a debt to pay down in v1.46-era coverage work, not as a blocker for v1.45 itself — the build ran, the audit enforced invariants, and the site deployed. But the test budget is one of the two honest limitations in the release.

**The Phase 415 integration commits (the visible v1.45~5..v1.45 tip) are the tail of a much larger 41-commit arc.** The release-window shortstat shows 7 files / 842 insertions, but those represent only the final phase (audit runner + generator README + version bumps). The milestone footprint — 87 files across 8 phases — captures the full generator. The commit graph for Phase 415 specifically shows the TDD discipline: `test(415-02): add failing tests for quality audit` landed before `feat(415-02): implement quality audit runner`, and `test(415-03): add failing tests for generator documentation` landed before `feat(415-03): create site generator documentation`. Tests-first was the rule through the arc, not an afterthought.

## Key Features

| Area | What Shipped |
|------|--------------|
| Markdown processor (Phase 409) | Frontmatter parser, heading-ID slugging, `{cite:key}` citation syntax, external-link handling, table-of-contents extraction, feeding both the HTML template pass and the agent-discovery emitters |
| Template engine (Phase 409) | Mustache-style variables/sections/partials supporting 7 page variants; shared partials for header, navigation, and footer; no server-side rendering at runtime |
| Build orchestrator (Phase 409) | File-discovery walker, content-processing pipeline, output writer, CLI entry point; deterministic ordering so two builds of the same source produce byte-identical output |
| Agent discovery — llms.txt / llms-full.txt (Phase 410) | Terse table-of-contents + full-content inline variants for AI agent consumption; URL consistency enforced by the audit runner |
| Agent discovery — AGENTS.md (Phase 410) | Emerging-convention capability/policy declaration describing site content types, authorship, citation conventions, and off-limits areas |
| Agent discovery — Schema.org JSON-LD (Phase 410) | Structured-metadata blocks embedded in every HTML page; validated at build time by the audit runner |
| Agent discovery — markdown mirror (Phase 410) | `.md` mirror tree of every published page so agents can skip HTML parsing entirely |
| CSS design system (Phase 411) | Custom properties, typography scale, dark/light/print modes, responsive layout; total CSS weight gated at 15 KB by the audit runner |
| HTML templates (Phase 411) | 7 page variants — index, article, list, tag, archive, bibliography, 404 — composed from shared partials |
| Search system (Phase 412) | Build-time index emission + client-side filter; total client JS < 3 KB; no API, no server, no runtime dependency |
| Citation integration (Phase 412) | `{cite:key}` resolver reusing the v1.36 citation cascade; inline HTML citation links + generated bibliography page; cite keys consistent across HTML and agent-discovery layers |
| WordPress integration (Phase 413) | MCP-bridged push/pull content sync; embeddable comment widget for bridging static pages to WordPress comment threads |
| Deployment tools (Phase 413) | FTP + rsync deploy paths; `--dry-run` reporting; post-deploy content-hash verification against live URLs |
| Content pipeline (Phase 414) | Sample-content generation, `site.yaml` configuration surface, `navigation.yaml` nav structure; frontmatter schema validation |
| Quality audit runner (Phase 415 — `src/site/audit.ts`) | 6 invariants: CSS ≤ 15 KB, JS ≤ 5 KB, internal-link integrity, Schema.org JSON-LD validity, agent-file URL consistency with sitemap, deterministic build structure; injectable `readFile`/`walkDir` for testability |
| Audit test suite (Phase 415 — `test/site/audit.test.ts`) | 6 tests covering CSS/JS size limits, link integrity, agent consistency, deterministic build verification |
| Generator documentation (Phase 415 — `src/site/README.md`) | 700+ words covering architecture, quick start, content authoring, frontmatter fields, citation syntax, agent discovery docs, WordPress integration, deployment, configuration, design system, quality audit, testing |

## Retrospective

### What Worked

- **Dual-audience architecture emitted human and agent surfaces from one pass.** The same content produces HTML with a CSS design system (dark/light/print modes) and agent-discovery layers (llms.txt, llms-full.txt, AGENTS.md, Schema.org JSON-LD, markdown mirror) in a single generator pipeline. No second tool keeps them in sync because they fall out of the same pass.
- **Client-side search under 3 KB JavaScript is a real constraint that produced a real design.** Rejecting off-the-shelf search libraries (Lunr ~25 KB) forced a bespoke implementation matched to the content shape. The audit runner's 5 KB total-JS ceiling blocks regression; the search code finishes queries in under 10 ms on the test corpus.
- **7 page variants with shared partials avoided template duplication.** The Mustache-style template engine with variables, sections, and partials let index, article, list, tag, archive, bibliography, and 404 pages all share header/nav/footer markup without copy-paste. The right abstraction for a static site with diverse content types.
- **WordPress MCP integration bridged rather than migrated.** Push/pull content sync and the comment widget let the static site coexist with the legacy WordPress surface. No flag-day migration; no orphaned comment stream; no bespoke HTTP glue outside the MCP bridge.
- **Quality audit runner as a build-time exit gate caught problems before deployment.** Six invariants (CSS/JS size, link integrity, JSON-LD validity, agent-file consistency, deterministic structure) run against real output. Broken links and invalid structured data fail the build instead of the browser.
- **TDD-first discipline held across Phase 415.** The git log shows `test(415-02)` before `feat(415-02)` and `test(415-03)` before `feat(415-03)`. Failing tests landed first, passing implementation followed. This is the habit the checklist gates want and the commit graph confirmed.
- **Citation integration reused v1.36's resolver instead of duplicating it.** The 6-adapter citation cascade from v1.36 is the same resolver the site generator calls; cite keys stay canonical across HTML, markdown, and agent-discovery surfaces.

### What Could Be Better

- **243 tests across 9 subsystems is thin.** Markdown, templates, CSS, search, citations, agent-file emission, WordPress sync, deployment, and quality audit — each subsystem needs its own adversarial fixtures. The current count covers happy paths well but is light on edge cases. v1.46-era coverage work is the natural follow-up.
- **FTP/rsync deployment is direct-to-production with no staging tier.** Dry-run and post-deploy verification help, but the first real deploy is the first deploy against real traffic. A staging environment with URL-mirrored previews is the next honest investment.
- **Agent-discovery conventions are emerging, not frozen.** `llms.txt`, `AGENTS.md`, and the Schema.org structured-data shapes are still being standardized by the broader ecosystem. The generator emits what's currently considered correct; future spec drift will require regeneration passes.
- **WordPress comment widget embeds a third-party runtime surface.** The comment widget depends on WordPress staying live. If WordPress ever fully retires, the widget degrades — commenters lose identity continuity. A static-comment fallback is unimplemented.
- **The 3 KB client-JS budget is a target, not a contract.** Any feature addition that pushes the total over 5 KB breaks the audit. That's the point of the ceiling, but it also means adding interactivity later requires negotiating JS budget against audit enforcement.

## Lessons Learned

- **Agent discovery layers are the sitemap.xml of the AI era.** Just as search engines need structured metadata to crawl sites, AI agents need structured discovery documents (llms.txt, AGENTS.md, Schema.org JSON-LD) to navigate them. Building these into the static site generator makes them automatic; bolting them on as post-processing makes them drift. v1.45 chose the first path because the second path was the v1.44-era failure mode to avoid.
- **A custom static site generator is justified when output requirements are non-standard.** Citation syntax, agent-discovery layers, WordPress content sync, deterministic build output, and progressive-disclosure templates are not available together in any off-the-shelf SSG. The custom build cost is offset by exact-fit output and by the fact that the pipeline is small enough to read in one sitting. A generator built for one site's requirements is a reasonable thing to maintain.
- **Build-time quality audit is the enforcement layer that makes invariants real.** Running CSS/JS size checks, link-integrity verification, Schema.org validation, agent-file URL consistency, and deterministic-build verification as part of the build pipeline means none of those invariants can drift. Audits that run "eventually" drift; audits that block the build don't.
- **Dual-audience design should be declared at the type layer, not patched in later.** The generator's shared types in Phase 408 treated HTML emission and agent-discovery emission as peer outputs from the start. Both paths consume the same parsed frontmatter, the same resolved citations, the same rendered markdown. Making them peers was a Phase 408 decision; making them peers later would have required rewriting every emitter.
- **TDD discipline shows up in the commit graph or it doesn't show up.** Phase 415 landed `test(415-02)` before `feat(415-02)` and `test(415-03)` before `feat(415-03)`. The ordering is not ceremonial — it's a checkable property. If a feat commit lands with no preceding test commit, TDD did not happen. The commit graph is the audit.
- **Injectable I/O is the difference between testable audit runners and untestable ones.** `src/site/audit.ts` accepts `readFile` and `walkDir` as injected primitives. The test suite passes synthetic implementations; production passes the real `fs` bindings. The runner logic stays the same; the I/O boundary moves. Without the injection point, the tests would require a filesystem fixture tree, which would be slower to run and more brittle than the injected approach.
- **Publishing pipeline is as load-bearing as the content it publishes.** The generator is not merely "docs tooling" — it is the mechanism by which the project's public face exists. Treating the generator with the same test discipline, typing rigor, and audit enforcement as the core library is the right stance. A flaky generator produces a flaky public face, and that is a visible failure mode.
- **Reuse existing subsystems; don't reimplement.** The v1.36 citation resolver, the v1.28 filesystem message bus (for MCP bridging), and the v1.27 content conventions all showed up inside v1.45 without rebuilding. When a later release consumes an earlier release's substrate cleanly, the earlier release's abstractions are paying off. When a later release has to work around an earlier release, the abstraction was wrong.
- **Deterministic output is a testable property, not a vague goal.** "Two builds produce byte-identical output" is an audit check the runner can run in CI. Non-deterministic generators (timestamp-laced output, unstable iteration order, random IDs) fail that check. Making determinism a build-gate invariant makes unstable output visible and fixable.
- **Wave sequencing (foundation → parallel specialists → integration) scales beyond a single feature.** The Phase 408–415 arc shipped 22 plans across 41 commits without cross-track collisions because Phase 408 declared the shared interfaces and Phases 409–411 consumed them in parallel. The same pattern worked for Phases 412–413 (second parallel wave) and Phase 415 (integration + audit). Eight phases of parallelizable work proved the sequencing model.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.34](../v1.34/) | Documentation Ecosystem — established canonical `docs/` source and 7 gateway documents; v1.45 is the concrete implementation of the 5-phase incremental migration plan v1.34 described |
| [v1.36](../v1.36/) | Citation Management — the 6-adapter citation resolution cascade that v1.45's `{cite:key}` syntax reuses unchanged |
| [v1.35](../v1.35/) | Mathematical Foundations Engine — `sc:learn` shipped here; v1.45's citation integration preserves the cite-key conventions v1.35 adopted |
| [v1.27](../v1.27/) | Foundational Knowledge Packs — content conventions consumed by v1.45's content pipeline |
| [v1.28](../v1.28/) | GSD Den Operations — filesystem message bus that v1.45's WordPress MCP bridge builds on |
| [v1.31](../v1.31/) | GSD-OS MCP Integration — the MCP Gateway/Host stack v1.45's WordPress integration targets |
| [v1.33](../v1.33/) | GSD OpenStack Cloud Platform — documentation-pack patterns referenced when shaping the generator's 7 page variants |
| [v1.40](../v1.40/) | sc:learn Dogfood Mission — dogfooding discipline that v1.45's quality audit runner applies to a different pipeline |
| [v1.41](../v1.41/) | Claude Code Integration Reliability — immediate predecessor to v1.44/v1.45 in the Feb-2026 arc |
| [v1.44](../v1.44/) | SC Learn PyDMD Dogfood — immediate predecessor; the second `sc:learn` dogfood corpus that proved v1.40's format-breadth work |
| [v1.46](../v1.46/) | Upstream Intelligence Pack — immediate successor; adds change-monitoring over upstream docs that v1.45's site can republish |
| [v1.49](../v1.49/) | Mega-release consolidating post-v1.35 work; re-exposes the site generator through the unified cartridge pipeline |
| [v1.0](../v1.0/) | Core Skill Management — the adaptive-loop substrate that every subsequent release including v1.45 extends |
| `src/site/audit.ts` | Phase 415 quality audit runner — 6 invariants gating build output |
| `src/site/README.md` | Phase 415 generator documentation — 700+ words, architecture through API reference |
| `test/site/audit.test.ts` | Phase 415 audit test suite — 6 tests, injectable I/O |
| `test/site/docs.test.ts` | Phase 415 documentation test — verifies README presence, required sections, minimum word count |
| tibsfox.com | Live target of the deploy pipeline — the site v1.45 publishes into |

## Engine Position

v1.45 sits at the midpoint of the v1.33–v1.49 infrastructure-hardening arc, specifically as the publishing-substrate release. v1.33–v1.34 established documentation canon and gateway structure. v1.35–v1.37 built the knowledge-ingestion pipeline (`sc:learn`, citations, complex-plane positioning). v1.38–v1.41 moved the project into its GSD-OS shell and hardened Claude Code integration. v1.44 ran the second `sc:learn` dogfood. v1.45 is the release that connected all of it to a public-facing surface by shipping the generator that publishes the canonical docs, the knowledge-pipeline outputs, the citation-resolved bibliographies, and the agent-discovery layers to tibsfox.com. Every post-v1.45 release that publishes content publishes through the machinery v1.45 built. In the longer arc toward v1.50, v1.45's agent-ready static site is the substrate that makes the project's research output addressable by AI agents, which is increasingly the dominant consumption mode. The release does not add new primitives — it adds a load-bearing endpoint.

## Files

- `src/site/` — complete static site generator (markdown processor, template engine, build orchestrator, agent-discovery emitters, CSS design system, HTML templates, search system, citation integration, WordPress MCP bridge, FTP/rsync deploy tools, content pipeline)
- `src/site/audit.ts` — Phase 415 quality audit runner (CSS/JS size limits, internal link integrity, Schema.org JSON-LD validity, agent-file URL consistency, deterministic build structure; injectable I/O)
- `src/site/README.md` — Phase 415 generator documentation (architecture, quick start, content authoring, frontmatter fields, citation syntax, agent discovery, WordPress integration, deployment, configuration, design system, quality audit, testing; 700+ words, 437 lines)
- `test/site/audit.test.ts` — Phase 415 audit test suite (6 tests covering all six audit invariants; uses injected `readFile`/`walkDir`)
- `test/site/docs.test.ts` — Phase 415 generator-documentation test (verifies README exists, required sections present, 500+ word minimum)
- `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json` — release-window version bumps to 1.45.0
- `docs/release-notes/v1.45/chapter/00-summary.md` — chapter summary pointing to this README
- `docs/release-notes/v1.45/chapter/01-features.md` — per-feature breakdown of the 13 subsystems
- `docs/release-notes/v1.45/chapter/03-retrospective.md` — What Worked / What Could Be Better inventory
- `docs/release-notes/v1.45/chapter/04-lessons.md` — 6-lesson extraction with classification and apply/investigate status
- `docs/release-notes/v1.45/chapter/99-context.md` — prev/next navigation and parse-confidence metadata

---

_Parse confidence: 1.00 — authored from the Phase 408–415 plan set, the `src/site/` generator source, the Phase 415 audit runner and its test suite, the v1.45 git log (release window v1.45~5..v1.45 plus the full 41-commit milestone footprint), and the chapter artifacts under `docs/release-notes/v1.45/chapter/`._
