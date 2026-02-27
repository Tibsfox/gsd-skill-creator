# v1.41 Lessons Learned — Claude Code Integration Reliability

## LLIS-41-01: CLAUDE.md Size Matters

**Category:** Architecture
**Impact:** High

Anthropic's system-reminder wrapper tells Claude that CLAUDE.md content "may or may not be relevant." At 417 lines, Claude rationally skips most of it. The fix isn't louder instructions — it's smaller, universally-relevant content backed by contextual skills.

**Recommendation:** Keep CLAUDE.md under 80 lines. Move behavioral instructions to skills and hooks.

## LLIS-41-02: Right Mechanism for Each Concern

**Category:** Architecture
**Impact:** Critical

Not all project configuration belongs in the same file. Static context → CLAUDE.md. Contextual behavior → skills. Deterministic enforcement → hooks. Scoped expertise → subagents.

**Recommendation:** Before adding to CLAUDE.md, ask: "Is this relevant to EVERY task?" If no, it belongs in a skill or hook.

## LLIS-41-03: Skill Description Aggressiveness

**Category:** Integration
**Impact:** Medium

Anthropic's guidance recommends skill descriptions be "a little bit pushy." Initial conservative descriptions resulted in under-triggering. Listing specific user phrases ("what should I work on", "where did I leave off") dramatically improved activation rates.

**Recommendation:** Include representative user phrases in skill descriptions, not just abstract capability descriptions.
