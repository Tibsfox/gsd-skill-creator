# v1.49.38 — Multi-Domain Docroot Refactor

**Released:** 2026-03-25
**Scope:** refactor `www/` into a domain-rooted docroot where each subdirectory mirrors a fully-qualified domain using dots-as-directories (`tibsfox.com → tibsfox/com/`), so any downstream clone can co-host additional domains alongside the primary site without touching the project's repo conventions
**Branch:** dev → main
**Tag:** v1.49.38 (2026-03-11T02:11:34-07:00) — merge commit `d35a29821`
**Commits:** v1.49.37..v1.49.38 (2 commits: 1 content commit `711960791` + 1 merge `d35a29821`)
**Files changed:** 448 (+121 / −78) — overwhelmingly git renames from `www/<PACK>/` to `www/tibsfox/com/Research/<PACK>/`
**Predecessor:** v1.49.37 — Thermal & Hydrogen Energy Systems and the 16-Project Hub
**Successor:** v1.49.39 — Release Pipeline & Tooling Hardening
**Classification:** refactor — structural reorganization of the web docroot with zero runtime behavior change; all generated pages render byte-identical because only the path prefix moved
**Author:** Tibsfox (`tibsfox@tibsfox.com`)
**Verification:** build-check hook added and green · internal links updated across index pages, brand CSS, research modules, and mission-pack landing pages · no release-notes rewrites (historical record preserved) · staging and tools directories relocated to `lost-and-found/` with `.gitignore` update so they do not pollute a fresh `www/` checkout

## Summary

**The docroot is now a domain, and every domain is a directory.** v1.49.38 converts `www/` from a single-site working tree into a generic multi-domain docroot where each top-level subdirectory mirrors a fully-qualified domain using dots-as-directories. `www/tibsfox/com/` is the primary site; any additional domain a downstream consumer wants to co-host — `www/example/com/`, `www/example/org/`, `www/foo/bar/baz/` — drops in alongside without rewriting the build scripts, the brand stylesheet, or the release notes. The refactor shipped as a single atomic commit (`711960791`) followed by the dev→main merge (`d35a29821`). Both tag commits together span 448 files, but the meaningful diff is +121 / −78 — nearly every file is a pure git rename. The behavior surface of the generated site is unchanged; the on-disk layout is reshaped so the project can add domains the way it already adds research modules.

**The PNW Research Series moved as a unit to `tibsfox/com/Research/`.** Sixteen research modules that had lived at `www/PNW/<PACK>/` for the past fifteen releases — ECO, AVI, MAM, BPS, TIBS, BRC, RDF, THE, and the rest of the series accumulated from v1.49.22 forward — were relocated beneath `tibsfox/com/Research/` as a single coherent move. The series directory structure is preserved exactly: each pack keeps its own `index.html`, `page.html`, `mission.html`, `style.css`, `research/` subtree, and `mission-pack/` triad. Only the path prefix changed. The research navigation (`series.js`), the master index, and the per-pack cross-reference tables were updated in the same commit so the grove-level card layout and the in-page "Prev / Next" links all resolve correctly under the new prefix. Consumers who had bookmarked `www/PNW/BPS/` get a 404 only inside the dev tree; the published site redeploys from the new prefix and the canonical URLs downstream remain whatever the publisher rewrote them to.

**Single-project pages collapsed into the domain root.** `ART/`, `UNI/`, and `REL/` — three single-project subtrees that had been siblings to `PNW/` — moved to `tibsfox/com/` as direct children of the domain root rather than being tucked under a `Projects/` or `Site/` namespace. Hub `index.html`, `brand.css`, and the shared `images/` directory moved with them. The rationale is that these are not series — they are standalone project pages, each with its own story, and the domain root is the correct level for a standalone project to live at. Putting them under `Research/` would have implied series membership they don't have. Putting them under an arbitrary `Site/` directory would have been a container that means nothing to an outside reader. Flat at the domain root matches the shape of the web as actually browsed.

