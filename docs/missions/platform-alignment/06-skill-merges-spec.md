# Skill Merges (×3) — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Opus (merges) + Haiku (deletion) + Sonnet (manifest + equivalence tests)
**Dependencies:** Wave 0.1 (`src/skill/frontmatter-types.ts`), Wave 0.4 (activation-equivalence test harness)
**Target Skills:**
- **Create:** `.claude/skills/commit-style/`, `.claude/skills/gsd-guide/`, `.claude/skills/team-control/`
- **Delete:** `.claude/skills/beautiful-commits/`, `.claude/skills/git-commit/`, `.claude/skills/gsd-onboard/`, `.claude/skills/gsd-explain/`, `.claude/skills/uc-lab/`, `.claude/skills/sc-dev-team/`

**Priority:** P2

---

## Problem

OOPS doc 07 §3.2 identified four activation conflict pairs where two skills match the same user intent. Three of them are semantically identical and should be merged; the fourth (`file-operation-patterns` / `other-patterns`) is kept separate because the content diverges meaningfully. The three merge targets account for ~80% content duplication each, wasting ~1,422 tokens on redundant loads and — worse — causing the activation system to double-fire on the same trigger.

OOPS doc 07 §7.1-7.3 specifies each merge and its projected savings:

| Merge | Sources | New skill | Savings |
|-------|---------|-----------|---------|
| A | `beautiful-commits` + `git-commit` | `commit-style` | ~479 tokens, eliminates "commit" trigger conflict |
| B | `gsd-onboard` + `gsd-explain` | `gsd-guide` | ~479 tokens, eliminates GSD-help trigger confusion |
| C | `uc-lab` + `sc-dev-team` | `team-control` (parameterized UC/Dev mode) | ~464 tokens, prevents divergence |

## Current State

Each source skill is a standalone directory with `SKILL.md` (and possibly a reference file or two). The activation system loads **both** skills when the user types something that matches either description — producing duplicated context and making it ambiguous which skill "won" the activation.

Current per-pair structure (OOPS doc 07 §7.1-7.3):

- `beautiful-commits/SKILL.md` — 51 lines, 208 words. Sections: Format, Types Table, Anti-patterns, Message Structure.
- `git-commit/SKILL.md` — 106 lines, 411 words. Sections: Format, Types Table, Angular Convention, Examples, Scope Rules, Anti-patterns.
- `uc-lab/SKILL.md` — 81 lines, 423 words. Sections: Agents, Autonomy, Context, Quality Rubric, Pipeline. Branch-bound to v1.50.
- `sc-dev-team/SKILL.md` — 72 lines, 386 words. Sections: Agents, Autonomy, Context, Integration, Pipeline. Branch-bound to dev.
- `gsd-onboard/SKILL.md` — 52 lines, 205 words. Compact command reference.
- `gsd-explain/SKILL.md` — 274 lines, 1,214 words. Detailed explainer.

## Solution

Three independent merges. Each produces a new merged skill with a **union** of activation triggers and a **deduplicated** body. Source skills are deleted after the new skill passes activation-equivalence tests.

### 2C.1: `commit-style` (merge A)

Combine `beautiful-commits` + `git-commit`:

```
commit-style/SKILL.md (~70 lines, ~300 words)
  Sections: Format · Types Table · Scope Rules · Examples · Anti-patterns
```

Remove: duplicate Format rules, duplicate Types Table, the "Angular Convention" section that just re-describes the Format section under a different name. Keep one canonical version of each.

**Activation trigger union:** every keyword in either source description must appear in the merged description. The description field carries the activation-relevant vocabulary.

### 2C.2: `gsd-guide` (merge B)

Combine `gsd-onboard` + `gsd-explain`:

```
gsd-guide/SKILL.md (~280 lines, ~1,100 words)
  Section 1: Quick Reference  (from gsd-onboard, ~50 lines)
  Section 2: Detailed Explanations  (from gsd-explain, ~230 lines)
```

Remove: duplicated command lists, overlapping "what does this do" prose. Keep Quick Reference as the first section so the first 50 lines carry the most frequently-needed content (command table, basic workflow).

### 2C.3: `team-control` (merge C)

Combine `uc-lab` + `sc-dev-team` into a parameterized skill with a mode switch:

```
team-control/SKILL.md (~100 lines, ~500 words)
  Sections: Agents · Autonomy · Context · Pipeline
  Subsections:
    UC Mode  — branch=v1.50, quality rubric, observatory integration
    Dev Mode — branch=dev, integration with main
```

