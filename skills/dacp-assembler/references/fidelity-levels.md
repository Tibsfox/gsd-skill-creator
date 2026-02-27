# Fidelity Levels Reference

Quick reference for Level 0-3 fidelity criteria. The fidelity model assigns levels based on five inputs: data complexity, historical drift rate, available skills, token budget, and safety criticality.

## Level 0: PROSE

**Description:** Markdown-only intent. No structured data, no scripts.

**Bundle contents:**
- `intent.md` -- human-readable handoff description

**When to use:**
- Status reports, simple acknowledgments, question escalations
- No structured data to hand off
- Historical drift is low or irrelevant

**Typical handoff types:** status-report, question-escalation

**Token cost:** ~200-500 tokens (intent only)

## Level 1: PROSE_DATA

**Description:** Intent plus structured JSON data payload.

**Bundle contents:**
- `intent.md` -- human-readable handoff description
- `data/payload.json` -- structured data payload

**When to use:**
- Configuration updates, simple task assignments
- Data has clear structure but schema validation is unnecessary
- Low drift rate, few or no matching skills
- Token budget is constrained (< 20K remaining)

**Typical handoff types:** configuration-update, research-handoff (simple)

**Token cost:** ~500-2000 tokens (intent + data)

## Level 2: PROSE_DATA_SCHEMA

**Description:** Intent, data, and JSON Schema references for validation.

**Bundle contents:**
- `intent.md` -- human-readable handoff description
- `data/payload.json` -- structured data payload
- `data/schema-*.json` -- JSON Schema references from catalog

**When to use:**
- Task assignments with structured data, data transformations
- Complex data structures that benefit from schema validation
- Moderate drift rate with available skills
- Default level for structured data

**Typical handoff types:** task-assignment, data-transformation (moderate)

**Token cost:** ~2000-5000 tokens (intent + data + schemas)

## Level 3: PROSE_DATA_CODE

**Description:** Full bundle with intent, data, schemas, and executable scripts.

**Bundle contents:**
- `intent.md` -- human-readable handoff description
- `data/payload.json` -- structured data payload
- `data/schema-*.json` -- JSON Schema references
- `code/*.sh` -- executable scripts from skill catalog

**When to use:**
- Safety-critical handoffs (always Level 3)
- High drift rate (> 0.3) with 3+ matching skills
- High drift + complex data + any matching skills
- Medium drift (> 0.15) + complex data + available skills

**Typical handoff types:** patch-delivery (safety), data-transformation (complex), verification-request (complex)

**Token cost:** ~5000-15000 tokens (full bundle)

## Decision Tree

Evaluated top-to-bottom, first match wins:

1. `safety_critical = true` --> Level 3
2. `data_complexity = 'none'` --> Level 0
3. `token_budget < 20K` --> cap at Level 1
4. `drift > 0.3 AND skills >= 3` --> Level 3
5. `drift > 0.3 AND complex data AND skills >= 1` --> Level 3
6. `drift > 0.3 AND skills >= 1` --> Level 2
7. `drift > 0.3 AND skills = 0` --> Level 1
8. `drift > 0.15 AND complex AND skills > 0` --> Level 3
9. `drift > 0.15 AND complex AND skills = 0` --> Level 2
10. `complex data` --> Level 2
11. `structured data AND skills > 0` --> Level 2
12. `simple data` --> Level 1
13. Default --> Level 2

## SAFE-02: Bounded Changes

Fidelity changes are bounded to max 1 level per cycle. If the model recommends jumping from Level 0 to Level 3, the actual change is clamped to Level 1. This prevents oscillation and ensures gradual adaptation.