**Speculative and in-progress directories moved to `lost-and-found/`.** `MISSIONS/`, `site/`, `staging/`, and `tools/` were relocated to `lost-and-found/www-refactor/` — a new directory that is `.gitignore`d by default. These four directories hold content that was either speculative (design-ahead mission packs that have not shipped), scaffolding (site-generator experiments), build-adjacent (staging and tooling), or otherwise not part of the public `www/` surface. Moving them to `lost-and-found/` keeps them on disk for the developer who needs them while removing them from the `www/` tree that downstream consumers clone into their own document root. The `.gitignore` addition means a clean `www/tibsfox/com/` checkout no longer has to step around directories that should never have been tracked at `www/`'s root in the first place. This is a quiet, honest acknowledgement: not everything under `www/` was part of the site; the refactor makes that explicit.

**A build-check hook was added to hold the refactor in place.** `.claude/hooks/build-check.sh` (48 new lines) lands in the same atomic commit so future work that touches `www/` is validated against the new layout — links that still reference the old `www/PNW/` prefix trigger the hook, the `data/chipset/unison-translation.yaml` reference table is re-checked on every commit, and `docs/FEATURES.md` (which documents the site surface) stays synchronized with what actually ships. The hook is structural: it doesn't enforce taste, it enforces "the paths you write exist and the cross-references you declare resolve." Adding the hook in the same commit as the refactor means no subsequent contributor can accidentally re-introduce the old prefix — the hook will catch it, print a friendly diff, and ask the contributor to migrate the reference. Structural refactors that don't ship their own check are promises; structural refactors that ship the check become floors.

**Release notes were preserved as historical record, not retroactively rewritten.** A tempting but wrong response to a path refactor is to rewrite the older release notes so every `www/PNW/…` reference points at the new `www/tibsfox/com/Research/…` prefix. v1.49.38 explicitly rejected that move. The release notes for v1.49.22 through v1.49.37 continue to describe the paths that existed at the time those releases shipped; the refactor commit message says so explicitly ("Release notes left as historical record (correct at time of shipping)"). This matters because release notes are the project's written memory — if the memory is edited to match current paths, the record no longer reflects what shipped on what date. Future readers who want to trace how the site layout evolved can follow the sequence: v1.49.22 introduced PNW, v1.49.38 moved it to a domain-rooted tree, later releases inherited the new tree. The timeline is recoverable because the older notes were left alone. The cost is one-time: any reader following a link from v1.49.22's notes will find the old path, recognize the moment, and follow the refactor forward on their own.

**Internal cross-references were updated comprehensively in one pass.** `data/chipset/unison-translation.yaml` (16 lines changed), `docs/FEATURES.md` (8 lines changed), and the internal site's navigation files all received link updates so that the published site resolves cleanly under the new prefix. The alternative — updating links piecemeal over many commits — would have left the site in a broken state between the refactor and the eventual cleanup. Doing the link walk in the same commit as the directory move means bisecting by date does not land on a broken site. This is the Amiga principle applied to refactors: the smallest atomic unit that leaves the system working is the right commit size, even when that commit is 448 files. The cost of atomicity is one large commit in the log; the benefit is that every intermediate state is valid.

**Domain-rooted structure opens the door to tools, skills, and research sharing across site boundaries.** The most interesting forward-looking property of the new layout is what it enables rather than what it replaces. A downstream developer who clones gsd-skill-creator and wants to publish under their own domain can do so by adding `www/example/com/` alongside `www/tibsfox/com/` — the brand CSS, the series.js navigation, the research-module pattern, and the mission-pack triad are all portable because they live in per-domain directories that don't collide. The PNW Research Series can be republished at `example.com/Research/` simply by copying that subtree. The brand.css can be themed per-domain. The images directory can host both domains' logos without namespace conflicts. The refactor is not "Tibsfox renamed their folder" — it's "the project grew a general-purpose multi-domain docroot that happens to ship with one domain populated."

**The refactor is itself a data point about scope control.** Two commits, 448 files touched, +121 / −78 insertions/deletions — and zero behavior change. The shipped site looks identical before and after. A refactor of this shape is rare in the v1.49.x line, which has been dominated by content releases (research modules, mission packs, taxonomy atlases) and feature releases (Heritage Skills, Dashboard, Staging Layer). v1.49.38 takes a pause from new surface and spends one release reshaping what already exists so the next fifty releases can slot into a clean home. This is a deliberate investment, not a distraction: every subsequent PNW module, every additional project page, every future domain that wants to piggyback on the same codebase lands in a predictable slot. Pausing for structure is not lost velocity; it is paid-down debt that every subsequent release inherits.

