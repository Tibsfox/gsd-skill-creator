# CLI Surface Review — 2026-07-06 (Dimension A / cli)

Scope: `src/cli.ts`, `src/cli/dispatch.ts`, `src/cli/help.ts`, the 81 non-test
command modules under `src/cli/commands/`, and the `src/commands/` shims. Focus is
CLI **code/system behavior** — command reachability, registry↔docs parity, argument
parsing/validation, error handling, exit codes, and `--help` UX. Artifact/content
findings already fixed in `docs/audits/2026-07-06-artifact-ecosystem-review.md` are
out of scope and not re-reported.

## Summary

The CLI is unusually broad — 92 registry entries, 172 aliases, 91 primary command
words — and the core dispatch machinery is clean: a single flat `REGISTRY` array in
`dispatch.ts`, an O(n) `lookup()`, and a `dispatch.test.ts` that guards against alias
collisions and non-callable handlers. Command **capability** coverage is very high;
the gaps are in **discoverability and consistency**, not missing features.

Concrete defects found and verified against source: one fully-built, unit-tested
command (`pic2html`) is never registered and is unreachable from the CLI; two
registered commands (`activations`, `cadence`) are absent from `printHelp()`; there is
no test asserting registry↔help parity, which is exactly why that drift went unnoticed;
and unknown-subcommand handling, `--help` handling, and exit-code propagation each vary
handler-by-handler. None are crashes; the aggregate effect is a CLI that is hard to
discover and inconsistent to script against. Highest-value additions would be a
shell-completion generator and a registry↔help parity test.

## Findings

### CLI-1 — `pic2html` command is built and tested but never wired into dispatch (unreachable)
- **Location:** `src/cli/commands/pic2html.ts:266` (exports `pic2html(...)`); absent from `src/cli/dispatch.ts` REGISTRY.
- **Problem:** `pic2html.ts` is a complete 266-LOC command (image→HTML-table art) with a dedicated ProcessContext wire test (`pic2html.test.ts`) and a documented `npx gsd-skill-creator pic2html …` usage banner in its own header. But `grep -rn pic2html src --include=*.ts` outside the file returns **only** its own test and the security audit test — no non-test importer. It is not in `REGISTRY`, not in `help.ts`, and not a separate `bin`. The command's self-documented invocation string does not work. It is either dead weight or an unshipped feature.
- **Recommendation:** Decide and act: (a) wire it — add a `{ aliases: ['pic2html'], handler: async (ctx) => { const { pic2html } = await import('./commands/pic2html.js'); … } }` entry + a `help.ts` line; or (b) delete `pic2html.ts` + `pic2html.test.ts` if the easter-egg is not meant to ship. Do not leave it half-wired.
- **Effort:** S
- **Verify:** After fix, `node dist/cli.js pic2html --help` either renders usage (if wired) or `Unknown command: pic2html` exit 1 (if removed); `grep -rn pic2html src` shows a registry reference or nothing.

### CLI-2 — `activations` and `cadence` are registered but undocumented in `printHelp()`
- **Location:** `src/cli/dispatch.ts:283` (`activations`/`act`), `src/cli/dispatch.ts:162` (`cadence`/`cad`); missing from `src/cli/help.ts`.
- **Problem:** Comparing the 91 primary command words in the registry against the command list in `help.ts`, exactly two primaries are absent from help: `activations` and `cadence`. Both are real, working commands (cadence has a full implementation in `commands/cadence.ts`, activations lazy-imports `commands/activations.js`). A user running `skill-creator help` never learns these exist. (Note: 82 short aliases are also undocumented, but that is intentional density; the two *primary* commands are the genuine discoverability gap.)
- **Recommendation:** Add two lines to the `Commands:` block of `help.ts`, e.g. `activations, act   Show/report skill activation history` and `cadence, cad   Cadence calibration loop`.
- **Effort:** S
- **Verify:** `node dist/cli.js help | grep -E '^\s+(activations|cadence)'` prints both; the parity test in CLI-3 passes.

