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