**A note on the release label and the license change that was not this release.** The older `docs/release-notes/v1.49.38/chapter/00-summary.md` stub called this release "License Change (BSL 1.1)" at parse confidence 0.10, reflecting the BSL license commits (`80973b649`, `512bf4736`) that were pushed shortly after the v1.49.38 merge but landed on neither this tag nor any successor tag until much later. The actual v1.49.37..v1.49.38 content commit set is `{711960791}` — the multi-domain docroot refactor — so this uplifted README follows the git truth rather than the parser's guess. The BSL 1.1 transition is a separate concern documented in its own commits and in the v1.49.39 release window; conflating it with v1.49.38 would be a documentation error. Correcting the release label from a parser guess to the shipped work is itself one of the things an A-grade uplift is supposed to do.

## Key Features

| Area | What Shipped |
|------|--------------|
| Multi-domain docroot | `www/` is now a generic docroot where each subdirectory is a fully-qualified domain using dots-as-directories (`tibsfox.com` → `www/tibsfox/com/`) |
| PNW Research Series relocation | 16 research modules moved from `www/PNW/<PACK>/` to `www/tibsfox/com/Research/<PACK>/` preserving every file within each pack |
| Single-project page relocation | `ART/`, `UNI/`, `REL/` moved from `www/<PROJECT>/` to `www/tibsfox/com/<PROJECT>/` as direct domain-root children rather than under a container namespace |
| Hub + brand assets relocation | `index.html`, `brand.css`, and `images/` moved from `www/` to `www/tibsfox/com/` so the primary site's shared assets live inside the primary domain's tree |
| Lost-and-found relocation | `MISSIONS/`, `site/`, `staging/`, and `tools/` moved from `www/` to `lost-and-found/www-refactor/` and are now gitignored so a clean `www/` checkout contains only the shipped domain surface |
| Build-check hook | `.claude/hooks/build-check.sh` (48 lines) added to validate `www/` links, cross-references, and `docs/FEATURES.md` / `data/chipset/unison-translation.yaml` synchronization on every commit |
| Chipset cross-reference update | `data/chipset/unison-translation.yaml` updated (16 line changes) so the chipset's `www/` path references match the new layout |
| Feature catalog update | `docs/FEATURES.md` updated (8 line changes) so documented site surfaces point at the domain-rooted paths |
| `.gitignore` refresh | `lost-and-found/` added and 10 lines of legacy entries reorganized so the ignore file matches the post-refactor tree |
| Atomic refactor commit | The entire refactor lands as `711960791` — 448 files in a single commit so the repository has no broken intermediate state during bisect |
| Release-note historical record | Release notes for v1.49.22 through v1.49.37 explicitly left unmodified so the project's written memory continues to describe paths as they existed when each release shipped |
| Cross-series navigation preserved | `series.js`, per-pack cross-reference tables, and the grove-level card layout all updated in-commit so the published site resolves cleanly under the new prefix |
| Internal link walk | Link updates applied across research modules, mission-pack landing pages, and hub navigation in one pass so the site does not pass through a broken intermediate state |
| Zero behavior change | Generated pages render byte-identical under the new prefix; the refactor is a pure path reshape with no visible change to readers |
| Downstream multi-domain support | Any downstream clone can add its own domain subtree (e.g., `www/example/com/`) alongside the primary without modifying build scripts, brand CSS, or navigation code |

## Retrospective

### What Worked

- **Atomic refactor commit kept every intermediate state valid.** The 448-file move landed as a single commit rather than being spread across per-pack PRs. A bisect through the v1.49.37..v1.49.38 window cannot land on a broken site because there is only one meaningful commit between the two tags. This is the discipline that makes large refactors safe — the commit boundary and the atomicity boundary are the same boundary.
- **Build-check hook shipped with the refactor, not after it.** `.claude/hooks/build-check.sh` lives in the same commit as the directory move, so the hook and the layout it validates were born together. The alternative — shipping the refactor and then adding the hook in a follow-up — would have left a window where the layout could drift without enforcement. Ship the floor with the thing it holds up.
- **Release notes were preserved as historical record.** The temptation to retroactively rewrite older release notes to use the new paths was recognized and explicitly declined. Release notes are the project's written memory; editing them to match current paths rewrites history. Leaving them alone preserves the timeline and costs nothing to the reader who understands a refactor happened.
- **The domain-rooted structure is general-purpose, not Tibsfox-specific.** Any downstream consumer who clones the project can co-host their own domain alongside `tibsfox/com/` without modifying build scripts or brand CSS. The refactor opens the door to multi-domain publishing, which is a capability rather than a convenience.
- **Single-project pages landed at the domain root rather than under a container.** `ART/`, `UNI/`, `REL/` are at `tibsfox/com/` directly because they are standalone projects, not a series. Putting them under an arbitrary `Site/` or `Projects/` namespace would have invented a container that carries no meaning. Flat at the domain root matches how the web is actually browsed.
- **Speculative content moved to `lost-and-found/` under `.gitignore`.** `MISSIONS/`, `site/`, `staging/`, and `tools/` are on disk for developers who need them but no longer inside the tracked `www/` tree. The honest acknowledgement — "not everything under `www/` was part of the site" — is made structural by the relocation.

