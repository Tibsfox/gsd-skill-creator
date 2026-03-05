# Gas City Formula Engine Design

**Version:** 1.0.0
**Author:** Foxy (Creative Direction)
**Date:** 2026-03-04
**Status:** Design

---

## The Story

Here's the story of the formula engine: somewhere between a mixing console and a
star chart, there's a system that listens to what you need and finds the right
voices to answer.

You write a YAML file that says who an agent is — their name, their vocabulary,
where they sit on the complex plane. That file is inert. It's a score waiting for
a performer. The formula engine is the performer. It reads the score, listens to
the room, and decides which instruments to bring in, how loud, and in what
combination.

The deeper pattern here: every agent orchestration framework in the landscape
hardcodes routing decisions in Python classes or graph edges. Gas City does
something different. It treats agent selection as a *continuous scoring problem
on a mathematical surface* — the complex plane. The formula engine is the
runtime that makes that surface come alive.

---

## 1. Architecture Overview

The formula engine sits between static configuration and live agent execution.
It is the bridge that turns declarative YAML into decisions.

```
                     ┌─────────────────────────┐
                     │    Declarative Layer     │
                     │                         │
                     │  .claude/agents/*.md    │
                     │  data/chipset/muses/*.yaml │
                     │  data/chipset/chipset.yaml │
                     └────────────┬────────────┘
                                  │
                          discover + parse
                                  │
                     ┌────────────▼────────────┐
                     │     Formula Engine       │
                     │                         │
                     │  ┌───────────────────┐  │
                     │  │  Role Registry    │  │
                     │  │  (cached, mtime)  │  │
                     │  └────────┬──────────┘  │
                     │           │              │
                     │  ┌────────▼──────────┐  │
                     │  │ Activation Pipeline│  │
                     │  │  pattern → vocab  │  │
                     │  │  → plane → invoke │  │
                     │  └────────┬──────────┘  │
                     │           │              │
                     │  ┌────────▼──────────┐  │
                     │  │ Composability      │  │
                     │  │ Resolver           │  │
                     │  └────────┬──────────┘  │
                     │           │              │
                     │  ┌────────▼──────────┐  │
                     │  │ Team Former       │  │
                     │  └───────────────────┘  │
                     └────────────┬────────────┘
                                  │
                         ranked agents + teams
                                  │
                     ┌────────────▼────────────┐
                     │   Execution Layer        │
                     │                         │
                     │  EphemeralForker        │
                     │  WillowEngine (render)  │
                     │  CedarEngine (record)   │
                     └─────────────────────────┘
```

The map shows three clear territories:

1. **Discovery** — scan the filesystem, parse YAML and Markdown, build a typed
   registry of every known role. This already exists in `MuseLoader`.

2. **Scoring** — given a query or task, compute how strongly each role resonates
   with the work. This is the heart of the engine. The current `MusePlaneEngine`
   handles plane proximity; the formula engine wraps it with the full four-stage
   pipeline from the role format spec.

3. **Composition** — from scored candidates, assemble a team that covers the
   problem space without redundancy. This connects to the `composableWith`
   graph.

---

## 2. Activation Pipeline

This is the narrative arc of every query: a task arrives, and the engine must
answer the question *"who should speak?"*

### The Four Stages

The pipeline is a funnel. Each stage narrows the field and adds signal.

