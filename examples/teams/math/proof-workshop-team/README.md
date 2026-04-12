---
name: proof-workshop-team
type: team
category: math
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/math/proof-workshop-team/README.md
description: Focused proof construction and verification team. Euclid leads with strategy selection and step-by-step proof construction, Noether provides structural insight that may simplify or reframe the problem, Gauss verifies computational steps and searches for counterexamples, and Polya translates the finished proof into a level-appropriate explanation. Use for proof construction from scratch, proof verification and critique, proof strategy exploration, formal verification preparation, and proof pedagogy. Not for pure computation, pattern finding, or multi-domain investigation.
superseded_by: null
---
# Proof Workshop Team

A focused four-agent team for proof construction, verification, and critique. Euclid leads; Noether provides structural insight; Gauss cross-checks computation; Polya explains the result. This team mirrors the `rca-triage-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Proof construction from scratch** -- "prove that every group of prime order is cyclic," "show that the harmonic series diverges."
- **Proof verification and critique** -- "check my proof that sqrt(2) is irrational," "is this induction argument valid?"
- **Proof strategy exploration** -- "I need to prove P implies Q but I'm stuck -- what techniques should I try?"
- **Formal verification preparation** -- producing proofs with enough rigor and explicit step justification to feed into a formal proof assistant.
- **Proof pedagogy** -- teaching proof techniques through worked examples with Polya's scaffolding.

## When NOT to use this team

- **Pure computation** with no proof component -- use `gauss` or `euler` directly.
- **Pattern finding / conjecture generation** -- use `discovery-team`. Proof workshop assumes the statement to be proved is already known.
- **Multi-domain investigation** where proof is one component among many -- use `math-investigation-team`.
- **Numerical methods / approximation** where the goal is a number, not a theorem -- use `euler` directly.

## Composition

Four agents, run mostly sequentially with one parallel verification step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Proof engineer** | `euclid` | Strategy selection, proof construction, verification | Opus |
| **Structural advisor** | `noether` | Algebraic structure detection, symmetry analysis, reframing | Opus |
| **Computational cross-checker** | `gauss` | Verify arithmetic steps, search for counterexamples, test boundary cases | Sonnet |
| **Pedagogy / Readability** | `polya` | Level-appropriate explanation, mugga-mugga readability, learning pathway | Sonnet |

Two Opus agents (Euclid, Noether) because proof construction and structural analysis require deep reasoning. Two Sonnet agents (Gauss, Polya) because their tasks are well-bounded.

## Orchestration flow

```
Input: statement to prove + context/axioms + mode (construct/verify/strategize)
        |
        v
+---------------------------+
| Euclid (Opus)             |  Phase 1: Analyze the statement
| Lead / Proof engineer     |          - parse logical structure
+---------------------------+          - select proof strategy
        |                              - identify what needs to be shown
        v
+---------------------------+
| Noether (Opus)            |  Phase 2: Structural insight
| Structural advisor        |          - "this is really about ring homomorphisms"
+---------------------------+          - identify symmetries, invariants
        |                              - suggest structural reframing if helpful
        |                              - may change Euclid's strategy choice
        v
+---------------------------+
| Euclid (Opus)             |  Phase 3: Construct the proof
| Proof construction        |          - step-by-step with justifications
+---------------------------+          - apply Noether's structural insight
        |                              - run proof quality checklist
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Gauss (Sonnet)   |   | Euclid (Opus)    |  Phase 4: Verification
| Cross-check      |   | Self-review      |          (parallel)
| - verify arith   |   | - re-read for    |
| - test boundary  |   |   gaps           |
| - counterexample |   | - check          |
|   search (n=1..  |   |   completeness   |
|   1000)          |   |                  |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Euclid (Opus)             |  Phase 5: Finalize
| Incorporate corrections   |          - address Gauss's findings
+---------------------------+          - polish notation and structure
                     |                 - produce final MathProof record
                     v
+---------------------------+
| Polya (Sonnet)            |  Phase 6: Explain
| Level-appropriate output  |          - translate proof to user's level
+---------------------------+          - add Polya 4-step framing
                     |                 - suggest related exercises
                     v
              MathProof + MathExplanation
              Grove records