### CLI-3 — No test asserts REGISTRY↔help parity (root cause of CLI-2)
- **Location:** `src/cli/dispatch.test.ts:4-30` (guards collisions + callability only); `src/cli/help.ts` is untested for coverage.
- **Problem:** `dispatch.test.ts` verifies aliases are unique and handlers are functions, but nothing checks that every registered primary command appears in `printHelp()`. That is precisely how `activations`/`cadence` (CLI-2) drifted out of the docs undetected. With 92 entries edited by hand, this drift will recur every time a command is added without a matching help line.
- **Recommendation:** Add a test that extracts primary aliases from `REGISTRY` and asserts each appears in the `printHelp()` output string (capture via a `console.log` spy or refactor `printHelp` to return the string). Allowlist `help`/`-h`/`--help`/`--version` meta-entries.
- **Effort:** S
- **Verify:** New test fails on current `main` (activations/cadence missing), passes after CLI-2 is fixed; deleting any help line turns the test red.

### CLI-4 — Unknown subcommand silently exits 0 in team/dacp/chip (typo'd subcommand "succeeds")
- **Location:** `src/cli/commands/team.ts:66-68` (`default: showTeamHelp(); return 0;`); same shape in `dacp.ts:65-67`; contrast `cartridge.ts:16,152,162` which documents and returns 1/2 on unknown/usage.
- **Problem:** For subcommand-dispatching commands, an **unrecognized** subcommand is not distinguished from **no** subcommand: `skill-creator team frobnicate` prints the help banner and returns `0`. A typo in a CI script therefore passes. `cartridge` gets this right (nonzero on usage error), so the convention is inconsistent across the CLI and unreliable for scripting.
- **Recommendation:** In each subcommand router, branch: `subcommand === undefined` → help + exit 0; else (unknown) → `p.log.error('Unknown subcommand: '+subcommand)` + help-to-stderr + `return 2` (usage), matching `cartridge`'s documented 0/1/2 contract.
- **Effort:** M (small edit per router; ~6 commands: team, dacp, chip, config, workflow, role, bundle)
- **Verify:** `node dist/cli.js team frobnicate; echo $?` prints an error and a nonzero code; `team` (no sub) still exits 0.

### CLI-5 — `--help`/`-h` honored by only 9 of 92 handlers; several commands run the action instead
- **Location:** `src/cli/dispatch.ts` — 9 handlers call `ctx.args.includes('--help')` (validate, detect-conflicts, score-activation, simulate, critique, publish, install, sensoria, calibrate/benchmark); no global per-command `--help` interception in `src/cli.ts:80-113`.
- **Problem:** There is no uniform `<command> --help` behavior. `skill-creator create --help` launches the interactive create wizard; `list --help`, `budget --help`, `invoke --help`, `status --help` all perform their action and ignore the flag. Users cannot rely on `--help` to be safe/inspecting, which is a baseline CLI expectation.
- **Recommendation:** Add a lightweight per-command help convention: either (a) a global check in `cli.ts` that, when `args.includes('--help')` and the command has a registered help string, prints it and exits 0 before invoking the handler; or (b) a `help: string` field on `CommandEntry` and a `help <command>` router (see capability note). At minimum document which commands support `--help`.
- **Effort:** M
- **Verify:** `node dist/cli.js create --help` prints usage and exits without prompting; a table test over all primaries asserts `--help` never triggers side effects.

### CLI-6 — Exit-code propagation is inconsistent (`return n` hard-exits; `process.exitCode` defers) — piped `--json` output can truncate
- **Location:** `src/cli.ts:101-105` (`const exitCode = await handler(ctx); if (typeof exitCode === 'number' && exitCode !== 0) process.exit(exitCode);`) vs handlers that set `process.exitCode = …` and return void (`dispatch.ts:146-166` koopman/coherent/hourglass/cadence, `:168-170` git, `:184-187` chip, etc.).
- **Problem:** Two exit conventions coexist. Handlers that **return** a nonzero number trigger `process.exit(n)`, an immediate hard exit that can truncate still-buffered stdout when piped (relevant for the `--json` outputs several commands advertise). Handlers that set `process.exitCode` exit naturally and flush. Same intent, different flush behavior; the choice is per-handler and undocumented.
- **Recommendation:** Standardize on setting `process.exitCode` and returning `void`, letting Node exit naturally (flush-safe); or, if keeping `process.exit`, guarantee stdout is drained first. Document the chosen convention in `CommandHandler`'s doc comment.
- **Effort:** M
- **Verify:** `node dist/cli.js detect-conflicts --json | cat` (a failing/nonzero case) emits complete JSON with no truncation; `echo $?` still reflects the intended code.