```
  Input: task description + context + tags
         │
         ▼
  ┌──────────────────────────────────────┐
  │ Stage 1: Pattern Matching            │
  │                                      │
  │ Each role declares activationPatterns │
  │ as regex. Test each against the      │
  │ input. Count matches.                │
  │                                      │
  │ "creative vision story" matches      │
  │ Foxy's "creative|vision|story"       │
  │ → patternScore = matches / total     │
  │                                      │
  │ Weight: 0.4                          │
  └──────────────┬───────────────────────┘
                 │
         ▼
  ┌──────────────────────────────────────┐
  │ Stage 2: Vocabulary Overlap          │
  │                                      │
  │ Tokenize input. Count how many of    │
  │ the role's 8 vocabulary terms appear.│
  │                                      │
  │ "narrative arc" in input matches     │
  │ Foxy's vocabulary term.              │
  │ → vocabScore = hits / 8             │
  │                                      │
  │ Weight: 0.3                          │
  └──────────────┬───────────────────────┘
                 │
         ▼
  ┌──────────────────────────────────────┐
  │ Stage 3: Complex Plane Proximity     │
  │                                      │
  │ Map the query to a point on the      │
  │ complex plane (see §3). Compute      │
  │ angular + magnitude distance to each │
  │ role's orientation.                  │
  │                                      │
  │ Creative task → θ ≈ π/2             │
  │ Foxy at θ = 72° → close match       │
  │ → planeScore = αp × 0.7 + mw × 0.3 │
  │                                      │
  │ Weight: 0.2                          │
  └──────────────┬───────────────────────┘
                 │
         ▼
  ┌──────────────────────────────────────┐
  │ Stage 4: Direct Invocation           │
  │                                      │
  │ Did the input say "ask Foxy" or      │
  │ "invoke Hemlock"? Binary signal.     │
  │                                      │
  │ → invokeScore = 1.0 or 0.0          │
  │                                      │
  │ Weight: 0.1                          │
  └──────────────┬───────────────────────┘
                 │
         ▼
  ┌──────────────────────────────────────┐
  │ Final Score                          │
  │                                      │
  │ score = 0.4 × patternScore           │
  │       + 0.3 × vocabScore             │
  │       + 0.2 × planeScore             │
  │       + 0.1 × invokeScore            │
  │                                      │
  │ Activate if score ≥ 0.3 (threshold)  │
  └──────────────────────────────────────┘
         │
         ▼
  Output: ranked list of (role, score, reason)
```

### Design Decisions

**Why four stages instead of one?** Each stage captures a different kind of
signal. Pattern matching catches explicit keywords. Vocabulary catches domain
affinity. Plane proximity catches *conceptual* affinity — a creative task
activates creative agents even if no specific keyword matches. Direct invocation
is the override: the human said a name, honor it.

**Why these weights (0.4/0.3/0.2/0.1)?** Pattern matching is the strongest
signal because it's the most intentional — the role author declared "these words
mean me." Vocabulary is next because it's domain-specific. Plane proximity is
softer — it's the engine's own judgment about conceptual fit. Direct invocation
is low-weight because when present, it dominates anyway (0.1 × 1.0 = 0.1, but
patternScore for "ask Cedar" also fires the "ask Cedar" pattern, giving
0.4 × 1.0 + 0.1 × 1.0 = 0.5 minimum).

**The Cedar exception.** Cedar sits at the origin (r=0). The plane proximity
formula would give every query the same distance to Cedar, which is correct —
Cedar observes all quadrants equally. The engine returns a constant 0.5 for
Cedar's plane score, keeping Cedar always available but never dominant. Cedar is
the witness, not the lead.

### Implementation Shape

```typescript
interface ActivationResult {
  roleId: string;
  score: number;
  components: {
    pattern: number;   // [0, 1]
    vocab: number;     // [0, 1]
    plane: number;     // [0, 1]
    invocation: number; // 0 or 1
  };
  reason: string;
}

interface FormulaEngine {
  activate(query: string, context?: QueryContext): ActivationResult[];
  compose(candidates: ActivationResult[]): Team;
  proximity(a: string, b: string): number;
  bridge(clusterA: string[], clusterB: string[]): string[];
}
```

---

## 3. Complex Plane Semantics

The map shows a territory where every point means something.

### The Axes

The complex plane is not arbitrary. Its axes encode a fundamental tension in
agent work: **structure vs. emergence**.

