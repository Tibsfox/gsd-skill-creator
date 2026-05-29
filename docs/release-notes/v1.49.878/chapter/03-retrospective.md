# v1.49.878 — Retrospective

**Wall-clock:** ~10 min. Class-based wire pattern transferred cleanly from v870's version-manager (class-private-method) and adapted to the public-class shape.

## What went as expected

- **Class-instance ctx storage is a fourth variant of "shared-helper hoist".** v870 stored ctx on a class with private methods using a private git() helper. v878 stores ctx on a class with public methods; each public method hoists at its own fetch. Both variants share: single class field carries ctx, methods consume it.
- **Cross-audit ran clean automatically.** KNOWN_UNWIRED Egress 4 → 3.
- **Pattern reuse from v863 terminal/health.ts.** v863 used hoist-outside-try (sibling pattern) for a fault-tolerant accessory; v878's health() uses same pattern. Belt-and-suspenders re-throw inside try as defensive measure.

## What surprised me

- **The class constructor signature change is a public-API change.** Adding `ctx?: EgressContext` as 2nd constructor param is backward-compatible (optional), but any caller currently constructing AnthropicChip would now have the option to thread security context. Likely the next refactor wave wires up ctx through chip factory functions.

## Future-improvement candidates

### Class-instance ctx storage as 4th shared-helper variant

Now 4 distinct shared-helper variants observed in this campaign:
1. Class-private-method (v870 version-manager)
2. Closure-capture (v871 contribute)
3. Module-internal-helper (v873 pre-flight, v874 acquirer)
4. Class-instance public-method (v878 anthropic-chip)

All 4 share the same core pattern: one entity (class/closure/module) carries ctx; one or more sites hoist on it.

**Promotion-eligible at next codify**: refines #10444 by consolidating these as "shared-helper hoist" with sub-variants.

## Verdict on scope

Pattern reuse from prior Egress chips (v863-v867) + Track 4 (v870-v875) makes Track 5 chips fast. Track 5 progress: 3/6 closed.