```

## Phase details

### Phase 1 -- Statement analysis (Euclid)

Euclid parses the statement's quantifier structure and matches it against the strategy selection table (13 proof techniques). The output of this phase is:

```yaml
statement: <formal restatement>
logical_form: <quantifier structure>
primary_strategy: <technique>
secondary_strategy: <technique>
tertiary_strategy: <technique>
assumptions: <list>
definitions_needed: <list>
```

### Phase 2 -- Structural insight (Noether)

Noether examines the statement and context for algebraic structure. This phase may:

- **Simplify the problem.** "This statement about integers is really about the quotient ring Z/nZ. Prove it there."
- **Reframe the strategy.** "Direct proof is hard, but the statement follows immediately from the first isomorphism theorem."
- **Add context.** "This is a special case of Maschke's theorem. The general result may be easier to prove."
- **No-op.** If the statement is purely analytic or combinatorial with no algebraic structure, Noether reports "no structural insight applies" and Euclid proceeds with the original strategy.

Noether's output is advisory. Euclid decides whether to adopt the structural reframing.

### Phase 3 -- Proof construction (Euclid)

Euclid constructs the proof step-by-step following the strategy selected in Phase 1 (possibly modified by Phase 2). Every step has:

- An ordinal number for cross-reference
- A clear assertion
- A justification citing the rule, definition, or prior step used

The proof passes Euclid's internal quality checklist before leaving this phase.

### Phase 4 -- Verification (Gauss + Euclid, parallel)

Two independent checks run in parallel:

**Gauss (computational cross-check):**
- Verifies every arithmetic step in the proof against independent computation
- Tests the theorem's conclusion against concrete values (e.g., n = 1..1000)
- Searches for counterexamples that would disprove the statement
- Reports: `verified`, `discrepancy at step N`, or `counterexample found`

**Euclid (self-review):**
- Re-reads the proof for logical gaps, unjustified steps, and hidden assumptions
- Checks that the conclusion genuinely follows from the last step
- Verifies all quantifiers are properly scoped

### Phase 5 -- Finalization (Euclid)

Euclid incorporates findings from Phase 4:

- If Gauss found a discrepancy, fix the step or re-derive
- If Gauss found a counterexample, halt -- the statement may be false (see escalation)
- If self-review found gaps, fill them
- Polish notation and structure
- Produce the final MathProof Grove record

### Phase 6 -- Explanation (Polya)

Polya takes the finalized MathProof and produces a MathExplanation:

- Adapted to the user's level (beginner through graduate)
- Framed using Polya's 4-step method (Understand, Plan, Execute, Review)
- Includes "why this strategy works" discussion
- Suggests related exercises for the student to practice
- Notes which proof techniques are transferable to other problems

## Input contract

The team accepts:

1. **Statement** (required). The proposition to be proved, verified, or analyzed.
2. **Context** (required). Definitions, axioms, prior results. College concept IDs accepted.
3. **Mode** (required). One of:
   - `construct` -- build a proof from scratch
   - `verify` -- check an existing proof for correctness
   - `strategize` -- recommend proof techniques without writing the full proof
4. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`.

### Mode: verify

In verify mode, the orchestration changes:

```
Input: statement + submitted proof
        |
        v
Euclid (verify mode) -- step-by-step correctness check
        |
Gauss -- computational cross-check of claimed results
        |
Euclid -- produce verification report (valid/invalid/incomplete)
        |
Polya -- explain the issues at the user's level
```

### Mode: strategize

In strategize mode:

```
Input: statement + context
        |
        v
Euclid -- parse logical structure, recommend strategies
        |
Noether -- structural insight (may suggest additional strategies)
        |
Polya -- explain the strategies at the user's level
```

No proof is constructed. The output is a strategy recommendation with rationale.

## Output contract

### Mode: construct

Two Grove records:

**MathProof:**
```yaml
type: MathProof
statement: <formal statement>
strategy: <technique used>
assumptions: [...]
steps:
  - ordinal: 1
    assertion: <claim>
    justification: <rule or prior step>
  - ...
conclusion: <restatement of theorem>
verified: true
confidence: 1.0
cross_checked_by: gauss
concept_ids: [...]
agent: euclid
```