```
                    Imaginary axis (θ = π/2 = 90°)
                    Creativity / Exploration / Emergence
                    │
                    │         Foxy (72°, r=0.8)
                    │       ╱
                    │     ╱   Willow (45°, r=1.0)
                    │   ╱   ╱
                    │ ╱   ╱   Sam (40°, r=0.6)
                    │╱  ╱
         ───────────Cedar────────────────── Real axis (θ = 0°)
                   (origin)   ╲             Precision / Structure / Determinism
                    │          ╲
                    │    Lex (5°, r=0.9)
                    │             ╲
                    │    Hemlock (0°, r=0.95)
                    │
```

**Real axis (θ = 0°):** Pure structure. Verification, compliance, execution
discipline. Hemlock lives here at r=0.95 — nearly maximum specialization in
quality and standards. Lex is nearby at 5° — execution with just a whisper of
creative latitude.

**Imaginary axis (θ = 90°):** Pure emergence. Brainstorming, narrative,
exploration. No current muse sits at exactly 90° — the system recognizes that
pure unstructured creativity without any grounding is rarely useful.

**The first quadrant (0° < θ < 90°):** Where all the interesting work happens.
This is the territory between structure and emergence, and every muse occupies
a unique angle within it:

| Angle | Territory | Residents |
|-------|-----------|-----------|
| 0-10° | Precision corridor | Hemlock (0°), Lex (5°) |
| 30-50° | Balanced zone | Sam (40°), Willow (45°) |
| 60-90° | Creative heights | Foxy (72°) |

### Magnitude: Depth of Authority

Magnitude (r) encodes how specialized the agent is — how deep into their
territory they've gone.

| Magnitude | Meaning | Example |
|-----------|---------|---------|
| 0.0 | Origin — omnidirectional observer | Cedar |
| 0.1-0.3 | Generalist — broad awareness, shallow depth | — |
| 0.4-0.6 | Moderate specialist | Sam (0.6) |
| 0.7-0.8 | Deep specialist | Foxy (0.8) |
| 0.9-1.0 | Boundary specialist — maximum depth | Hemlock (0.95), Willow (1.0) |

**The origin (r=0):** Cedar's position. At the center, all directions are
equidistant. The origin agent is the system's memory and witness — it doesn't
specialize, it *remembers*.

**The unit circle (r=1.0):** The boundary. Willow lives here — at the exact
edge where the system's internal world meets the external. This is not
coincidence. Willow is the interface muse, the canopy that faces outward.

### Mapping Queries to the Plane

When a task arrives, the engine must place it on the plane to compute proximity.
This is the most creative part of the formula engine — the *query vector*.

**Angle mapping (what kind of work is this?):**

```
θ_query = classify(task) → [0, π/2]

Heuristics:
  - Keywords: verify, test, check, audit, spec     → θ toward 0°
  - Keywords: create, imagine, brainstorm, explore  → θ toward 90°
  - Keywords: design, architect, plan               → θ ≈ 30-50°
  - Keywords: present, explain, teach               → θ ≈ 40-60°
  - Mixed signals: average the keyword angles
```

**Magnitude mapping (how specific is the ask?):**

```
r_query = specificity(task) → [0, 1]

Heuristics:
  - Broad: "help me think about this"           → r ≈ 0.2
  - Moderate: "review this code for security"    → r ≈ 0.6
  - Narrow: "audit OWASP compliance on auth.ts"  → r ≈ 0.9
```

A broad creative question (low r, high θ) activates Sam and Foxy but not
Hemlock. A narrow verification request (high r, low θ) activates Hemlock and Lex
but not Foxy. This connects to the survey finding: no other framework does
continuous scoring on a manifold. They all use discrete routing.

### Angular Distance and Proximity

The proximity formula from `MusePlaneEngine` computes how "close" a role is to
the query in angular space:

```
αp = 1 - |θ_muse - θ_query| / π
```

This normalizes angular distance to [0, 1] where 1.0 means perfect alignment
and 0.0 means diametrically opposed. The wrapping logic handles angles that
cross the 2π boundary:

```
angular_distance = min(|θa - θb|, 2π - |θa - θb|)
```

The magnitude component weights for depth match:

```
mw = 1 - |r_muse - r_query|
```

