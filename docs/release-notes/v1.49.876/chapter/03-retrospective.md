# v1.49.876 — Retrospective (Track 5 opens)

**Wall-clock:** ~10-12 min from v875 ship close. First Egress chip; transferred patterns from v863-v867 cluster cleanly.

## What went as expected

- **Two-site hoisted-check pattern from v867 applied directly.** Same shape: hoist before each fetch in the file. No new structural decisions needed.
- **Egress signature is slightly different from Process** — `ensureEgressAllowed(ctx, source, op, target)` vs `ensureProcessAllowed(ctx, source, op, target, argv)`. TypeScript caught the signature mismatch immediately during build; fixed in ~30 seconds.
- **Cross-audit ran clean automatically.** KNOWN_UNWIRED Egress dropped 6 → 5.

## What surprised me (mildly)

- **fetchReadme's catch is result-wrapping (non-fatal).** The original code returned nulls on any error. I moved the hoist OUTSIDE the try/catch so security denial blocks the readme attempt regardless of the fallback. This is the same #10427 pattern as v863's terminal/health.ts (fault-tolerant accessory; hoist outside try).

## Verdict on scope

Track 5 opens cleanly. Pattern reuse from v863-v867 makes the Egress cluster lower-friction than Track 4 (which surfaced 5 distinct wire shapes). Track 5 will likely exercise more variants of two-site hoisted-check + hoist-at-top + the DI-fetch-wrapper from v866.
