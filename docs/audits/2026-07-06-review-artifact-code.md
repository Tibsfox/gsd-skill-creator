# Artifact-System Code Review — 2026-07-06 (Dimension A: artifact-code)

Scope: the CODE that creates/validates/manages artifacts —
`src/cartridge/`, `src/chipset/`, `src/skill/`, `src/skill-creator/`,
`src/agents/`, `src/validation/`, `src/teams/`, and the learn-time
generators in `src/learn/generators/`. Content (skill/agent/team/chipset/
cartridge markdown) was already reviewed in
`docs/audits/2026-07-06-artifact-ecosystem-review.md`; this pass looks only
at validator/generator/loader/scaffolder correctness, schema enforcement,
and path-safety along the create/forge code paths. Nothing already fixed
there is re-reported.

## Summary

The core validators are in good shape: `path-safety.ts`, `skill-validation.ts`,
`agent-validation.ts`, and `team-validation.ts`/`team-validator.ts` are careful,
well-tested, and enforce the right invariants (array-`tools:` rejection,
strict name schema with suggestions, topology rules, task-cycle detection via
Kahn's algorithm, cross-member skill-conflict/role-coherence checks). The
cartridge `validateCartridge` cross-chipset consistency checks are sound.

The material gap is **path containment on the cartridge load/scaffold paths.**
The repo owns a defense-in-depth toolkit (`assertSafePath`, `validateSafeName`)
and a `LoaderContext` chokepoint, but the cartridge loader and companion
scaffolder do **not** use them, and the cartridge Zod schema does not constrain
skill keys / agent names to safe filesystem components. A community-trust
cartridge — exactly the untrusted input the project's security-hygiene skill
exists to handle — can therefore (a) make the loader read arbitrary files via
`src:` `../` / absolute references (verified empirically) and (b) make the
companion scaffolder write files outside the cartridge directory via a
`../`-laden skill key or agent name. Secondary findings: the learn-time
generators emit skill/agent artifacts that would fail this repo's own
validators, and agent-frontmatter validation is asymmetric with skill
validation (no description length/quality check).

## Findings

### AC-1 (HIGH) — Cartridge loader `src:` references have no path containment (arbitrary local file read)

**Location:** `src/cartridge/loader.ts:343` (`splitSrcReference`) + `:253-256`
(read), reached from every `loadCartridge`/`loadAnyCartridge`/`parseCartridge`
call.

**Problem.** `splitSrcReference` resolves an external chipset reference as
`const filePath = isAbsolute(filePart) ? filePart : resolve(baseDir, filePart)`
and then `readFileSync(filePath, ...)`. There is no check that `filePath` stays
within the cartridge directory. Absolute paths are honored verbatim, and `../`
segments walk out of the cartridge tree. The one guard in the path,
`ensureAllowed(ctx, ...)`, is a no-op when `ctx` is undefined
(`loader-context.ts:201` — `if (!ctx) return;`), and **every** production caller
(`src/cli/commands/cartridge.ts:170,187,285,304,325,348,446`,
`scaffold-companions.ts:39`) passes no `ctx`. So for a community/untrusted
cartridge loaded via `skill-creator cartridge eval|validate|scaffold-companions
<path>`, the loader will read any file the YAML points at.

**Evidence (verified).** A `trust: community` cartridge with
`chipsets: [{ kind: department, src: ../outside-secret.yaml }]` was loaded; the
loader read the out-of-tree file and merged its contents — the only reason it
ultimately threw was the *downstream Zod schema* rejecting an incomplete
department (error class `READ-SUCCEEDED-THEN-SCHEMA-REJECT`, first Zod issue
`path: ["description"]`), i.e. the traversal read had already succeeded. An
attacker who shapes the target file as a valid chipset (or uses the `#/fragment`
extractor) reads its content into the loaded object; even a malformed target
leaks bytes into error strings that echo the resolved absolute path.

**Recommendation.** After resolving `filePath`, call
`assertSafePath(filePath, baseDir)` (already exists in
`src/validation/path-safety.ts`) so external references are contained to the
cartridge directory; add an explicit `allowExternal`/allowlist opt-in for the
rare legitimate cross-tree case. Additionally, have the CLI construct a
`LoaderContext` scoped to the cartridge root and thread it through
(`loadCartridge(path, { ctx })`) so the chokepoint stops being permissive by
default for user-supplied cartridge paths.

**Effort:** M. **Verify:** add a test that `loadCartridge` on a cartridge with
`src: ../x.yaml` or `src: /etc/hostname` throws `PathTraversalError` (or a
loader-scoped "escapes cartridge dir" error) instead of reading the file.

---

### AC-2 (MEDIUM) — Companion scaffolder + cartridge schema: unvalidated skill keys / agent names → write-side path traversal

**Location:** `src/cartridge/scaffold-companions.ts:104` (`writeIfAbsent` →
`join(root, relPath)`), fed by keys/names from `src/cartridge/types.ts:146`
(`skills: z.record(z.string(), …)`) and `:53` (`name: z.string().min(1)`).

**Problem.** `scaffoldCompanions` (a live CLI command,
`cartridge.ts:140,265`) derives write paths directly from cartridge content:
`skills/${key}.md`, `agents/${agent.name}.md`, `teams/${key}.md`. The cartridge
schema constrains these only to non-empty strings — no filesystem-safe pattern.
A malicious/untrusted cartridge with a skill key or agent name like
`../../evil` yields `join(cartridgeDir, 'skills/../../evil.md')`, which escapes
the cartridge directory; `writeIfAbsent` then `mkdirSync(dirname, {recursive})`
+ `writeFileSync` there. `validateSafeName` exists precisely for this but is
never called on cartridge keys/names.

**Recommendation.** Add a name/key pattern to the cartridge Zod schemas
(reuse the same `[a-z0-9-]`-style rule used for skills/agents, or run
`validateSafeName` on each key/name in `validateCartridge`), and defensively
call `assertSafePath(abs, root)` inside `writeIfAbsent` before writing. Both are
cheap and use code already in the repo.

**Effort:** S–M. **Verify:** test that a cartridge with an agent named
`../../x` fails `validateCartridge`, and that `scaffoldCompanions` refuses to
write outside its cartridge dir.

---

### AC-3 (MEDIUM) — Learn-time generators emit skill/agent artifacts that fail the repo's own validators / won't activate or install

**Location:** `src/learn/generators/skill-generator.ts:90` and
`src/learn/generators/agent-generator.ts:80,263`
(consumed by `src/commands/sc-learn.ts:290-312` and
`src/scan-arxiv/aggregate-generators.ts:133-147`).

**Problem.**
- Generated **skill** description is the fixed string `Learned skill for
  ${domainName} domain` — it contains none of the activation patterns that
  `validateDescriptionQuality`/`hasActivationPattern`
  (`skill-validation.ts:14-31`) look for (no "Use when…", no trigger verb), so
  every learn-generated skill would be flagged "may not activate reliably."
- Generated **agent** frontmatter has no `tools:` field and a description
  (`Agent specializing in ${domainName} domain reasoning`) with no trigger
  clause, and is written to `${outputDir}/${agentName}/AGENT.md` — a
  `<name>/AGENT.md` subdirectory convention. Claude Code discovers agents as
  flat `.claude/agents/<name>.md`, so an agent emitted at
  `agents/learn/<name>/AGENT.md` is not installable/discoverable as-is.

These artifacts are the *output* of the create pipeline, so they should be held
to the same bar the validators enforce for hand-authored artifacts.

**Recommendation.** Run generator output through `validateSkillInput` /
`validateAgentFrontmatter` (and `validateDescriptionQuality`) before it is
recorded to a changeset; make the skill description embed a real "Use when …"
clause built from the top keywords, give the agent a comma-separated `tools:`
string and a trigger-bearing description, and emit agents as `<name>.md` (or
document why the subdir form is intentional for learn artifacts).

**Effort:** M. **Verify:** assert in a generator test that
`validateAgentFrontmatter(parseFrontmatter(generateAgent(...).content))` is
`valid` and that `validateDescriptionQuality(skill.description)
.hasActivationTriggers === true`.

---

### AC-4 (LOW) — Full team validation treats missing member agents as informational, never an error

**Location:** `src/teams/team-validator.ts:611-612` +
`validateMemberAgents:181-219` (status `missing` is returned but never pushed to
`errors` in `validateTeamFull`).

**Problem.** `validateTeamFull` runs member-agent resolution and populates
`memberResolution[].status = 'missing'`, but it never converts a missing agent
into an error or warning. A team config whose members reference agent files
that do not exist on disk still returns `valid: true`. That's defensible for a
pre-install check, but there is no strict mode for callers (forge/CI) that want
"all referenced agents must exist" enforced.

**Recommendation.** Add an option (e.g. `requireMemberAgents: true`) that
promotes `missing` resolutions to errors, or at least emit a warning for each
missing member so the result surfaces the gap.

**Effort:** S. **Verify:** test that a team referencing a nonexistent agent
yields an error/warning under the strict option.

---

### AC-5 (LOW) — Agent frontmatter validation is asymmetric with skill validation (no description length/quality bound)

**Location:** `src/validation/agent-validation.ts:63-70`
(`description: z.string().min(1)` only).

**Problem.** Skills enforce `description` 1–1024 chars
(`skill-validation.ts:416,495`) and offer activation-quality checks; agents
enforce only "non-empty." There is no upper bound and no activation-quality
signal for agent descriptions, even though agents activate on the same
description-matching mechanism. This lets an agent ship a 5-KB or trigger-less
description that a skill with identical text would be warned about.

**Recommendation.** Mirror the skill bound (`.max(1024)`) on
`AgentFrontmatterSchema.description` and optionally reuse
`validateDescriptionQuality` to emit the same non-blocking activation warnings.

**Effort:** S. **Verify:** test that an agent with a 2000-char description
fails and one with a trigger-less description warns.

---

### AC-6 (LOW) — `slugify` in the generators can produce invalid names (`learn-` with a trailing hyphen)

**Location:** `src/learn/generators/skill-generator.ts:45` and
`agent-generator.ts:43`.

**Problem.** `slugify` strips non-alphanumerics; a domain name composed only of
punctuation/unicode collapses to `''`, yielding skill name `learn-` / agent
name `learn--agent`, which violate `OfficialSkillNameSchema` (no trailing
hyphen / no `--`). No guard rejects or repairs the empty-slug case before the
name is used as a filesystem path and artifact name.

**Recommendation.** Fall back to a stable token (e.g. a short hash of the domain
name) when `slugify` returns empty, and/or run the result through
`validateSkillNameStrict` and bail with a clear error.

**Effort:** S. **Verify:** `generateLearnedSkill('!!!', primitives)` produces a
name that passes `validateSkillNameStrict`.

---

### AC-7 (LOW) — `detectToolOverlap` assumes `member.tools` is an array; a string tools field silently no-ops

**Location:** `src/teams/team-validator.ts:401-405`.

**Problem.** The check reads `(member as …).tools as string[]` and iterates
`for (const tool of tools)`. Agent/member tool declarations elsewhere in the
system are comma-separated **strings**. If a member carries a string `tools`
field, `for…of` iterates characters, none of which match `WRITE_TOOLS`, so the
overlap check silently detects nothing rather than parsing the string. The
check is effectively inert for the string form.

**Recommendation.** Normalize `member.tools` via `parseToolsString`
(`agent-validation.ts:175`) when it is a string before iterating.

**Effort:** S. **Verify:** test that two members each with
`tools: "Read, Write"` produce a `Write` overlap result.

## New-function / capability opportunities

1. **Cartridge path-containment layer (from AC-1/AC-2).** A single helper that
   the loader and scaffolder both call — resolve, then `assertSafePath` against
   the cartridge root, with an explicit allowlist opt-in — closes both the read
   and write traversal vectors and makes the existing `LoaderContext` chokepoint
   effective by default on user-supplied cartridge paths.

2. **Cartridge name/key schema.** Promote skill keys, agent names, and team keys
   from `z.string()` to a filesystem-safe pattern in the Zod schemas so
   `validateCartridge` rejects traversal-bearing identifiers up front (defense
   in depth even after AC-2's write guard).

3. **Generator self-validation gate.** Route all `generate*` output through the
   existing `validateSkillInput` / `validateAgentFrontmatter` /
   `validateTeamConfig` before it is written to a changeset, so the create
   pipeline can never emit an artifact the repo's own validators reject
   (addresses AC-3 systemically, not just for the learn generators).

4. **Strict team validation mode** (AC-4) for forge/CI callers that need
   "referenced agents must exist" to be a hard failure.

## Notes

- **`src/cartridge/distill.ts`** is an explicit pass-through **stub** (v2 seam,
  `author: 'distiller-stub'`). It is honest scaffolding, not dead weight — leave
  it, but be aware `distill()` currently echoes input unchanged.
- Positive: `validateAgentFrontmatter`'s `tools: z.string().optional()` already
  rejects the YAML-array `tools:` form at the schema level (the ecosystem
  review's C2 was a content fix; the validator itself is correct). Tool-name
  checks are warning-only by design (`validateToolsField` never populates
  `errors`), which is intentional for custom/future tools.
- Positive: `path-safety.ts` (`validateSafeName` + `assertSafePath` with the
  trailing-separator prefix-collision guard) is solid; the finding is that the
  cartridge subsystem doesn't *use* it, not that it's wrong.
- Positive: `team-validation.validateTopologyRules` IS wired into
  `validateTeamFull` (`team-validator.ts:607`), so topology enforcement is not
  orphaned despite `validateTeamConfig` alone not calling it.
- Not re-reported (already covered by the ecosystem review): array-`tools:`
  content, Co-Authored-By trailer, hardcoded absolute paths in agents, phantom
  command refs, 22-department validation debt, benchmark corpora, and the
  path-traversal enforcement in `skill-store.ts` (that guard is real; it is a
  *different* code path from the cartridge loader/scaffolder flagged here).