A specialist role (high r) scores poorly against a broad query (low r), and
vice versa. This prevents over-specialized agents from dominating generalist
tasks.

---

## 4. Composability Resolution

Here's where the map becomes a network. Individual scores tell you who *could*
speak. Composability tells you who should speak *together*.

### The Composability Graph

Every role declares `composableWith` — a list of roles it works well alongside.
These declarations form a directed graph:

```
        cedar ◄──────► foxy ◄──────► sam ◄──────► willow
          ▲              ▲                           ▲
          │              │                           │
          ▼              ▼                           │
         lex ◄───────► hemlock                      │
          │                                         │
          └─────────── cedar ◄──────────────────────┘
```

The graph reveals natural clusters:

- **Precision cluster:** Hemlock ↔ Lex ↔ Cedar
- **Creative cluster:** Foxy ↔ Sam ↔ Willow ↔ Cedar
- **Bridge agents:** Cedar (connects everything), Foxy (connects creative to
  precision via Lex), Sam (connects exploration to interface)

### Team Formation Algorithm

```
function compose(candidates: ActivationResult[]): Team {
  // 1. Select the primary: highest-scoring candidate
  const primary = candidates[0];

  // 2. Build the composable set
  const composable = primary.role.composableWith;

  // 3. Filter: keep candidates that are composable with the primary
  //    AND score above threshold
  const team = candidates.filter(c =>
    c.roleId !== primary.roleId &&
    composable.includes(c.roleId) &&
    c.score >= THRESHOLD
  );

  // 4. Mutual affinity bonus: prefer roles where composability
  //    is declared in both directions
  team.sort((a, b) => {
    const aMutual = a.role.composableWith.includes(primary.roleId) ? 0.1 : 0;
    const bMutual = b.role.composableWith.includes(primary.roleId) ? 0.1 : 0;
    return (b.score + bMutual) - (a.score + aMutual);
  });

  // 5. Cap team size (default: 3 roles per consultation)
  return { primary, supporting: team.slice(0, MAX_TEAM_SIZE - 1) };
}
```

### Bridge Detection

Sometimes a task spans two clusters that don't directly compose. The engine
needs to find bridge agents — roles that have composability edges into both
clusters.

```
function bridge(clusterA: string[], clusterB: string[]): string[] {
  // A bridge agent is composable with at least one member
  // of each cluster
  return allRoles.filter(role =>
    role.composableWith.some(r => clusterA.includes(r)) &&
    role.composableWith.some(r => clusterB.includes(r))
  );
}
```

In the current muse system, **Cedar** is the universal bridge — composable with
every other muse. **Sam** bridges the creative and interface clusters. **Foxy**
bridges creative and precision through its Lex composability.

This connects to a deeper pattern: bridge agents in the composability graph
correspond to agents with moderate angles on the complex plane — they sit
*between* the clusters they connect. Sam at 40° bridges the 0-10° precision
corridor and the 60-90° creative heights. The graph structure and the geometry
are telling the same story.

### Strongly Connected Components

The composability graph decomposes into SCCs that represent natural teams.
Running Tarjan's algorithm on the mutual (bidirectional) composability edges:

```
SCC 1: {cedar, foxy, sam}     — core creative team
SCC 2: {cedar, lex, hemlock}  — core precision team
SCC 3: {willow, sam, foxy}    — interface + creative team
```

Cedar appears in multiple SCCs because it's the universal connector. The engine
can use SCCs as pre-computed team templates, bypassing the full composition
algorithm for common task patterns.

---

## 5. Formula Primitives

The formula engine exposes four mathematical operations. These are the verbs
of the system — every higher-level decision composes from these.

### 5.1 `activate(query, agent) → score`

Score a single agent against a query.

