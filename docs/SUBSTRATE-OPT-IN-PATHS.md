# Substrate Opt-In Paths

**Surface:** A new operator's first 30 minutes after a clean clone +
operator who has been running gsd-skill-creator at defaults and wants
to know what else is available.

**Codified at:** v1.49.805 (Strengthening Lever S4 promotion — built on
the 2026-05-26 core-functions audit retrospective).

---

## Why this document exists

`docs/GETTING-STARTED.md` covers the install + first ship workflow.
`docs/MODULE-DEFAULTS.md` lists *which* modules are on/off by default
with their flag names. This document fills the gap between those two:
**per-module, why you'd turn this on, what it costs, what it unlocks**.

The audience is operators who have done the first ship cycle and want
to know which optional substrates are worth their attention next.

---

## How to read this document

Each substrate has four fields:

1. **What it unlocks** — the operator-visible behaviour gained by opting
   in.
2. **What it costs** — concrete cost (latency, memory, wall-clock per
   operation, new failure surface).
3. **Opt-in mechanic** — exact flag name + value (cross-references
   `docs/MODULE-DEFAULTS.md` for the canonical list).
4. **When to defer** — concrete signal that you do NOT need this yet.

Substrates are grouped by axis: **observability**, **learning**,
**execution**, **safety**.

---

## Observability substrates

### Bounded-learning audit log (default OFF for tests; default ON for CLI)

- **Unlocks:** every `skill-creator bounded-learning` invocation appends
  one JSON line to `.planning/patterns/bounded-learning-log.jsonl`,
  forensic-grade history of every calibration tick.
- **Costs:** one file append per CLI call (~µs). File grows ~200 bytes
  per tick. No size cap; operator manages rotation.
- **Opt-in:** ON by default in the CLI; disable via `--no-audit-log`
  flag per invocation, or `--audit-log /dev/null`.
- **Defer if:** you don't run `bounded-learning` interactively (the loop
  is only useful when you'll inspect the history).

### Token-budget events log (opt-in via skill prompt)

- **Unlocks:** `/sc:status` records `responsive`/`ignored` operator
  outcomes after a token-budget warn line, feeding the calibration loop
  for `token_budget.warn_at_percent`.
- **Costs:** one JSON line appended per status invocation that emits or
  follows up on a warn. Best-effort silent — never blocks `/sc:status`.
- **Opt-in:** Step 4.6 in `/sc:status` skill prompt (active by default
  once /sc:status is installed via `project-claude/install.cjs`).
- **Defer if:** you rarely cross the token-budget warn line (no signal
  to record).

### Bounded-learning log query subcommand (v804+)

- **Unlocks:** read-side surface for the two append-only JSONL logs.
  `skill-creator bounded-learning --query --log audit|events --last N
  --since <ISO> --threshold <key> --kind <responsive|ignored>`.
- **Costs:** O(file-size) read per invocation; no caching.
- **Opt-in:** none — always available once `bounded-learning` is
  reachable.
- **Defer if:** you do not need to introspect the logs (they accumulate
  whether you query or not).

---

## Learning substrates

### Sensoria net-shift receptor (M6)

- **Unlocks:** Lanzara-2023 receptor-substrate model gives skills a
  reversible adaptation surface for non-stationary task distributions.
- **Costs:** memory overhead per skill (~hundreds of bytes); per-shift
  rebound CPU spike on receptor transition.
- **Opt-in:** `sensoria.enabled` flag in `.claude/gsd-skill-creator.json`.
- **Defer if:** your task distribution is stationary across sessions
  (the receptor will idle but allocate).

### Orchestration multi-turn retrieval + selector (M5)

- **Unlocks:** prefix-cache + multi-turn-retrieval + selector that
  routes across skills.
- **Costs:** per-turn selector cost (~ms); prefix-cache memory
  overhead grows with conversation depth.
- **Opt-in:** `orchestration.enabled` flag.
- **Defer if:** you run single-turn skill invocations or the selector
  routing decision is consistently obvious.

### ACE actor-critic wire (MA-2)

- **Unlocks:** M7 ΔF (variational free-energy delta) wires into the M5
  selector — selector learns from belief-update magnitude rather than
  manually-curated routing tables.
- **Costs:** depends on `orchestration.enabled`; adds critic-update
  pass per turn. Bounded-learning of the actor weights.
- **Opt-in:** `orchestration.ace.enabled` flag.
- **Defer if:** the manual selector routing is good enough; the actor
  needs ~50+ turns to outperform a fixed routing table.

### Stochastic selection (MA-3 + MD-2)

- **Unlocks:** softmax / ε-greedy exploration over skill routing —
  selector is no longer purely greedy.
- **Costs:** mild exploration tax (~ε of routes go to suboptimal
  skills). Bounded by ε-decay schedule.
- **Opt-in:** `orchestration.stochastic.enabled` flag.
- **Defer if:** routing is stationary and you trust the actor's greedy
  choices.

### Lyapunov K_H adaptation (MB-1) + projection (MB-2) + dead-zone (MB-5)

- **Unlocks:** Sastry-Bodson-1989 stable adaptation of receptor gains
  with projection operators that bound the parameter space and
  dead-zones that suppress chatter near the operating point.
