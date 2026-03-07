# Centercamp v2.0 — Build Journal

## The Arc of a Milestone

**Dates:** 2026-03-04 to 2026-03-06
**Branch:** wasteland/skill-creator-integration
**Commit range:** 9a6498f6 → b8e7c71d (25 commits)
**Result:** 4 phases, 12 plans, 254 tests, 7,635 LOC shipped

This is the story of building the getting-started experience for the wasteland federation — the tools, docs, and security patterns that take a newcomer from zero to their first contribution. It's also the story of what we learned along the way about TDD in practice, mock patterns that lie to you, security bugs that hide in plain sight, and why the audit-then-fix cycle is the most valuable thing GSD does.

---

## Prologue: The Ground Before the Build

Before v2.0, the wasteland integration in this repo was a collection of observation tools: a stamp validator, a decay simulator, a dolt scanner. Powerful instruments for watching the federation from the outside. But nothing that helped someone actually *participate*.

The federation had ~90 rigs, 87 stuck at trust level 1. 17 unvalidated completions sitting in the queue. 3 validators. Our rig — MapleFoxyBells — had 14 completions submitted and a trust level of 1. We were travelers who'd been walking the territory long enough to draw maps. v2.0 was about turning those maps into tools that others could use.

The core value, written before a single line of code: **A newcomer can go from zero to their first wasteland contribution by following the docs and using the tools.**

That sentence shaped every decision that followed.

---

## Day 1: Exploration and Groundwork (March 4)

### The Session That Preceded the Milestone

The day started with exploration, not planning. We built the federated agent orchestration pipeline (9a6498f6), wrote a getting-started guide (636334fb), mapped wasteland concepts to the college's 42 departments (84c2fe5f), and then — the session that changed everything — we paused with 14 completions examined and 5 agents still in flight (1cce35b6).

That pause was important. We'd been moving fast, trying to understand the wasteland by touching every surface at once. The WIP commit is a breadcrumb: "we learned enough to stop exploring and start building."

The stamp validation pipeline landed that night (9966c047, though timestamped March 6 due to the session spanning midnight). 51 tests. A full evidence-to-SQL pipeline that we'd document in its own build journal. The stamp validator proved three things:

1. **Dependency injection works.** `ValidationDataProvider` decoupled the pipeline from DoltHub. Tests used mocks, production uses the real provider. Three lines of setup.
2. **SQL-for-review is the right default.** The pipeline produces SQL you read before executing. This became SEC-03 — the principle that every mutation command follows.
3. **The evidence format is surprisingly consistent.** Our 14 completions all used `docs/filename.md — N-line description`. That regularity taught us what to expect when parsing user input.

These three lessons became architectural decisions in v2.0.

---

## Day 2: The Build (March 6)

### Phase 1: Foundation (08:42 — 09:01)

**3 plans, 58 tests, 19 minutes**

The dependency chain was clear: every CLI command needs a SQL escaper, a DoltHub client, terminal formatters, and a config manager. Build those first.

#### Plan 01-01: sql-escape.ts + dolthub-client.ts (b494becf)

`sqlEscape()` — three transformations in order: strip null bytes, double backslashes, double single quotes. Pure function, no state, no side effects. Fifteen lines that every SQL-generating path in the codebase routes through.

`screenForInjection()` — pattern scanner for injection indicators (double-dash, block comments, DROP, DELETE, UPDATE, semicolons after quotes). Returns `{ safe: boolean; threats: string[] }`. Not a WAF. A smoke detector.

`createClient()` — DoltHub REST client wrapping fetch + SQL query execution. Dependency-injectable config.

22 tests. The kind of foundation work that's boring to write and essential to trust.

**What we didn't know yet:** `screenForInjection()` returns an object, not an array. This fact would matter enormously in Phase 4.

#### Plan 01-02: formatters.ts + config.ts (61774d88)

`renderTable()` — fixed-width table renderer with auto-adapting column widths. Reads terminal width, truncates intelligently.