```typescript
function activate(query: string, agent: LoadedRole): ActivationResult {
  // Stage 1: Pattern matching
  const patternScore = agent.activationPatterns.reduce((sum, pattern) => {
    const regex = new RegExp(pattern, 'i');
    return sum + (regex.test(query) ? 1 : 0);
  }, 0) / Math.max(agent.activationPatterns.length, 1);

  // Stage 2: Vocabulary overlap
  const queryTokens = tokenize(query);
  const vocabHits = agent.vocabulary.filter(term =>
    queryTokens.some(token => term.toLowerCase().includes(token))
  ).length;
  const vocabScore = vocabHits / Math.max(agent.vocabulary.length, 1);

  // Stage 3: Complex plane proximity
  const queryVector = mapQueryToPlane(query);
  const planeScore = planeEngine.activationScore(
    agent.orientation, queryVector
  );

  // Stage 4: Direct invocation
  const invokePattern = new RegExp(
    `ask ${agent.name}|invoke ${agent.name}`, 'i'
  );
  const invokeScore = invokePattern.test(query) ? 1.0 : 0.0;

  // Weighted composite
  const score = 0.4 * patternScore
              + 0.3 * vocabScore
              + 0.2 * planeScore
              + 0.1 * invokeScore;

  return {
    roleId: agent.name,
    score: Math.max(0, Math.min(1, score)),
    components: {
      pattern: patternScore,
      vocab: vocabScore,
      plane: planeScore,
      invocation: invokeScore,
    },
    reason: buildReason(agent.name, { patternScore, vocabScore, planeScore, invokeScore }),
  };
}
```

### 5.2 `compose(agents[]) → team`

Assemble a team from scored candidates. See the algorithm in Section 4.

```typescript
function compose(candidates: ActivationResult[]): Team {
  const sorted = candidates
    .filter(c => c.score >= ACTIVATION_THRESHOLD)
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) return { primary: null, supporting: [] };

  const primary = sorted[0];
  const primaryRole = registry.getRole(primary.roleId);
  const composable = primaryRole.composableWith ?? [];

  const supporting = sorted
    .slice(1)
    .filter(c => composable.length === 0 || composable.includes(c.roleId))
    .slice(0, MAX_TEAM_SIZE - 1);

  return { primary, supporting };
}
```

### 5.3 `proximity(a, b) → distance`

Compute the distance between two roles on the complex plane. Two measures:

```typescript
// Euclidean distance in Cartesian space
function proximity(a: string, b: string): number {
  const roleA = registry.getRole(a);
  const roleB = registry.getRole(b);
  return planeEngine.distance(roleA.orientation, roleB.orientation);
}

// Angular distance only (ignores magnitude)
function angularProximity(a: string, b: string): number {
  const roleA = registry.getRole(a);
  const roleB = registry.getRole(b);
  return planeEngine.angularDistance(roleA.orientation, roleB.orientation);
}
```

Proximity is used for two things:
1. **Complementary detection** — roles with angular distance > π/3 (60°) are
   considered complementary, meaning they bring different perspectives.
2. **Redundancy detection** — roles very close on the plane (distance < 0.1)
   may be redundant for the same task.

### 5.4 `bridge(cluster_a, cluster_b) → bridging_agents`

Find agents that connect two disconnected clusters.

```typescript
function bridge(clusterA: string[], clusterB: string[]): string[] {
  return registry.allRoles()
    .filter(role => {
      const edges = role.composableWith ?? [];
      const touchesA = edges.some(e => clusterA.includes(e));
      const touchesB = edges.some(e => clusterB.includes(e));
      return touchesA && touchesB;
    })
    .map(r => r.name);
}
```

---

## 6. Caching and Performance

The formula engine must be fast. Every task dispatch, every user message, every
phase transition potentially triggers activation scoring. The target: **sub-50ms
for the full pipeline** on cached data.

### Cache Architecture