- **Costs:** small per-update CPU; convergence-bounded by Lyapunov
  proof.
- **Opt-in:** three flags (`sensoria.lyapunov.enabled`,
  `lyapunov.projection.enabled`, `lyapunov.dead_zone.enabled`) —
  designed to be enabled together.
- **Defer if:** you do NOT have `sensoria.enabled` (Lyapunov adapts
  the sensoria gains).

### Embeddings (MD-1)

- **Unlocks:** shallow learned embeddings (word2vec) over skill
  descriptions; used by drift detectors + selector.
- **Costs:** one-time embedding compute on skill load; small per-skill
  memory overhead.
- **Opt-in:** env var `GSD_SKILL_CREATOR_EMBEDDINGS_ENABLED=1`.
- **Defer if:** no downstream consumer is enabled (no drift detector,
  no learned routing).

### A/B harness (ME-3)

- **Unlocks:** significance-gated A/B on the M4 fork/explore/commit
  branching primitive.
- **Costs:** doubles the work for harnessed slices; significance gate
  bounds the false-positive rate.
- **Opt-in:** env var `SC_AB_HARNESS_ENABLED=1`.
- **Defer if:** you don't run M4 branching workflows.

---

## Execution substrates

### Math GPU coprocessor (default ON)

- **Unlocks:** algebrus / fourier / statos / symbex / vectora chips +
  MCP server + CPU oracle fallback.
- **Costs:** GPU memory allocation on first invocation; CPU fallback
  path if GPU is unavailable.
- **Opt-in:** ON by default (`coprocessor.enabled: true`); opt-OUT via
  `{"coprocessor": {"enabled": false}}`.
- **Defer if:** you have no GPU and want to skip the CPU-fallback
  latency entirely (rare).

### M8 Symbiosis co-evolution (default ON when imported)

- **Unlocks:** co-evolutionary pass at branch commit time;
  cross-skill influence learning.
- **Costs:** per-commit CPU spike proportional to active-skill count.
- **Opt-in:** ON by default; opt-OUT by passing
  `{ enabled: false }` to `CoEvolutionSettings` at site.
- **Defer if:** branch commits are infrequent (no signal to evolve).

---

## Safety substrates

### Self-mod guard (always ON; not opt-out)

- **Unlocks:** PreToolUse hook BLOCKS `.claude/{skills,agents,hooks}/`
  edits without `SC_SELF_MOD=1` /
  `SC_INSTALL_CALLER=project-claude` /
  `npm_lifecycle_event` override.
- **Costs:** one hook invocation per write tool call (~µs).
- **Opt-in:** none — always active. Override via the three env vars
  above for known-safe operations.
- **Defer if:** N/A — load-bearing safety surface, no defer path.

### git-add-blocker (always ON; not opt-out)

- **Unlocks:** BLOCKS staging files under `.planning/`, `.claude/`,
  `.archive/`, `artifacts/`, `.gsd/`, `.chipset/`, `.env`,
  `project-claude/hooks/.log/` without `SC_FORCE_ADD=1`.
- **Costs:** one hook invocation per `git add` (~ms).
- **Opt-in:** none — always active.
- **Defer if:** N/A — load-bearing safety surface.

### Drift detectors (DRIFT-18 to DRIFT-25)

- **Unlocks:** Semantic-drift (DRIFT-18), TraceAlign BCI (DRIFT-22),
  knowledge / alignment / temporal / grounding / context-entropy
  guards (DRIFT-19, -20, -23, -24, -25).
- **Costs:** per-claim or per-retrieval compute; tunable thresholds.
- **Opt-in:** mix of "always-on when imported" (DRIFT-18, DRIFT-22)
  and JSON-flag-gated (DRIFT-19, -20, -23, -24, -25).
- **Defer if:** you operate inside a single tight knowledge domain
  with no temporal drift (DRIFT-23 / DRIFT-24 add no signal).

---

## Discovering substrates not on this list

This document is intentionally incomplete. New substrates ship in
forward-cadence milestones and accrue here only after they have
≥1 operator-visible consumer surface. To find the next-newer substrate
beyond v805's cutoff:

1. `git log --oneline docs/MODULE-DEFAULTS.md` — sees flag additions.
2. `ls src/` — module directories not in this doc are candidates for
   inclusion.
3. The most-recent release-notes 03-retrospective.md often names what
   shipped and how to enable it.

---

## How this doc evolves

- One entry per opt-in substrate, four-field structure preserved.
- Add new entries below their axis grouping in the order they ship.
- Retire entries only when the substrate is removed from the codebase
  (not when it becomes default-ON — note the default change inline).
- Cross-link to `docs/MODULE-DEFAULTS.md` as the flag-truth source;
  this doc is the WHY-truth source.

---

## Cross-references

- [Module defaults](MODULE-DEFAULTS.md) — flag-truth source for opt-in
  state.
- [Getting started](GETTING-STARTED.md) — first-30-minutes path; this
  doc is the second-30-minutes path.
- [Meta-cadence discipline](meta-cadence-discipline.md) — the consume
  axis's overdue check surfaces substrates that are observably under-used.
- [Shelfware verdict patterns](shelfware-verdict-patterns.md) — the
  WIRED / RETIRED / ALLOWLISTED verdicts that adjudicate which
  substrates this doc should list.
