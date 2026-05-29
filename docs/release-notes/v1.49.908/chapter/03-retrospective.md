# Retrospective — v1.49.908

## What Worked

**3-instance promotion took 6 ships from initial candidate (v902 → v907 → v908).** v902 was the 1-instance candidate; v907 was the 2-instance candidate; v908 closes it at 3-instance ESTABLISHED. This is faster than the v899 codify cycle (which promoted #10455 from 3 instances across v890+v896+v897 — 7 ships). The compressed cycle reflects the multi-chip session: chips ship every ~25-30 minutes once the wire shape is known.

**Mixed-mode methods (read-then-write) keep their write-side out-of-scope per #10457.** `ingestSessionLog(logPath)` reads an external file then writes records via the ingestTurn loop. Gating only the read (on logPath) is correct per the discipline — write-side is implicit in the contract.

**External-path-gated audits add fidelity without breaking the consolidated-gate pattern.** Most public methods in v908 gate on `this.storePath` (the class's wrapped scope). `ingestSessionLog` gates on `logPath` (an external file). Both shapes coexist within the now-ESTABLISHED v902 sub-variant — the discipline admits both scope-targets and external-path-targets depending on what the method reads.

## What Could Have Been Better

**No external test fixture for ConversationStore existed before v908.** I created `conversation-store.test.ts` from scratch for the LoaderContext block. This added some work but also exposes ConversationStore's behavior to the unit-test layer for future maintenance. A future ship might extend this test file to cover non-LoaderContext behavior — but that's out of scope for v908.

**init() is not gated and could silently read disk on first call.** `init()` is called by every public method (idempotent). On first call, it reads `this.indexFile`. The current public-method gates fire BEFORE init() so they cover the first-call read transitively — but if a write-side method (like `ingestTurn`) is the first to call init(), the index-read happens silently. Carry-forward: documenting "init() may read disk silently from write-side public methods" or adding a gate inside init() would close this gap. Not blocking — the threat surface is the storePath scope, and the index-read is bounded by it.

## Lessons Learned

See [04-lessons.md](04-lessons.md). v902's class-multi-method consolidated-gate sub-variant PROMOTES to ESTABLISHED at 3-instance (v902 + v907 + v908). The catalog at #10448 now formally lists this sub-variant.