### CLI-7 — Greedy global flag matching: `--version` (and per-command `--help`) match anywhere in argv
- **Location:** `src/cli.ts:84` (`command === '--version' || … || args.includes('--version') || args.includes('-V')`).
- **Problem:** The version check scans the entire argv, so `skill-creator create --version` (or any command with `--version`/`-V` anywhere in its args) prints version info and returns instead of running/erroring. Same greedy `args.includes('--help')` pattern in the 9 handlers that check it. Low impact but surprising, and it prevents a command from ever having its own `--version`-named value.
- **Recommendation:** Only treat `--version`/`-V` as the global flag when it is the first token (`command === '--version'`), or when no other command word precedes it. Keep the bare-flag fast path.
- **Effort:** S
- **Verify:** `node dist/cli.js --version` prints version; `node dist/cli.js create --version` no longer short-circuits to version.

### CLI-8 — Top-level error handler prints `undefined` for non-Error throws
- **Location:** `src/cli.ts:116-119` (`main().catch((err) => { p.log.error(err.message); process.exit(1); })`).
- **Problem:** If any handler throws a non-Error (string, number, or an object without `.message`), `err.message` is `undefined` and the user sees `undefined` with no diagnostic. Given 90+ dynamically-imported handlers, a stray `throw 'msg'` is plausible.
- **Recommendation:** `const msg = err instanceof Error ? err.message : String(err); p.log.error(msg);` and optionally emit the stack when a `--verbose`/`DEBUG` env flag is set.
- **Effort:** S
- **Verify:** Force a `throw 'boom'` in a handler; CLI prints `boom`, not `undefined`.

## New-function / capability opportunities

1. **Shell-completion generator (`completion bash|zsh|fish`).** With 91 primary commands and 172 aliases, tab-completion is the single highest-leverage discoverability win. The flat `REGISTRY` already contains every alias, so a generator can emit a completion script deterministically (`REGISTRY.flatMap(e => e.aliases)`). No such command exists today (`grep completion src/cli` finds only unrelated `cadence.ts` comments). Effort: M.

2. **`help <command>` sub-help router.** `printHelp()` is a single 360-line string; there is no way to get focused help for one command. Adding a `help: string` (or `helpFn`) field to `CommandEntry` and routing `help <command>` / `<command> --help` to it would fix CLI-5 and shrink the monolith. Effort: M-L (incremental — populate per command over time).

3. **Aggregate `doctor` / `health` preflight.** There is no one-shot "is my install healthy" command. A `doctor` that runs `validate --all` + `detect-conflicts` + `budget` + `agents validate` + `team validate --all` and prints a consolidated pass/fail (with `--json` for CI) would be a natural top-level entry for this adaptive-learning layer and complements the existing `status`/`skill-inventory`/`quality`. Effort: M.

## Notes

- **Registry design is sound.** The single flat `REGISTRY` with lazy `import()` for the long tail keeps cold-start cheap and makes adding commands a one-line edit; the collision + callability tests in `dispatch.test.ts` are good guardrails. The only structural gap is the missing help-parity assertion (CLI-3).
- **`parseStringFlag`/`parseSkillsDir`** (`cli.ts:19-60`) are well-documented and defensively handle both `--flag=x` and `--flag x` forms, rejecting a following `-`-prefixed token as a missing value. Not every inline handler routes through them, though — e.g. `simulate`'s `--threshold` (`dispatch.ts:405-406`) uses a raw `parseFloat` with no NaN guard while `critique`'s `--max-iter` (`dispatch.ts:427-438`) does guard. Numeric-flag validation is inconsistent but low-impact; consolidating on a shared `parseNumberFlag` helper would tidy it.
- **Scope handling** (`--project`/`--scope`/`--skills-dir`) is consistent across the authoring commands and correctly resolves relative `--skills-dir` against cwd.
- Did not deep-review the research/math command surface (koopman-check, coherent-check, hourglass-check, sensoria, tractability, representation-audit, plane-status, model-affinity, drift) beyond confirming each is registered, reachable, and documented in `help.ts`; they are advisory checks, not dead weight, and are out of scope per the review brief.