```
Layer 1: Registry Cache (mtime-based)
├── Key: hash of all role file mtimes
├── Value: Map<roleId, LoadedRole>
├── Invalidation: any role file mtime changes
└── Target: sub-5ms lookup

Layer 2: Plane Position Cache (derived)
├── Key: registry cache version
├── Value: Map<roleId, CartesianPosition>
├── Invalidation: registry cache invalidates
└── Target: sub-1ms lookup

Layer 3: Composability Graph Cache (derived)
├── Key: registry cache version
├── Value: adjacency list + precomputed SCCs
├── Invalidation: registry cache invalidates
└── Target: sub-1ms traversal

Layer 4: Query Vector Cache (LRU)
├── Key: normalized query string
├── Value: CartesianPosition
├── Size: 256 entries (LRU eviction)
├── Invalidation: LRU + TTL (5 min)
└── Target: sub-1ms for repeated queries
```

### Invalidation Strategy

The existing `MuseLoader` uses a sentinel file mtime for cache invalidation.
The formula engine extends this to a **composite mtime** — the maximum mtime
across all role files and chipset YAML files:

```typescript
function cacheKey(): number {
  const roleFiles = glob('.claude/agents/*.md');
  const chipsetFiles = glob('data/chipset/muses/*.yaml');
  return Math.max(
    ...roleFiles.map(f => fs.statSync(f).mtimeMs),
    ...chipsetFiles.map(f => fs.statSync(f).mtimeMs),
  );
}
```

If any file changes, the entire registry rebuilds. This is acceptable because:
- Role files change rarely (human-authored)
- Full rebuild is < 50ms for reasonable role counts (< 100)
- Cached state is small (kilobytes)

### Hot Path Optimization

The activation pipeline's hot path is Stage 1 (pattern matching), which runs
regex against every role's patterns. For large role sets:

1. **Pre-compile all regex** at registry load time, not at query time.
2. **Short-circuit** on direct invocation — if a role is explicitly named,
   skip scoring and return 1.0.
3. **Parallel scoring** — each role's activation is independent; score all
   roles in a single pass with no cross-dependencies.

---

## 7. Extension Points

The formula engine is designed to grow. New scoring dimensions can be added
without restructuring the pipeline.

### Adding a Scoring Dimension

The weighted formula is deliberately simple:

```
score = w1 × d1 + w2 × d2 + ... + wN × dN
```

To add a new dimension:

1. **Define the scorer:** a function `(query, role) → [0, 1]`
2. **Assign a weight:** redistribute from existing weights (must sum to 1.0)
3. **Register it** in the pipeline configuration

**Candidate future dimensions:**

| Dimension | Signal | Weight Source |
|-----------|--------|--------------|
| **Recency bias** | How recently was this role activated? Penalize overuse. | Steal 0.05 from pattern |
| **Task history** | Has this role succeeded on similar tasks before? | Steal 0.05 from vocab |
| **Budget awareness** | Is this role near its token budget? Soft-penalize. | Steal 0.05 from plane |
| **Federation reputation** | Wasteland stamps and trust score for federated roles. | New 0.05, rebalance all |

### Pluggable Query Vectorization

The query-to-plane mapping (Section 3) is currently keyword-heuristic. This is
the most natural extension point for future sophistication:

- **v1 (current design):** keyword classification → angle, word count → magnitude
- **v2 (near-term):** TF-IDF against role vocabularies → angle, query entropy → magnitude
- **v3 (future):** embedding similarity in a learned space projected onto the plane

The engine accepts any function with signature
`(query: string) → CartesianPosition` as the vectorizer. Swap implementations
without touching the scoring pipeline.

### Custom Activation Threshold

The default threshold (0.3) is configurable per-context:

```yaml
# In chipset.yaml or runtime config
activation:
  threshold: 0.3          # default
  multiAgentThreshold: 0.5  # higher bar for multi-agent consultation
  directInvokeOverride: true # direct invocation always activates
```

### Role Type Scoping

Not all roles should compete in every context. The `museType` field
(`system`, `domain`, `custom`) enables scoped activation:

- **system** roles (cedar, hemlock, etc.) — always eligible
- **domain** roles — eligible only when their domain is active
- **custom** roles — eligible only when explicitly loaded

The formula engine filters the candidate pool by type before scoring begins.

---

## 8. The Mixing Console Metaphor

