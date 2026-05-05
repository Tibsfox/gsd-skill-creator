# v1.49.607 — Forward Lessons

## Emitted lessons (forward guidance for future milestones)

### #10248 CANDIDATE — clean-room rebuild cost multiplier

**Statement:** When a milestone builds clean-room reimplementations of algorithm families
(rather than wrapping existing libraries), apply a 2–2.5× cost multiplier to the implementation
estimate.  The multiplier accounts for: per-algorithm correctness test suites that must precede
each dependent algorithm; verbose per-language grammar state tables in state-machine lexers;
emergent specification gaps discovered during integration (e.g., Sankey rename-chaining).

**Trigger:** any milestone spec containing "clean-room reimplement" or "no external library dep"
for an algorithm family (graph layout, rendering, parsing, search).

**Action:** add explicit 2× buffer to the implementation estimate; allocate a dedicated
integration wave (W2-equivalent) AFTER all primitives land, not during.

**Soak target:** 3 observations before promotion to ESTABLISHED.

---

### #10249 CANDIDATE — ADR-as-supply-chain-policy template

**Statement:** Architectural constraints that must survive indefinitely (e.g., dep cleanliness,
migration additive-only policy, self-mod guard) should be encoded as: (1) an ADR documenting
the rationale and scope, (2) a mechanical audit tool enforcing the constraint, (3) registration
in vitest.tools.config.mjs or the pre-tag-gate for CI enforcement.  Prose-only ADRs erode;
tool-enforced ADRs do not.

**Trigger:** any new ADR added to docs/adr/ that specifies a constraint on code structure,
dependencies, or migration patterns.

**Action:** within the same milestone, ship a companion audit tool and CI registration.
If the constraint cannot be mechanically audited (rare), document the manual audit procedure
and cadence in the ADR itself.

**Soak target:** 3 observations before promotion to ESTABLISHED.

---

### #10250 CANDIDATE — coordinator / source-guard pattern for multi-pane dashboards

**Statement:** In multi-pane dashboards where panes must stay in sync on shared selection state,
use a single coordinator as the sole writer and all panes as subscribers (typed FocusSubscriber
interface).  Eliminate direct pane-to-pane calls.  This prevents event-loop cycles, makes the
state machine testable in isolation (coordinator.test.ts), and provides a single serialisation
point for URL-hash persistence.

**Trigger:** any new dashboard feature with two or more panes that share selection/focus state.

**Action:** define a coordinator module first; have all panes import from it via subscribe(); do
not allow any pane to import from another pane directly.

**Soak target:** 3 observations before promotion to ESTABLISHED.

---

### #10251 CANDIDATE — trigram index as reusable sub-millisecond search primitive

**Statement:** The trigram index pattern (`src/atlas/search/`) achieves sub-millisecond search
over corpora up to ~50,000 symbols on commodity hardware with zero external deps.  The pattern
is reusable beyond the atlas: any dashboard feature requiring fast in-memory search over string
identifiers (skill names, agent names, phase titles, mission names) can use the same
TrigramIndex + TrigramQuery + highlight pipeline.

**Trigger:** any new dashboard search feature or Cmd-K-style palette.

**Action:** import `TrigramIndex` from `src/atlas/search/index.js`; build at load time;
query synchronously on each keystroke.  Do not reach for a fuzzy-search library first.

**Soak target:** 2 observations before promotion to ESTABLISHED (pattern already confirmed
in the atlas palette; first reuse will complete the 2-ex threshold).

---

### #10252 CANDIDATE — state-machine lexer as reusable syntax-highlight primitive

**Statement:** The state-machine lexer architecture in `src/atlas/syntax/` (per-language
grammar state tables + shared tokeniser driver) is reusable for any future feature requiring
syntax highlighting or code parsing beyond the atlas: the college-of-knowledge code-snippet
viewer, skill SKILL.md syntax display, etc.  Adding a new language requires only a grammar
state table; the driver and test harness are language-agnostic.

**Trigger:** any new feature requiring syntax highlighting or token-level code parsing.

**Action:** add a grammar module to `src/atlas/syntax/grammars/`; register in
`src/atlas/syntax/index.ts`; write a `__tests__/<lang>.test.ts` proving tokenizer correctness
for the language's distinguishing constructs before shipping.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10253 CANDIDATE — Sankey rename-chaining via transitive alias resolution

**Statement:** Sankey-based symbol-change visualisation breaks when symbols are renamed across
missions (the source flow shows the old name; the sink flow shows the new name; they appear as
unrelated nodes).  The fix is transitive alias resolution: build an alias graph from the
rename events in the commit history; resolve each symbol to its current canonical name before
building the Sankey.  This was not in the original W2 spec but was discovered during archeology
view integration.

**Trigger:** any milestone that builds a Sankey or flow visualisation over versioned symbol
corpora.

