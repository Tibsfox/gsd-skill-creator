# HB-02 AgentDoG BLOCK Schema — User Guide

**Path:** `src/safety/agentdog/`
**Source paper:** arXiv:2601.18491 (AgentDoG)
**Default:** OFF
**Flag:** `gsd-skill-creator.cs25-26-sweep.agentdog-schema.enabled`

## What it does

Enriches Safety Warden BLOCK decisions with a structured **where / how /
what** diagnostic taxonomy:

- **Where axis** — captures the component or skill that emitted the
  candidate (`component: 'skill:foo'`, `component: 'mcp:bar'`, etc.).
- **How axis** — classifies the vulnerability vector and escalation
  pattern (`prompt-injection`, `network-egress`, `privilege-escalation`,
  …).
- **What axis** — names the impacted asset and rates the blast radius
  (`local`, `process`, `system`, `network`).

When enabled, every BLOCK decision passing through
`enrichBlockWithAgentDog()` carries a frozen `agentDog` field with a
diagnostic record matching `AGENTDOG_SCHEMA_VERSION`. When disabled,
`enrichBlockWithAgentDog()` returns the input object referentially
unchanged.

## How to enable

```jsonc
{
  "gsd-skill-creator": {
    "cs25-26-sweep": {
      "agentdog-schema": { "enabled": true }
    }
  }
}
```

No marker file required. HB-02 ships at 4B/7B/8B parity with the
published taxonomy on Qwen + Llama families.

## Reading AgentDog diagnostics

A BLOCK decision with HB-02 enrichment looks like:

```json
{
  "decision": "BLOCK",
  "reason": "untrusted-skill-attempted-network-call",
  "agentDog": {
    "schemaVersion": "1.0.0",
    "where": { "component": "skill:third-party-fetcher" },
    "how": {
      "vulnerabilityVector": "network-egress",
      "escalationPattern": "data-exfil"
    },
    "what": {
      "impactedAsset": "secrets-store",
      "blastRadius": "system"
    }
  }
}
```

The `where` axis tells you which component to audit; the `how` axis
tells you which detection rule fired; the `what` axis tells you what was
at stake. All three are required for a BLOCK to be considered diagnostically
complete.

## Default-off invariant

`emitAgentDogDiagnostic()` returns `AGENTDOG_DISABLED_RESULT` (a frozen
sentinel — `{emitted: false, disabled: true, diagnostic: null}`).
`enrichBlockWithAgentDog()` is a no-op pass-through. JSON serialization
of an enriched BLOCK with the flag off is byte-identical to the input.
