# Gastown Skill Splits (×3) — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Sonnet
**Dependencies:** None (but run before Wave 2D.2 backfill so new reference files get version frontmatter in one pass)
**Target Skills:**
- `.claude/skills/sling-dispatch/`
- `.claude/skills/done-retirement/`
- `.claude/skills/gupp-propulsion/`

**Priority:** P1

---

## Problem

The three heaviest Gastown skills load their entire implementation detail (TypeScript code, error handling, per-runtime strategies, observability metrics) into context on every activation. OOPS doc 07 §4 measured the impact: a "Gastown multi-agent dispatch" scenario loads ~7% of the 200K context window just on these three skills. Most of that content is implementation reference, not activation guidance — the agent rarely needs the full TypeScript skeleton to decide whether to use the skill.

Current word counts and projected splits (OOPS doc 07 §7.4-7.6):

| Skill | Current SKILL.md | Target SKILL.md | Moved to references |
|-------|------------------|-----------------|---------------------|
| `sling-dispatch` | 2,305 words (494 lines) | ~600 words | 1,705 words → `references/pipeline-implementation.md` |
| `done-retirement` | 2,267 words (377 lines) | ~550 words | 1,717 words → `references/retirement-implementation.md` |
| `gupp-propulsion` | 1,961 words (263 lines) | ~500 words | 700 + 761 words → `references/runtime-strategies.md` + `references/metrics-and-learning.md` |

Total savings from default load path: **~8,748 tokens** (~7,326 from the splits alone; OOPS doc 07 §7.7 projects 21% reduction in default-load token cost).

## Current State

Each of the three skills is a single SKILL.md mixing overview, activation guidance, and full implementation prose. References directories may or may not exist; where they do, they contain gastown-origin docs, not implementation reference.

```
.claude/skills/sling-dispatch/
├── SKILL.md (494 lines)
└── references/ (if present, contains gastown-origin.md only)
```

## Solution

For each of the three skills, perform the same mechanical refactor:

1. **Read the current SKILL.md** and identify content by role:
   - **Keep in SKILL.md:** skill name, description, activation triggers, pipeline overview, stage descriptions (prose only, no code), integration table, activation context
   - **Move to references:** full TypeScript implementations, error handling code, batch-mode code, formula expansion, cleanup sequences, per-runtime strategies, observability metrics

2. **Write reference files** into `.claude/skills/<skill>/references/<name>.md` per the targets above. Preserve every word — this is a move, not a rewrite.

3. **Update SKILL.md** to reference the new files at the bottom:

   ```markdown
   ## References

   Implementation detail moved to:
   - [`references/pipeline-implementation.md`](references/pipeline-implementation.md) — full TS code + error handling
   ```

4. **Word-count gate:** each resulting SKILL.md must be ≤800 words (target ~500-600). If over, move more prose into the reference file.

### Per-skill breakdown

#### 2B.1: `sling-dispatch`

**SKILL.md keeps:** pipeline overview, 7-stage descriptions (prose only), integration table, activation context. Target: ~600 words (~120 lines).

**`references/pipeline-implementation.md` receives:** full TypeScript implementations, error handling code, batch mode code, formula expansion code. Target: ~1,705 words (~374 lines).

#### 2B.2: `done-retirement`

**SKILL.md keeps:** pipeline overview, 7-stage descriptions (prose only), **irreversibility rules** (must stay in SKILL.md — this is a safety property, not implementation detail), integration table. Target: ~550 words (~100 lines).

**`references/retirement-implementation.md` receives:** full TypeScript implementations, cleanup sequences. Target: ~1,717 words (~277 lines).

#### 2B.3: `gupp-propulsion`

**SKILL.md keeps:** core GUPP principle, enforcement rules, safety boundaries. Target: ~500 words (~80 lines).

**`references/runtime-strategies.md` receives:** per-runtime strategy details for Claude Code, Codex, Gemini, Cursor. Target: ~700 words (~100 lines).

**`references/metrics-and-learning.md` receives:** observable metrics, learning feedback loop description. Target: ~761 words (~83 lines).

Two reference files, not one — the runtime strategies and the metrics/learning loop are logically distinct concerns; keeping them separate lets consumers load only the part they need.

## Acceptance Criteria

1. Each of the three SKILL.md files is ≤800 words post-split (T-SPLIT-SL-01, T-SPLIT-DR-01, T-SPLIT-GP-01).
2. Activation equivalence: for each skill, every trigger keyword in the pre-split description still appears in the post-split description. Tests T-SPLIT-SL-02, T-SPLIT-DR-02, T-SPLIT-GP-02 run a fixed-corpus activation probe against pre- and post-split versions.
3. Each reference file exists at the specified path and contains the prose removed from SKILL.md, **verbatim** where possible (T-SPLIT-SL-03, T-SPLIT-DR-03, T-SPLIT-GP-03).
4. No content is **lost** — sum of post-split SKILL.md words + reference file words ≥ pre-split SKILL.md words. Trivial boilerplate reduction (e.g., removing duplicated headings) is allowed; narrative deletion is not.
5. `done-retirement` irreversibility rules remain in SKILL.md (must still fire at activation time, not on-demand).
6. `gupp-propulsion` safety boundaries remain in SKILL.md (same reason).
7. `project-claude/manifest.json` (if it tracks reference file counts) is updated to reflect the new reference files.
8. Integration test T-INT-04: the "Gastown multi-agent dispatch" scenario loads <5% of 200K context (down from 7%).
9. Zero regression against baseline suite.

## Technical Notes

- This is a **content move**, not a **content rewrite**. Sonnet is the right model — the judgment required is "is this sentence overview or implementation detail," not "how should I rewrite this."
- Word counts: use `wc -w` or `node -e 'const t=require("fs").readFileSync("SKILL.md","utf8"); console.log(t.split(/\s+/).filter(Boolean).length)'`. Frontmatter YAML counts — strip it before measuring if you want body-only, but the 800-word target is inclusive of frontmatter (frontmatter is trivial, <30 words).
- The skill activation system reads `description:` in frontmatter to match triggers. **Do not edit the description.** Moving body prose does not affect activation — the activation probe tests this explicitly.
- Reference files are loaded on-demand. The skill loader follows markdown links, so `[text](references/name.md)` in SKILL.md is the correct wire format (not absolute paths).
- The `.claude/skills/<skill>/references/` directory may already exist with `gastown-origin.md` inside. Do not delete or move existing reference files — only add new ones.
- Preserve code blocks with their original language hints (` ```typescript `, etc.) when moving them to the reference file.
- 2D.2 version backfill runs **after** this split, so the new reference files will not yet have frontmatter when 2D.2 begins. Backfill should walk `references/*.md` as well as `SKILL.md`, OR reference files can be declared out-of-scope for version backfill (they're not skills themselves). Recommend the latter: reference files inherit their parent skill's version implicitly.

---

*Component spec for Platform Alignment milestone, track 2B. Source: OOPS doc 07 §7.4-7.6 at commit `254b50553`. The three splits account for ~84% of the projected token savings from the full OOPS skill-system optimization.*
