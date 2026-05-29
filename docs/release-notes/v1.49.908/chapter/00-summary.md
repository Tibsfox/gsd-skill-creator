# v1.49.908 — Fourteenth LoaderContext Chip: `memory/conversation-store.ts`

**Released:** 2026-05-29

## Why this ship

Continues the multi-chip LoaderContext campaign. With `file-store.ts` chipped at v907, `memory/conversation-store.ts` (531 LOC) is the next size-ascending entry. The file is a `ConversationStore` class in the same memory-store family as `FileStore` — and exhibits the same structural shape that v902 + v907 already established. v908 is the 3rd instance of v902's class-multi-method consolidated-gate sub-variant, **PROMOTING it to ESTABLISHED** per #10448 catalog discipline.

## What's in this ship

- **`src/memory/conversation-store.ts`** UPDATED:
  - `ctx?: LoaderContext` added as optional 2nd constructor parameter on `ConversationStore(config, ctx?)`. Stored as `private readonly ctx?: LoaderContext` (per #10455 idiom).
  - `LOADER_SOURCE = 'memory/conversation-store'` constant.
  - 3 pure read methods gate on `this.storePath`:
    - `search(query, limit, sessionFilter)`
    - `listSessions()`
    - `getStats()`
  - Mixed-mode `ingestSessionLog(logPath, sessionId?)` gates on its `logPath` parameter BEFORE the readFile. Subsequent ingestTurn-loop writes are out-of-scope per #10457.
  - Write-only methods (`ingestTurn`, `endSession`, `init` mkdirs) NOT gated — out-of-scope per #10457.
- **`src/memory/conversation-store.test.ts`** NEW (9 tests, all LoaderContext integration):
  - search/listSessions/getStats each emit 1 audit per call.
  - ingestSessionLog gates on logPath BEFORE readFile.
  - LoaderContextDenied propagates from public read.
  - ingestTurn/endSession emit 0 audits (write-side).
  - 9th #10456 variant: 3 audits under {search + listSessions + getStats}.
  - Legacy permissive mode preserves prior behavior.
- **`src/security/loader-context-audit.test.ts`** UPDATED:
  - `KNOWN_UNWIRED` set: `'src/memory/conversation-store.ts'` removed (2 → 1 entry).
  - 3-instance promotion of v902 sub-variant documented in chip-down note.

## Wire shape — 3-INSTANCE PROMOTION

**Class-multi-method consolidated-gate is now ESTABLISHED.** Three instances close the promotion:

| Instance | File | Public read methods | Scope |
|---|---|---|---|
| v902 | `orchestrator/state/state-reader.ts` | 1 (`read`) | `this.planningDir` |
| v907 | `memory/file-store.ts` | 5 (`list`, `count`, `has`, `get`, `query`) | `this.memoryDir` |
| **v908** | `memory/conversation-store.ts` | 3 (`search`, `listSessions`, `getStats`) + 1 mixed (`ingestSessionLog`) | `this.storePath` + `logPath` |

The wire mechanics across all 3 instances are identical: class-stored `private readonly ctx`, hoist `ensureAllowed` at top of each public read method on the class's wrapped scope, transitive private fs ops inherit the gate, write-side methods out-of-scope per #10457.

**Generalization:** the sub-variant covers M public read methods orchestrating N private fs ops on a class-wrapped scope. M ranges from 1 (v902) to 5 (v907) without structural change.

**Mixed-mode contribution:** v908 adds a new sub-shape — when a public method reads from an EXTERNAL path (not the class's wrapped scope), gate on that external path rather than the scope. `ingestSessionLog(logPath)` gates on `logPath`, not on `this.storePath`. This preserves audit fidelity for cross-scope reads.

**Audit emission shape (9th #10456 variant):** 1 audit per public read-method call; scope-target or path-target depending on the method's read source. {search + listSessions + getStats} = 3 audits.

## What this ship is

- A forward-cadence security-chokepoint chip per #10432.
- **The 3rd instance of v902's class-multi-method consolidated-gate sub-variant — PROMOTES to ESTABLISHED.**
- A 9th #10456 audit-record-count variant.
- A new mixed-mode sub-shape (external-path-gated) within the now-ESTABLISHED v902 sub-variant.
- KNOWN_UNWIRED Loader 2 → 1.

## Engine state

- NASA degree: **1.178** (126 consecutive ships).
- Counter-cadence count: **10** (UNCHANGED).
- Manifest entries: **23** (UNCHANGED).
- Lessons in manifest: **99** (UNCHANGED — promotion to ESTABLISHED does NOT add a new lesson; it changes the catalog status of the existing #10448 sub-variant).
- KNOWN_UNWIRED Process: **0** (UNCHANGED).
- KNOWN_UNWIRED Egress: **0** (UNCHANGED).
- **KNOWN_UNWIRED Loader: 2 → 1** (-1).
- Wired calibratable thresholds: **7 of 7** (UNCHANGED).
- Pre-tag-gate step count: **18** (UNCHANGED).
- Operational axes: **4** (UNCHANGED).