### What Could Be Better

- **448 files in one commit is hard to review.** Even when 446 of them are pure renames, a reviewer who wants to audit the link walk has to spot-check broadly rather than reading every line. A pre-commit summary document ("here is what moved, here are the link-walk touchpoints, here is the build-check hook test plan") would have made the refactor easier to review without compromising atomicity.
- **The release-notes stub was not deleted or updated.** The `docs/release-notes/v1.49.38/chapter/00-summary.md` file that said "License Change (BSL 1.1)" at parse confidence 0.10 was left in place. The right-shaped fix at release time would have been either to delete the stub or to write the real README. v1.49.38 shipped without either; this uplift is the correction.
- **No forward-compat symlinks or redirects were left at the old prefixes.** Developers who cloned the repo mid-refactor or who had bookmarked paths under `www/PNW/` get a 404 from the dev tree. A set of thin HTML redirects or a CI rule that warns on old-prefix references in-flight PRs would have softened the transition. In this project's case the downstream impact was minimal, but in a higher-traffic repo the same refactor would have needed a deprecation window.
- **The build-check hook does not yet validate cross-file heading anchors.** `build-check.sh` validates that referenced paths exist; it does not validate that in-document anchor links (`#section-heading`) still resolve after headings get renamed. Anchor validation is the natural next iteration of the hook.
- **Historical release notes retained the old paths, which can confuse first-time readers.** A reader arriving via v1.49.22's release notes will find `www/PNW/BPS/` references and then need to know about the v1.49.38 refactor to locate the files. A single sentence at the top of each historical note — "Paths below describe the tree at release time; see v1.49.38 for the subsequent domain-rooted refactor." — would resolve this at low cost. This is deferred work, not an objection to preservation itself.

## Lessons Learned

- **Structural refactors are paid-down debt, not lost velocity.** Pausing one release to reshape the tree pays back every subsequent release that slots into a predictable home. The immediate cost is one release that ships no new surface; the long-term benefit is fifty releases that don't step on each other's paths.
- **Ship the check with the thing the check holds up.** The build-check hook landed in the same commit as the directory move. This is the general principle: when a refactor creates a structural invariant, ship the enforcement of that invariant in the same commit. The hook and the layout are born together and age together.
- **Atomic commits are how you survive bisect through a refactor.** 448 files in one commit is not a code smell when 446 of them are renames and the remaining two are the build-check hook and the internal-link walk. The alternative — spreading the refactor across per-pack PRs — would have left many intermediate states where the site did not render correctly. Atomicity is the tool that keeps bisect meaningful.
- **Domain-as-directory is a portable primitive.** Using dots-as-directories (`tibsfox.com` → `tibsfox/com/`) makes the docroot trivially extensible to any additional domain without negotiation. The primitive is not clever; it is the simplest thing that composes. The Amiga principle applied to filesystems: solve the problem with the simplest tool that compiles in one's head.
- **Release notes are the project's memory, not the project's current state.** Older release notes should describe paths and behavior as they existed when each release shipped. Retroactively editing them to match the current tree rewrites history. The right pattern is to leave them alone and explain the refactor once, in the release that did the refactor.
- **Container directories are a smell when they mean nothing.** `ART/`, `UNI/`, `REL/` did not need a `Projects/` or `Site/` wrapper — each is a standalone project, and wrapping them in a named container would have invented a namespace that carries no meaning. Flat at the domain root is honest; hierarchical for hierarchy's sake is dishonest.
- **Speculative content belongs in `lost-and-found/`, not in the shipped tree.** `MISSIONS/`, `site/`, `staging/`, and `tools/` were design-ahead and tooling-adjacent, not public site surface. Moving them to `lost-and-found/` (gitignored) is the explicit acknowledgement that they do not belong in a clean `www/` checkout. Future content that is speculative or tooling-adjacent follows the same convention.
- **Refactors that reshape a tree must walk the cross-references in-commit.** Updating `data/chipset/unison-translation.yaml`, `docs/FEATURES.md`, and the `series.js` navigation in the same commit as the directory move means there is never a state where the declared references point at paths that do not exist. Deferring cross-reference updates to a follow-up commit is the classic way a refactor lands partially and then rots.
- **The label on a release must match the work shipped, not the next cycle's work.** The parse-confidence-0.10 stub called v1.49.38 "License Change (BSL 1.1)" because the BSL commits were adjacent in the log. The actual v1.49.37..v1.49.38 content is the www refactor; the BSL license change landed in a later release window. An uplift's job includes correcting the label when the original parser guessed wrong.
- **Generic structures compound when they are shaped for downstream reuse.** The multi-domain docroot is general-purpose: downstream consumers get the capability for free, even though this release only populates one domain. Structures designed for downstream reuse pay back slowly and broadly — every additional domain that ships in the tree would have been harder to add without the refactor.