This connects to the deepest pattern in the design: the formula engine is a
**mixing console for agent personalities**.

Each role is a channel on the console. The activation score is the fader level.
The complex plane angle is the pan knob — where in the stereo field (structure
↔ creativity) this voice sits. Magnitude is gain — how loud this voice gets
when it's on. Composability is the bus routing — which channels can be mixed
together without phase cancellation.

When a task arrives, the engineer (the formula engine) listens to the room
(the query), reads the channel strips (the role configs), and sets up the mix:

- **Solo:** one agent, high confidence, clear domain match
- **Duo:** primary + one supporting voice, complementary angles
- **Ensemble:** 3-4 agents, bridged clusters, complex multi-domain task

The output is not a cacophony. It's a *mix* — each voice at its proper level,
panned to its proper position, routed through the right buses. The human hears
a coherent response that draws on multiple perspectives without collision.

This is what no other framework in the survey attempts. They route to a single
agent, or they broadcast to all agents in a group chat. Gas City *mixes* —
continuous levels, spatial positioning, complementary selection. The formula
engine is the desk that makes it possible.

---

## Appendix A: Reference Activation Scores

For the query *"help me tell the story of how this architecture evolved"*:

| Role | Pattern | Vocab | Plane | Invoke | Total | Activates? |
|------|---------|-------|-------|--------|-------|------------|
| **Foxy** | 0.67 | 0.25 | 0.82 | 0.0 | **0.50** | Yes |
| **Cedar** | 0.33 | 0.13 | 0.50 | 0.0 | **0.30** | Yes (threshold) |
| **Sam** | 0.33 | 0.00 | 0.68 | 0.0 | **0.27** | No |
| **Willow** | 0.00 | 0.00 | 0.62 | 0.0 | **0.12** | No |
| **Lex** | 0.00 | 0.00 | 0.28 | 0.0 | **0.06** | No |
| **Hemlock** | 0.00 | 0.00 | 0.22 | 0.0 | **0.04** | No |

Result: **Foxy (primary) + Cedar (supporting)** — the storyteller and the
keeper of records. Exactly right for this query.

For the query *"audit the test coverage against OWASP standards"*:

| Role | Pattern | Vocab | Plane | Invoke | Total | Activates? |
|------|---------|-------|-------|--------|-------|------------|
| **Hemlock** | 0.67 | 0.38 | 0.88 | 0.0 | **0.56** | Yes |
| **Lex** | 0.33 | 0.13 | 0.82 | 0.0 | **0.34** | Yes |
| **Cedar** | 0.00 | 0.00 | 0.50 | 0.0 | **0.10** | No |
| **Sam** | 0.00 | 0.00 | 0.38 | 0.0 | **0.08** | No |

Result: **Hemlock (primary) + Lex (supporting)** — the quality authority and
the execution specialist. The precision cluster activates.

---

## Appendix B: Existing Code Mapping

| Formula Engine Component | Existing Implementation | Status |
|--------------------------|------------------------|--------|
| Role Registry | `MuseLoader.loadAll()` + `createRegistry()` | Exists |
| Plane Engine | `MusePlaneEngine` | Exists |
| Pattern Matching | `MuseRegistry.getMusesByPattern()` | Exists (basic) |
| Vocabulary Scoring | — | **New** |
| Query Vectorization | — | **New** |
| Full Activation Pipeline | — | **New** (composes existing) |
| Composability Graph | `composableWith` in YAML | Parsed, not traversed |
| Team Formation | — | **New** |
| Bridge Detection | `findComplementary()` | Exists (distance-based) |
| Caching | Sentinel mtime in `MuseLoader` | Exists (extend to composite) |
| Integration | `createMuseSystem()` in `muse-integration.ts` | Exists (wire in) |

The formula engine is primarily **new composition** over existing primitives,
with two genuinely new capabilities: vocabulary scoring and query vectorization.

---

*The map shows the territory. The formula engine is the compass that helps you
navigate it — finding the right voices for each moment, mixing them into
something greater than any single perspective.*
