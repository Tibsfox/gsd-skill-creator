# Retrospective — v1.49.906

## What Worked

**Two-site on same path preserves audit signal.** `loadKnownGoodHashes` gates existsSync THEN readFileSync on the same `filePath`. Both gates fire when the file exists; only the first fires when it's missing. This preserves a meaningful signal in the audit log: "was the file checked or actually read?" The variable count (1 vs 2 audits) is information, not noise.

**Sibling-chokepoint coexistence works at a 2nd-instance file.** v903 keystore.ts was the first file to carry both ProcessContext + LoaderContext. v906 emulated-scanner.ts is the second. The pattern from v903 (separate optional params, no aggregation) generalizes cleanly. Per #10449, sibling chokepoints stay separate — and this is starting to look like a stable convention.

**Mocking existsSync didn't break the LoaderContext gate.** The test file mocks `existsSync`; my gate calls `ensureAllowed` BEFORE existsSync, so the gate fires regardless of the mock. The audit-record-count assertions worked first time.

## What Could Have Been Better

**Three different ProcessContext+LoaderContext files would suggest formalizing the dual-ctx idiom.** v903 + v906 are 2 instances. A 3rd instance (likely from one of the remaining 3 KNOWN_UNWIRED entries) would surface this as a stable pattern. Carry-forward: watch for it.

## Lessons Learned

See [04-lessons.md](04-lessons.md). No new manifest-promoted lessons; v906 reinforces #10448 (sync multi-site), #10449 (2nd-instance dual-ctx), #10456 (7th variant).
