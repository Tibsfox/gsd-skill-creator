---
name: math-investigation-team
type: team
category: math
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/math/math-investigation-team/README.md
description: Full Mathematics Department investigation team for multi-domain problems spanning proof, computation, pattern-finding, and structural analysis. Hypatia classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Polya. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the domain is not obvious and different mathematical perspectives may yield different insights. Not for routine computation, pure proof, or pure pattern exploration.
superseded_by: null
---
# Math Investigation Team

Full-department multi-method investigation team for mathematical problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `rca-deep-team` runs multiple analysis methods on an incident.

## When to use this team

- **Multi-domain problems** spanning proof, computation, pattern-finding, and structural analysis -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different mathematical perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a number theory problem that needs Gauss's computation, Ramanujan's pattern detection, and Euclid's proof).
- **Novel problems** where the user does not know which specialist to invoke, and Hypatia's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a mathematical object requires seeing it through multiple lenses (algebraic structure via Noether, analytic behavior via Euler, computational patterns via Gauss/Ramanujan).
- **Verification of complex results** -- when a proof needs computational cross-checks, structural validation, and pedagogical review simultaneously.

## When NOT to use this team

- **Simple computations** -- use `gauss` or `euler` directly. The investigation team's token cost is substantial.
- **Pure proof requests** where the domain is clear -- use `proof-workshop-team`.
- **Pure pattern exploration** or conjecture generation -- use `discovery-team`.
- **Beginner-level teaching** with no research component -- use `polya` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `hypatia` in single-agent mode.

## Composition

The team runs all seven Mathematics Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `hypatia` | Classification, orchestration, synthesis | Opus |
| **Proof specialist** | `euclid` | Formal proof construction and verification | Opus |
| **Computation specialist** | `gauss` | Algebraic computation, number theory, modular arithmetic | Sonnet |
| **Analysis specialist** | `euler` | Calculus, series, limits, numerical methods | Sonnet |
| **Structure specialist** | `noether` | Abstract algebra, symmetry, category theory | Opus |
| **Pattern specialist** | `ramanujan` | Pattern detection, conjecture generation | Sonnet |
| **Pedagogy specialist** | `polya` | Level-appropriate explanation, learning pathways | Sonnet |

Three agents run on Opus (Hypatia, Euclid, Noether) because their tasks require deep reasoning. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior MathSession hash
        |
        v
+---------------------------+
| Hypatia (Opus)            |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (compute/prove/explain/explore/verify)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Euclid    Gauss    Euler   Noether  Ramanujan  (Polya
    (proof)   (comp)   (anly)  (struct) (pattern)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Hypatia activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Hypatia (Opus)            |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Polya (Sonnet)            |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Hypatia (Opus)            |  Phase 5: Record
              | Produce MathSession      |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + MathSession Grove record
```

## Synthesis rules

Hypatia synthesizes the specialist outputs using these rules, directly analogous to the `rca-deep-team` synthesis protocol:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same result independently (e.g., Gauss computes a value and Euler derives it analytically), mark the result as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Hypatia does not force a reconciliation. Instead:

1. State both findings with attribution ("Gauss's computation yields X; Euler's series yields Y").
2. Check for error: re-delegate to the specialist whose result is less expected.
3. If the disagreement persists after re-checking, escalate to Euclid for formal adjudication.
4. Report the disagreement honestly to the user.

### Rule 3 -- Structure over computation

When Noether identifies an algebraic structure that explains a computational pattern (e.g., "this recurrence is the character table of a cyclic group"), the structural explanation takes priority in the synthesis. The computation becomes evidence for the structural claim.

### Rule 4 -- Conjecture is not fact

Ramanujan's output is always labeled as conjecture. If Euclid can prove the conjecture, it graduates to theorem. If Euclid cannot prove or disprove it, the conjecture is reported with its confidence level and the honest statement "proof remains open."

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Polya adapts the presentation -- simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The mathematical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language mathematical question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Hypatia infers from the query.
3. **Prior MathSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows work at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or open conjectures
- Suggests follow-up explorations

### Grove record: MathSession

```yaml
type: MathSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: explore
  user_level: graduate
agents_invoked:
  - hypatia
  - euclid
  - gauss
  - euler
  - noether
  - ramanujan
  - polya
work_products:
  - <grove hash of MathProof>
  - <grove hash of MathDerivation>
  - <grove hash of MathConjecture>
  - <grove hash of MathExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (MathProof, MathDerivation, MathConjecture, or MathExplanation) linked from the MathSession.

## Escalation paths

### Internal escalations (within the team)

- **Ramanujan finds pattern, Euclid can't prove/disprove:** Report honestly. The conjecture stands as open with its confidence level. Suggest computational extensions (more cases, different parameters) and note that the statement is unresolved.
- **Gauss/Euler computation disagrees with Euclid proof:** Re-check both. If Gauss finds a counterexample to a claim Euclid proved, the proof has a flaw -- escalate to Euclid for re-examination. Computation trumps proof in the presence of a concrete counterexample.
- **Noether identifies structure that changes the problem:** Re-route the revised problem to the appropriate specialist. A problem that looked analytic but turns out to be algebraic should go to Gauss/Noether, not Euler.

### External escalations (from other teams)

- **From proof-workshop-team:** When a proof attempt reveals the problem is multi-domain (e.g., the proof requires combinatorial computation Euclid cannot do alone), escalate to math-investigation-team.
- **From discovery-team:** When a conjecture touches multiple domains or requires structural analysis beyond Ramanujan's pattern detection, escalate to math-investigation-team.

### Escalation to the user

- **Open research question:** If the problem appears to be genuinely unsolved (Ramanujan finds a pattern, Euclid exhausts strategies, and the statement does not appear in known literature), report this honestly with all evidence gathered.
- **Outside mathematics:** If the problem requires domain expertise outside mathematics (physics modeling, engineering constraints, statistical methodology), Hypatia acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per investigation:

- **Hypatia** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Euclid, Noether) + 3 Sonnet (Gauss, Euler, Ramanujan), ~30-60K tokens each
- **Polya** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: math-investigation-team
chair: hypatia
specialists:
  - proof: euclid
  - computation: gauss
  - analysis: euler
  - structure: noether
  - patterns: ramanujan
pedagogy: polya

parallel: true
timeout_minutes: 15

# Hypatia may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> math-investigation-team: Investigate the relationship between the Fibonacci
  sequence, the golden ratio, and the distribution of phyllotactic spirals in
  sunflower seed heads. Level: graduate.

# Multi-domain problem
> math-investigation-team: Why does the sum 1/1^2 + 1/2^2 + 1/3^2 + ... equal
  exactly pi^2/6? I want the proof, the pattern, the structural reason, and an
  explanation I can share with undergrads.

# Follow-up
> math-investigation-team: (session: grove:abc123) Now extend that analysis to
  the Riemann zeta function at other even integers.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., algebraic geometry, stochastic calculus) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide (Bash for computation, Read/Grep for reference).
- Research-level open problems may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
