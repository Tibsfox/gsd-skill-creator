# HB-05 Five-Principle Structural-Completeness Linter — User Guide

**Path:** `src/cartridge/linter/structural-completeness.ts`
**Source paper:** arXiv:2604.21090 (37% of 34 governance files scored
below threshold)
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.structural-completeness-lint.enabled`

## What it does

Validates a SKILL.md document against five principles grounded in
computability theory + proof theory + Bayesian epistemology:

1. **Identifiability** — the skill has a stable, addressable name.
2. **Triggerability** — the conditions under which the skill activates
   are explicit.
3. **Demonstrability** — the SKILL.md includes at least one concrete
   example.
4. **Refutability** — failure modes are named.
5. **Composability** — the skill declares its inputs / outputs /
   side-effects.

Each principle returns `{ satisfied, rationale }`. The composite result
is `{ passed, principleResults, ... }`.

## SKILL.md authoring guidance

A linting-clean SKILL.md is structured as:

```markdown
---
name: <stable-id>
description: <one-line trigger condition>
---

# <human-readable name>

## When to use
<refutable condition; specific verbs; no "could" / "may">

## How to use
<imperative steps>

## Examples
<at least one runnable / pasteable example>

## Limits
<named failure modes; what the skill refuses to do>
```

See `docs/skill-authoring/skill-md-quality-checks.md` for the full
authoring checklist (HB-06's four-type ambiguity sister doc covers the
language-level guidance).

## How to enable

```jsonc
{
  "gsd-skill-creator": {
    "cs25-26-sweep": {
      "structural-completeness-lint": { "enabled": true }
    }
  }
}
```

When enabled, `runPromotionGate()` returns `blocked: true` on lint
failure — promotion out of `.planning/staging/inbox/` is refused. When
disabled, the linter still runs; failures emit warnings only and
promotion proceeds (conservative-default; byte-identical-with-baseline).

## Default-off invariant

The linter itself is pure (the flag does not affect lint output —
`checkStructuralCompleteness` always runs). The `runPromotionGate`
wrapper checks the flag and decides whether to block; with flag off,
`blocked: false` regardless of lint result. The `flag-off-aggregate-
byte-identical.test.ts` integration test pins this behavior on a
synthetic SKILL.md.
