# W2 Inline-Recovery Procedure

**Closes Lesson #10194 candidate (added v1.49.590 T2.2; validated v1.49.590 ship; reaffirmed v1.49.591+).**

When a Sonnet W2 build agent dispatch is rate-limited mid-build (Anthropic per-account quota exhausted) and the ship deadline cannot wait for the typical ~1-hour quota refresh, fall back to **main-context Opus inline recovery** as a tested-acceptable mitigation.

## Trigger conditions

- `Error: rate_limit_exceeded` from Sonnet subagent during W2-MUS or W2-ELC build
- Ship deadline within current session (cannot defer to next session)
- Quota-failed file count > 0 against gold-standard predecessor

## Procedure

1. **Identify quota-failed files** — count files in `www/tibsfox/com/Research/{TRACK}/<version>/` vs gold-standard predecessor `<version-0.01>/`.
2. **For each missing file**, main-context Opus authors using gold-standard predecessor as reference.
3. **Per-file budget:** 3-7K output tokens; **MUST use incremental Edit operations** (3-12 Edits per file per T2.4 from v1.49.589) — single Write of large files risks 32K output cap silent-truncation.
4. **After all files exist**, run `npm run depth-audit -- <version> --json` to score depth.
5. **Acceptance:** zero FAIL findings (≥80% predecessor depth); WARN findings (80-95%) acceptable for ship; PASS findings (≥95%) ideal.

## Quality tradeoff (citation-anchored from v1.49.589 W2)

| Recovery path | Predecessor depth ratio | Verdict |
|---|---|---|
| Sonnet subagent (normal W2) | 95-113% | PASS |
| Inline Opus (recovery fallback) | 78-89% | WARN |
| Single Write attempt at >100 lines | 0% (silent truncation) | FAIL — never use |

## Acceptable-as-recovery framing

Inline recovery is a *fallback* when ship deadline cannot wait, NOT the default. Subsequent milestones' Sonnet-driven W2 should re-establish 95%+ depth. v1.49.589 demonstrated zero FAIL findings under inline recovery — pattern is validated for emergency use only.

## Why this lives outside CLAUDE.md

This procedure is human-judgement-driven (deciding when to invoke; choosing which files to author first; setting per-file budgets) — it is not scriptable. Promoting it to a script would be over-fitting; keeping it as discoverable runbook prose is the right level.

The CLAUDE.md hot context is reserved for invariants and pointers. Recovery procedures live here so they are findable when the trigger fires (search "W2 quota" in `docs/release-pipeline/`) without bloating the agent's working context for every session.