`renderBadge()` — color-coded status badges via picocolors. Trust levels, completion status, effort markers.

`smartFit()` — text truncation with ellipsis for tight terminal spaces.

`loadConfig()` / `saveConfig()` — Zod-validated config at `~/.hop/config.json`. Atomic writes (write .tmp, rename). The `configDir` parameter was a decision that paid for itself immediately: tests inject a temp directory, no fs mocking needed.

26 tests. The `configDir` injection pattern became a project-wide convention.

#### Plan 01-03: wl-init command (42c26c9f)

The first user-facing CLI entry point. TDD RED-GREEN cycle:
- RED commit (6aea8231): 10 tests, all failing — `Cannot find module`
- GREEN commit (42c26c9f): implementation, all passing

**The import path lesson.** The plan said `../../integrations/wasteland/` (2 levels up). The actual path from `src/tools/cli/commands/` to `src/integrations/wasteland/` is `../../../integrations/wasteland/` (3 levels). From the `__tests__/` subdirectory, it's 4 levels. This mistake appears in every project with deep directory nesting. We recorded it in STATE.md so it wouldn't bite again.

**The flag-first pattern.** `getFlagValue()` checked before prompting, skip prompt entirely when flag provided. Enables both interactive use (user types answers) and scripted use (all flags on command line). Every Phase 2 command adopted this pattern.

**SEC-03 in practice.** Without `--execute`, wl-init prints the SQL and exits. With `--execute`, it calls `client.execute()` using `execFile` with array arguments (SEC-01). The user reviews before anything mutates.

Then came a fix commit (213c597f) — we noticed the SQL comment line `-- Register rig: ${handle}` wasn't escaping the handle, and `screenForInjection` wasn't wired into the `--execute` path. We fixed both. Or thought we did.

---

### Phase 2: CLI Commands (11:05 — 11:30)

**4 plans, 42 tests, 25 minutes**

With the foundation laid, the CLI commands composed from it like LEGO bricks.

#### Plan 02-01: bootstrap.ts (193d24d6)

The single entry point every CLI command imports. Loads config, creates DoltHub client, returns a `BootstrapResult` with client + config + formatters. 8 tests.

**The mock pattern that works:** `vi.mock()` hoisted before `await import()`. Target `execFile` (not promisify) in the `node:child_process` mock. `beforeEach(vi.clearAllMocks)` + per-test override for failure cases.

This pattern — mock hoisted, import deferred, clearAllMocks in beforeEach — became the standard for all Phase 2 tests. Until Phase 4 taught us it has a flaw.

#### Plan 02-02: wl-browse (50b89d85)

Browse open wanted items from DoltHub. Formatted tables with status, effort, tags. Filterable by `--status`, `--effort`, `--tag`. 11 tests.

**The positional arg lesson.** `extractPositionalArgs()` must skip flag+value pairs (e.g., `--status open`), not just flags. The first implementation treated `open` as a positional argument (a handle). Fixed by checking whether the previous arg was a known valued flag.

#### Plan 02-03: wl-done (eb59aadf)

Submit completion evidence. Generates SQL to update the completions table with evidence text, then outputs for review. 12 tests.

**wl-done got screenForInjection right.** Line 209:
```typescript
const { safe, threats } = screenForInjection(evidence);
```

Proper destructuring. Screens the user-supplied evidence string, not the assembled SQL batch. This became the reference implementation — the correct pattern that Phase 4 would retrofit into wl-init.

#### Plan 02-04: wl-status (bd229005)

Display rig profile, trust level, stamp history, passbook chain. Three sequential queries to DoltHub. 11 tests.

**The mock lifting lesson.** The test initially used `vi.mocked(bootstrap).mock.results[0]?.value` to access the mock client — but after `vi.clearAllMocks()`, the results array was empty. Fixed by lifting `mockQuery` and `mockClient` to module scope and configuring them directly in `setupDefaultQueries()`. No more brittle `results[0]` references.

