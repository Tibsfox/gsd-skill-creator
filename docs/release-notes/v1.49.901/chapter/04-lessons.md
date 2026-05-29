# Lessons Emitted — v1.49.901

One NEW lesson promoted from 3-instance carry-forward. Single-promotion counter-cadence ship.

## NEW — Lesson #10458: Fake-fixture wire test pattern

**Status:** PROMOTED-TO-ESTABLISHED at v1.49.901 (was 3-instance carry-forward since v874).

**Evidence (3 instances):**

| Ship | File | Fake fixture | Wire under test |
|---|---|---|---|
| v1.49.872 | `src/cli/commands/pic2html.test.ts` | `fake.png` (4 bytes: `[0x89, 0x50, 0x4e, 0x47]` — PNG magic) | ProcessContext spawn of `sh`/`python3` via PIL |
| v1.49.874 | `src/learn/acquirer.test.ts` | `fake.zip` (4 bytes: `[0x50, 0x4b, 0x03, 0x04]` — ZIP magic) | ProcessContext exec of `unzip` for archive extraction |
| v1.49.874 | `src/learn/acquirer.test.ts` | `fake.docx` (4 bytes: `[0x50, 0x4b, 0x03, 0x04]` — ZIP magic since docx is ZIP-format) | ProcessContext exec of `unzip` via docx-extraction path |

**The pattern:** When a wire test exercises a chokepoint check but doesn't need real data, use a minimal fake-bytes fixture with the correct extension and 4-byte magic signature. The chokepoint gate fires synchronously before the side-effecting operation — the fact that the operation would fail on the fake data never matters because the security throw happens first.

**Why this is a distinct lesson from #10456 (audit-record-count):** #10456 specifies WHAT to assert (exactly N records under N invocations). #10458 specifies HOW to construct the FIXTURE that enables the assertion (minimal bytes that route through the right code branch). They pair: a wire test typically uses a fake-fixture (Template 6) to drive multiple invocations and an audit-record-count assertion (Template 5) to verify the chokepoint fidelity. Both are necessary for a complete wire test; neither subsumes the other.

**Magic-byte signature catalog (in canonical doc):** `.png` / `.zip` / `.docx` / `.pdf` / `.gz` — each with the 4 bytes that route through the right type-detection branch. Add new entries when a chip surfaces a new extension.

**Anti-patterns (in canonical doc):**

- Constructing a real valid file when the chokepoint gate fires first (wastes 10-100x LOC + adds dependency surface).
- Asserting on processing-result success in a permissive-mode wire test (the fake fixture WILL fail processing; wrap in `.catch(() => {})` with explanatory comment).
- Skipping the magic-byte signature when the gated code path uses file-type detection (zero-byte / wrong-extension files trigger a different code branch, bypassing the chokepoint).
- Real-file fixtures committed to the repo (bloat + maintenance debt; generate in `beforeAll`, clean up in `afterAll`).

**Codification placement:** `docs/test-discipline/cf-closure-verification-templates.md` as Template 6 — added in this ship.

**Cross-references:** #10456 (audit-record-count) / #10442 (hoist above swallow-catches) / #10448 (shared-helper hoist sub-variant catalog) / #10427 (failure-mode contracts).

## Carry-forward backlog after v901

The codify-axis carry-forward stood at ~14 candidates going into v901. With #10458 absorbed, the backlog is now ~13 candidates. No new 1-instance candidates emerged from v901 (doc-only ship). The next counter-cadence codify cycle remains targeted at v910-ish.

## Cross-references

- #10456 (Audit-record-count assertion) — pairs with #10458 for complete chokepoint wire tests
- #10442 (Failure-mode contracts — hoist gates ABOVE swallow-catches)
- #10448 (Shared-helper hoist sub-variant catalog)
- #10427 (Failure-mode contracts)
- v1.49.872 retrospective — first fake-fixture instance (`fake.png` for pic2html ProcessContext wire)
- v1.49.874 retrospective — strengthening instances (`fake.zip` + `fake.docx` for acquirer ProcessContext wires)
- v1.49.886 retrospective — first candidate-named-with-blocker mention (test-discipline disciplines.json entry not yet established)
- v1.49.899 retrospective — fake-fixture pattern named in carry-forward as "could be picked up directly as a 1-ship codify"
