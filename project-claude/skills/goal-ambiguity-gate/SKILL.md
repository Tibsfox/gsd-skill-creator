---
name: goal-ambiguity-gate
description: >
  Use the moment a request is underspecified and you are about to act on an
  ASSUMED goal. Enumerate the candidate goals the request could mean, project
  the action or artifact each one implies, and check whether they diverge: if
  two or more plausible goals lead to materially different actions or artifacts,
  ask exactly ONE targeted clarifying question; otherwise proceed on the
  most-likely goal and state the assumption in one line. Clarification is an
  evidence-producing action, not a delay — but one question, never an
  interrogation. Distinct from gsd-spec-phase (GSD-phase-bound, emits a heavy
  SPEC.md) and intent-router (fetch strategy, not goal disambiguation). Backed
  by agent goal-state inference (arxiv 2606.16813v1). Triggers on acting under
  an assumed goal when the request admits more than one materially different
  reading.
description-frequency: on-demand
user-invocable: true
version: 1.0.0
format: 2025-10-02
triggers:
  - "request is underspecified and I am about to act on an assumed goal"
  - "two plausible goals imply different actions or artifacts"
  - "should I ask a clarifying question before acting"
updated: 2026-07-18
status: ACTIVE
source: arxiv 2606.16813v1 (Agent Goal-State Inference)
---

# Goal Ambiguity Gate

A lightweight, always-on gate that runs in the half-second before you act on an
underspecified request. It forces you to name the goals the request *could*
mean, see whether they would produce different work, and — only when they
would — spend exactly one question to collapse the ambiguity. It treats that
question as an evidence-producing action, not friction, and it caps you at one.

## Why

On a self-modifying, parallel-agent system the cost of guessing the wrong goal
is not a re-do — it is a bad artifact that has already entered shared state. A
misread "clean up the skills" can retire a live skill; a misread "sync main"
can push a dev-line assumption to `main`; a misread "record this" can write the
wrong thing into `MEMORY.md` or the Grove store where a later agent trusts it.
The paper's finding is that a small structured goal-inference pass before acting
recovers most of the loss from acting on the modal-but-wrong interpretation.
This gate is that pass, sized so it never becomes an interrogation.

## Data classes touched

The gate itself reads and writes **nothing** — it is control-flow over your own
next action. But the *gated action's* data class sets the threshold. When the
candidate goals diverge on an action that touches shared repo state (git
push/merge, the refinery-merge queue, retiring or editing a `.claude/skills/`
file), sensitive memory (Grove `never-surface` records — private origins, Fox
Companies IP, credentials, Center Camp trust rules), or self-modification, the
default on uncertainty is **escalate / ask — never silently proceed**. Data-
neutral, cheap, in-context divergences may proceed on the modal goal.

## How

1. **Enumerate.** Name the plausible goals G1…Gn the request could mean. A goal
   is *plausible* if a competent teammate could infer it from the words given —
   not a strawman. Cap at 4; if you can name only one, skip to step 5.
2. **Project.** For each Gi, state the concrete action/artifact it implies:
   which files change, what gets committed, what reaches output, reversibility.
3. **Test divergence.** Goals diverge *materially* if their projections differ
   in any of: files/paths touched, artifact produced, reversibility, data class,
   or blast radius — a difference you could not cheaply undo after the fact.
   Wording-only differences that land on the same action do **not** count.
4. **Ask ONE.** If ≥2 goals diverge materially, ask the single question with the
   highest discriminating power — the one whose answer eliminates the most
   candidates or resolves the highest-cost split — and offer the candidate
   readings inline. One question. Do not stack a second "and also…".
5. **Proceed.** If exactly one plausible goal survives, or all candidates
   converge on the same action, or the only divergence is cheap-and-reversible
   and data-neutral, act on the modal goal and state the assumption in one line
   so it is correctable.
6. **Hard-ask override.** If any surviving divergence lands on an irreversible
   or shared-state or `never-surface` action, ask even when you would lean one
   way. In convoy/worktree work this aligns with mayor-coordinator escalation
   and the refinery-merge queue's never-auto-resolve posture: fail closed.

### Robustness rule

Judge by the **effect** each goal implies, not by how confidently the request
was phrased. "Clean up the skills" is confident but ambiguous (retire vs
reformat vs dedupe → three different artifacts) — gate it. "maybe just fix the
typo?" is hedged but unambiguous (one edit, reversible) — proceed. Confidence in
the phrasing is not confidence in the goal.

## Confidence / failure model

This gate wraps an **LLM judgment** — which goals are plausible, and whether
their projected actions diverge materially — not a deterministic parser. It is
semi-decidable: it reduces wrong-goal execution, it does not eliminate it. Two
fail-closed defaults: (a) when you cannot tell whether two goals diverge
materially, treat them as diverging and ask; (b) when the gated action is
irreversible, shared-state, or touches `never-surface` memory, unresolved
uncertainty resolves to **ask**, never to silent proceed. Over-asking is also a
failure — one targeted question, and never re-ask a question already answered
this session.

## When to skip

- Only one plausible goal exists, or all candidates converge on the same action.
- The action is trivially reversible, cheap to redo, and touches no shared repo
  state or sensitive memory (e.g. an in-context draft you can rewrite).
- You are already inside `gsd-spec-phase`: that heavier gate owns ambiguity for
  a GSD-phase deliverable and emits SPEC.md — do not double-gate.
- The user has already answered this exact question this session.

## Integration

- **gsd-spec-phase** — the GSD-phase-bound cousin. It runs formal ambiguity
  scoring and emits a heavy SPEC.md for a *phase deliverable*. This gate is the
  lightweight, always-on version for any single action outside a GSD phase.
  Inside a phase, defer to spec-phase.
- **intent-router** — orthogonal. intent-router decides HOW to fetch (retrieval
  strategy, budget, depth) once the need is known; this gate decides WHAT the
  goal is before acting. Resolve the goal here, then route.
- **decision-framework** — the escalation path. If the one clarifying question
  does not collapse the ambiguity (goals still diverge, or the user delegates
  the choice back), hand off to decision-framework to reason among the options
  rather than firing a second question.
- **security-hygiene / mayor-coordinator** — the hard-ask override in step 6
  is the same fail-closed posture these enforce for self-modification and for
  convoy-level shared-state conflicts.
