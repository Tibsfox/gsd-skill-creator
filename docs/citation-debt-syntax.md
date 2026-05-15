# V-Flag Emit / Close / State-Change Syntax

**Status:** normative as of v1.49.653 (L-03 Phase 1).
**Consumed by:** `tools/citation-debt/scan-retrospectives.mjs --write-diff`.
**Applied by:** `tools/citation-debt/apply-diff.mjs`.

This document specifies the formal markdown syntax for V-flag lifecycle events
in `docs/release-notes/v*/chapter/03-retrospective.md`. The scan tool parses
these blocks to build a proposed-diff JSON; the apply tool consumes the diff
and updates `.planning/citation-debt.json`.

Informal prose mentions of V-flag IDs (e.g. "this closes V-20" in narrative
text) are still surfaced by the scan tool's informal-mention path but do
**not** flow through to the ledger automatically. Only the formal blocks
below trigger ledger mutations.

---

## 1. Emit a new V-flag

When a milestone surfaces a citation that cannot be verified at W1 and needs
durable tracking, the retrospective MAY include an emit block:

```markdown
### V-flag emit: V-26

- target: Sonics 1965 Kearney Barton session log
- reason: physical-archive
- source_file: null
- follow_up_action: Email ethnoarc@uw.edu OR call (206) 543-0974
```

**Required keys:** `target`, `reason`, `follow_up_action`.
**Optional keys:** `source_file`, `source_line`.

**Allowed `reason` values** (matching the ledger's `deferred_reason` field):

| Value | Meaning |
|---|---|
| `paywalled` | Source behind subscription paywall (e.g. Wiley J. Zool.) |
| `physical-archive` | Source requires in-person archive visit or phone inquiry |
| `vendor-inquiry` | Source held by a vendor / agency awaiting data request |
| `research-time-cost` | Located in published source but requires time to extract specific page |

**V-flag ID format:** `V-<integer>` for new top-level entries (e.g. `V-26`),
or `V-<integer>-<SUFFIX>` for related sub-entries grouped under a parent
reason (e.g. `V-9-MTR`, `V-9-NCSC`, `V-9-OLY` for three NPS Inventory & Monitoring
data requests sharing the V-9 anchor).

ID assignment: the author chooses the ID. The scan tool validates uniqueness
against the current ledger; collision → error at scan time.

---

## 2. Close a V-flag (status → RESOLVED)

When a previously open V-flag is fully closed:

```markdown
### V-flag close: V-20 → RESOLVED

- evidence: Located in Mudgway SP-4227 chapter 4 pp. 152-156 via NTRS retrieval 2026-05-10
```

**Required keys:** `evidence`.
**Optional keys:** `closing_milestone` (defaults to the containing retrospective's milestone).

After close, the entry's `status` is set to `RESOLVED`, `last_updated` is set
to today, and a `resolution_note` field is added with the evidence text.

---

## 3. State-change a V-flag (any transition)

For transitions other than → RESOLVED (e.g. `PARTIAL` → `COVERED`, or
`DEFERRED` → `PARTIAL`):

```markdown
### V-flag state: V-9-MTR → COVERED

- evidence: NPS I&M data received from MORA park ecologist 2026-05-10; awaiting per-lake breakdown
```

**Required keys:** `evidence`.
**Allowed target states:** `DEFERRED | PARTIAL | COVERED | RESOLVED`.

State transitions update the entry's `status` field and append a
`status_history` entry (the apply tool maintains this).

---

## 4. Parse rules (scan-retrospectives.mjs)

The parser is strict — only properly-shaped blocks trigger ledger actions.

1. Block header pattern (anchored at column 0): `^### V-flag (emit|close|state): V-<ID>( → <STATUS>)?$`
2. After header, parse `- <key>: <value>` bullets until blank line or next `## *` header.
3. Required keys must be present.
4. Unknown keys are ignored with a warning (forward-compatibility).
5. `null` value (literal string `null`, no quotes) maps to JSON null.
6. Multi-line values: not supported. Keep each value on one line. If long,
   use a follow-up paragraph below the bullets (the parser ignores it).
7. Headers nested under deeper `####` are not parsed (intentional —
   keeps the formal-block pattern at the section level).

---

## 5. Why this syntax

The scan tool needs to distinguish three things in retrospective prose:

1. **Informal mention** — "this closes V-20" in a narrative paragraph. No
   action needed; we just want the operator to know the mention exists.
2. **Formal lifecycle event** — author intentionally signaling that the
   ledger should be updated.
3. **False positive** — incidental ID-shaped strings like `FA-647-15` (FA
   prefix) or `V-1.0-rc` (RC label).

The `### V-flag <action>:` header form is specific enough to catch (2)
reliably while excluding (1) and (3). Authors who want to mention a V-flag
without triggering a ledger update should use inline prose; authors who
want to update the ledger use the formal block.

---

## 6. Round-trip example

Input retrospective fragment:

```markdown
## Closing notes

The v1.49.582 audit located the Mudgway page numbers we'd been chasing
since v1.49.583; we can now retire V-20.

### V-flag close: V-20 → RESOLVED

- evidence: Located in Mudgway SP-4227 chapter 4 pp. 152-156 via NTRS retrieval 2026-05-10

Reading the chapter confirmed the antenna-pointing operations match
our earlier W1 narrative.
```

Scan output (`.planning/citation-debt-proposed-diff.json`):

```json
{
  "scan_date": "2026-05-15",
  "scanned_versions": ["v1.49.582"],
  "proposed_actions": [
    {
      "kind": "close",
      "v_flag_id": "V-20",
      "to_status": "RESOLVED",
      "evidence": "Located in Mudgway SP-4227 chapter 4 pp. 152-156 via NTRS retrieval 2026-05-10",
      "closing_milestone": "v1.49.582"
    }
  ]
}
```

Apply tool reads this + current ledger, prompts operator (or auto-confirms),
writes updated ledger with `V-20.status = "RESOLVED"`, `V-20.last_updated = "2026-05-15"`,
and `V-20.resolution_note = "<evidence>"`.

---

## 7. Authoring discipline

- Write the formal block in retrospective `03-retrospective.md`, near the
  end of the chapter (after the prose narrative).
- Author the prose narrative explaining *why* the V-flag is being
  emitted/closed/state-changed; the formal block is the *machine-readable
  trace* of that decision, not a replacement for the prose.
- The scan tool runs at pre-tag-gate step 11 (citation-debt-sync) WARN-only;
  set `SC_PRE_TAG_GATE_REQUIRE=citation-debt-sync` to block on activity
  that hasn't yet flowed to the ledger.
