# Lessons — v1.49.38

15 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Structural refactors are paid-down debt, not lost velocity.**
   Pausing one release to reshape the tree pays back every subsequent release that slots into a predictable home. The immediate cost is one release that ships no new surface; the long-term benefit is fifty releases that don't step on each other's paths.
   _⚙ Status: `investigate` · lesson #3324_

2. **Ship the check with the thing the check holds up.**
   The build-check hook landed in the same commit as the directory move. This is the general principle: when a refactor creates a structural invariant, ship the enforcement of that invariant in the same commit. The hook and the layout are born together and age together.
   _⚙ Status: `investigate` · lesson #3325_

3. **Atomic commits are how you survive bisect through a refactor.**
   448 files in one commit is not a code smell when 446 of them are renames and the remaining two are the build-check hook and the internal-link walk. The alternative — spreading the refactor across per-pack PRs — would have left many intermediate states where the site did not render correctly. Atomicity is the tool that keeps bisect meaningful.
   _⚙ Status: `investigate` · lesson #3326_

4. **Domain-as-directory is a portable primitive.**
   Using dots-as-directories (`tibsfox.com` → `tibsfox/com/`) makes the docroot trivially extensible to any additional domain without negotiation. The primitive is not clever; it is the simplest thing that composes. The Amiga principle applied to filesystems: solve the problem with the simplest tool that compiles in one's head.
   _⚙ Status: `investigate` · lesson #3327_

5. **Release notes are the project's memory, not the project's current state.**
   Older release notes should describe paths and behavior as they existed when each release shipped. Retroactively editing them to match the current tree rewrites history. The right pattern is to leave them alone and explain the refactor once, in the release that did the refactor.
   _⚙ Status: `investigate` · lesson #3328_

6. **Container directories are a smell when they mean nothing.**
   `ART/`, `UNI/`, `REL/` did not need a `Projects/` or `Site/` wrapper — each is a standalone project, and wrapping them in a named container would have invented a namespace that carries no meaning. Flat at the domain root is honest; hierarchical for hierarchy's sake is dishonest.
   _⚙ Status: `investigate` · lesson #3329_

7. **Speculative content belongs in `lost-and-found/`, not in the shipped tree.**
   `MISSIONS/`, `site/`, `staging/`, and `tools/` were design-ahead and tooling-adjacent, not public site surface. Moving them to `lost-and-found/` (gitignored) is the explicit acknowledgement that they do not belong in a clean `www/` checkout. Future content that is speculative or tooling-adjacent follows the same convention.
   _⚙ Status: `investigate` · lesson #3330_

8. **Refactors that reshape a tree must walk the cross-references in-commit.**
   Updating `data/chipset/unison-translation.yaml`, `docs/FEATURES.md`, and the `series.js` navigation in the same commit as the directory move means there is never a state where the declared references point at paths that do not exist. Deferring cross-reference updates to a follow-up commit is the classic way a refactor lands partially and then rots.
   _⚙ Status: `investigate` · lesson #3331_

9. **The label on a release must match the work shipped, not the next cycle's work.**
   The parse-confidence-0.10 stub called v1.49.38 "License Change (BSL 1.1)" because the BSL commits were adjacent in the log. The actual v1.49.37..v1.49.38 content is the www refactor; the BSL license change landed in a later release window. An uplift's job includes correcting the label when the original parser guessed wrong.
   _⚙ Status: `investigate` · lesson #3332_

10. **Generic structures compound when they are shaped for downstream reuse.**
   The multi-domain docroot is general-purpose: downstream consumers get the capability for free, even though this release only populates one domain. Structures designed for downstream reuse pay back slowly and broadly — every additional domain that ships in the tree would have been harder to add without the refactor.
   _⚙ Status: `investigate` · lesson #3333_

11. **448 files in one commit is hard to review.**
   Even when 446 of them are pure renames, a reviewer who wants to audit the link walk has to spot-check broadly rather than reading every line. A pre-commit summary document ("here is what moved, here are the link-walk touchpoints, here is the build-check hook test plan") would have made the refactor easier to review without compromising atomicity.
   _⚙ Status: `investigate` · lesson #3334_

12. **The release-notes stub was not deleted or updated.**
   The `docs/release-notes/v1.49.38/chapter/00-summary.md` file that said "License Change (BSL 1.1)" at parse confidence 0.10 was left in place. The right-shaped fix at release time would have been either to delete the stub or to write the real README. v1.49.38 shipped without either; this uplift is the correction.
   _⚙ Status: `investigate` · lesson #3335_

13. **No forward-compat symlinks or redirects were left at the old prefixes.**
   Developers who cloned the repo mid-refactor or who had bookmarked paths under `www/PNW/` get a 404 from the dev tree. A set of thin HTML redirects or a CI rule that warns on old-prefix references in-flight PRs would have softened the transition. In this project's case the downstream impact was minimal, but in a higher-traffic repo the same refactor would have needed a deprecation window.
   _⚙ Status: `investigate` · lesson #3336_

14. **The build-check hook does not yet validate cross-file heading anchors.**
   `build-check.sh` validates that referenced paths exist; it does not validate that in-document anchor links (`#section-heading`) still resolve after headings get renamed. Anchor validation is the natural next iteration of the hook.
   _⚙ Status: `investigate` · lesson #3337_

15. **Historical release notes retained the old paths, which can confuse first-time readers.**
   A reader arriving via v1.49.22's release notes will find `www/PNW/BPS/` references and then need to know about the v1.49.38 refactor to locate the files. A single sentence at the top of each historical note — "Paths below describe the tree at release time; see v1.49.38 for the subsequent domain-rooted refactor." — would resolve this at low cost. This is deferred work, not an objection to preservation itself.
   _⚙ Status: `investigate` · lesson #3338_
