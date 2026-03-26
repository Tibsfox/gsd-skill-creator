# Paula Meets Agnus

> **Domain:** System Integration & Adaptive Learning
> **Module:** 6 -- skill-creator x GSD-2 Full Integration Architecture
> **Through-line:** *GSD-2 prevents context rot during a session. skill-creator prevents amnesia between sessions.* The integration is the bus between them -- the protocol that makes two chips into a system.

---

## Table of Contents

1. [The Integration Thesis](#1-the-integration-thesis)
2. [Module 1: Pi SDK Event Bridge](#2-module-1-pi-sdk-event-bridge)
3. [Module 2: Skill Discovery Path and Format Negotiation](#3-module-2-skill-discovery-path-and-format-negotiation)
4. [Module 3: Artifact Reader and Pattern Extraction](#4-module-3-artifact-reader-and-pattern-extraction)
5. [Module 4: Phase-Aware Skill Loading](#5-module-4-phase-aware-skill-loading)
6. [Module 5: Feedback Loop and Refinement Bridge](#6-module-5-feedback-loop-and-refinement-bridge)
7. [Module 6: Agent Composition and GSD-2 Subagent Wiring](#7-module-6-agent-composition-and-gsd-2-subagent-wiring)
8. [Integration Architecture Diagram](#8-integration-architecture-diagram)
9. [Success Criteria](#9-success-criteria)
10. [Cross-References](#10-cross-references)
11. [Sources](#11-sources)

---

## 1. The Integration Thesis

GSD-2 solves the session problem. skill-creator solves the inter-session problem. Together they solve the AI amnesia problem.

**GSD-2 alone:**
- Session 1: Fresh context, produces T01-SUMMARY.md
- Session 2: Fresh context, pre-loads T01-SUMMARY.md, produces T02-SUMMARY.md
- Session 100: Fresh context, pre-loads recent summaries, does not know what Session 1 discovered about this codebase's specific failure modes, naming conventions, or architectural quirks
- Result: Each session re-discovers patterns that previous sessions already found

**skill-creator alone:**
- Observes Claude Code sessions via hooks
- Cannot observe Pi SDK sessions (different session lifecycle)
- Cannot learn from GSD-2's richest artifact -- the DECISIONS.md register
- Cannot use phase context (Research vs Execute) to load the right skills
- Result: Skills are available but don't know they're running in a GSD-2 context

**Integrated:**
- GSD-2 session starts → event bridge creates observation record
- Observation record joins `.planning/patterns/sessions.jsonl`
- Pattern analyzer detects recurring patterns across sessions
- Skill generator promotes patterns into `.agents/skills/`
- Next GSD-2 Research session loads research-phase skills
- Next GSD-2 Execute session loads execute-phase skills
- Skill matches phase-specific context, not just generic keyword match
- Result: Session 100 starts with the accumulated knowledge of sessions 1-99, organized by phase, refined by feedback

---

## 2. Module 1: Pi SDK Event Bridge

**The problem:** skill-creator uses `settings.json` hooks (`PreToolUse`, `PostToolUse`, `Stop`) that only fire in Claude Code sessions. GSD-2 runs via Pi SDK's `InteractiveMode`. The hook system never fires.

**The solution:** A 10th GSD-2 extension (bridge.ts) that hooks into the Pi SDK's own session lifecycle events -- the same lifecycle events that GSD-2's existing 9 extensions already use.

**Bridge extension behavior:**

```typescript
// bridge.ts - 10th GSD-2 extension
// Syncs to ~/.gsd/agent/ on launch (always-overwrite)

class SkillCreatorBridge {
  async onSessionStart(session: PiSession) {
    this.observation = {
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      phase: await readCurrentPhase(),  // from STATE.md
      commands: [],
      filesAccessed: [],
    };
  }

  async onToolCall(event: ToolCallEvent) {
    this.observation.commands.push(event.toolName);
    if (event.toolName === 'read_file' || event.toolName === 'write_file') {
      this.observation.filesAccessed.push(event.params.path);
    }
  }

  async onSessionEnd(session: PiSession) {
    this.observation.outcome = await detectOutcome();  // was artifact written?
    this.observation.tokenCount = session.tokenUsage;
    await appendJSONL('.planning/patterns/sessions.jsonl', this.observation);
  }

  async onSessionCrash(session: PiSession) {
    this.observation.status = 'interrupted';
    await appendJSONL('.planning/patterns/sessions.jsonl', this.observation);
  }
}
```

**SessionObservation schema mapping:**

| skill-creator Field | GSD-2 Source | Extraction Method |
|--------------------|-------------|-------------------|
| `sessionId` | Pi SDK session UUID | Read from session manager at start |
| `timestamp` | Session dispatch time | ISO timestamp from STATE.md last-modified |
| `commands` | Tool calls in session | Aggregate tool names from Pi SDK event stream |
| `filesAccessed` | Read/Write tool targets | Collect file paths from tool_call events |
| `decisions` | DECISIONS.md delta | Diff append-only register between session boundaries |
| `phase` | STATE.md current phase | Read before dispatch: Research/Plan/Execute/Complete |
| `outcome` | T0N-SUMMARY.md written | Detect artifact creation within session boundary |
| `tokenCount` | Pi SDK cost tracker | Read from GSD-2's per-unit token ledger |

---

## 3. Module 2: Skill Discovery Path and Format Negotiation

**The problem:** GSD-2 reads `.agents/skills/` and `.claude/skills/`. skill-creator writes to `.claude/skills/`. The path alignment is accidental -- no format was negotiated, no metadata handoff designed.

**The solution:** skill-creator adds a `--gsd2` flag (or auto-detects `.gsd/` directory presence) that deposits skills to `.agents/skills/` in addition to `.claude/skills/`.

**SKILL.md format for GSD-2 compatibility:**

The critical field is `description`. GSD-2's skill discovery evaluates the description to determine phase relevance. Using GSD-2 phase vocabulary in the description makes discovery accurate:

```yaml
---
name: typescript-error-patterns
description: >
  TypeScript error patterns and resolution strategies for common type
  system failures. Use when GSD-2 is in Execute phase, working with
  TypeScript files, or when T0N-PLAN.md contains type-related must-haves.
  Also activates for: type errors, interface mismatches, generic constraints.
triggers:
  intents:
    - "typescript"
    - "type error"
    - "execute phase"
  files:
    - "*.ts"
    - "tsconfig.json"
  contexts:
    - "gsd-execute"
    - "gsd-plan"
  threshold: 0.4
enabled: true
version: 1
metadata:
  gsd2:
    phases: ["execute", "plan"]
    model_hint: "sonnet"
    token_estimate: 800
---
```

The `metadata.gsd2` block is ignored by skill-creator's existing parser (unknown fields are skipped) but read by GSD-2's enhanced skill discovery to filter by phase.

---

## 4. Module 3: Artifact Reader and Pattern Extraction

**The problem:** GSD-2's `.gsd/` directory is a goldmine of pattern data. `T0N-SUMMARY.md` files, `DECISIONS.md` entries, `M001-RESEARCH.md` findings -- all of this is exactly the observation data skill-creator needs. Currently it accumulates and is never analyzed.

**The solution:** A `GSDArtifactReader` class that watches `.gsd/` and extracts pattern candidates:

```typescript
class GSDArtifactReader {
  async processSummary(summaryPath: string) {
    const summary = await parseSummaryFile(summaryPath);
    // Extract from YAML frontmatter
    const observation: SessionObservation = {
      sessionId: summary.frontmatter.task_id,
      phase: summary.frontmatter.phase,
      decisions: summary.frontmatter.decisions,
      deviations: summary.frontmatter.deviations,  // "deviated from plan because..."
      outcome: summary.frontmatter.status,
    };
    await this.patternStore.addObservation(observation);
  }

  async processDecisions(decisionsPath: string) {
    const newEntries = await diffDecisionsFile(decisionsPath, this.lastProcessed);
    for (const entry of newEntries) {
      if (entry.type === 'reversal') {
        // A reversed decision is a feedback signal
        await this.feedbackStore.addRecord({
          type: 'decision_reversal',
          original: entry.original,
          reversal: entry.reversal,
          reason: entry.reason,
        });
      }
    }
  }
}
```

**What the pattern extractor finds:**
- Recurring tool call sequences (indicators of common tasks)
- Files frequently co-accessed (indicators of coupled modules)
- Decision patterns (architectural choices made repeatedly)
- Deviation patterns ("deviated from plan because" in SUMMARY files)
- Correction patterns (reversed DECISIONS.md entries)

---

## 5. Module 4: Phase-Aware Skill Loading

**The problem:** skill-creator's relevance scorer has no concept of GSD-2 phases. It loads skills based on intent patterns, file patterns, and context patterns -- all of which are context-agnostic. A "testing patterns" skill is relevant in Execute phase but wastes context in Research phase.

**The solution:** A `PhaseContext` type injected into the relevance scorer:

```typescript
type PhaseContext = {
  phase: 'research' | 'plan' | 'execute' | 'complete' | 'reassess';
  milestone: string;      // e.g., "M001"
  slice: string;          // e.g., "S01"
  task?: string;          // e.g., "T03" (Execute phase only)
  taskDescription?: string;
};

// Phase-to-skill-category mappings
const PHASE_SKILL_CATEGORIES: Record<string, string[]> = {
  research: ['domain-knowledge', 'ecosystem-survey', 'codebase-patterns'],
  plan: ['decomposition', 'estimation', 'dependency-analysis'],
  execute: ['implementation', 'testing', 'framework-specific', 'error-patterns'],
  complete: ['documentation', 'uat-generation', 'release-notes'],
  reassess: ['roadmap-judgment', 'risk-assessment'],
};
```

**Phase context injection flow:**
1. GSD-2 state machine reads STATE.md (current phase)
2. Bridge extension writes phase context to `.planning/patterns/current-phase.json`
3. skill-creator relevance scorer reads current-phase.json before scoring
4. Scorer applies phase multiplier: skills with category matching current phase get 2x relevance weight
5. Result: Different skills load for Research vs Execute, even on the same project

---

## 6. Module 5: Feedback Loop and Refinement Bridge

**The problem:** GSD-2's LLM corrects itself in DECISIONS.md. It records plan deviations in T0N-SUMMARY.md. These corrections are feedback signals that skill-creator's refinement engine should process -- but the vocabularies are incompatible.

**The solution:** A `GSDFeedbackTap` that translates GSD-2 artifacts into skill-creator FeedbackRecords:

**Decision reversal detection:**
```typescript
const REVERSAL_PATTERNS = [
  /changed earlier decision:/i,
  /reverted decision:/i,
  /correction: .* was wrong/i,
  /updated: .* no longer applies/i,
];
```

**Plan deviation extraction:**
```typescript
const DEVIATION_PATTERNS = [
  /deviated from plan because/i,
  /changed approach: /i,
  /discovered that original approach/i,
];
```

These patterns match the informal language GSD-2's LLM uses when recording corrections. A matched pattern produces a FeedbackRecord that feeds into skill-creator's refinement pipeline:

```typescript
const feedback: FeedbackRecord = {
  timestamp: new Date().toISOString(),
  skillId: matchedSkill.id,
  correctionType: 'plan_deviation',
  context: extractedContext,
  signal: 'negative',  // the deviation means the skill's guidance was incomplete
};
```

The bounded refinement rules apply: 20% max change per refinement cycle, 3 corrections minimum, 7-day cooldown.

---

## 7. Module 6: Agent Composition and GSD-2 Subagent Wiring

**The problem:** skill-creator generates composite agents when skills co-activate 5+ times over 7+ days. GSD-2 dispatches Scout, Researcher, and Worker subagents from `~/.gsd/agent/`. The agents exist but are never connected.

**The solution:** A format translation layer that converts skill-creator composite agents into GSD-2 subagent definitions:

```typescript
// skill-creator agent format (.claude/agents/auth-expert.md)
// -->
// GSD-2 subagent format (~/.gsd/agent/extensions/auth-expert.md)

function translateToGSD2SubagentFormat(agentFile: string): string {
  const agent = parseAgentFile(agentFile);
  return `
# ${agent.name} -- GSD-2 Integration
# Auto-generated by skill-creator agent composer

## Activation Conditions
Use when: ${agent.description}
GSD-2 phases: ${agent.metadata.gsd2_phases.join(', ')}

## Capabilities
${agent.skills.map(s => `- ${s.name}: ${s.description}`).join('\n')}

## Context Requirements
${agent.context_requirements}
  `;
}
```

**preferences.md auto-writer:**

skill-creator also writes GSD-2's `preferences.md` based on observed co-activation data:

```yaml
# preferences.md -- auto-written by skill-creator
# Do not manually edit; regenerated after each skill promotion cycle

always_use_skills:
  - typescript-error-patterns    # activated in 47/52 Execute sessions
  - jest-test-patterns           # activated in 38/52 Execute sessions

skill_rules:
  - "typescript-error-patterns: only in Execute phase"
  - "domain-auth-expert: Research and Execute phases, auth-related tasks only"

phase_skill_rules:
  research:
    - domain-knowledge
    - ecosystem-survey
  execute:
    - typescript-error-patterns
    - jest-test-patterns
    - framework-react-patterns
  complete:
    - documentation-generator
```

---

## 8. Integration Architecture Diagram

```
GSD-2 RUNTIME (Pi SDK)                SKILL-CREATOR (Node.js)
======================                =======================

[ /gsd auto ]                         [ skill-creator observe ]
     |                                        ^
     v                                        |
[ Pi SDK Session ]  --event-bridge-->  [ Session Observer ]
     |               (Module 1)         [ Pattern Store ]
     v                                        |
[ .gsd/ artifacts ] --artifact-read--> [ Pattern Analyzer ]
T0N-SUMMARY.md       (Module 3)        [ Suggestion Engine ]
DECISIONS.md                                  |
M001-RESEARCH.md                       [ Skill Generator ]
                                              |
[ skill_discovery ] <--skill-deposit-- [ .agents/skills/ ]
.agents/skills/       (Module 2)       [ .claude/skills/ ]
.claude/skills/                        SKILL.md files
     |                                        |
     v                                        v
[ Dispatch Prompt ] <--phase-context-- [ Relevance Scorer ]
Pre-inlined skills    (Module 4)       Phase-aware loading
     |                                        |
     v                                        v
[ LLM Execution ]   --feedback-tap-->  [ Feedback Store ]
Corrections/overrides (Module 5)       feedback.jsonl
DECISIONS.md updates                   Refinement Engine
     |                                        |
     v                                        v
[ Agent Manifest ]  <--agent-wire---   [ Agent Composer ]
always_use_skills     (Module 6)       .claude/agents/
preferences.md                         Composite agents
```

---

## 9. Success Criteria

| # | Criterion | Verifiable? |
|---|-----------|-------------|
| 1 | Pi SDK session produces SessionObservation in sessions.jsonl within 5 seconds | Yes -- check file after session |
| 2 | Promoted skill discovered by GSD-2 without manual config | Yes -- run /gsd auto after promotion |
| 3 | T0N-SUMMARY.md parsed with ≥90% field extraction accuracy | Yes -- compare expected vs extracted |
| 4 | DECISIONS.md reversals produce FeedbackRecord entries | Yes -- check feedback.jsonl after reversal |
| 5 | PhaseContext injected for all 4 GSD-2 phases | Yes -- log phase context at load time |
| 6 | Research phase skills differ from Execute phase skills | Yes -- compare loaded skill lists by phase |
| 7 | Composite agent translates to valid GSD-2 subagent format | Yes -- validate against GSD-2 subagent schema |
| 8 | preferences.md populated after ≥5 co-activations | Yes -- check file after 5 sessions |
| 9 | Integration adds ≤2 seconds to session startup | Yes -- measure /gsd auto startup time |
| 10 | Backward compatibility: existing skill-creator works without GSD-2 | Yes -- run without .gsd/ present |

---

## 10. Cross-References

| Project | Connection |
|---------|------------|
| [SYS](../SYS/index.html) | System architecture; integration as system design |
| [CMH](../CMH/index.html) | Distributed orchestration; inter-system communication |
| [MPC](../MPC/index.html) | Math engine integration patterns |
| [VAV](../VAV/index.html) | Storage architecture; pattern store design |
| [GRD](../GRD/index.html) | Optimization; feedback loop as gradient signal |
| [WAL](../WAL/index.html) | Systematic methodology; integration as transformation |

---

## 11. Sources

1. [GSD-2 README](https://github.com/gsd-build/GSD-2) -- Integration points and preferences.md format
2. [Pi SDK (pi-mono)](https://github.com/badlogic/pi-mono) -- InteractiveMode event lifecycle
3. [gsd-skill-creator source](https://github.com/Tibsfox/gsd-skill-creator) -- skill-creator architecture
4. [skill-creator-wasteland-integration-analysis.md](https://github.com/Tibsfox/gsd-skill-creator) -- Strategic analysis
5. [gsd-amiga-vision.md](https://github.com/Tibsfox/gsd-skill-creator) -- Amiga Principle: bus between chips
