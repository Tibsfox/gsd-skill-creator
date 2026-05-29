# v1.49.879 — Retrospective

**Wall-clock:** ~10 min. Pattern reuse from v878 anthropic-chip made this very fast — both are class-based two-site hoisted-check.

## What went as expected

- Direct pattern reuse from v878. ~5 LOC source changes, ~25 LOC test changes.
- The retry loop's per-iteration hoist works correctly — each retry attempt is a distinct egress decision.
- Cross-audit ran clean automatically.

## What surprised me

- HttpClient's retry catch needed the #10427 re-throw INSIDE the try (clearTimeout(timeoutId) runs after). Order matters: re-throw FIRST so security denials don't trigger spurious retries.

## Verdict on scope

Track 5 progress: 4/6 closed. 2 chips remaining: skill-installer (401) + ipc (516). Track 5 close is imminent.

The class-instance two-site hoisted-check is now confirmed across v878 + v879 as a stable variant. Promotion-eligible alongside the other shared-helper variants at next codify.
