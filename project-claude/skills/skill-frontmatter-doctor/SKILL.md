---
name: skill-frontmatter-doctor
description: Use when authoring or reviewing a SKILL.md or agent .md and you need to detect and fix the four most common frontmatter defects — echoed or truncated triggers, tools written as a YAML array instead of a comma-separated string, a description outside the 1-1024 character bound, and a missing "Use when..." clause.
description-frequency: on-demand
user-invocable: true
version: 1.0.0
format: 2025-10-02
triggers:
  - "authoring or reviewing a SKILL.md or agent .md for frontmatter defects"
  - "fix malformed skill frontmatter, triggers, tools array, or description length"
updated: 2026-07-06
status: ACTIVE
---

# Skill Frontmatter Doctor

Detect and fix the four highest-frequency defects in skill and agent
frontmatter. This is the corpus-wide #1 defect class, and there is no
deterministic guard for it — so treat this checklist as the guard.

Run the advisory linter first to get a candidate list:

```bash
node tools/skill-frontmatter-doctor.mjs
```

It scans `.claude/skills/**/SKILL.md`, `.claude/agents/*.md`,
`project-claude/skills/**/SKILL.md` and `project-claude/agents/*.md`,
prints a report, and always exits 0 (advisory, not a gate). Use its
output to target the fixes below, then verify by re-reading the file.

## The four defect classes

### 1. Echoed or truncated triggers

A `triggers:` entry must be a distinct, usable keyword or phrase a user
would actually type — not a copy of the description and not a fragment
that was cut mid-thought.

Recognize a bad trigger when it:

- **Echoes the description** — the trigger string is a substring of the
  `description` (or vice versa). A trigger that just repeats the
  description adds no routing signal.
- **Ends mid-word** — the last token is a partial word (a truncation
  artifact, e.g. `"...author a new cartri"`).
- **Ends at a conjunction or preposition** — trails off on
  `and`, `or`, `but`, `with`, `for`, `to`, `of`, `the`, `a`, `an`
  (e.g. `"scaffold a department and"`).
- **Ends at an open parenthesis** — an unbalanced `(` signals a clipped
  phrase (e.g. `"build a content cartridge ("`).

Fix: replace with short, self-contained phrases the user would say.
Prefer several concrete invocations over one long echo of the
description. Example:

```yaml
# BAD — echoes the description, one entry, trails off
triggers:
  - "Use when the user asks to author or scaffold a skill and"

# GOOD — distinct, concrete, complete
triggers:
  - "fix malformed skill frontmatter"
  - "lint skill or agent triggers"
  - "check description length"
```

### 2. `tools:` as a YAML array (the #1 mistake)

Per `docs/OFFICIAL-FORMAT.md`, the `tools` field MUST be a
**comma-separated string**, not a YAML sequence. A YAML array silently
fails to parse as an allow-list.

```yaml
# BAD — YAML array (will not work)
tools: ["Read", "Write", "Bash"]

# BAD — YAML block sequence (same problem)
tools:
  - Read
  - Write
  - Bash

# GOOD — comma-separated string
tools: Read, Write, Bash
```

Fix: collapse the array/sequence to a single-line string of tool names
separated by `, `. Omit the field entirely to inherit all tools.

### 3. Description outside 1-1024 characters

The `description` must be a non-empty string of **1 to 1024 characters**
inclusive. Too short gives the router nothing to match; over 1024 is
rejected.

Fix:

- **Empty / missing** → write one sentence that names the trigger
  situation and the outcome.
- **Over 1024** → cut to the essential "when + what". Move detail into
  the skill body, not the frontmatter.

### 4. Missing a "Use when..." clause

A good description tells the router *when* to activate, not just what the
skill is. It should contain an explicit activation clause — canonically
starting with **"Use when..."** (or an equivalent "Use this skill
when...", "Activates when...").

```yaml
# BAD — describes the thing, never says when
description: A helper for skill frontmatter.

# GOOD — leads with the activation condition
description: Use when authoring or reviewing a SKILL.md or agent .md and you need to fix the four common frontmatter defects.
```

Fix: prepend a "Use when <situation>" clause describing the concrete
condition that should activate the skill.

## Fix loop

1. Run `node tools/skill-frontmatter-doctor.mjs` and read the report.
2. For each flagged file, open it and apply the matching fix above.
3. Re-read the frontmatter to confirm the change landed and the YAML is
   still valid.
4. Re-run the linter to confirm the finding is gone.

## Self-check

This skill's own frontmatter is a worked example of the target state:
the `description` opens with "Use when...", stays within 1-1024
characters, and the `triggers:` entries are distinct, complete phrases
that are not substrings of the description. Keep it that way when
editing.
