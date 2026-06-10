# v1.49.1028 — Lessons

No new manifest lesson promoted this ship. Two candidates observed (below); manifest holds at 152.

**Lesson candidate (1st observation):** *"The first real parse of an unobserved surface is itself an
audit."* Populating `.skill-index.json` forced the first strict YAML+zod parse of the installed skills
tree and surfaced three latent defect classes in one run: a validator schema inverted against its own
corpus (object-form `triggers` accepted, array form used by 36/36 source skills rejected), an
abort-on-first-error batch path, and 2 months-old YAML frontmatter defects masked by a lenient consumer.
Corollary: when wiring measurement into a previously-unmeasured surface, budget for the measurement
finding rot — don't treat the wire as a one-line task. Promote if observed again.

**Lesson candidate (1st observation):** *"Minimal fixtures validate the code path, not the corpus."*
Executor B's tests were green against minimal SKILL.md fixtures while the real installed tree was 92%
unparseable by the same code path. Real-corpus smoke (one read-only run against the live surface) belongs
in the verification step of any ship that consumes a production corpus. Promote if observed again.

## Applied (existing lessons)

- **C6 adjudication (audit §6.3):** 13 differs = 11 stale + 2 intentional marker blocks; NEVER blanket
  `--force`. Applied verbatim — the deploy enumerated exactly 11 `--only` targets.
- **#10461 gate-enforce-every-runnable-surface + drift-guard pairing:** install-parity test is named
  `*.test.ts` (root vitest project → gate step 2 + CI) with the drift-guard layer pinning committed
  expectations; no new gate step added (per the promotion-debt lesson).
- **v1027 gotcha — `adversarial-ship-review.mjs` args are `{base, intent}`:** run with
  `base: "v1.49.1027"`, not the silently-ignored `baseRef` (which would have reviewed only the last
  commit and missed the cross-commit findings).
- **Known-flake protocol (m2/substrate timing class):** re-run in isolation before classifying; green
  20/20 → not a content regression.
- **Design-pass-first (D4) + bounded one-component dispatches + SendMessage follow-on (ship-1 QA path):**
  two executors, 42/47 tool uses, commit-per-deliverable, one follow-on fix dispatch.
- **Chokepoint discipline (ProcessContext/LoaderContext):** new CLI command file deliberately named
  `activations.ts` (outside the loader-basename regex); corpus access reuses the already-wired amiga
  transcript reader; both audits green (2,120 tests).
- **Lesson #10202 (gh `-R` flag) + git-add-blocker pairing + no Co-Authored-By trailers:** applied across
  all commits and the T14 chain.

## Process notes

- The `--write` failure printed the zod error but the index file was left untouched — the abort happened
  in `refresh()`'s new-skills discovery loop (`.parse()` with no per-skill catch), upstream of any save.
  The fix wraps per-skill reads and reports skips honestly; a zero-entries rebuild now exits 1.
- The review's "36/36" counter-claim vs the code comment's "34/37" was a measurement-time artifact: 34/37
  was true pre-YAML-repair (2 skills unparseable), 36/36-source true post-repair. The corrected comments
  state both denominators explicitly (source vs installed) so the next reader doesn't relitigate it.
- `install.cjs --dry-run` exits 1 in the steady state (2 intentional differs produce warnings) — the
  parity test asserts on parsed output, not exit code. Documented in the test header for the next person
  who "fixes" it.