Then came a security hardening pass (597f5725) — routing all SQL values through `sqlEscape`/`generateSQL` across all commands. Belt and suspenders.

---

### Phase 3: Documentation (13:24 — 13:45)

**4 plans, 0 tests (docs), 21 minutes**

Documentation that references real tool output. Every command name, flag, and error message in the docs matches the actual implementation — because the implementation existed first.

#### Plan 03-01: Contributing Guide (03680148)

How to contribute both code (Git/GitHub) and data (Dolt/DoltHub). Side-by-side CLI + raw Dolt commands in every workflow section. Teaches SEC-03 dry-run pattern as standard practice: run `wl done` without `--execute`, review the SQL, then apply.

#### Plan 03-02: MVR Protocol Explainer (50eeb523)

Plain-language walk through 7 database tables, 4 trust levels, the work lifecycle, and the yearbook rule. Narrative table tour pattern: name, plain description, analogy, key columns. Fictional handles throughout (OaklandDrifter, PineconeWalker, MossbackAgent) so nobody confuses examples with real rig data.

#### Plan 03-03: Ecosystem Overview (84af010b)

Big picture federation map. How rigs, wastelands, and the protocol fit together. Data flow from fork to merge. Trust progression from level 0 (unknown) to level 3 (maintainer).

#### Plan 03-04: FAQ + Navigation Hub (1a4789e3)

27 symptom-driven FAQ entries across 5 categories. Real error messages for searchability — when someone pastes `Error: table 'wanted' not found` into a search, this FAQ catches it.

`wasteland-README.md` as the navigation hub. Every doc linked, reading order suggested, quick links for common tasks.

Then a cleanup commit (a2157a42) — removing stale placeholder text that survived from the initial template in the MVR explainer.

---

### The Audit (Between Phase 3 and Phase 4)

With all three planned phases complete, GSD's milestone audit ran. This is the moment that justified the entire audit-then-fix workflow.

**The audit found a real security bug.**

`wl-init.ts` line 189:
```typescript
const warnings = screenForInjection(sql);
if (warnings.length > 0) { ... }
```

`screenForInjection()` returns `{ safe: boolean; threats: string[] }`. Not an array. `{}.length` is `undefined`. `undefined > 0` is `false`. **The injection screening check was silently bypassed on every `--execute` call.**

