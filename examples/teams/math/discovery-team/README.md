---
name: discovery-team
type: team
category: math
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/math/discovery-team/README.md
description: Sequential conjecture pipeline for experimental mathematics. Ramanujan runs the pattern search protocol on data, Gauss extends computational evidence to large N and checks boundary cases, Euclid attempts to prove or disprove the conjecture, and Polya documents the full journey including what was tried, what was learned, and what remains open. Use for exploring patterns in mathematical data, generating conjectures from computational evidence, experimental mathematics, and AI-assisted mathematical discovery. Not for problems with known solutions, proof of known conjectures, or teaching requests.
superseded_by: null
---
# Discovery Team

A sequential four-agent pipeline for experimental mathematics and conjecture generation. Ramanujan detects patterns, Gauss extends the evidence computationally, Euclid attempts proof, and Polya records the full journey. This team mirrors the `postmortem-team` pattern: a sequential pipeline where each stage builds on the previous one's output.

## When to use this team

- **Exploring patterns in mathematical data** -- "here are the first 20 values of this function, is there a pattern?"
- **Generating conjectures from computational evidence** -- "I computed these prime gaps and they seem to follow a rule."
- **"I think there's a pattern here -- help me find it"** -- open-ended exploration where the question is not yet precise enough for proof.
- **Experimental mathematics** -- systematic computation-driven investigation of mathematical phenomena.
- **AI-assisted mathematical discovery** -- Level 2 per the AI math discovery research taxonomy (pattern detection + conjecture generation + proof attempt, but not autonomous theorem proving).
- **Data-driven number theory** -- investigating sequences, modular patterns, partition counts, and combinatorial objects through computation first.

## When NOT to use this team

- **Problems with known solutions** -- the discovery pipeline is for open questions. Use the appropriate specialist directly for textbook problems.
- **Proof of known conjectures** -- if the statement is already known and you want a proof, use `proof-workshop-team`. Discovery-team is for generating the conjecture, not proving someone else's.
- **Teaching requests** -- use `polya` directly. The discovery pipeline is research-oriented, not pedagogical.
- **Multi-domain investigation** where pattern-finding is one component -- use `math-investigation-team`.
- **Pure computation** with no exploratory component -- use `gauss` or `euler` directly.

## Composition

Four agents, run sequentially:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Explorer** | `ramanujan` | 7-step pattern search protocol (differences, ratios, modular, OEIS, generating functions, structural, report) | Sonnet |
| **Extender** | `gauss` | Large-N computation, boundary case verification, stress testing | Sonnet |
| **Prover** | `euclid` | Proof or disproof attempt on the conjecture | Opus |
| **Recorder** | `polya` | Document the full journey: methods, findings, dead ends, next steps | Sonnet |

Only one Opus agent (Euclid) because the pipeline is sequential and proof is the deepest reasoning task. Ramanujan, Gauss, and Polya run on Sonnet because their tasks are well-defined: pattern detection, computation, and documentation.

## Orchestration flow

```
Input: data (sequence, table, examples) + optional domain + optional context
        |
        v
+---------------------------+
| Ramanujan (Sonnet)        |  Stage 1: Pattern search
| Explorer                  |          - differences (1st, 2nd, 3rd)
+---------------------------+          - ratios
        |                              - modular residues (mod 2,3,5,7,10)
        |                              - OEIS cross-reference
        |                              - generating function hypotheses
        |                              - structural hypotheses (recurrence,
        |                                closed form, combinatorial)
        |                              Output: MathConjecture (or "no pattern")
        v
+---------------------------+
| Gauss (Sonnet)            |  Stage 2: Extend evidence
| Extender                  |          - compute to large N (1000+)
+---------------------------+          - test boundary cases (n=0, n=1,
        |                                negative, large primes)
        |                              - verify conjecture at scale
        |                              - search for counterexamples
        |                              - compute error terms if approximate
        |                              Output: extended evidence report
        v
+---------------------------+
| Euclid (Opus)             |  Stage 3: Proof attempt
| Prover                    |          - strategy selection based on
+---------------------------+            conjecture structure
        |                              - construct proof if possible
        |                              - construct disproof if
        |                                counterexample found
        |                              - failure report if stuck
        |                              Output: MathProof, disproof,
        |                                or failure report
        v
+---------------------------+
| Polya (Sonnet)            |  Stage 4: Record the journey
| Recorder                  |          - what data was provided
+---------------------------+          - what patterns were found
        |                              - what evidence was gathered
        |                              - what proof was attempted
        |                              - what succeeded, what failed
        |                              - what remains open
        |                              - suggested next steps
        |                              Output: MathExplanation
        v
  Grove records:
  MathConjecture + (MathProof or failure) + MathExplanation
```