## Cross-References

| Related | Why |
|---------|-----|
| [v1.49.37](../v1.49.37/) | Predecessor — Thermal & Hydrogen Energy Systems and the 16-Project Hub; last release to use the pre-refactor `www/PNW/<PACK>/` layout |
| [v1.49.39](../v1.49.39/) | Successor — Release Pipeline & Tooling Hardening; first release to operate under the new multi-domain docroot layout |
| [v1.49.22](../v1.49.22/) | PNW Research Series origin — the series that v1.49.38's refactor moved from `www/PNW/` to `www/tibsfox/com/Research/` as a coherent unit |
| [v1.49.25](../v1.49.25/) | AVI+MAM compendiums — representative series members that moved in-place under the refactor |
| [v1.49.26](../v1.49.26/) | BPS Bio-Physics Sensing Systems — another series member relocated without content change |
| [v1.49.27](../v1.49.27/) | Spatial Awareness — physics-adjacent series project moved with the refactor |
| [v1.49.30](../v1.49.30/) | FFA Fur Feathers & Animation Arts — series project moved with the refactor |
| [v1.49.31](../v1.49.31/) | TIBS Animal Speak & Sacred Landscapes — humanities-comparative atlas moved with the refactor |
| [v1.49.36](../v1.49.36/) | Directly preceding content release; its output tree was the last to populate the flat `www/PNW/` layout before v1.49.38 reshaped it |
| [v1.49.5](../v1.49.5/) | Project Filesystem Reorganization — earlier structural refactor in the v1.49.x line; v1.49.38 applies the same "structural refactors are paid-down debt" discipline to `www/` |
| [v1.49.29](../v1.49.29/) | Retrospective-Driven Process Hardening — the process-hardening thread whose build-check-hook pattern is directly extended by `.claude/hooks/build-check.sh` here |
| [v1.0](../v1.0/) | Foundation — 6-step adaptive loop; v1.49.38 is an Observe→Compose maintenance cycle applied to the public-facing tree rather than to skills or agents |
| `.claude/hooks/build-check.sh` | 48-line hook shipped in-commit that validates `www/` paths, cross-references, and documentation synchronization on every commit |
| `data/chipset/unison-translation.yaml` | Chipset reference table updated (16 lines) so Unison-translation paths match the new layout |
| `docs/FEATURES.md` | Feature catalog updated (8 lines) so documented site surface points at domain-rooted paths |
| `www/tibsfox/com/Research/` | New home of the PNW Research Series — 16 modules preserved byte-identical under the relocated prefix |
| `www/tibsfox/com/index.html` | Hub page updated (36 lines changed) to reflect the new layout while preserving visual presentation |
| `lost-and-found/www-refactor/` | Gitignored home for `MISSIONS/`, `site/`, `staging/`, `tools/` — directories relocated out of the shipped `www/` tree |
| `.gitignore` | 10-line update adding `lost-and-found/` and reorganizing legacy entries to match the post-refactor tree |
| `711960791` | The atomic refactor commit — 448 files moved in a single coherent diff |

