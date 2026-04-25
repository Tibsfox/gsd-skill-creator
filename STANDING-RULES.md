# STANDING-RULES.md

Pinned, always-loaded rules for this project. **This file bypasses the memory survey scorer** — every entry here loads on every turn, regardless of relevance, regardless of token budget.

> **Load order (see `docs/memory-schema.md` for the full contract):**
> 1. `STANDING-RULES.md` — always loaded, never scored, never shed.
> 2. `CLAUDE.md` (project) — always loaded.
> 3. `MEMORY.md` (auto-memory corpus) — **scored** by `src/memory/survey-scorer.ts`; entries below the relevance threshold are shed for the turn.
>
> The scorer's hard invariant (CF-B-023-2) is that any entry with `type: pinned-rule` (whether housed here or in MEMORY.md frontmatter) is preserved verbatim. The scorer treats this file as the canonical home for `type: pinned-rule` entries.

## Rule format

Each rule is a top-level `##` heading followed by a one-line summary and (optionally) a body. Add `<!-- STANDING-RULE -->` as a marker comment to make the rule machine-discoverable.

```
## <imperative rule statement>
<!-- STANDING-RULE -->

<rationale and any clarifications>
```

## Rules

### ALWAYS work on the dev branch
<!-- STANDING-RULE -->

First action in any session that will write code is `git switch dev`. Don't read STATE.md to confirm; don't ask; don't surface a branch mismatch — just switch. The session-start `Current branch:` field is an artifact, not a directive. Cross-branch work (push to main, tag/release on main) returns to `dev` immediately after.

### NEVER add Claude co-author trailers to commit messages
<!-- STANDING-RULE -->

Do not add `Co-Authored-By: Claude ...` or `Generated with Claude Code` footers. Trailers rot fast (model IDs and context sizes change), and the user has flagged this repeatedly.

### NEVER `git add`, `git commit`, or `git push` files under `.planning/`
<!-- STANDING-RULE -->

`.planning/` is gitignored by design. Any commit that stages a `.planning/` path is a violation of the project's information-hiding contract; the contents include Fox Companies IP, mission packages, and pre-publication research notes that must not appear in the public history.

### NEVER import, reference, or surface `wasteland/` content
<!-- STANDING-RULE -->

The `wasteland` branch (and any `wasteland` path segment) holds muse content that is explicitly excluded from the published library. Imports, greps, cross-references, and test fixtures must all skip `wasteland`-tagged sources.

### Fox Companies IP stays in `.planning/` only
<!-- STANDING-RULE -->

Anything tagged Fox Companies, Tibsfox Inc., FoxFiber, FoxCompute, FoxCapComm, or any of the strategy/legal/funding documents under `.planning/fox-companies/` is private. Published artifacts (the live `www/` tree, npm package, GitHub releases) must contain none of this content.

### v1.50 branch is deferred — do not route work there
<!-- STANDING-RULE -->

The `v1.50` branch is paused until the user explicitly reactivates it. Intake docs that mention "v1.50" as a target version do NOT mean routing work to that branch. Active development continues on the `dev` line (currently v1.49.x).

### Never delete logs — only archive
<!-- STANDING-RULE -->

Long-term session and operational logs are critical to project development. Move logs to an archive location; do not delete them.

### Pinned-rule passthrough is a HARD scorer invariant
<!-- STANDING-RULE -->

The memory survey scorer (`src/memory/survey-scorer.ts`) MUST NEVER shed an entry with `type: pinned-rule`. CF-B-023-2 enforces this with a regression test. If the test fails, fix the scorer — not the test.

## How to add a rule

1. Append a new `## <rule statement>` heading at the bottom of the Rules section.
2. Add the `<!-- STANDING-RULE -->` marker on the next line.
3. Write a short rationale (1-3 sentences). Cite the trigger event if relevant.
4. Update `src/memory/__tests__/standing-rules-separation.test.ts` if the count or canonical-rule list assertion needs to change.

## How a rule is removed or relaxed

Standing rules are sticky by design. Removing a rule requires:
- An explicit user request, OR
- A successor rule that subsumes the original, OR
- A documented mission retrospective that retires the rule with rationale.

Drift the rule into MEMORY.md with `type: decision` (recording the relaxation event) before deleting the heading here.