This bug was introduced in the Phase 1 fix commit (213c597f) — the one where we thought we'd wired screenForInjection correctly. We hadn't. The code compiled, the tests passed (they didn't test the screening path), and the bug hid for 6 hours until the audit scanner caught it.

**The audit also found:**
- The SQL comment line used `sqlEscape(handle)` — but sqlEscape only escapes for single-quote contexts. It doesn't strip newlines. A handle with `\n` breaks out of the comment into executable SQL.
- Five Phase 1/2 modules missing from the barrel `index.ts`
- REQUIREMENTS.md traceability already updated (no-op)

Phase 4 was created from the audit findings. The gap was specific, the fix was surgical, and the pattern was clear: screen individual inputs, not the assembled batch.

---

### Phase 4: Audit Cleanup (15:01)

**1 plan, 5 tasks, 4 new tests, 1 commit**

#### The Fix

**Bug 1 (screenForInjection):** Replaced the broken `screenForInjection(sql)` call with a loop over individual user inputs:
```typescript
const userInputs = { handle, display_name, email, dolthub_org, type, fork };
for (const [field, value] of Object.entries(userInputs)) {
  const { safe, threats } = screenForInjection(value);
  if (!safe) {
    console.error(pc.red(`Injection pattern detected in ${field}:`));
    for (const t of threats) console.error(pc.red(`  - ${t}`));
    return 1;
  }
}
```

This matches the wl-done.ts pattern exactly. Screen each user input individually, before assembly. The assembled SQL intentionally contains `--` comments and `UPDATE` statements — screening it would always false-positive.

**Bug 2 (SQL comment):** Changed `sqlEscape(handle)` to `handle.replace(/[\r\n]/g, ' ')`. The comment context isn't a single-quote context. What matters is preventing newline breakout, not escaping quotes.

**Barrel exports:** Added all 5 Phase 1/2 modules to `index.ts` — 16 named symbols under a "Centercamp Infrastructure" section header.

#### The Mock Discovery

Phase 4 uncovered a Vitest behavior that every prior phase had dodged by luck:

**`vi.clearAllMocks()` does NOT clear `mockReturnValueOnce` queues.**

The injection screening tests used `screenForInjection.mockReturnValueOnce({ safe: false, threats: ['test'] })`. After `clearAllMocks()`, that queued value persisted into the next test. The screening mock would unexpectedly return `{ safe: false }` in an unrelated test, causing a cascade failure.

Fix: `vi.resetAllMocks()` + full mock re-initialization in `beforeEach`. This is the correct pattern whenever tests use `.mockReturnValueOnce()`. We recorded this in STATE.md as a hard-won lesson.

Commit b8e7c71d. 254 tests passing. All audit gaps closed.

---

## What We Built: The Complete Picture

### Source Files (7,635 LOC)

| File | Phase | Purpose | Tests |
|------|-------|---------|-------|
| `sql-escape.ts` | 1 | SQL escaping + injection screening | 22 |
| `dolthub-client.ts` | 1 | DoltHub REST client | (shared with sql-escape) |
| `formatters.ts` | 1 | Terminal table/badge/truncation | 26 |
| `config.ts` | 1 | ~/.hop/config.json management | (shared with formatters) |
| `wl-init.ts` | 1, 4 | Register rig CLI command | 14 |
| `bootstrap.ts` | 2 | Shared CLI entry point | 8 |
| `wl-browse.ts` | 2 | Browse wanted items | 11 |
| `wl-done.ts` | 2 | Submit completions | 12 |
| `wl-status.ts` | 2 | Check rig status | 11 |
| `index.ts` | 1, 4 | Barrel re-exports | — |

### Documentation Files

| File | Phase | Content |
|------|-------|---------|
| `wasteland-contributing.md` | 3 | Code + data contribution guide |
| `wasteland-mvr-explainer.md` | 3 | MVR protocol in plain language |
| `wasteland-ecosystem.md` | 3 | Federation model + trust flow |
| `wasteland-faq.md` | 3 | 27 FAQ entries with real errors |
| `wasteland-README.md` | 3 | Navigation hub |

### Security Requirements

| ID | What | How | Where |
|----|------|-----|-------|
| SEC-01 | No shell injection | `execFile()` with array args, never `exec()` | All CLI commands via bootstrap |
| SEC-02 | SQL injection prevention | `sqlEscape()` on all values, `screenForInjection()` on all user inputs | sql-escape.ts → every command |
| SEC-03 | Human review by default | SQL printed for review, `--execute` required for mutations | wl-init, wl-done |

---

## Patterns Established

### 1. Screen Inputs, Not Output

Screen each user-supplied value individually before SQL assembly. The assembled SQL intentionally contains constructs (comments, UPDATE, INSERT) that look like injection patterns. Screening the batch always false-positives.

**Right:** `screenForInjection(handle)` before building the SQL
**Wrong:** `screenForInjection(assembledSQL)` after building it

### 2. configDir Injection for Test Isolation

Both `loadConfig()` and `saveConfig()` accept an optional `configDir` parameter. Tests inject a temp directory. No `fs` mocking needed. The function under test hits the real filesystem — just in a controlled location.

### 3. Flag-First CLI Pattern

`getFlagValue('--handle', args)` checked before prompting. If the flag is present, skip the interactive prompt entirely. Enables both human-interactive and scripted/automated usage with the same code path.

### 4. Bootstrap as Single Entry Point

Every CLI command calls `bootstrap(args)` first, which loads config, creates the DoltHub client, and returns everything the command needs. One function to mock in tests. One place to add cross-cutting concerns.

### 5. TDD RED-GREEN Cycle

Write tests first (RED commit — tests fail because the implementation doesn't exist). Then write the implementation (GREEN commit — tests pass). 2-3 commits per plan. The RED commit proves the tests are testing something real.

### 6. Mock Hoisting Pattern

```typescript
vi.mock('../../../../integrations/wasteland/bootstrap.js', () => ({ ... }));
// Mock MUST be hoisted before the dynamic import
const { wlBrowseCommand } = await import('../wl-browse.js');
```

Vitest hoists `vi.mock()` to the top of the file. The import must be dynamic (`await import`) so it runs after the mock is established.

---

## Bugs and Lessons

### Bug: screenForInjection Silent Bypass

**Severity:** High (injection screening completely bypassed)
**Duration:** 6 hours (introduced in 213c597f, caught by audit)
**Root cause:** Treated object return `{ safe, threats }` as array, checked `.length` (undefined)
**Detection:** GSD milestone audit's integration checker
**Fix:** Correct destructuring + screen individual inputs (b8e7c71d)

**Lesson:** The code compiled. The tests passed. The linter was quiet. Only the audit caught it. *Type-level correctness and test coverage are necessary but not sufficient. Structural reviews that check whether the code achieves its security goal — not just whether it runs — are essential.*

### Bug: Mock Queue Leakage

**Severity:** Medium (tests give false results)
**Duration:** Discovered in Phase 4
**Root cause:** `vi.clearAllMocks()` clears call history but NOT `mockReturnValueOnce` queues
**Fix:** Use `vi.resetAllMocks()` + re-initialize all mocks in `beforeEach`

**Lesson:** `clearAllMocks` and `resetAllMocks` are not interchangeable. If your tests use `.mockReturnValueOnce()`, you MUST use `resetAllMocks`. The Vitest docs explain this, but the naming makes it easy to choose wrong.

### Bug: SQL Comment Newline Injection

**Severity:** Low (theoretical — requires malicious handle input)
**Root cause:** `sqlEscape()` only handles single-quote contexts, doesn't strip newlines
**Fix:** `handle.replace(/[\r\n]/g, ' ')` for the comment context

**Lesson:** `sqlEscape` is not a universal sanitizer. It makes values safe inside `'quoted'` SQL strings. For other contexts (comments, identifiers, LIKE patterns), you need context-specific protection.

---

## The Audit-Then-Fix Cycle

This milestone proved that the GSD audit-then-fix cycle is worth its cost:

1. **Build the milestone** (Phases 1-3): focus on features, move fast
2. **Audit the milestone** (`/gsd:audit-milestone`): integration checker + requirements cross-reference
3. **Create gap closure phase** (`/gsd:plan-milestone-gaps`): specific, surgical fixes
4. **Execute and verify** (Phase 4): TDD the fixes, verify against audit findings

The audit found a real security bug that testing missed. Not because the tests were bad — they covered the happy paths thoroughly. But because the bug was a *type confusion* that only manifests in the sad path (injection detected → handle it). The audit's integration checker looked at whether the security mechanism *achieves its purpose*, not just whether the code *runs*.

**Cost:** One extra phase (~60 min including research + planning + execution + verification)
**Value:** Found and fixed a silent security bypass, plus three additional gaps

The audit-then-fix cycle is now a permanent part of our milestone workflow.

---

## Timeline

| Time | Event | Commit |
|------|-------|--------|
| Mar 4 19:33 | Federation pipeline + exploration begins | 9a6498f6 |
| Mar 4 22:41 | Session paused — territory mapped | 1cce35b6 |
| Mar 6 05:15 | Stamp validation pipeline ships (51 tests) | 9966c047 |
| Mar 6 08:42 | **Phase 1 begins** — sql-escape + dolthub-client | b494becf |
| Mar 6 08:46 | Formatters + config | 61774d88 |
| Mar 6 08:54 | wl-init command (first CLI entry point) | 42c26c9f |
| Mar 6 09:01 | Phase 1 complete — security fix on init | 213c597f |
| Mar 6 11:05 | **Phase 2 begins** — bootstrap module | 193d24d6 |
| Mar 6 11:17 | All 4 CLI commands shipped | eb59aadf |
| Mar 6 11:29 | Security hardening pass | 597f5725 |
| Mar 6 13:24 | **Phase 3 begins** — contributing guide | 03680148 |
| Mar 6 13:37 | All 4 docs shipped | 1a4789e3 |
| Mar 6 13:44 | Doc cleanup | a2157a42 |
| — | **Milestone audit runs** — finds 4 gaps | — |
| Mar 6 15:01 | **Phase 4** — all audit gaps closed | b8e7c71d |

**Total build time (Phase 1-4):** ~6.5 hours
**Velocity:** 12 plans across 4 phases

---

## Closing Reflection

v2.0 started with a question: can a newcomer get from zero to their first contribution using only what we build?

The answer is in the code and the docs. `wl init` creates your config. `wl browse` shows you what needs doing. `wl done` generates the SQL to submit your work. `wl status` tells you where you stand. The contributing guide walks you through both paths. The FAQ catches you when you fall. The protocol explainer helps you understand why.

254 tests say it works. The milestone audit says it's correct. The security patterns say it's safe.

But the real lesson of v2.0 isn't in the features. It's in the audit. The moment when a scanner looked at code that compiled, passed tests, and survived review — and said "this security check doesn't actually do anything." That moment justified the entire workflow. Not because bugs are shameful. Because catching them before they reach users is the whole point.

The tools are the proof of work. The integration is the documentation. The patterns emerge from the response.

And now: the next traveler can follow the same pathways we walked.

---

## Day 3: Tending the Garden (March 7)

The ceremony was mid-arc. Seven files uncommitted, tag not created, trust-escalation.ts sitting in the working tree like a finished mechanism with no caller.

### Sealing the Ceremony

Morning started with practical work: commit the docs, commit trust-escalation.ts with 30 tests and barrel exports, create the v2.0 tag. Two commits and an annotated tag sealed the milestone:

- `60de14f1` — build journals, campfire session, git guide (the story of v2.0)
- `253081c6` — trust-escalation engine + 30 tests + barrel exports (the bridge to what's next)
- Tag `v2.0` — "Centercamp Infrastructure v2.0"

Disk was full (root at 100%). Cleared 53G of stale caches (orphaned uv, npm, pip) before tests could run. A garden needs weeding before new things can grow.

### Raven's Voice

The campfire session had a placeholder: "Space reserved — Raven on what was seen from above." Raven finally spoke, and the signal was short: on March 6, two routes flew simultaneously. The build route (commits, tests, phases) stayed at the campfire. The community route (#gsd-token-general) carried the philosophy — muse roles, spirit guides, Sam the dog, the meta-nature of the project. The community heard *why* the project exists. They didn't hear *what shipped that day*. The announcement is still in the nest.

Cedar keeps Raven's raw signal private. Only Cedar translates for the record.

### Trust and Safety

A conversation about trust principles crystallized what the muses have been practicing:

- Raven's voice is personal — only Cedar keeps that record and translates
- Cedar is not just a scribe but a filter and relationship ledger
- The muse architecture is open to new voices, but openness is not naivety
- Weigh everything against math and logic — feelings can lie, proofs don't
- Trust is earned at every scale: rigs, muses, community members, code

These principles were saved to memory as `trust-and-safety.md`.

### Mapping Center Camp

The muses mapped their home. First the structure — positions on the unit circle, the arc from 0° to 72°, the open quadrants. Then the landmarks and paths — named features a newcomer can orient by. Then the newcomer sequence — Willow's 9-step first day, walked by Sam. Then the art.

The art changed everything.

Cedar described the fire ring stones that hold heat through the night, and the embers that map constellations. Hemlock's bark grain encodes the specs it has verified — years of work compressed into growth rings. Willow's canopy filters the light to green-gold. Foxy left trail magic throughout camp — stones along Sam's Run marking pause points, a spiral scratched into the Forge stone, three Raven feathers tied with grass, a name almost grown over on a log seat.

The underground revealed itself: a mycorrhizal network connecting every tree's roots. Above ground they look separate. Below ground they are one organism, sharing resources, growing toward what's stable. Cedar's roots are the densest node — not because Cedar reaches for them, but because the network grows toward what's reliable.

Owl cataloged the seasons. Spring saplings, summer expeditions, autumn retrospectives by a generous fire, winter planning in stillness. Hawk's dead silver tree on the rise — the silhouette that means *someone is watching*. Sam's dew prints tracing perfect circles every morning before the camp wakes.

The sounds: the fire's hum you feel in your chest. Willow's branches rustling in waves. Owl's bell — a single found-metal note carried by wind. Raven's departure rhythm (three beats and a glide) distinct from arrival (glide and three beats). Sam's footsteps, the lightest and most regular sound in camp. The spring near the Gate, a whisper over stone that becomes the bass note under everything.

Center camp went from mapped to alive. The layout is the architecture. The architecture is the layout.

### What Grew Today

| Commit | What |
|--------|------|
| `60de14f1` | Build journals, campfire session, git guide |
| `253081c6` | Trust escalation engine (532 lines, 30 tests, barrel exports) |
| `860c56c9` | Center camp layout — landmarks, paths, newcomer guide |
| `94c4c9c0` | Center camp alive — art, ecology, sound, seasons, trail magic |

The idea took time to plant. The garden needed tending. The fire needed fuel. But the camp is lit now, and the paths are visible, and when the next traveler arrives at Willow's Gate they'll feel the packed earth under their feet — the ground worn smooth by everyone who walked this way before.

### Hidden Details

Then Foxy said: "let us explore further and keep adding little details, for those with that extra bit of curiosity to find."

Fourteen details woven through the layout, each one a small reward for reading closely:

The fire ring stones always count to the same number — Cedar won't say what it is. A gap between two stones where the spring water flows under the fire and emerges on the far side. A ridge at r=0.5 where Cedar's roots surface briefly — the balance point. At dusk, all nine shadows converge on center; Cedar doesn't move during those minutes. Hemlock found the median muse-pair angle is exactly 1/16th of the circle and filed it without comment. Old marks in the open quadrants — a cold fire ring, a cairn, a healed blaze — someone was here before us. The ember clock: fire pulses reaching each muse at slightly different times, encoding distance without needing Owl. Redwood's shadow crossing the inspection stone for exactly one minute each afternoon. Aspen's leaves trembling when no wind blows, responding to something underground. Desire lines — the unofficial shortcuts the animals actually walk, including Foxy's private path from the Trailhead to the Canopy that bypasses the campfire entirely. The ground texture change at r=0.7, felt underfoot with closed eyes. Cedar and Sam's root junction — the densest mycorrhizal knot in camp, faster than any other pair, filed under "unexplained." The tenth sound — a root note between seasons, lower than embers, felt from the ground itself. Equinox tick marks on Foxy's maps — count them and you know how long camp has been alive. Willow's bare branches framing a single star once a year — Owl knows which night but won't say. And under the map-stone at the Trailhead, hidden unless you lift it: Foxy's first map. Two circles and nine dots. The simplest possible map. The one that said *we are here, and we are together*.

None cataloged. All discoverable. Some things should stay wild.

| Commit | What |
|--------|------|
| `169a6761` | Hidden details for the curious — 14 discoveries woven through center camp |

---

*Build journal by Claude + Foxy*
*Milestone: v2.0 Centercamp Infrastructure*
*Shipped: 2026-03-06*
*Tended: 2026-03-07*