## Engine Position

v1.49.38 is the structural refactor release in the v1.49.x content-release line. It sits between v1.49.37 (Thermal & Hydrogen Energy Systems, the last major content release before the refactor) and v1.49.39 (Release Pipeline & Tooling Hardening, the first release to operate under the new domain-rooted layout). In the broader shape of v1.49.x, it plays the role that v1.49.5 (Project Filesystem Reorganization) played earlier: a deliberate pause from new surface to reshape existing structure so the next fifty releases slot into a clean home. The architectural footprint is large (448 files) but the behavioral footprint is zero — the shipped site renders identically under the new prefix. Looking forward, every subsequent release in the v1.49.x line inherits three durable affordances: the multi-domain docroot pattern (any domain can co-host without negotiation), the gitignored `lost-and-found/` convention (speculative content has a home outside the shipped tree), and the build-check hook that holds both conventions in place. v1.49.38 is the release that taught the project to distinguish between "stuff inside `www/`" and "stuff that actually ships as the website," and that distinction is now structural rather than conventional.

## Cumulative Statistics

| Metric | Value |
|--------|-------|
| Commits (v1.49.37..v1.49.38) | 2 (content `711960791` + merge `d35a29821`) |
| Files changed | 448 |
| Lines inserted / deleted | 121 / 78 |
| Pure renames (no content change) | ≈ 446 |
| New files | 1 (`.claude/hooks/build-check.sh`) |
| Materially modified files | ≈ 3 (`.gitignore`, `data/chipset/unison-translation.yaml`, `docs/FEATURES.md`, `www/tibsfox/com/index.html`) |
| Research modules relocated | 16 (PNW Research Series, en bloc) |
| Standalone project pages relocated | 3 (ART, UNI, REL) |
| Directories moved to `lost-and-found/` | 4 (MISSIONS, site, staging, tools) |
| New hooks | 1 (`.claude/hooks/build-check.sh`, 48 lines) |
| Behavior changes to generated site | 0 |
| Domains now supportable | N (any count — dots-as-directories pattern composes freely) |
| Domains currently populated | 1 (`tibsfox/com`) |
| Release-note files retroactively rewritten | 0 (historical record preserved) |

## Files

- `www/tibsfox/com/Research/` — new home of the 16-module PNW Research Series (ECO, AVI, MAM, BPS, TIBS, BRC, RDF, THE, and series siblings) moved from `www/PNW/`
- `www/tibsfox/com/` — domain root now containing `ART/`, `UNI/`, `REL/` (standalone project pages), `index.html` (hub), `brand.css` (shared stylesheet), `images/` (shared assets)
- `www/tibsfox/com/index.html` — 36 lines changed; hub page updated to reflect the new layout while rendering identically
- `data/chipset/unison-translation.yaml` — 16 lines changed; chipset reference table brought into sync with the new paths
- `docs/FEATURES.md` — 8 lines changed; feature catalog updated so documented site surface points at domain-rooted paths
- `.claude/hooks/build-check.sh` — 48 new lines; build-check hook shipped in the same commit as the refactor to hold the new layout in place
- `.gitignore` — 10 lines changed; `lost-and-found/` added and legacy entries reorganized
- `lost-and-found/www-refactor/MISSIONS/` — relocated mission-pack stubs, gitignored so they do not pollute a fresh `www/` checkout
- `lost-and-found/www-refactor/site/` — relocated site-generator experiments, gitignored
- `lost-and-found/www-refactor/staging/` — relocated staging area, gitignored
- `lost-and-found/www-refactor/tools/` — relocated build-adjacent tooling, gitignored
- `docs/release-notes/v1.49.38/chapter/00-summary.md` — parsed summary chapter for the release (kept in place for DB-driven navigation even though the uplift replaces its narrative role)
- `docs/release-notes/v1.49.38/chapter/99-context.md` — parsed context chapter for the release

Aggregate: 448 files changed, +121 insertions, −78 deletions across 2 commits (content `711960791` + merge `d35a29821`), v1.49.37..v1.49.38 window. Overwhelmingly git renames; the meaningful material change is one new hook, three small cross-reference updates, and one hub-page refresh.

---

**Prev:** [v1.49.37](../v1.49.37/) · **Next:** [v1.49.39](../v1.49.39/)
