# v1.49.969 — Retrospective

## What went right

- **Recon before design.** A five-agent read-only reconnaissance workflow mapped every `model:` assignment site in `src/` before any code was written. It established three load-bearing facts: `escalateTo` had zero production consumers (the M5-selector docstring was aspirational), `AgentGenerator` is the one site with a genuine *skill → dispatched-agent* link, and `TeamMemberModel`/`ModelAlias` are byte-compatible with `ModelFamily` minus `unknown`. That map made the wire-site choice obvious and defensible rather than a guess.
- **Lightest honest wire.** Rather than coupling the generator to the full ME-1 classifier or depending on `skillStore` preserving raw frontmatter (which it does not), the actuator is a pure function taking caller-supplied decisions. Byte-identical-when-off falls out by construction: when `modelAffinity` is absent, `resolveEffectiveModel` returns `config.model` and the generated string is unchanged — proven by an exact-content equality assertion in the wire test.
- **Typecheck caught two real defects** the tests could not: an unreachable `target === 'inherit'` comparison (a `ModelFamily` is never `'inherit'`) and a `ModelFamily`-typed test array indexing a `Record<DispatchModel, …>`. Both fixed before commit.

## What went well in process

- **Step-P adversarial review on the diff** returned 0 confirmed findings against the ship code across all five lenses. The single confirmed MINOR was pre-existing STORY.md DB-regen drift surfaced because `git diff HEAD~1` includes the unstaged working tree — correctly diagnosed as out-of-scope perpetual drift and restored from HEAD before the STORY-gate rather than committed.
- The review's apparent "doc inconsistency" finding became a useful T14 instruction: restore STORY.md from HEAD before appending, preserving the committed v967/v968 form against the regen normalization (#10436 destination preservation).

## What to watch

- The actuator is **reachable but opt-in**: a caller must both enable the flag and supply per-skill decisions for an escalation to fire. No production caller threads the decisions yet — the mechanism is live and tested, at the same opt-in level as the rest of the ME-2 module. A follow-on could let `AgentGenerator` self-serve decisions from skill frontmatter once `skillStore` reliably preserves the `model_affinity`/`output_structure` blocks.
- STORY.md / INDEX.md / dashboard / preserved-modules-hashtree DB-regen drift remains a recurring per-session artifact; the ship restores the curated files from HEAD rather than committing the regen form.
