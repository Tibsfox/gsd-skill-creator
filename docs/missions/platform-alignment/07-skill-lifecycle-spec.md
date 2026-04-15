# Skill Lifecycle + Versioning — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Sonnet (backfill script, loader, CLI) + Haiku (run backfill, review diffs)
**Dependencies:** Wave 0.1 (`src/skill/frontmatter-types.ts`), must run **after** Wave 2B (Gastown splits) and Wave 2C (skill merges)
**Target Files:**
- All 44 `.claude/skills/*/SKILL.md` files (frontmatter backfill)
- `src/skill/version-backfill.ts` (new, one-shot script)
- `src/skill/lifecycle-loader.ts` (new)
- `src/cli/commands/skill-inventory.ts` (new)

**Priority:** P2 / P3

---

## Problem

No skill declares a version (except the 6 new ones from 2026-03). No mechanism exists to track when a skill was last modified, what format version it targets, whether it is active / deprecated / retired, or whether it needs migration when the skill system evolves. Claude Code's binary references `skills-2025-10-02` as a format date and exposes a full CRUD API with versioned endpoints (`POST /v1/skills/{id}/versions`, etc.) — the platform anticipates versioned skills. Our inventory is frozen at format-zero with no declared lifecycle.

OOPS doc 07 §8 proposes a 5-stage lifecycle (`draft → active → deprecated → retired → archived`) with four version fields (`format`, `version`, `status`, `updated`). This mission implements the lifecycle + the loader behavior + a CLI inventory command that surfaces lifecycle state. The **archived** stage is out of scope — it's a follow-up when any skill actually reaches that state.

## Current State

- 6 skills declare `version` (the ones created in 2026-03).
- 0 skills declare `format`, `status`, or `updated`.
- 0 skills have a programmatic lifecycle — the loader treats every skill as unconditionally active.
- No `skill-creator skill-inventory` CLI command exists.
- Cartridge-forge (closed 2026-04-14) established version discipline for cartridges; this mission extends the same discipline to skills.

## Solution

Four deliverables, implemented in dependency order:

### 2D.1: Version backfill script — `src/skill/version-backfill.ts`

A one-shot TypeScript script that walks `.claude/skills/*/SKILL.md`, reads each file's frontmatter, and inserts missing fields without overwriting existing values:

```typescript
async function backfillSkill(skillPath: string): Promise<Diff> {
  const content = await readFile(skillPath, 'utf8');
  const { frontmatter, body } = parseFrontmatter(content);

  // Only insert; never overwrite
  frontmatter.format   ??= '2025-10-02';
  frontmatter.version  ??= '1.0.0';
  frontmatter.status   ??= 'active';
  frontmatter.updated  ??= await gitLastModifiedDate(skillPath);  // YYYY-MM-DD

  const out = serializeFrontmatter(frontmatter) + body;
  if (out === content) return { skill: skillPath, changed: false };

  await writeFile(skillPath, out);
  return { skill: skillPath, changed: true, added: diffKeys(frontmatter, prior) };
}
```

`gitLastModifiedDate()` runs `git log -1 --format='%ai' -- <path>` and takes the date portion. If the file is untracked (newly split reference files from Wave 2B), fall back to today's date.

The script emits a dry-run diff by default and a `--write` flag applies changes. Wave 2D.2 runs it with `--write` after 2B and 2C complete so the split SKILL.md files and merged skills are included in the backfill.

### 2D.3: Lifecycle loader — `src/skill/lifecycle-loader.ts`

A function that wraps the existing skill-loading path and enforces status-based behavior:

```typescript
type SkillStatus = 'active' | 'deprecated' | 'retired' | 'draft';

interface LoadedSkill {
  name: string;
  status: SkillStatus;
  warnings: string[];
  body: string;
}

function loadSkillWithLifecycle(skillPath: string): LoadedSkill | null {
  const fm = parseFrontmatter(readFileSync(skillPath, 'utf8'));
  const status: SkillStatus = fm.status ?? 'active';  // default-allow

  if (status === 'retired') return null;              // do not load at all
  if (status === 'draft')   return null;              // do not load unless explicitly enabled

  const loaded: LoadedSkill = {
    name: fm.name, status, warnings: [], body: fm.body
  };

  if (status === 'deprecated') {
    const replacement = fm.deprecated_by ? ` → ${fm.deprecated_by}` : '';
    loaded.warnings.push(`DEPRECATED skill "${fm.name}" loaded${replacement}`);
  }

  return loaded;
}
```

