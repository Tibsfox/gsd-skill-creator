# Move Ranking

Rank suggested moves by these criteria, in order:

1. **Unblocking impact** — does this remove a blocker for other in-flight work?
2. **Context heat** — is the relevant code already loaded in the developer's
   head from the meeting discussion or recent activity?
3. **Cost vs information value** — cheap analysis runs that inform multiple
   decisions outrank expensive single-purpose missions.
4. **Risk reduction** — does this address a high-severity finding?

## Composition rule

A 3-5 move list should generally include:

- **1 high-impact unblock** — often a research mission or gate-clearing review
- **1 forward-progress move** — a vision or research mission for new work
- **1 cheap-fast-cleanup move** — an analysis run, an orphan pickup, a dismissal

If the project is in heavy-blocker territory (held gate + stalled missions +
high-severity findings), substitute the forward-progress move for a second
unblock. If the project is in light-blocker territory (no gate, no stalled
work), substitute the unblock for a second forward-progress move.

## Move format (from C00 SuggestedMove type)

```json
{
  "rank": 1,
  "title": "Investigate DACP/chipset coupling spike",
  "kind": "research",
  "rationale": "Probable root cause of the held CAPCOM gate. A 2.3× coupling baseline suggests architectural drift, not a localized bug — research will inform whether to refactor or accept.",
  "expected_unblocks": "Wave 2 calibration completion; clears the gate via informed decision instead of force",
  "source_findings": ["F-2026-0501-0023", "F-2026-0501-0024"]
}
```

Required fields:

- `rank` (int, 1-N where N ≤ 5)
- `title` (action-oriented imperative — starts with a verb)
- `kind` (`research` | `vision` | `review` | `analyze`)
- `rationale` (≥10 chars; the verifier hard-fails empty/stub rationales)
- `source_findings` (array of finding IDs; empty allowed ONLY when rationale
  explicitly notes "no prior evidence")

Optional:

- `expected_unblocks` (free text describing downstream effects)

## Move kinds

- **`research`** — produces a research mission package (LaTeX PDF) via
  `research-mission-generator`. Use for "we need to understand X" moves where
  the answer is not yet in the KB.
- **`vision`** — produces a builder mission package via `vision-to-mission`.
  Use for "build X" moves where the path forward is reasonably clear.
- **`review`** — a focused human review of an artifact. Use for gate clears,
  PR reviews, design doc reads. NOT for spec writing.
- **`analyze`** — runs the analyzer on a slice (snapshot diff, single section,
  cross-cutting heuristic). Cheapest kind; use for "we need data" moves.

## Examples

### Example 1: high-impact unblock with finding evidence

```json
{
  "rank": 1,
  "title": "Investigate DACP/chipset coupling spike",
  "kind": "research",
  "rationale": "F-2026-0501-0023 shows 2.3× baseline coupling; cleanup unblocks Wave 2 CAPCOM gate.",
  "expected_unblocks": "Wave 2 calibration; held gate informed clear",
  "source_findings": ["F-2026-0501-0023", "F-2026-0501-0024"]
}
```

### Example 2: forward-progress with KB precedent

```json
{
  "rank": 2,
  "title": "Pick up orphan silicon-perf draft",
  "kind": "vision",
  "rationale": "Draft is 14 days old (F-2026-0418-0007) but the topic is now hot — recent CAPCOM finding ties back to the same module. Resuming costs less than restarting.",
  "expected_unblocks": "silicon-perf mission package, ready for skill-creator",
  "source_findings": ["F-2026-0418-0007", "F-2026-0501-0023"]
}
```

### Example 3: forward-looking move (allowed empty source_findings)

```json
{
  "rank": 3,
  "title": "Snapshot diff since v1.49",
  "kind": "analyze",
  "rationale": "Drift hypothesis cannot be verified without a snapshot diff — no prior evidence in KB; this run produces the evidence.",
  "expected_unblocks": "informed prioritization for next meeting",
  "source_findings": []
}
```

The empty `source_findings` array is acceptable here ONLY because the
rationale explicitly notes "no prior evidence" — this signals the verifier
that the move is forward-looking and not a sloppy citation gap.

## Anti-patterns to avoid

- **"Investigate everything"** — too vague; pick a finding and anchor on it.
- **Moves without rationale** — fail the verifier; never persisted.
- **Cargo-cult source_findings** — listing finding IDs the move doesn't
  actually address. The verifier doesn't catch this; the developer will.
- **5 moves all of the same kind** — research-research-research-research-research
  is a planning failure, not a briefing. Mix kinds.
- **Burying the unblock** — the highest-impact move is rank 1. Don't put a
  cleanup at rank 1 because it's "easy" — easy moves go at the bottom.