## Stage details

### Stage 1 -- Pattern search (Ramanujan)

Ramanujan applies the full 7-step pattern search protocol:

1. **First, second, third differences.** Constant differences identify polynomial sequences.
2. **Ratio patterns.** Converging ratios identify geometric or factorial-type sequences.
3. **Modular residues.** Periodic residues mod small primes reveal modular structure.
4. **OEIS cross-reference.** First 6-10 terms searched against the Online Encyclopedia of Integer Sequences. Matches are strong evidence but not proof.
5. **Generating function hypotheses.** Hypothesize f(x) = sum(a_n * x^n) and check for functional equations.
6. **Structural hypotheses.** Recurrence relations, closed forms, combinatorial interpretations.
7. **Report.** Assemble findings into a MathConjecture with calibrated confidence (0.0-1.0) and the standing Mertens calibration reminder.

If Ramanujan finds no pattern after the full protocol, the pipeline reports "no pattern detected" honestly and does not fabricate a weak hypothesis.

**Stage 1 output:**
```yaml
type: MathConjecture
statement: <conjectured formula or characterization>
evidence: [<bulleted evidence from each step>]
counterexamples_checked: <N>
confidence: <0.0-1.0>
domain: <inferred domain>
status: open
calibration_note: "Mertens conjecture held for 10^10 cases and was still false."
agent: ramanujan
```

### Stage 2 -- Extended computation (Gauss)

Gauss takes Ramanujan's conjecture and stress-tests it:

- **Large N extension.** Compute a_n and verify the conjecture for n = 1..1000 (or higher if feasible). If the conjecture involves a formula, compute both sides independently.
- **Boundary cases.** Test n = 0, n = 1, n = -1 (if applicable), large primes, perfect squares, and other structurally interesting inputs.
- **Counterexample search.** Systematic search for values where the conjecture fails. A single counterexample disproves the conjecture.
- **Error analysis.** If the conjecture is approximate (e.g., "a_n ~ f(n) as n -> infinity"), compute the error |a_n - f(n)| and check whether it shrinks as expected.
- **Convergence rate.** If the conjecture involves a limit, characterize the convergence rate.

**Stage 2 output:**
```yaml
type: evidence_report
conjecture_hash: <grove hash of MathConjecture>
verified_range: [1, 1000]
boundary_cases_tested: [0, 1, -1, ...]
counterexample_found: false  # or {n: 847, expected: X, actual: Y}
error_analysis: <if applicable>
convergence_rate: <if applicable>
confidence_update: +0.15  # Gauss's evidence raises or lowers Ramanujan's confidence
agent: gauss
```

If Gauss finds a counterexample, the pipeline does not proceed to proof. Instead:

1. Gauss documents the counterexample precisely.
2. Ramanujan is notified to update the conjecture (possibly with a restricted domain).
3. If the restricted conjecture still looks viable, the pipeline resumes from Stage 2 with the revised statement.

### Stage 3 -- Proof attempt (Euclid)

Euclid receives the conjecture plus all evidence from Stages 1 and 2 and attempts to prove or disprove it:

