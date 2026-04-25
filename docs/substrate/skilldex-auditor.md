# Skilldex Auditor — UIP-13 T1a

> Phase 765, v1.49.573 Upstream Intelligence Pack v1.44.
> CAPCOM hard-preservation Gate G10.

`src/skilldex-auditor/` is a static, read-only ZFC compliance auditor for
SKILL.md spec-conformance. It scores skills against the canonical
gsd-skill-creator schema and emits structured PASS/FAIL/WARN findings the
session-observatory can ingest unchanged.

## Architectural antecedents

The module is a methodology fusion of two upstream papers:

1. **Skilldex** — Saha & Hemanth, *Skilldex: A Package-Manager-Style
   Catalog for Agent Skills*, ACL Findings 2026
   (**arXiv:2604.16911**). Skilldex models a skill library as a versioned
   catalog with a small required schema. The Skilldex
   `name` / `description` / `version` schema is the direct ancestor of
   the required-frontmatter rule set in `conformance-scorer.ts` and the
   read-only `registry.ts` package-manager view.

2. **Structural Verification for EDA** — Jayasuriya et al.,
   *Static Structural Verification for Electronic Design Automation*
   (**arXiv:2604.18834**). This paper argues for static-only,
   no-execution structural verification of design artefacts as a
   precondition for downstream tools. The auditor inherits the
   discipline: **no tool-in-the-loop debug, no execution, no spawning of
   skills under audit.** Every check is a pure structural predicate over
   a parsed `SkillSpec`.

## Public API

```ts
import { auditSkill, auditAll } from 'gsd-skill-creator/skilldex-auditor';

// Audit one SKILL.md.
const findings = await auditSkill('/path/to/SKILL.md');

// Audit a whole skills directory (one level deep).
const report = await auditAll('/path/to/skills/');
console.log(report.summary); // { pass, warn, fail }
```

Other public exports:
- `parseSkillFile`, `parseSkillContent`, `scoreSpec` — scorer primitives
- `emitFinding`, `emitReport`, `parseFinding`, `parseReport`, `summarise` — emitter
- `listRegistry`, `findInRegistry` — read-only Skilldex-style catalog view
- `isSkilldexAuditorEnabled`, `readSkilldexAuditorConfig` — opt-in gate

## Opt-in configuration

The module is **default-OFF**. Opt in via `.claude/gsd-skill-creator.json`:

```json
{
  "gsd-skill-creator": {
    "upstream-intelligence": {
      "skilldex-auditor": { "enabled": true }
    }
  }
}
```

When the flag is absent, false, or the file is malformed, every public
entry point returns immediately:

- `auditSkill()` returns `[]`.
- `auditAll()` returns
  `{ disabled: true, inspected: 0, findings: [], summary: { 0,0,0 } }`.

**No skill file is read in the disabled state.** This is the Gate G10
flag-off byte-identical guarantee: with the flag off the module behaves
byte-identically to the phase-764 tip.

## Read-only invariant

The auditor performs ZERO writes into:

- `.claude/skills/`
- `.agents/skills/`
- `examples/`

This is enforced both by code review and by an integration test that
walks `src/skilldex-auditor/` (excluding `__tests__/`) and rejects any
match for `fs.writeFile`, `fs.appendFile`, `fs.writeFileSync`, or
`fs.appendFileSync`. Test fixtures may write to OS-temp directories
because those are not part of the skill library.

The auditor also performs ZERO imports from CAPCOM-adjacent modules:
`src/orchestration/`, `src/dacp/`, or any path matching
`src/capcom`. A second integration test enforces this via regex.

## Conformance ruleset (current)

| Rule ID                                  | Severity on miss | Source                  |
| ---------------------------------------- | ---------------- | ----------------------- |
| `frontmatter.present`                    | `fail`           | Skilldex §3 schema      |
| `frontmatter.name.required`              | `fail`           | Skilldex §3 schema      |
| `frontmatter.description.required`       | `fail`           | Skilldex §3 schema      |
| `frontmatter.version.recommended`        | `warn`           | Skilldex §3 schema      |
| `structure.headings.present`             | `warn`           | Structural Verification |

`REQUIRED_HEADINGS` is exported as an empty list so the canonical
SKILL.md template can extend the rule set without touching the scorer
core.

## Emitter envelope

All findings and reports are wrapped in versioned envelopes:

```json
{
  "schema": "skilldex-auditor.finding/v1",
  "emittedAt": "2026-04-24T00:00:00.000Z",
  "finding": { "skillPath": "...", "ruleId": "...", "severity": "fail", "message": "..." }
}
```

Reports use `skilldex-auditor.report/v1`. Round-trip is verified by
`__tests__/finding-emitter.test.ts`.

## Non-goals

The auditor explicitly does NOT:

- Execute the skill or any of its hooks.
- Mutate any DAG topology consumed by other code.
- Touch the CAPCOM gate-state surface.
- Spawn tools or call into orchestration / DACP.
- Re-implement a YAML library — a hand-rolled flat-mapping subset is used
  to honour the "no new dependencies" constraint.

Future extensions (richer YAML, deeper Markdown structural checks, cross-
skill dependency probes) belong in companion phases under the same
opt-in flag, not in this module.

## Integration target

The auditor's primary integration target is the **session-observatory
pipeline** (`src/session-observatory/`). Findings emitted by `auditSkill`
/ `auditAll` are ingested by the session-observatory in their versioned
envelope format without transformation. The module also composes with
[T2d ArtifactNet Provenance](artifactnet-provenance.md) via a duck-
compatible `ExistingAudit` interface: provenance can wrap any call that
returns a report shaped like `{ timestamp, inspected, findings, summary }`
and prepend a `preAudit` slot before the findings array.

```ts
import { auditAll } from 'gsd-skill-creator/skilldex-auditor';
import { preAuditHook } from 'gsd-skill-creator/artifactnet-provenance';

// Wrap with provenance pre-audit (T2d composes on top of T1a, both flags
// are independent — either may be off without affecting the other).
const wrappedAudit = preAuditHook(
  async () => auditAll('.claude/skills/'),
  () => assetsForSkillsDir,
);
const report = await wrappedAudit();
// report.findings — Skilldex conformance findings
// report.preAudit — ArtifactNet provenance findings (undefined if T2d off)
```

See [`docs/substrate/upstream-intelligence/README.md`](upstream-intelligence/README.md)
for the full v1.49.573 cluster composition guide.

## eess26 cite-keys

- **eess26_2604.16911** — Saha & Hemanth, *Skilldex*, ACL Findings 2026
- **eess26_2604.18834** — Jayasuriya et al., *Static Structural Verification for EDA*, 2026
