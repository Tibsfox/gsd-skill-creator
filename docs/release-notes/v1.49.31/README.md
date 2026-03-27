# v1.49.31 — Animal Speak, Sacred Landscapes & Process Hardening (Grandmother Cedar — Foxy Edition)

**Shipped:** 2026-03-09
**Commits:** 2
**Files:** 21 changed | **Insertions:** 4,290 | **Deletions:** 31
**Source:** TIBS mission pack + v1.49.29 Wave 2 process hardening completion

## Summary

Two threads woven into one release: the TIBS research study — a 5-module scholarly examination of Ted Andrews' *Animal Speak*, Pacific Northwest Indigenous shamanic traditions, and the epistemological distance between them — and the final process hardening deliverables from the v1.49.29 retrospective synthesis (wave commit markers, LOC tracking, speculative infrastructure inventory, TypeScript API doc generation).

The TIBS study treats its subject with the care it demands: five nations individually documented (Coast Salish, Lower Chinook, Tlingit, Haida, Tsimshian), colonial suppression history sourced to peer-reviewed scholarship, ceremonial knowledge described at the category level without instructional detail, and zero GPS coordinates for sacred sites. The appropriation question is presented through three scholarly positions without advocacy.

## Key Features

### 1. TIBS — Animal Speak, Sacred Landscapes, and the Living World (15 files, 4,103 lines, 548 KB)

A research study at the intersection of New Age popular literature and Indigenous knowledge systems, examining Ted Andrews' work alongside the Pacific Northwest shamanic traditions it draws from.

**5 research modules:**

| Module | Code | Lines | Domain |
|--------|------|-------|--------|
| Shared Schema | SCH | 186 | Tribal glossary, source index, document conventions |
| Andrews Biography | BIO | 366 | 8 life checkpoints, 6 core frameworks, intellectual genealogy |
| Andrews Bibliography | BIB | 483 | 41 titles, 7 series clusters, 6 priority annotations |
| Tribal Traditions | TRB | 359 | 5-nation survey, guardian spirit ceremonialism, colonial suppression, revival |
| Critical Context | CRT | 362 | New Age context, 3 scholarly positions, appropriation migration path |
| Synthesis | SYN | 241 | 5 epistemological differences, 4 resonances, 3-profile reading guide |

**Key findings:**
- **Appropriation migration path:** Coast Salish guardian spirit tradition -> Harner's *Way of the Shaman* (1980) -> Andrews' *Animal Speak* (1993) -> broader neo-shamanic literature
- **5 epistemological differences:** Source of authority, relationship to place, transmission and ownership, role of the body, relationship to time
- **4 genuine resonances:** Primacy of attention, guardian spirit relationship, healer's vocation, animals as persons
- **3-profile reading guide:** Spiritual Seeker, Scholar, Indigenous Knowledge Seeker — each with annotated recommendations and cautions

**Safety-critical (6/6 PASS):**
- SC-SRC: All 34 sources traceable to academic/institutional publishers
- SC-NUM: Every numerical claim attributed to a named source
- SC-IND: Every Indigenous knowledge reference names a specific nation
- SC-ADV: No policy advocacy — three scholarly positions presented without endorsement
- SC-CER: No ceremonial instruction — functions described, not procedures
- SC-LOC: Zero GPS coordinates or navigational information for sacred sites

**30/30 tests PASS, 12/12 success criteria PASS.**

**Browsable catalog:** `www/PNW/TIBS/index.html` — earth/cedar theme, page.html pattern, series.js navigation. PNW series now 11 projects.

### 2. Process Hardening Completion (v1.49.29 Wave 2)

Final deliverables from the retrospective-driven process hardening initiative:

- **Wave commit marker hook** — both `validate-commit.sh` files validate `Wave N: description` format when present. Warning mode (logs, doesn't block). Normal commits unaffected.
- **LOC-per-release tracking** — STATE.md table with v1.49.22-29 data, 15K LOC flag threshold for large releases.
- **Speculative infrastructure inventory** — `infra/SPECULATIVE-INVENTORY.md` catalogs 28 design-ahead files across 7 categories (VM backends, platform abstractions, PXE templates, world specs, runbooks, knowledge packs, monitoring).
- **TypeScript API doc generation** — `typedoc.json` configured for `src/`, `docs:api` npm script, `docs/api/` gitignored. Verified: produces output with 0 errors.

## Retrospective

### What Worked
- **Treating the subject with scholarly discipline.** The TIBS study could have been a book review. Instead it's a 5-module comparative epistemology with 34 sources, 5 nations individually treated, and an appropriation analysis that presents multiple positions. The result is useful to all three reader profiles.
- **Safety-critical tests as the editorial standard.** Six safety gates — no unsourced claims, no generic Indigenous descriptors, no ceremonial instruction, no sacred site locations, no policy advocacy, every number attributed. These aren't optional quality checks; they're the editorial standard that makes the research publishable.
- **Session handoff for process work.** The Wave 2 process hardening was picked up from a HANDOFF.md in a new session and completed without rework. The handoff document paid for itself.
- **Two threads, one release.** Research and process hardening are different kinds of work but they're both ready at the same time. Shipping them together is honest — it's what happened.

### What Could Be Better
- **No v1.49.30 release notes in-repo before release.** The FFA release went to GitHub before its release notes were written. The v1.49.29 checklist enforcement caught this gap for v1.49.29 but didn't prevent it for v1.49.30.
- **Wave commit marker hook can't validate heredoc commits.** The message extraction parses `-m` flag content which doesn't preserve newlines from heredoc patterns. Warning mode is appropriate until extraction improves.

## Lessons Learned

1. **Comparative epistemology reveals structure.** Listing "5 differences and 4 resonances" between Indigenous and New Age knowledge systems is more useful than either celebration or critique. The structure itself is the finding.
2. **Reader profiles are a gift.** A 3-profile reading guide ("if you're a spiritual seeker, start here; if you're a scholar, start here") respects the reader's time and intent. It's the bibliography equivalent of Radical Inclusion.
3. **Process hardening compounds silently.** Wave markers, LOC tracking, speculative infra inventory, typedoc — none of these are exciting. All of them prevent future problems. The best process work is invisible when it's working.
4. **Release notes are the project's memory.** Updating v1.49.29's GitHub release body with full Wave 2 coverage ensures the teaching trail is complete. The release notes are not just a changelog — they're the story of how the project thinks about itself.
