# v1.49.874 — ProcessContext singleton chip: `src/learn/acquirer.ts`

**Released:** 2026-05-28

## Why this ship

Track 4 chip #5. Size-ascending picks acquirer.ts (509 LOC, 9 spawn sites across 6 helpers) after v873's pre-flight.ts (363 LOC). First chip in the upper-mid LOC band; introduces a `safeExecFile` module-internal helper that pairs `ensureProcessAllowed` with `execFileSync`. All 9 spawn sites refactor to single-line `safeExecFile(ctx, command, args, opts)` calls.

## What's in this ship

- **Wire shape:** module-internal-helper with safeExecFile wrapper (variant of #10433).
- **Audit target accuracy:** records actual binaries (unzip/tar/git/curl/pdftotext) — better than v870-v873 shell-exec which records target='sh'.
- **#10427 application:** 3 re-throws across fault-tolerant extractor catches (pdftotext fallback, docx error path, epub error path).
- **Test coverage:** 3 new cases verifying default behavior + denial + audit threading with target=unzip.

## Engine state

NASA degree 1.178 (UNCHANGED — 92 consecutive ships).
Counter-cadence count 6 (UNCHANGED).
Manifest entries 23 (UNCHANGED). Lessons 85 (UNCHANGED).
KNOWN_UNWIRED Process: 2 → 1. Egress: 6 (UNCHANGED).
Wired calibratable thresholds: 5 of 7 (UNCHANGED).
UNCODIFIED 39 ≤ 41 (UNCHANGED).
