# HB-01 Tool Attention — User Guide

**Path:** `src/orchestration/tool-attention/`
**Source paper:** arXiv:2604.21816 ("Tool Attention")
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.tool-attention.enabled`

## What it does

Reduces the per-turn token cost of a large MCP tool catalogue by:

1. **ISO score** — ranks tools by cosine similarity between the current
   intent embedding and per-tool description embeddings.
2. **State-aware gate** — applies a phase-conditional top-k budget
   (planning / executing / verifying have different effective k values).
3. **Lazy schema loader** — emits a *compact pool* (name + short
   description; ~10 tokens/tool) of all tools and a *full-schema set* only
   for the top-k gated tools.
4. **Budget monitor** — fires a fracture alert if context occupancy
   crosses the configured threshold (default 70%).

The published paper quantifies the cost of feeding all tool schemas to
every turn at 10k–60k tokens depending on catalogue size; HB-01's lazy
loader recovers the bulk of that budget without functional impact.

## How to enable

```jsonc
// .claude/gsd-skill-creator.json
{
  "gsd-skill-creator": {
    "cs25-26-sweep": {
      "tool-attention": { "enabled": true }
    }
  }
}
```

That's it — no marker file, no CAPCOM gate. HB-01 is a non-safety
performance optimization.

## Baseline-measurement workflow

Before enabling in production:

1. With the flag off, capture a per-turn token-occupancy series across a
   representative session.
2. Enable the flag; re-capture the same series.
3. Compute p50 and p95 reductions.

The HB-01 test suite includes
`token-budget-baseline.test.ts` and `token-budget-reduction.test.ts` —
they exercise the same measurement on a synthetic 60-tool corpus and
record p50 reduction ≈ 74.2%. Real-world reduction depends on catalogue
size, top-k value, and intent-tool semantic alignment; expect 50–75% on
catalogues with 30+ heterogeneous tools.

## Default-off invariant

When the flag is off, `computeIsoScore`, `applyStateGate`,
`lazyLoadSchemas`, `checkBudget`, and `runToolAttentionPipeline` all
return frozen `disabled: true` sentinels. The
`flag-off-aggregate-byte-identical.test.ts` integration test pins the
JSON-canonical shape of every sentinel — any future change must be
deliberate.
