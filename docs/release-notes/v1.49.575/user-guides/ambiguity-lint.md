# HB-06 Four-Type Ambiguity Linter — User Guide

**Path:** `src/cartridge/linter/ambiguity.ts` +
`docs/skill-authoring/skill-md-quality-checks.md`
**Source paper:** arXiv:2604.21505 (Orchid 1,304 function-level tasks)
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.ambiguity-lint.enabled`

## What it does

Detects four classes of natural-language ambiguity in SKILL.md authoring
text:

1. **Lexical ambiguity** — words with multiple senses ("right",
   "object", "table") flagged for disambiguation.
2. **Syntactic ambiguity** — phrase-attachment ambiguity ("inspect the
   record with the audit trail" — does the audit trail attach to "the
   record" or to "inspect"?).
3. **Semantic ambiguity** — vague quantifiers and references ("most
   skills", "they", "the previous step") flagged for explicit
   referencing.
4. **Vagueness** — "could", "may", "might", "perhaps" — modal hedges
   that defeat refutability.

Each detected flag has a span `(line, col)` and a type. The function
itself (`checkAmbiguity`) is pure and synchronous; the **promotion-gate
wrapper** (callers) decides whether failures block promotion.

## Four-type checklist

The full checklist lives at
`docs/skill-authoring/skill-md-quality-checks.md`. Authoring-time
practice:

- Replace bare pronouns with explicit nouns.
- Replace modal hedges (could / may / might) with declarative verbs
  (does / refuses / requires).
- Define every quantifier (replace "most" / "some" / "few" with a
  concrete count or percentile).
- Resolve attachment ambiguity by reordering or punctuating.

## How to enable

```jsonc
{
  "gsd-skill-creator": {
    "cs25-26-sweep": {
      "ambiguity-lint": { "enabled": true }
    }
  }
}
```

## Baseline zero-FP guarantee

The HB-06 test suite includes
`ambiguity-baseline-zero-fp.test.ts` which runs the linter against the
46 in-tree skills under `.claude/skills/` and asserts zero false
positives at the v1.49.575 sensitivity calibration. Tightening the
sensitivity is a v1.49.576+ work item.

## Default-off invariant

`checkAmbiguity()` is pure — the flag does not change its output. The
flag controls only whether the promotion-gate wrapper treats lint
failures as blocking. With the flag off, lint findings are recorded but
not blocking; promotion proceeds.
