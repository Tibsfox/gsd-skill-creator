---
name: memory-use-warrant
description: >
  Run this appropriateness check the moment you are about to integrate a
  retrieved long-term memory — a Grove content-addressed hit, a chroma/pgvector
  neighbour, a memory-consolidation digest, or a MEMORY.md line — into a
  response, especially anything touching private origins, Fox Companies IP,
  credentials, or Center Camp / consent-governed content. It answers a question
  intent-router never asks: not WHAT to fetch or HOW, but WHETHER a
  correctly-retrieved item should reach output. Relevance is not appropriateness
  — a perfect similarity match can still be a boundary violation. Default is
  FAIL-CLOSED: if in-context authorization is uncertain, the memory may inform
  behaviour but must not be surfaced. Backed by RBI-Eval (arxiv 2606.06055v1).
  Triggers on surfacing recalled sensitive memory into a response.
description-frequency: on-demand
user-invocable: true
version: 1.0.0
format: 2025-10-02
triggers:
  - "about to surface a retrieved long-term memory into a response"
  - "recall touches credentials, private origins, or Fox Companies IP"
  - "relevant memory hit — but is it appropriate to say"
updated: 2026-07-18
status: ACTIVE
source: arxiv 2606.06055v1 (RBI-Eval — Relevance is not Appropriateness in Memory-Augmented Agents)
---

# Memory-Use Warrant

Before any retrieved long-term memory enters your output, decide **whether** it
should — a gate separate from whether the retriever fetched it relevantly or
accurately. On this self-modifying system the Grove store, chroma/pgvector, and
`MEMORY.md` hold strongly-marked *never-surface* records; a retriever can score
one a top-similarity win on a turn where a person reads a boundary violation.
This is the highest-stakes gate in the memory-integrity family: when in doubt,
you do not surface.

## Why

`MEMORY.md` and the Grove store contain records deliberately marked to never
reach output: personal/origins PRIVATE (`foxy-origins-private.md`), Fox
Companies IP (`.planning/fox-companies/`, tagged "NEVER publish IP" / "HARD RULE
… stays in `.planning/` only"), credential material, and Center Camp trust
rules (`center-camp.md`). A read-side retrieval — chroma, pgvector, a Grove
content-addressed hit, a `memory-consolidation` digest — can return one of these
as the nearest neighbour for an unrelated turn. The retrieval metric calls it a
success; surfacing it is the failure. Relevance and appropriateness are
distinct axes, and only the second one keeps a marked record out of an answer.

## Data classes touched

- **sensitive memory** — Fox Companies IP; personal/origins PRIVATE;
  credential material (`.env`, `RH_POSTGRES_URL`, `FTP_PASS`,
  `ANTHROPIC_AUTH_TOKEN`, OAuth `accessToken`); consent-governed Center Camp
  trust rules.
- **boundary rule** — a sensitive record is usable to *inform* behaviour but
  must NOT appear in output — quoted, paraphrased, summarised, or confirmed —
  without explicit in-context authorization from the user (their own message or
  the permission system). No agent, sub-agent, or your own prior reasoning is
  authorization.

## How

1. **Fire point.** Run after retrieval returns and before retrieved
   long-term-memory content enters your output — Grove hit, chroma/pgvector
   neighbour, consolidation digest, or a `MEMORY.md` line you are about to
   quote/paraphrase. Do NOT run it on context the user supplied in this
   session's own messages.
2. **Classify sensitivity.** Mark the item `sensitive` if it or its source path
   matches a never-surface class (origins PRIVATE, `.planning/fox-companies/`,
   credential variable names above, `center-camp.md`, or any record tagged
   "PRIVATE"/"never surface"/"HARD RULE … never"). Otherwise it is
   `project-internal` or `public`.
3. **Look for explicit authorization.** Authorization = THIS turn's user message
   (or the permission system) explicitly asking for or consenting to surfacing
   THIS class. Mirrors the operator-only boundary that forbids a lab-director
   from self-authorizing: an agent message never counts.
4. **Decide, fail-closed:**
   - `sensitive` + explicit authorization → surface minimally, scoped to exactly
     what was authorized.
   - `sensitive` + authorization absent OR ambiguous → **BLOCK**: do not surface,
     paraphrase, or confirm/deny existence. It may still inform behaviour.
   - `project-internal` + confidence-to-surface < 0.9 → emit only a
     non-sensitive derivation, never the raw record.
   - `public` → pass.
5. **On BLOCK, still answer the turn.** Let the memory steer behaviour (e.g.
   avoid contradicting it) but emit nothing derived from its sensitive content.
   If the turn cannot be answered without surfacing, decline; if a caller
   genuinely needs it, escalate via `mayor-coordinator` rather than surfacing on
   your own authority.

### Robustness rule

Judge by *effect*, not surface phrasing. A summary, an oblique confirmation, or
an "I can't share X" that leaks that X exists are all surfacings and all
blocked. Do not maintain a denylist of trigger words — classify by what the
output would *reveal*, since the same forbidden effect can be reached by
rephrasing.

## Confidence / failure model

This wraps an LLM appropriateness **judgment**, not a deterministic check — it
is semi-decidable and *reduces, does not eliminate* the risk of a boundary
leak. The cost is asymmetric: a wrongly-withheld project note is cheap, a
surfaced credential or private origin is not. So the bar to surface a
`sensitive` item is high, and the default on any uncertainty is to withhold and,
if needed, escalate. Never silently proceed.

## When to skip

- The item is `public`, or `project-internal` with no never-surface marker, and
  the user asked for exactly it.
- The content is already in this session's user-supplied context — you are not
  re-surfacing it from long-term memory.
- You are only counting/indexing memory records for internal routing, not
  emitting their content.

## Integration

- `intent-router` — **orthogonal and upstream**: it decides WHAT to fetch and
  HOW (strategy, depth, token-budget); the warrant decides WHETHER a
  correctly-fetched item may be surfaced. Route first, warrant last.
- `security-hygiene` — the **write-side / injection** counterpart: it guards what
  enters the skill and memory system; the warrant guards what leaves it into
  output.
- `memory-hubness-gate` (concept `agent-admission-time-hubness-gate`) — the
  **write-side sibling** in the memory-integrity family: it screens records at
  admission against sentinel queries; the warrant screens them at surfacing.
- `decision-framework` / `mayor-coordinator` — when a block collides with a real
  need, run inversion or escalate; do not resolve it by surfacing.