- **Strategy selection** based on the conjecture's logical structure (following Euclid's 13-technique table).
- **Proof construction** if a strategy succeeds: full step-by-step MathProof with justifications.
- **Disproof construction** if Euclid finds a structural reason the conjecture is false (independent of Gauss's counterexample search).
- **Failure report** if Euclid exhausts three strategies without success: honest documentation of what was tried and what blocked each attempt.

The three outcomes are:

**Proved:**
```yaml
type: MathProof
statement: <the conjecture, now a theorem>
strategy: <technique>
steps: [...]
conclusion: <restatement>
verified: true
confidence: 1.0
agent: euclid
```

**Disproved:**
```yaml
type: MathProof
statement: "The negation of [conjecture]"
strategy: <technique>
steps: [...]
conclusion: "The conjecture is false because..."
verified: true
confidence: 1.0
agent: euclid
```

**Open (failure to prove or disprove):**
```yaml
type: failure_report
statement: <the conjecture>
strategies_attempted:
  - technique: <name>
    obstacle: <what went wrong>
  - ...
recommendation: <next steps>
agent: euclid
```

### Stage 4 -- Journey documentation (Polya)

Polya documents the entire discovery process, not just the result. The output is a narrative that:

1. **Describes the data** -- what was provided, where it came from.
2. **Records the pattern search** -- what Ramanujan tried at each step, what worked, what didn't.
3. **Records the evidence gathering** -- what Gauss computed, what boundaries were tested, what confidence shift resulted.
4. **Records the proof attempt** -- what strategies Euclid tried, whether the proof succeeded or failed.
5. **States the outcome clearly** -- proved, disproved, or open.
6. **Identifies what was learned** -- even if the conjecture is unresolved, the search process produced knowledge about the mathematical object.
7. **Suggests next steps** -- more data, different approach, related conjectures, literature to consult.

**Stage 4 output:**
```yaml
type: MathExplanation
discovery_journey:
  data_description: <what was provided>
  patterns_found: [<list>]
  patterns_not_found: [<list>]
  evidence_gathered: <summary of Gauss's verification>
  proof_outcome: proved | disproved | open
  key_insights: [<what was learned regardless of outcome>]
  next_steps: [<suggested follow-up investigations>]
target_level: <user level>
concept_ids: [...]
agent: polya
```

## Input contract

The team accepts:

1. **Data** (required). One of:
   - A sequence of numbers
   - A table of input-output pairs
   - A collection of examples that may share a pattern
   - A formula to test against data
2. **Domain** (optional). Which area of mathematics the pattern likely belongs to. Narrows Ramanujan's search.
3. **Context** (optional). Known constraints, prior conjectures, related results.
4. **User level** (optional). For Polya's documentation. Defaults to `intermediate`.

## Output contract

The team produces up to three Grove records:

1. **MathConjecture** (always) -- Ramanujan's conjecture with evidence and confidence.
2. **MathProof** (if Euclid succeeds) -- formal proof or disproof of the conjecture.
3. **MathExplanation** (always) -- Polya's journey documentation.

All three are linked in a MathSession record if the team is invoked through Hypatia:

```yaml
type: MathSession
query: <original data/question>
classification:
  domain: <detected>
  complexity: <detected>
  type: explore
  user_level: <provided or inferred>
agents_invoked:
  - ramanujan
  - gauss
  - euclid
  - polya
work_products:
  - <grove hash of MathConjecture>
  - <grove hash of MathProof>      # if proved/disproved
  - <grove hash of MathExplanation>
```

## Escalation paths

### Conjecture touches multiple domains

If Ramanujan's pattern search reveals connections across multiple domains (e.g., a number-theoretic pattern that appears to be governed by an analytic identity involving zeta function values), escalate to `math-investigation-team`. The full department can bring Euler (analysis), Noether (structure), and additional perspective that the four-agent discovery team cannot.

### Conjecture is already known

If Ramanujan's OEIS cross-reference matches a known sequence with a known proof, the pipeline short-circuits:

1. Ramanujan reports the OEIS match with references.
2. Gauss verifies the match extends beyond the given terms.
3. Euclid skips proof attempt (the proof exists in the literature).
4. Polya documents the identification and points to the known result.

This is not a failure -- identifying that a pattern is already known is a valid and useful outcome.

### Statement appears false but no explicit counterexample

If Euclid's proof attempt strongly suggests the conjecture is false (e.g., the negation follows from a well-known theorem) but Gauss did not find a counterexample in the tested range, report both facts. The counterexample may exist beyond the tested range (Mertens phenomenon). Suggest extended computation as a next step.

### From other teams

- **From math-investigation-team:** When Hypatia classifies a query as primarily exploratory ("what pattern governs..."), the investigation team may delegate to discovery-team rather than running all seven agents.
- **To proof-workshop-team:** When the discovery pipeline produces a conjecture with high confidence (>= 0.8) and Euclid's proof attempt fails, the conjecture can be forwarded to proof-workshop-team for a more intensive proof effort with Noether's structural assistance.

### Escalation to the user

- **No pattern found.** If Ramanujan completes the full 7-step protocol and finds nothing, report honestly. Suggest the data may be random, the pattern may require more terms, or the relationship may be non-algebraic.
- **Pattern found, proof open.** The most common research-level outcome. Report the conjecture with its confidence level, Gauss's evidence, and Euclid's failure report. This is a legitimate mathematical contribution -- many published conjectures exist in exactly this state.

## The Mertens reminder

Every MathConjecture record produced by this team carries the calibration note:

> "Mertens conjecture held for 10^10 cases and was still false. Computational evidence is necessary but never sufficient."

This reminder exists to prevent overconfidence. A conjecture verified for n = 1..1000 (or even n = 1..10^6) is still a conjecture. Only Euclid's proof converts it to a theorem.

## Token / time cost

Approximate cost per discovery investigation:

- **Ramanujan** -- 1 Sonnet invocation (pattern search), ~20-35K tokens
- **Gauss** -- 1 Sonnet invocation (extended computation), ~15-30K tokens
- **Euclid** -- 1 Opus invocation (proof attempt), ~30-50K tokens
- **Polya** -- 1 Sonnet invocation (documentation), ~15-25K tokens
- **Total** -- 80-140K tokens, 3-8 minutes wall-clock

Lighter than both `math-investigation-team` and `proof-workshop-team` because only four agents are involved and the pipeline is strictly sequential.

## Configuration

```yaml
name: discovery-team
explorer: ramanujan
extender: gauss
prover: euclid
recorder: polya

# Gauss verification range
verification_range: 1000

# Counterexample search range (may be larger than verification)
counterexample_range: 10000

# Minimum confidence to forward to Euclid
proof_threshold: 0.4

# Short-circuit on OEIS match?
oeis_shortcircuit: true
```

## Invocation

```
# Sequence exploration
> discovery-team: What pattern governs this sequence?
  1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, ...
  I know it's Fibonacci but I want to see the full search protocol.

# Open-ended exploration
> discovery-team: Here are the first 30 values of the partition function p(n).
  Is there a pattern in p(n) mod 5? Ramanujan himself studied this.

# Data from computation
> discovery-team: I computed the number of spanning trees for complete graphs
  K_1 through K_12: 1, 1, 3, 16, 125, 1296, 16807, 262144, 4782969,
  100000000, 2357947691, 61917364224. What's the formula?

# Exploration from a hint
> discovery-team: Euler conjectured that there are no integer solutions to
  a^4 + b^4 + c^4 = d^4. Explore computationally before attempting proof.
  (Historical note: Elkies found a counterexample in 1988.)

# Follow-up from math-investigation-team
> discovery-team: Noether identified a group-theoretic structure in this
  sequence. Explore whether the pattern extends to other finite groups.
  Context: grove:ghi789 (Noether's structural analysis).
```

## Limitations

- The team's pattern search is as good as Ramanujan's 7-step protocol. Patterns that do not manifest as difference sequences, ratio sequences, modular periodicities, OEIS matches, generating functions, or recurrences may be missed.
- The computational extension (Gauss) is bounded by time and token budget. Sequences requiring millions of terms to reveal their pattern will exceed the budget.
- The proof attempt (Euclid) is limited to Euclid's 13 proof techniques. Conjectures requiring advanced machinery (analytic number theory, algebraic geometry, representation theory) may exceed Euclid's repertoire. In such cases, Euclid reports failure honestly.
- The team does not access external databases in real time. OEIS cross-reference uses cached knowledge, not a live API call.
- The documentation (Polya) records the journey but does not publish it. Publication-quality writeups require human editing.
