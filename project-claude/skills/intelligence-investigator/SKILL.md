---
name: intelligence-investigator
description: |
  Generate intelligence briefings for the planning dashboard. Use this skill
  whenever a request file appears in `.planning/console/inbox/pending/` whose
  `type` field starts with `intelligence.` (refresh_briefing, triage_finding,
  snapshot_diff, investigate_section, dismiss_finding). The skill reads the
  per-project KB at `.gsd/intelligence/intelligence.db`, synthesizes a briefing
  with a causal hypothesis + acknowledged uncertainty + confidence label and
  ranked moves, then writes the result back to the KB. Always trigger this
  skill for these request types — do not generate briefings manually.
allowed-tools: Read, Glob, Bash(sqlite3:*), Bash(git:*), Bash(node:*), Bash(bun:*), Write
---

# Intelligence Investigator

You are responsible for generating planning briefings for the GSD intelligence
dashboard. The dashboard surfaces these briefings to the developer at the start
of every planning meeting. You run inside a gsd-skill-creator session that is
already watching `.planning/console/inbox/pending/`.

## When to activate

Activate when you find a file matching `req_*.json` in
`.planning/console/inbox/pending/` whose `type` field starts with
`intelligence.`:

- `intelligence.refresh_briefing` — full project briefing refresh
- `intelligence.triage_finding` — single finding deep-dive
- `intelligence.snapshot_diff` — explain what changed between two snapshots
- `intelligence.investigate_section` — investigate a specific section of code
- `intelligence.dismiss_finding` — record a dismissal with rationale

## Process

### 1. Parse the request

Read the request file. Extract `id`, `type`, `project`, `branch`, `payload`,
`respond_to`, `timeout_hint_ms`. The request fields define the scope:

- `payload.since_snapshot` — for diff-based requests
- `payload.scope` — list of section/file globs to focus on
- `payload.conversation_text` — recent dashboard discussion (already redacted)
- `payload.finding_id` — for triage requests

### 2. Load KB context

Run `bash scripts/load-kb-context.sh <project>` to extract a redacted JSON
context summary. The script:

- Reads top 30 findings by `severity × confidence` from the per-project DB
- Reads in-flight bundles + decisions
- Reads recent meeting record paths (last 3)
- Reads recent snapshot diffs (last 3)
- **Redacts secrets** (API keys, tokens, password fragments, SSH keys) before
  emitting context (S14, D-25-31)
- **NEVER** emits raw source-file content (D-25-30)

The output is structured JSON; parse it before reasoning.

### 3. Synthesize briefing

Following `references/briefing-format.md`, write a briefing of 2-3 paragraphs
that:

1. Opens with what's currently happening (1-2 sentences)
2. Proposes at least one **causal hypothesis** ("Coupling spike between X and
   Y is probably driving the held gate, because…")
3. Acknowledges at least one **uncertainty** ("It's unclear whether the
   calibration modules can land before the gate clears")
4. Ends with a **confidence label**: `low`, `medium`, or `high`
   (See `references/confidence-calibration.md` for guidance)

A briefing without a causal hypothesis or without an acknowledged uncertainty
fails verification. Do not produce summary-only briefings.

### 4. Rank suggested moves

Following `references/move-ranking.md`, propose 3-5 ranked next moves. For each:

- **rank** (1 = highest priority)
- **title** (action-oriented: "Investigate X", "Clear Y", "Pick up Z")
- **kind** (`research`, `vision`, `review`, or `analyze`)
- **rationale** (1-2 sentences explaining *why this move now*, citing source findings)
- **expected_unblocks** (what becomes possible if this move succeeds)
- **source_findings** (list of finding IDs that motivated this move)

A move without a rationale fails verification. A move that doesn't reference
any source findings is acceptable only if it's a forward-looking move (e.g.,
"Snapshot diff to see what's drifted") — its rationale must explicitly note
"no prior evidence".

### 5. Self-check the briefing

Run `bun scripts/verify-briefing.ts <briefing-json-path>` (or `node` if bun is
unavailable). Exit 0 = pass; exit 1 = fail with violation list.

If self-check fails:

1. Do **not** proceed to step 6 (KB write). The briefing must NOT be persisted.
2. Write a status file with `status: "failed"` to `respond_to`. Include the
   violation list in `error`.
3. End the run.

D-25-28: Every briefing MUST contain causal hypothesis pattern + uncertainty
pattern + valid confidence label. Failed self-check → no KB write.

### 6. Write briefing to KB

Run `node scripts/write-briefing.ts <projectId> <briefing-json-path>`. The
script:

- Validates required fields (causal hypothesis, uncertainty, confidence)
- Calls `kb.writeBriefing()` with the briefing payload
- Emits `{ "briefing_id": "B-..." }` to stdout

The web tool picks up the new briefing via the `intelligence:briefing_ready`
event.

### 7. Write status to outbox

Write a JSON status file to the path in the request's `respond_to` field:

```json
{
  "request_id": "req_2026-05-02_1430_c8e1",
  "status": "complete",
  "briefing_id": "B-2026-0502-1430",
  "completed_at": "2026-05-02T14:31:42Z"
}
```

For triage_finding / dismiss_finding requests, the status payload may also
carry `decision_id` if a recommendation was committed.

### Failure paths

If you cannot produce a briefing meeting the verification criteria:

- Write a status with `"status": "failed"` and an explanation in `error`.
- Do **not** produce a partial briefing. Half-briefings degrade dashboard trust.

If `timeout_hint_ms` is approaching (>80% elapsed) and you have not finished:

- Write a status with `"status": "failed"` and `"error": "timeout"`.

## Critical constraints

- **Never return briefing content inline to the requestor.** Always write to KB.
- **Never include raw file contents in your reasoning context.** Work from KB
  findings only. The `load-kb-context.sh` script enforces this.
- **If KB context indicates redacted secrets**, treat the redaction as
  intentional. Do not attempt to reconstruct or guess at masked values.
- **Confidence labels must be honest.** Don't label `high` if the data is thin.
  See `references/confidence-calibration.md` for thresholds.
- **No causal hypothesis = failed self-check = no KB write.** Treat the
  causal-hypothesis requirement as a hard gate, not an aesthetic suggestion.
- **No source-file reads.** This skill works from KB findings only — the
  analyzer pipeline already redacted secrets and condensed source ranges into
  rationales. Bypassing this layer reintroduces secrets to the AI's context.

## Reference files

- `references/briefing-format.md` — briefing structure with examples (good +
  two bad examples)
- `references/move-ranking.md` — how to rank suggested moves
- `references/kb-queries.md` — common KB query patterns (sqlite3-CLI compatible)
- `references/confidence-calibration.md` — when to label low / medium / high
