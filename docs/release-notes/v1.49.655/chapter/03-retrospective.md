# 03 — Retrospective: v1.49.655

## What went well

1. **The 16-page parallel-W2 dispatch pattern worked at scale.** Memory note "Sub-agent token ceiling + iterative dispatch" warned about 60-70 tool-use ceilings; in practice every dispatch landed in 5-15 tool uses (well under ceiling) with ~30-60 min wall-clock per page. The bound-to-1-component-per-dispatch discipline (Lesson #10193) held.

2. **Page-depth target matched at scale.** Average MUS page = 558 lines / 19.5 card-title sections (v1.108 reference = 552 / 19). Average ELC page = 557 lines / 20.9 sections (v1.108 reference = 598 / 20). The reference-template-plus-subject-data dispatch pattern reliably produces near-reference depth.

3. **Catalog regen was clean.** Both MUS + ELC catalogs passed the drift gate post-edit. The descending-version-order insertion at top-of-list matched the existing 1.108/1.107 layout.

4. **Two-milestone scaffold-then-fill pattern validated.** v1.49.654 infrastructure + v1.49.655 content is the codified pattern (Lesson #10265). The split kept each milestone focused; the infrastructure milestone could ship its tests + audits independently of content authoring.

5. **NASA inherited drift cleanly isolated.** Pre-tag-gate depth-audit still requires bypass for NASA 1.116 (Tracks 3+4+5+7 missing) — but MUS+ELC are now clean. The new `depth-audit-mus-elc` granular bypass introduced at v1.49.654 isn't needed this ship since MUS+ELC pass naturally.

## What went imperfectly

1. **2 of 16 page dispatches hit "API Error: socket connection closed unexpectedly" mid-flight.** MUS 1.115 (U2) + MUS 1.116 (Madonna) both failed Wave 2. Retries succeeded on first attempt with identical prompts (per Lesson #10215 — transient API errors recover via identical-prompt retry). Both retries were faster (~9 min vs ~15 min wall-clock for the originals).

2. **MUS 1.115 came in under depth target.** 483 lines vs 540-563 for siblings. Still passes ≥10 card-title threshold (19 sections), still substrate-tracked. Acceptable but on the thin end of the cohort range.

3. **MUS 1.116 came in over depth target.** 674 lines / 25 sections vs ~560 / 19 cohort norm. The "above target" agent dispatched 6 reads (vs typical 3-5) and authored more aside cards. Excess depth is acceptable but could indicate over-budget per W2 dispatch in future.

4. **One agent included a meta-statement containing the forbidden "Claude" substring.** MUS 1.116 had a line `<li>No AI-coauthor markers, no "Claude" attribution, no Co-Authored-By trailers in any output content</li>` inside an internal-methodology card. Caught by grep audit; fixed by Edit. False-positive in spirit (it was negating the policy, not asserting AI authorship) but correct to remove.

5. **www/ files are gitignored.** The 16 new pages + 2 catalog updates do not commit to git. They live on disk and get FTP-synced to tibsfox.com separately. v1.49.655's `chore(release)` commit will only contain the 5 release-notes files + version bumps. The actual content artifact lives in the working tree until FTP sync runs.

## Reproducibility

```bash
# 1. Switch to dev
cd /media/foxy/ai/GSD/dev-tools/gsd-skill-creator
git switch dev
git pull --ff-only origin dev

# 2. Verify
git log --oneline v1.49.654..v1.49.655

# 3. Verify the 16 working-tree files exist (regenerate if missing):
ls www/tibsfox/com/Research/MUS/{1.109,1.110,1.111,1.112,1.113,1.114,1.115,1.116}/index.html
ls www/tibsfox/com/Research/ELC/{1.109,1.110,1.111,1.112,1.113,1.114,1.115,1.116}/index.html

# 4. Audits clean:
node tools/update-catalog-indexes.mjs --check
node tools/depth-audit.mjs 1.116
```

## Cumulative session statistics

- **2 commits** since v1.49.654 (release notes + chore(release))
- **~600 insertions / minor deletions** across the committed diff (release notes only)
- **~9,000 lines of HTML** written to working-tree (gitignored www/)
- **18 sub-agent dispatches** (16 page authoring + 2 catalog regen)
- **2 retries** for transient API errors (MUS 1.115 + MUS 1.116)
- **5 new release-notes files** (README + 4 chapters)
- **0 commits with Co-Authored-By: Claude trailer** (v1.49.621 policy)
- **0 mission package files committed** (per memory rule)
- **0 catalog drift** at ship time
