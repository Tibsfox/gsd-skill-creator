/**
 * Instruction Autoformalization to Policy-as-Code -- logic concept (June-2026 arXiv).
 * @module departments/logic/concepts/instruction-autoformalization
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 7;
const radius = 0.72;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const instructionAutoformalization: RosettaConcept = {
  id: "logic-instruction-autoformalization",
  name: "Instruction Autoformalization to Policy-as-Code",
  domain: 'logic',
  description:
    "Agent safety in high-stakes domains needs formal policy enforcement, but probabilistic guardrails (fine-tuned classifiers, prompt steering) give no formal guarantees, while hand-coded symbolic enforcement does not scale to the breadth of real policy specifications. Autoformalization of agent instructions (arXiv:2606.26649, 2026) closes the gap with a pipeline that translates agent prompts, MCP tool descriptions, and natural-language policy documents into formally verified policies via an LLM generator-critic loop, emitting the Cedar Policy Language. On MedAgentBench the autoformalized policies cover substantially more of the source natural-language specification than the prior hand-coded symbolic enforcement. Conceptually it turns the deontic content of instructions — the obligations, permissions, and prohibitions stated in prose — into executable, machine-checkable policy-as-code, and makes the generator-critic loop the scaling mechanism between informal norms and formal enforcement: the generator drafts a candidate policy, the critic rejects it until it covers the source clauses, and the result is a default-deny ruleset a policy decision point can evaluate.",
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: "Represent a policy as a Cedar-like rule `Rule = namedtuple('Rule', 'effect principal action resource when')` with `effect in {'permit','forbid'}`. The generator drafts `rules` from an NL spec; the critic scores coverage `covered = sum(clause_entailed(r, rules) for clause in nl_clauses)/len(nl_clauses)` and loops `while covered < tau: rules = revise(rules, uncovered)`. Evaluation is default-deny with forbid-override: `permit if any(match(r,req) for r in rules if r.effect=='permit') and not any(match(r,req) for r in rules if r.effect=='forbid')`. See Cedar; MedAgentBench.",
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: "Compile the ruleset once into a `struct Rule { Effect eff; Matcher principal, action, resource; Pred cond; }` held in a `Policy` that owns its arena (RAII frees on scope exit). `Decision evaluate(const Request& q, const Policy& p)` scans rules: return `Deny` unless some `Permit` matches `q` with its `cond` true AND no `Forbid` matches — forbid-overrides, default-deny. The generator-critic loop lives offline; the hot path is a branch-predictable linear scan over a contiguous `std::vector<Rule>`.",
    }],
    ['unison', {
      panelId: 'unison',
      explanation: "Each policy rule is an immutable content-addressed term: the #hash of `Rule Permit principal action resource cond` IS its identity, so a re-derived-but-identical rule dedupes in the Merkle-DAG policy base and two autoformalization runs converge. `evaluate : Request -> [Rule] -> Decision` is a pure default-deny fold. The generator-critic loop is `ability Formalize where critique : Policy ->{Formalize} [Clause]`; a `handle` block records each rejected candidate, so the audit trail of why a policy was accepted is itself content-addressed.",
    }],
  ]),
  relationships: [
    {
      type: "dependency",
      targetId: "logic-deontic-logic",
      description: "Autoformalization compiles the deontic content of instructions — obligations, permissions, prohibitions — into executable policy-as-code; deontic logic supplies the modal semantics the Cedar effect/forbid rules operationalize.",
    },
    {
      type: "cross-reference",
      targetId: "logic-ai-verified-proof",
      description: "The generator-critic loop yields formally verified policies; a machine-checked proof can certify that the compiled policy faithfully covers its natural-language source and stays default-deny.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "Both derive machine-checkable predicates from natural-language manuals: autoformalization emits Cedar policy-as-code, while compliance-trace-check emits SMT-validatable predicates — two targets for the same informal-to-formal compilation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