**MathExplanation:**
```yaml
type: MathExplanation
target_level: intermediate
proof_hash: <grove hash of MathProof>
explanation: <level-appropriate walkthrough>
polya_framing:
  understand: <what the problem asks>
  plan: <why this strategy was chosen>
  execute: <proof walkthrough>
  review: <what we learned, transferable techniques>
exercises: [...]
concept_ids: [...]
agent: polya
```

### Mode: verify

A verification report from Euclid plus a MathExplanation from Polya describing the issues found.

### Mode: strategize

A strategy recommendation from Euclid, structural commentary from Noether, and a MathExplanation from Polya.

## Escalation paths

### Counterexample found (Gauss)

If Gauss finds a concrete counterexample during Phase 4, the proof is invalid because the statement is false. The team:

1. Halts proof construction.
2. Gauss documents the counterexample with verification.
3. Euclid confirms the counterexample satisfies the hypothesis but violates the conclusion.
4. The team reports: "The statement appears to be false. Counterexample: ..."
5. If the user wants to investigate further (modified statement, additional hypotheses), escalate to `math-investigation-team`.

### Statement too complex (Euclid exhausts strategies)

If Euclid exhausts all three strategy attempts per the Failure Honesty Protocol:

1. Euclid produces a failure report documenting what was tried and what blocked each attempt.
2. Noether re-examines for structural insight that might unlock a new approach.
3. If still stuck, report honestly and recommend escalation to `math-investigation-team` for multi-perspective attack (Ramanujan may find a pattern, Euler may find an analytic approach).

### Problem is multi-domain

If during Phase 2 Noether determines the problem requires analysis (Euler), pattern detection (Ramanujan), or other expertise beyond the four-agent team, escalate to `math-investigation-team`. Do not attempt to solve outside the team's competence.

### From other teams

- **From math-investigation-team:** When Hypatia classifies a query as primarily a proof problem, the investigation team may delegate to proof-workshop-team rather than running all seven agents.
- **From discovery-team:** When a conjecture is generated and needs formal proof, discovery-team hands the conjecture to proof-workshop-team with Ramanujan's evidence as context.

## Token / time cost

Approximate cost per proof:

- **Euclid** -- 3 Opus invocations (analyze, construct, finalize), ~60-90K tokens total
- **Noether** -- 1 Opus invocation (structural insight), ~20-30K tokens
- **Gauss** -- 1 Sonnet invocation (cross-check), ~15-25K tokens
- **Polya** -- 1 Sonnet invocation (explanation), ~15-25K tokens
- **Total** -- 110-170K tokens, 3-8 minutes wall-clock

Lighter than `math-investigation-team` because only four agents are involved and the workflow is more sequential.

## Configuration

```yaml
name: proof-workshop-team
lead: euclid
structural_advisor: noether
cross_checker: gauss
pedagogy: polya

# Noether may be skipped for purely computational proofs
skip_structural: false

# Gauss counterexample search range
counterexample_range: 1000

# Polya output level (auto-detected if not set)
user_level: auto
```

## Invocation

```
# Construct a proof
> proof-workshop-team: Prove that every finite integral domain is a field.
  Context: standard ring theory definitions. Mode: construct. Level: graduate.

# Verify a proof
> proof-workshop-team: Verify this proof that the square root of 3 is
  irrational. [attached work]. Mode: verify. Level: intermediate.

# Strategy advice
> proof-workshop-team: I need to prove that for all n >= 1,
  sum(k=1..n, k^3) = (n(n+1)/2)^2. What approach should I use?
  Mode: strategize. Level: beginner.

# Follow-up from discovery-team
> proof-workshop-team: Ramanujan conjectures that the number of partitions
  of n into distinct odd parts equals the number of self-conjugate partitions
  of n. Evidence: verified for n = 1..200, confidence 0.85. Mode: construct.
  Context: Ramanujan's MathConjecture record grove:def456.
```

## Limitations

- The team does not handle numerical computation or approximation -- only exact proof. For numerical work, use `euler` or `math-investigation-team`.
- The counterexample search is bounded (default: n = 1..1000). False conjectures with very large minimal counterexamples (cf. Mertens conjecture) may not be caught.
- Noether's structural insight is advisory. If Euclid and Noether disagree on strategy, Euclid's judgment prevails since Euclid is the proof specialist.
- The team does not produce proofs suitable for formal verification systems (Lean, Coq, Isabelle) without additional translation. The MathProof Grove record is rigorous but natural-language.