**Action:** include a rename-tracking pass in the symbol indexer; add alias resolution before
Sankey layout; test with a fixture that renames a symbol across two missions.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10254 CANDIDATE — run the desktop UI end-to-end before claiming ship-ready

**Statement:** Compile + tests pass is necessary but not sufficient.  An IPC stub that returns
`Err` for all commands compiles cleanly and passes all unit tests (the stub tests verify the
stub *returns* a deferred error — they don't verify the production path works).  Only a live
desktop UI smoke-test surfaces the failure.  The W4a meta-test net passed; the stub survived
to near-tag; the work-review pass caught it.

**Trigger:** any milestone that ships a new Tauri IPC surface or wires a new Rust delegate
trait.

**Action:** after the final wave, open the desktop shell and exercise the new tab/surface
end-to-end before running `npm run pre-tag-gate`.  Verify that IPC commands return data, not
error banners.  Post-W4 work-review pass before tag is a required gate, not optional.

**Soak target:** 3 observations before promotion to ESTABLISHED.

---

### #10255 CANDIDATE — when a perf claim looks suspicious, re-measure at the actual target scale

**Statement:** D4 bench surfaced GLSL at 5,400 LOC/sec (0.54× the 10K target) and attributed
the root cause to an O(n²) engine-wide `source.slice(pos)` pattern.  D5 fixed the engine
(sticky regex); GLSL moved from 5,400 → 5,600 LOC/sec — within noise.  The actual bottleneck
is the coarse-AST extractor's speculative `skipBalanced` calls at high token density, not the
lexer.  The D4 root-cause attribution was overstated; D5 re-measurement corrected it.

**Trigger:** any perf bench result that looks 10× worse than neighboring languages.

**Action:** run the fix, re-measure, and check whether the number moved.  If it didn't move
significantly, the bottleneck is elsewhere.  Attribute root cause after the fix, not before.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10256 CANDIDATE — snapshot-clear helpers + replace-mode for idempotent re-runs

**Statement:** The D2 linker idempotency fix (`clearSnapshotProvenance` + `opts.mode = 'replace'`
in `src/intelligence/provenance/linker.ts`) costs ~10 lines and eliminates duplicate-row bugs
on re-runs.  Any write-once pipeline that can be re-triggered (indexer, linker, extractor)
should expose a `replace` mode from the start rather than requiring a follow-on patch.

**Trigger:** any new pipeline stage that writes rows to an Intelligence KB table.

**Action:** expose `opts?: { mode?: 'append' | 'replace' }` on the run method; implement
`clear*` for the snapshot scope; default to `'append'` for backward compat.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10257 CANDIDATE — ARIA aria-live="polite" (not "assertive") for navigational state changes

**Statement:** The D3 a11y pass wired `aria-live="polite"` on the atlas focus announcer.
Navigational state changes in an exploratory tool (clicking a node, changing focus) are not
urgent — `assertive` would interrupt the user mid-sentence and is inappropriate.  Use `polite`
for any focus/selection change in an interactive dashboard.

**Trigger:** any new dashboard pane that emits focus-change announcements to screen readers.

**Action:** mount a visually-hidden `<div role="status" aria-live="polite">` via the
coordinator's `attachAnnouncer()` method; never use `aria-live="assertive"` for exploratory
navigation events.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10258 CANDIDATE — perf benches at the actual target scale, not a convenient smaller scale

**Statement:** The D4 bench defaulted to 10K-line fixtures.  The mission spec criterion is
"100K LOC < 3 min" (≥ 10K LOC/sec at 100K scale).  10K is convenient but too small: at 10K
lines the O(n²) engine and an O(n) engine are indistinguishable for most grammars.  The
architectural fix (D5 sticky regex) is confirmed correct at scale even though the 10K bench
numbers barely moved, because asymptotic analysis shows the divergence widens at 100K.

**Trigger:** any perf bench whose target is specified at a different scale than the default
fixture size.

**Action:** set the bench fixture size to match the spec target scale, or document explicitly
why the smaller scale is a conservative proxy.

**Soak target:** 2 observations before promotion to ESTABLISHED.

---

### #10259 CANDIDATE — audit the trait → impl → wired-up chain before claiming completion

**Statement:** A trait with a `Stub` implementation is non-functional in production until the
real implementation lands AND is wired into the Tauri state.  The atlas `AtlasKbDelegate`
trait had 13 methods; `StubAtlasKbDelegate` implemented all 13; `AtlasState::default()` was
wired to the stub; nothing in the build or test suite caught the gap because stub-method tests
verify stub behavior, not production behavior.

**Trigger:** any milestone that introduces a new Rust delegate trait backed by a stub.

**Action:** after landing the stub, immediately create a tracking note (or a `TODO(real-impl)`
comment in `AtlasState::default()`) that is visible in code review.  Before tagging, grep for
`new_with_stub` and verify each call site has been migrated or intentionally kept.

**Soak target:** 3 observations before promotion to ESTABLISHED.
