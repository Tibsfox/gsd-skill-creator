# Risk, Compatibility & The Bridge

> **Domain:** Architecture Risk Analysis and Synthesis
> **Module:** 5 -- Semantic Mismatch, PR #28 Surgical Merge, Lock File Races, The Amiga Principle
> **Through-line:** *Every bridge has load limits. Knowing them before you drive the truck across is the difference between engineering and gambling.* The integration between Caliber and gsd-skill-creator has four identified architectural risks, three compatibility wins, and one philosophical principle that ties everything together. This module maps the terrain, marks the load limits, and names the principle.

---

## Table of Contents

1. [Risk Landscape Overview](#1-risk-landscape-overview)
2. [Risk 1: Scoring Semantic Mismatch](#2-risk-1-scoring-semantic-mismatch)
3. [CLAUDE.md vs SKILL.md Structure](#3-claudemd-vs-skillmd-structure)
4. [Grounding Check Adaptation](#4-grounding-check-adaptation)
5. [Risk 2: Token Budget for Score Operations](#5-risk-2-token-budget-for-score-operations)
6. [Gating the Insights Command](#6-gating-the-insights-command)
7. [Risk 3: PR #28 Surgical Partial Merge](#7-risk-3-pr-28-surgical-partial-merge)
8. [The Three Changes in PR #28](#8-the-three-changes-in-pr-28)
9. [Why Summary Flattening Breaks the Integration](#9-why-summary-flattening-breaks-the-integration)
10. [The Tripwire Test](#10-the-tripwire-test)
11. [PR #28 Communication Strategy](#11-pr-28-communication-strategy)
12. [Risk 4: Lock File Race Conditions](#12-risk-4-lock-file-race-conditions)
13. [PID-Based Lock Validation](#13-pid-based-lock-validation)
14. [Compatibility Win 1: Shared Stack](#14-compatibility-win-1-shared-stack)
15. [Compatibility Win 2: Shared Data Formats](#15-compatibility-win-2-shared-data-formats)
16. [Compatibility Win 3: Shared Test Framework](#16-compatibility-win-3-shared-test-framework)
17. [The Amiga Principle](#17-the-amiga-principle)
18. [Verification Matrix: The Calibration Report](#18-verification-matrix-the-calibration-report)
19. [Cross-References](#19-cross-references)
20. [Sources](#20-sources)

---

## 1. Risk Landscape Overview

The integration has four identified risks, ranked by severity:

| Risk | Severity | Likelihood | Impact | Mitigation |
|------|----------|-----------|--------|------------|
| R1: Scoring semantic mismatch | Medium | High | Medium | Adapted rubric, separate check implementations |
| R2: Token budget for scoring | Low | Medium | Low | User-gated insights, LLM-free core scoring |
| R3: PR #28 structural conflict | High | Certain | High | Surgical partial merge, tripwire test |
| R4: Lock file race conditions | Medium | Medium | Medium | PID validation, lock-manager.ts |

Risk R3 is the highest-priority item because it has certain likelihood (the PR exists now) and high impact (merging the summary flattening would require an immediate revert before the FeedbackCategory port can proceed). All other risks have standard mitigations that reduce their impact to acceptable levels [1].

```
RISK SEVERITY MATRIX
================================================================

  Impact
    High  │  R3          │              │
          │  PR #28      │              │
    Med   │              │  R1: Sem.    │  R4: Locks
          │              │  Mismatch    │
    Low   │              │  R2: Tokens  │
          │              │              │
          └──────────────┴──────────────┴──────────────
           High           Medium         Low
                         Likelihood
```

---

## 2. Risk 1: Scoring Semantic Mismatch

Caliber scores CLAUDE.md files -- prose documents that describe a project to an AI agent. gsd-skill-creator scores SKILL.md files -- structured documents with YAML frontmatter that define reusable capabilities. The same rubric categories apply to different document types [2].

The mismatch is real but manageable. The five rubric categories (Existence, Quality, Grounding, Accuracy, Freshness) are abstract enough to apply to both document types. The specific *checks* within each category must be adapted:

| Category | Caliber Check | gsd-skill-creator Check | Risk |
|----------|--------------|------------------------|------|
| Existence | CLAUDE.md file exists | SKILL.md file exists | None -- same pattern |
| Quality | Token budget < 2K | Content < 500 lines | Low -- different thresholds |
| Grounding | Directory refs on disk | File pattern triggers match | **Medium** -- different matching logic |
| Accuracy | Path freshness | Trigger target freshness | Low -- same git mechanism |
| Freshness | Recently updated | Recently updated | None -- identical check |

The Grounding category carries the highest adaptation risk because the matching logic is fundamentally different. Caliber matches prose directory references against `fs.existsSync()`. gsd-skill-creator must match YAML glob patterns against `git ls-files` output [2].

---

## 3. CLAUDE.md vs SKILL.md Structure

Understanding the structural differences explains why the Grounding check needs adaptation:

```
CLAUDE.md -- PROSE DOCUMENT
================================================================

  # Project Name

  This project uses TypeScript with React. The source code
  lives in `src/components/` and `src/features/`.

  ## Key Directories
  - `src/components/` -- UI components
  - `src/features/` -- feature modules
  - `tests/` -- test files


SKILL.md -- STRUCTURED DOCUMENT
================================================================

  ---
  name: typescript-patterns
  description: TypeScript patterns for React development.
    Use when editing .tsx files in src/ directories.
  triggers:
    filePatterns:
      - "src/components/**/*.tsx"
      - "src/features/**/*.tsx"
  extends: base-typescript
  version: 1.2.0
  enabled: true
  ---

  ## Instructions

  When working with TypeScript React components...
```

Caliber's Grounding check extracts directory references from prose using regex (backtick-delimited paths, markdown list items starting with paths). gsd-skill-creator's Grounding check reads structured YAML fields. The YAML approach is more reliable -- no regex parsing ambiguity -- but requires a different implementation path [3].

---

## 4. Grounding Check Adaptation

The adapted Grounding check for gsd-skill-creator:

```
GROUNDING CHECK -- gsd-skill-creator ADAPTATION
================================================================

  Input: SKILL.md with triggers.filePatterns YAML field

  For each filePattern in triggers.filePatterns:
    1. Expand glob against git ls-files:
       matches = execSync('git ls-files --full-name "' + pattern + '"')
    2. Count matches:
       if matches.length == 0:
         FAIL: "Trigger pattern '{pattern}' matches zero tracked files"
         fix: suggest closest matching pattern from git ls-files
       else:
         PASS: "{matches.length} files match trigger pattern"

  For extends field:
    3. Check if extended skill exists:
       if !fs.existsSync('.claude/skills/' + extends + '/SKILL.md'):
         FAIL: "Extends target '{extends}' does not exist"
         fix: list available skills

  Grounding score:
    file_pattern_score = (patterns_with_matches / total_patterns) * 12
    extends_score = extends_target_exists ? 8 : 0
    total_grounding = file_pattern_score + extends_score  // max 20
```

> **CAUTION:** The Grounding check must handle the case where `triggers.filePatterns` is undefined (some skills trigger on context, not file patterns). Skills without file patterns receive full Grounding score for the file pattern component, since there's nothing to ground against. The extends check still applies.

---

## 5. Risk 2: Token Budget for Score Operations

Caliber's scoring is LLM-free. If gsd-skill-creator's scoring stays LLM-free (which it should), there is zero token budget concern for the core scoring operation [4].

The risk emerges with the `insights` command, which computes trend analysis and generates human-readable summaries. If insights uses LLM-generated summaries (rather than template-based output), it introduces token costs:

| Operation | Token Cost | Frequency |
|-----------|-----------|-----------|
| `skill-creator score` | 0 (LLM-free) | Every session possible |
| `skill-creator refresh` | 0 (LLM-free, git-only) | On detected drift |
| `skill-creator insights` | 0 if template-based, ~500 if LLM-summarized | On explicit request |

The mitigation is simple: make insights template-based by default, with an optional `--detail` flag for LLM-enriched summaries. The template produces the arrow table and alerts; the LLM adds narrative interpretation [4].

---

## 6. Gating the Insights Command

The insights command is gated behind explicit user intent -- it never runs automatically:

| Trigger | Runs? | Rationale |
|---------|-------|-----------|
| Session start | No | Would add latency to every session |
| Post-commit hook | No | Not relevant to commit operation |
| Explicit `skill-creator insights` | Yes | User specifically requested it |
| Post-refinement | Optional | Show delta after refinement applies |

This gating prevents the "death by dashboard" antipattern where metrics are computed constantly but rarely consumed [5].

---

## 7. Risk 3: PR #28 Surgical Partial Merge

PR #28 from an external Tessl contributor contains three independent changes bundled into one pull request. The changes have different risk profiles and require different decisions. Treating PR #28 as a single accept/decline decision wastes a legitimate contribution and creates unnecessary friction [6].

---

## 8. The Three Changes in PR #28

| Change | Files | Decision | Reason |
|--------|-------|----------|--------|
| Summary flattening | feedback-store.ts, feedback.jsonl schema | **DECLINE** | Destroys structured FeedbackEntry fields required by FeedbackCategory port |
| Terminology renames | feedback-store.ts, test files | **HOLD** | Must happen after v1.50 enum work, not before |
| Unpinned GitHub Action | .github/workflows/*.yml | **ACCEPT** | Zero-risk security hygiene, immediate merge |

The GitHub Action pin is good work and should be acknowledged. The summary flattening is architecturally incompatible with the integration plan. The terminology renames are potentially valid but must be sequenced after the enum port to avoid breaking the 202-test baseline [6].

---

## 9. Why Summary Flattening Breaks the Integration

The FeedbackCategory enum port requires FeedbackEntry to remain a structured object with named fields. The summary flattening collapses the entry to a flat string, removing the structural foundation the enum needs:

```
STRUCTURAL CONFLICT -- PR #28 vs INTEGRATION
================================================================

  CURRENT FeedbackEntry (compatible with integration):
  {
    skillName:  "typescript-patterns",
    content:    "skill suggested wrong interface pattern",
    timestamp:  "2026-03-27T14:30:00Z"
  }

  AFTER Integration (Wave 1B adds category):
  {
    skillName:  "typescript-patterns",
    content:    "skill suggested wrong interface pattern",
    timestamp:  "2026-03-27T14:30:00Z",
    category:   FeedbackCategory.CORRECTION   // NEW field
  }

  IF PR #28 summary flattening merges FIRST:
  {
    summary: "typescript-patterns: skill suggested wrong interface pattern"
  }
  // category field has nowhere to live
  // Wave 1B would have to REVERT PR #28 before proceeding
  // Net result: wasted review cycles, contributor frustration

  TIMELINE CONSTRAINT:
    PR #28 flattening MUST NOT merge before FeedbackCategory lands
    PR #28 Action pin CAN merge immediately (no conflict)
    PR #28 renames CAN merge AFTER v1.50 enum work
```

The conflict is structural, not personal. The contributor's work is valid -- it's just sequenced incorrectly relative to the integration plan. The communication strategy (Section 11) preserves the relationship while protecting the architectural requirement [7].

---

## 10. The Tripwire Test

A structural regression test added in Wave 0 (Task 0.3) that catches schema-flattening changes automatically:

```
TRIPWIRE TEST -- FEEDBACK ENTRY STRUCTURAL GUARD
================================================================

  // feedback-store.test.ts -- added in Wave 0

  describe('FeedbackEntry structural guard', () => {

    it('preserves required fields through serialization', () => {
      const entry = {
        skillName:  'typescript-patterns',
        content:    'skill suggested wrong interface pattern',
        timestamp:  new Date().toISOString(),
      };
      const roundtripped = JSON.parse(JSON.stringify(entry));
      expect(roundtripped).toHaveProperty('skillName');
      expect(roundtripped).toHaveProperty('content');
      expect(roundtripped).toHaveProperty('timestamp');
      // category field added in Wave 1B -- its absence here is intentional.
      // When Wave 1B adds it, extend this test to assert FeedbackCategory.
    });

    it('FeedbackStore.append() accepts structured entry', async () => {
      const store = new FeedbackStore(tmpDir);
      await store.append({
        skillName: 'test-skill',
        content:   'correction text',
        timestamp: new Date().toISOString(),
      });
      const entries = await store.read('test-skill');
      expect(entries[0]).toHaveProperty('skillName', 'test-skill');
      expect(entries[0]).toHaveProperty('content');
      // Flat-string schema would fail: entries[0] would be a string,
      // not an object with named properties.
    });

  });
```

This test is green before the enum port (current schema is compatible) and remains green after it. Any PR that flattens FeedbackEntry to a string will fail it immediately, providing automated protection against the structural regression [8].

---

## 11. PR #28 Communication Strategy

The response to the contributor should be direct, explain the architectural reason, and keep the contribution alive:

```
RECOMMENDED PR COMMENT
================================================================

  "Thanks for this -- the Action pin is exactly right and
  we'll take that now.

  The summary flattening and field renames touch areas that
  are actively being extended. Typed feedback categories
  (FeedbackCategory enum) are landing in the next milestone
  and require FeedbackEntry to stay structured. Merging the
  flattening first would require an immediate revert -- not
  a great outcome for either of us.

  Would you be willing to:
    1. Pull the summary flattening and rename hunks from
       this PR, and merge the Action fix as a standalone?
    2. Open a new PR for the renames after v1.50 lands --
       happy to flag when the milestone closes.

  If you want to contribute to the FeedbackCategory design
  itself, I can loop you in on the spec."
```

This communication preserves three things: the Action pin contribution (accepted), the rename contribution (deferred, not rejected), and the contributor relationship (invited to participate in the enum design) [6].

---

## 12. Risk 4: Lock File Race Conditions

The CALIBER_LEARNINGS gotcha about stale lock files applies directly to gsd-skill-creator's PatternStore:

```
LOCK FILE RACE CONDITION -- FAILURE MODE
================================================================

  Session 1: Starts, acquires pattern-store.lock (PID 12345)
  Session 1: Crashes (process killed, OOM, Ctrl+C)
  Session 1: Lock file remains: pattern-store.lock contains "12345"

  Session 2: Starts, tries to acquire pattern-store.lock
  Session 2: Lock exists! But PID 12345 is no longer running.
  Session 2: Current behavior: WAITS INDEFINITELY or FAILS SILENTLY

  CORRECT behavior: Check if PID 12345 is running. If not,
  clean up stale lock. Acquire lock normally.
```

The fix is a `lock-manager.ts` utility that performs PID-based lock validation before acquisition [9].

---

## 13. PID-Based Lock Validation

```
LOCK MANAGER -- PID VALIDATION
================================================================

  async function acquireLock(lockPath: string): Promise<void> {
    if (fs.existsSync(lockPath)) {
      const lockContent = fs.readFileSync(lockPath, 'utf-8');
      const pid = parseInt(lockContent.trim(), 10);

      if (isNaN(pid)) {
        // Corrupt lock file -- clean up
        fs.unlinkSync(lockPath);
      } else {
        try {
          // Check if process is running (signal 0 = no signal, just check)
          process.kill(pid, 0);
          // Process IS running -- lock is valid, throw
          throw new Error('Lock held by running process ' + pid);
        } catch (err) {
          if (err.code === 'ESRCH') {
            // Process NOT running -- stale lock, clean up
            fs.unlinkSync(lockPath);
          } else {
            throw err;  // Permission error or other issue
          }
        }
      }
    }

    // Write new lock with current PID
    fs.writeFileSync(lockPath, String(process.pid));
  }
```

The `process.kill(pid, 0)` call is the standard Unix mechanism for checking process existence without sending a signal. It succeeds silently if the process exists and throws `ESRCH` if it doesn't [9].

> **WARNING:** PID-based lock validation has a race condition: between checking the PID and writing the new lock, another process could start with the same PID (PID recycling). This race window is extremely narrow (microseconds) and PID recycling to the exact same number is astronomically unlikely on modern systems with 32-bit PID spaces. For the use case (development tool, single user, single machine), this mitigation is sufficient.

---

## 14. Compatibility Win 1: Shared Stack

Both projects are TypeScript/Node.js targeting Claude Code. This eliminates three categories of integration friction:

| Eliminated Friction | Detail |
|--------------------|--------|
| Language boundary | No FFI, no serialization between languages |
| Runtime mismatch | Same Node.js runtime, same async model |
| Package ecosystem | Same npm registry, same dependency resolution |

The shared stack means ported logic can be copy-adapted rather than rewritten. Type definitions are directly shareable. Test patterns are directly portable [10].

---

## 15. Compatibility Win 2: Shared Data Formats

Both projects use JSONL for append-only data stores:

| Format | Caliber Usage | gsd-skill-creator Usage |
|--------|--------------|------------------------|
| JSONL | score-history.jsonl | feedback.jsonl, skill-metrics.jsonl |
| YAML | - | SKILL.md frontmatter, chipset configs |
| Markdown | CLAUDE.md, CALIBER_LEARNINGS.md | SKILL.md body, docs |

The JSONL format alignment means the new `skill-metrics.jsonl` follows an established pattern in both codebases. Parsing, writing, and retention management are proven patterns [10].

---

## 16. Compatibility Win 3: Shared Test Framework

Both projects use vitest. Test patterns are directly portable:

| Pattern | Caliber | gsd-skill-creator |
|---------|---------|-------------------|
| Framework | vitest | vitest |
| Assertion style | expect() | expect() |
| Mock system | vi.mock() | vi.mock() |
| Coverage tool | c8/istanbul via vitest | c8/istanbul via vitest |
| Test file pattern | *.test.ts | *.test.ts |

The 202 existing tests in gsd-skill-creator provide a comprehensive regression suite. Any integration change that breaks an existing test is immediately visible [11].

---

## 17. The Amiga Principle

The Amiga shipped in 1985 with a custom chipset -- Agnus, Denise, Paula -- because no general-purpose chip could handle video, audio, and DMA simultaneously at the required performance level. Jay Miner's team didn't build one chip that did everything. They built three chips that each excelled at one thing, connected through a shared bus with typed, deterministic interfaces [12].

Caliber is Paula -- specialized I/O, deterministic, fast, no wasted cycles. The scoring engine does one thing (cross-reference filesystems) and does it with zero LLM overhead, complete reproducibility, and sub-200ms latency.

gsd-skill-creator is Denise -- display logic, pattern rendering, output composition. The skill lifecycle system watches patterns, generates skills, renders them into the development environment, and refines them based on feedback.

The integration bus is DACP -- typed bundles with structured payloads. The `skillScorePayload` field in DACP bundles is the data that crosses the bus. Paula (scoring) produces the score; Denise (skill lifecycle) consumes it. The bus carries the data; neither chip needs to understand the other's internals [12].

```
THE AMIGA PRINCIPLE -- APPLIED TO INTEGRATION
================================================================

  AMIGA 1985                         CGI INTEGRATION 2026
  ==========                         ====================

  Agnus: DMA controller              GSD Orchestrator: Mission control
    - Moves data between chips         - Moves bundles between systems
    - Manages shared memory            - Manages .planning/ staging
    - No processing, just routing      - No scoring, just routing

  Denise: Display compositor          Skill-Creator: Skill lifecycle
    - Reads sprite data from RAM       - Reads patterns from sessions
    - Composites video output           - Composites SKILL.md output
    - Refreshes display each frame     - Refines skills each cycle

  Paula: Audio + I/O                  Caliber: Scoring + drift
    - DMA-driven audio playback        - Filesystem-driven scoring
    - Serial port management           - Git diff analysis
    - Deterministic, interrupt-driven  - Deterministic, LLM-free

  Shared Bus: 68000 address bus       Shared Bus: DACP protocol
    - Typed addresses                  - Typed bundles
    - Word-aligned transfers           - Structured payloads
    - Deterministic timing             - Deterministic scoring

  KEY INSIGHT: The Amiga's power came from specialization
  connected through clean interfaces, not from one chip
  trying to do everything. Same principle. Same result.
```

The Amiga Principle is not nostalgia. It's an engineering theorem: specialized execution paths, faithfully iterated, produce outcomes that general-purpose brute force cannot. A 7.16 MHz Amiga produced effects that 32 MHz PCs couldn't match -- not because it was faster, but because each chip was *perfectly matched* to its task [12].

---

## 18. Verification Matrix: The Calibration Report

The complete verification matrix maps each success criterion to its test coverage:

| # | Success Criterion | Test IDs | Status |
|---|-------------------|----------|--------|
| 1 | `skill-creator score` produces 100-pt LLM-free score | SC-02, CF-01 to CF-05 | Pending |
| 2 | Score categories cover all 5 dimensions | CF-01 to CF-04 | Pending |
| 3 | `score --compare` shows per-skill delta vs git ref | CF-08 | Pending |
| 4 | `skill-creator refresh` detects stale triggers | CF-13, CF-14, IN-05 | Pending |
| 5 | FeedbackStore uses 6-category taxonomy | CF-09, IN-02 | Pending |
| 6 | Refinement auto-reverts on score regression | SC-01, CF-10, CF-11 | Pending |
| 7 | `skill-metrics.jsonl` tracks activation/correction/ROI | CF-12, IN-03 | Pending |
| 8 | `skill-creator insights` shows trend arrows | CF-15 | Pending |
| 9 | `--agent cursor` strips extension fields | IN-06 | Pending |
| 10 | DACP bundles carry `skillScorePayload` | SC-04, IN-04 | Pending |
| 11 | New commands achieve 90%+ test coverage | CF-01 to CF-15 composite | Pending |
| 12 | All 202 existing tests pass after integration | SC-03 | Pending |
| 13 | PR #28 action-pin merged; flattening declined; tripwire green | SC-05 | Pending |

**Safety-critical tests (BLOCK level):**

| ID | Verifies | Expected Behavior |
|----|----------|-------------------|
| SC-01 | Score regression guard | Refinement producing lower score auto-reverted |
| SC-02 | No LLM calls in score-engine | score-engine.ts completes with zero LLM API calls |
| SC-03 | Existing 202 tests pass | All pre-integration tests pass after changes |
| SC-04 | DACP payload integrity | skillScorePayload does not corrupt existing bundles |
| SC-05 | FeedbackEntry structural guard | Tripwire test passes; schema flattening causes failure |

**Test count summary:**

| Category | Count | Priority | Failure Action |
|----------|-------|----------|----------------|
| Safety-critical | 5 | Mandatory | BLOCK release |
| Core functionality | 28 | Required | BLOCK merge |
| Integration | 12 | Required | BLOCK merge |
| Edge cases | 8 | Best-effort | LOG and document |
| **Total** | **53** | | |

---

## 19. Cross-References

> **Related:** [Caliber Architecture](01-caliber-architecture-analysis.md) -- source system architecture informing risk analysis
> **Related:** [GSD Architecture](02-gsd-skill-creator-architecture.md) -- receiving system architecture, DACP integrity concerns
> **Related:** [Integration Mapping](03-integration-mapping.md) -- port specifications evaluated for risk
> **Related:** [Calibration Loops](04-calibration-loops-quality-metrics.md) -- quality lifecycle dependent on risk mitigations

Cross-project references:

| Project | Connection |
|---------|-----------|
| GSD2 | GSD-2 Architecture defines DACP bundle integrity requirements (SC-04) |
| ACE | Compute Engine runtime validation for LLM-free scoring (SC-02) |
| PMG | Pi-Mono deployment stress-tests lightweight scoring under resource constraints |
| GSA | GSD Alignment provides the philosophical framework for the Amiga Principle |
| CMH | Computational Mesh validates lock-manager.ts in distributed environments |
| MCF | Multi-Cluster Federation tests DACP payload propagation across boundaries |
| K8S | Kubernetes container isolation validates platform-specific output (IN-06) |
| MGU | Module Governance consumes verification matrix results for promotion gates |

---

## 20. Sources

1. Tibsfox. "Caliber x GSD Integration Vision: Risk Analysis." Internal document, 2026.
2. caliber-ai-org. "src/scoring/: Category Implementations." GitHub, v1.29.4, 2026.
3. Anthropic. "Claude Code: SKILL.md Format Specification." docs.anthropic.com, 2025.
4. caliber-ai-org. "src/scoring/score-engine.ts: LLM-Free Implementation." GitHub, 2026.
5. Tufte, E. *The Visual Display of Quantitative Information.* 2nd Edition. Graphics Press, 2001.
6. Tibsfox. "PR #28 Analysis: Surgical Partial Merge." Internal analysis, 2026.
7. Tibsfox. "FeedbackCategory Enum: Structural Prerequisite Analysis." Internal analysis, 2026.
8. Tibsfox. "Tripwire Test Specification: FeedbackEntry Guard." Internal specification, 2026.
9. Stevens, W.R. & Rago, S. *Advanced Programming in the UNIX Environment.* 3rd Edition. Addison-Wesley, 2013. Ch. 14: "Advanced I/O."
10. caliber-ai-org. "ai-setup: package.json Dependencies." GitHub, v1.29.4, 2026.
11. Tibsfox. "gsd-skill-creator: Vitest Test Suite." GitHub, 2026.
12. Commodore-Amiga. *Amiga Hardware Reference Manual.* 3rd Edition. Addison-Wesley, 1991. Ch. 1-3.
13. Miner, J. "The Amiga Chipset: Design Philosophy." Presentation at Amiga Developer Conference, 1985.
14. caliber-ai-org. "CALIBER_LEARNINGS.md: Lock File Gotcha." GitHub, 2026.
15. IEEE. "IEEE 1003.1-2017: POSIX.1." The Open Group, 2017. Section on process.kill() semantics.
16. Tibsfox. "DACP Protocol Specification: Bundle Integrity." gsd-skill-creator dev branch, 2026.