The mode is detected from the active branch (or an explicit front-matter hint). Both modes share 90% of the structure; only branch-specific and rubric-specific content differs.

**Critical:** `uc-lab` carries a quality rubric that `sc-dev-team` does not have. The rubric must move into the `UC Mode` subsection verbatim. Dropping it would degrade observatory quality gates.

### Shared frontmatter (consumed from Wave 0.1)

Every new skill adopts the full schema from `00-milestone-spec.md` §Cross-Component Interfaces:

```yaml
---
name: commit-style | gsd-guide | team-control
description: <union of source descriptions, trigger keywords preserved>
format: 2025-10-02
version: 1.0.0                # new skill, reset to 1.0.0
status: active
updated: 2026-04-15
---
```

Version resets to `1.0.0` because OOPS doc 07 §8.4 classifies "merge with another skill" as a major-version event — the merged skill is a new identity, not a continuation of either source.

### Deletion

After each new skill passes its activation-equivalence test, delete the source skill directory via `rm -rf .claude/skills/<source>/`. This is a Haiku task in 2C.4 — pure mechanical removal, no judgment.

### Manifest update

`project-claude/manifest.json` (if it enumerates skills) must be updated to remove the 6 sources and add the 3 merged skills. Also update the install script `project-claude/install.cjs` if it references source names directly.

## Acceptance Criteria

1. `commit-style/SKILL.md` exists with merged content (T-MERGE-CS-01).
2. All trigger keywords from `beautiful-commits` AND `git-commit` appear in `commit-style` description (T-MERGE-CS-02, T-MERGE-CS-03).
3. `beautiful-commits/` and `git-commit/` directories are deleted (T-MERGE-CS-04).
4. `gsd-guide/SKILL.md` exists with Quick Reference as Section 1 and Detailed Explanations as Section 2 (T-MERGE-GG-01).
5. All triggers from `gsd-onboard` AND `gsd-explain` preserved in `gsd-guide` description (T-MERGE-GG-02, T-MERGE-GG-03).
6. `gsd-onboard/` and `gsd-explain/` directories are deleted (T-MERGE-GG-04).
7. `team-control/SKILL.md` exists with UC Mode + Dev Mode subsections (T-MERGE-TC-01).
8. All triggers from `uc-lab` AND `sc-dev-team` preserved in `team-control` description (T-MERGE-TC-02, T-MERGE-TC-03).
9. `uc-lab/`, `sc-dev-team/` directories deleted and `project-claude/manifest.json` updated (T-MERGE-TC-04).
10. `uc-lab` quality rubric is preserved **verbatim** in `team-control` UC Mode subsection.
11. Activation-equivalence test (Wave 0.4 harness) passes for all three merges — for each merge, every sample prompt in `src/skill/__tests__/fixtures/activation-prompts.json` that matched a source skill still matches the merged skill.
12. Zero regression against baseline suite.

## Technical Notes

- **Triggers live in the `description` field.** Merging descriptions is the highest-risk step: drop a keyword and activation coverage silently regresses. The activation-equivalence harness is designed to catch this, but Opus should be deliberate — read both source descriptions, underline every content word, ensure every underlined word appears in the merged description.
- **250-char description limit** may be tight on the `commit-style` merge (both sources have long descriptions). If the union exceeds 250, move the longer examples into the body and keep the description focused on the trigger vocabulary.
- **Branch-conditional mode detection for `team-control`** is behavior, not content — handled by the activation layer, not the SKILL.md. For now the spec is to document both modes in one SKILL.md and let the agent read whichever is relevant; smart mode-switching is a follow-up.
- **Reference file migration:** if any source skill has `references/*.md`, those files move to the merged skill's directory. Check each source for references before deleting.
- **`gsd-explain` is 1,214 words** — the merged `gsd-guide` will be ~1,100 words, above the 800-word Gastown-split ceiling. This is acceptable because `gsd-guide` is not a Gastown skill and does not activate on every session. The word budget for this merge is explicitly uncapped.
- Wave 0.1 must produce the frontmatter types file **before** this track starts. Track 2C is blocked on Wave 0.
- Running the activation-equivalence harness is 2C.5, after all three merges are written but before manifest update — a single smoke run covering all three at once.

---

*Component spec for Platform Alignment milestone, track 2C. Source: OOPS doc 07 §7.1-7.3 at commit `254b50553`. Opus is assigned for the merges because the content-deduplication decisions require judgment that preserves trigger coverage — this is the other genuinely-hard decision in the mission.*
