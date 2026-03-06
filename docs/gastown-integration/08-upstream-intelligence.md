# 08 — Upstream Intelligence

## Keeping the Chipset Current

Gastown is actively developed. New patterns, bug fixes, and architectural improvements land regularly. gsd-skill-creator's upstream intelligence features can track these changes and help you decide what to absorb — safely.

## The Absorption Protocol

Upstream changes NEVER flow automatically into your chipset. Every absorption follows this protocol:

```
1. DETECT    — Upstream intelligence notices new commits/releases
2. DIFF      — Generate a human-readable summary of what changed
3. ASSESS    — Evaluate relevance: does this affect our chipset patterns?
4. VALIDATE  — Run the change through security and schema validation
5. REVIEW    — Human reviews the proposed absorption
6. ABSORB    — Apply validated changes to chipset YAML, skills, or types
7. TEST      — Run chipset test suite (108+ tests)
8. COMMIT    — Atomic commit with upstream provenance in message
```

**Steps 1-4 are automated. Steps 5-8 require human judgment.**

## Setting Up Upstream Tracking

### Track the Repository

Use gsd-skill-creator's upstream intelligence to monitor `steveyegge/gastown`:

```bash
# Check latest release
gh release list --repo steveyegge/gastown --limit 5

# Compare current chipset version against upstream
gh api repos/steveyegge/gastown/commits \
  --jq '.[0:5] | .[] | "\(.sha[0:8]) \(.commit.message | split("\n")[0])"'
```

### What to Watch For

| Change Type | Impact | Action |
|-------------|--------|--------|
| New agent role | High | Evaluate for chipset absorption. May need new skill + types. |
| Communication pattern change | High | Assess compatibility with existing channels. |
| GUPP enforcement change | Medium | Review ADR-003 (GUPP advisory). May need skill update. |
| CLI command change | Low | Chipset doesn't use CLI directly. Note for glossary. |
| Bug fix in coordination | Medium | Check if pattern is replicated in our skills. |
| New formula/molecule feature | Medium | Evaluate for future absorption (not yet implemented). |
| Performance optimization | Low | Go-specific, usually doesn't apply. |
| Documentation update | Low | May improve our glossary or concept mapping. |

## Security Gates for Upstream Absorption

Every proposed change passes through these gates before absorption:

### Gate 1: Content Inspection
- No executable payloads in YAML/JSON changes
- No new environment variable requirements that expose infrastructure
- No new network calls or external service dependencies
- No credential-shaped strings

### Gate 2: Schema Validation
```typescript
const result = gastown.validateChipset(proposedYaml, schemaPath);
if (!result.valid) {
  // REJECT — schema violation
}
```

### Gate 3: Token Budget Check
- Sum of all skill weights must remain ≤ 1.0
- New skills must declare their weight
- Existing skill weight changes need justification

### Gate 4: Topology Constraint Check
- Exactly 1 mayor (no new coordinator roles that could split-brain)
- No removal of required roles (witness, refinery)
- Agent count limits respected (max 30 per role)

### Gate 5: Boundary Check
- No new outbound data flows (nothing new leaves your workspace)
- No new inbound data sources (no new external URLs or services)
- Skill boundaries preserved (NEVER clauses still enforced)

## Provenance Tracking

Every absorption commit includes provenance:

```
feat(gastown): absorb upstream convoy batching improvement

Source: steveyegge/gastown@a1b2c3d
Upstream PR: #142
Pattern: convoy batch sizing now uses fibonacci sequence
Validated: schema ✓, budget ✓, topology ✓, security ✓
```

This creates a traceable chain from upstream change to chipset modification.

## What We Learn vs What We Copy

**Learn (absorb the pattern):**
- Agent coordination strategies
- Communication protocol improvements
- Failure recovery techniques
- Scaling heuristics

**Never copy (stay independent):**
- Go code (we're TypeScript + skills)
- Dolt SQL schemas (we use filesystem)
- CLI command implementations (we use skills)
- Infrastructure specifics (tmux, process management)

The chipset is a pattern translation, not a code port. When Gastown improves a coordination pattern, we translate the improvement into our skill and type system. We never vendor upstream code directly.