**Default-allow rule:** a skill with no `status` field (shouldn't happen after backfill, but possible for manually-added skills) is treated as `active`. This preserves backward compatibility with any loader paths the backfill does not cover.

Warnings are emitted to stderr, not stdout — they must not pollute the `additionalContext` the loader feeds the agent.

### 2D.4: `skill-creator skill-inventory` CLI command

New command at `src/cli/commands/skill-inventory.ts`:

```
$ skill-creator skill-inventory
Skill inventory (44 total):
  active:     44
  deprecated: 0
  retired:    0
  draft:      0

Stale skills (not updated >90 days):
  <none>

Deprecated skills with migration path:
  <none>
```

Stale threshold: 90 days since `updated`. Staleness is informational — stale skills still load (they're active), but the inventory report surfaces them so the maintainer can bump `updated`, edit the skill, or deprecate it.

### 2D.5: Lifecycle tests

Per `09-test-plan.md` §Skill Lifecycle Behavior:

- T-LC-01: `status: active` loads normally.
- T-LC-02: no `status` field defaults to active (backward compat).
- T-LC-03: `status: deprecated` loads but emits stderr warning.
- T-LC-04: `status: retired` does not load at all.
- T-LC-05: `skill-inventory` reports 44 active, 0 deprecated, 0 retired after backfill.
- T-LC-06: `skill-inventory` flags skills with `updated` >90 days as stale.
- T-LC-07: version-backfill script preserves existing frontmatter fields (no overwrites) — critical regression guard.

Each test gets a fixture under `src/skill/__tests__/fixtures/lifecycle/` with hand-crafted SKILL.md files demonstrating each status.

## Acceptance Criteria

1. `src/skill/version-backfill.ts` exists, supports `--dry-run` (default) and `--write`.
2. Running `--write` against all 44 skills adds `format: 2025-10-02`, `version: 1.0.0`, `status: active`, `updated: <git-date>` to any skill missing them — **no overwrites** of existing values (T-LC-07).
3. `updated` dates match `git log -1 --format='%ai'` output for tracked files; untracked files get today's date.
4. `src/skill/lifecycle-loader.ts` exists and implements the four status behaviors (T-LC-01..04).
5. `skill-creator skill-inventory` CLI command exists and reports lifecycle state (T-LC-05, T-LC-06).
6. Post-backfill, all 44 skills carry the 4 new fields. Manual spot-check: pick 5 random SKILL.md files and verify frontmatter.
7. Harness-integrity test from cartridge-forge continues to pass — this mission does not touch `data/chipset/` or `examples/cartridges/`.
8. The 6 already-versioned skills from 2026-03 retain their existing version numbers (not reset to 1.0.0) — T-LC-07 covers this.
9. Zero regression against baseline suite.
10. Wave 3.8 smoke: `skill-creator skill-inventory` returns a clean report with no warnings.

## Technical Notes

- **2D.1 is scheduled in Wave 0** per `00-milestone-spec.md` §Cross-Component Interfaces: the shared frontmatter schema is a Wave 0 artifact because 2C (merges) consumes it. The **script** (`version-backfill.ts`) depends on that schema but is a separate Wave 2D task.
- **Run order within Wave 2:** 2D runs **last**. The Gastown splits (2B) create new reference files and resize SKILL.md files; the skill merges (2C) create new skills and delete old ones. Running backfill after both ensures the new files are included and the deleted files are not.
- **Reference files are not skills.** The backfill walker should match `.claude/skills/*/SKILL.md` only — not `.claude/skills/*/references/*.md`. Reference files inherit their parent skill's version implicitly and do not need frontmatter.
- **YAML frontmatter parser:** use the existing `js-yaml` dep (already in package.json) or a minimal hand-rolled parser. Do **not** add a new dep — the mission is a zero-new-dep mission per the cartridge-forge precedent.
- **Diff preservation:** the backfill script must preserve existing field order where possible. Prepending new fields at the top of the YAML block is acceptable; reordering existing fields is not (diffs become noisy and review is harder).
- **`draft` status is supported** but no existing skill currently declares it. It's provided for future use (skill-author-discipline Phase B already introduced a TDD-for-skills gate that could publish drafts before they graduate to active).
- **Staleness is informational.** Do **not** downgrade stale skills to `deprecated` automatically. The 90-day threshold is a prompt for human review, not an auto-expiry.
- **CLI naming:** the command name `skill-inventory` follows the existing `skill-creator <verb>` pattern. Do not name it `list-skills` (already taken) or `inventory` (too generic).
- **Test fixtures** for the lifecycle tests must be isolated from the real `.claude/skills/` directory — tests that mutate real skills would break parallel test runs. Put fixtures under `src/skill/__tests__/fixtures/lifecycle/` and point the loader at the fixture root via a config param.

---

*Component spec for Platform Alignment milestone, track 2D. Source: OOPS doc 07 §8 (lifecycle proposal) + §10 (recommendations) at commit `254b50553`. Completes the version-discipline story started by cartridge-forge (closed 2026-04-14).*
