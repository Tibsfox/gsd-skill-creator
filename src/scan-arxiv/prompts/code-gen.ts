// === code-gen domain prompts ===
//
// Boundaries:
//   IN  — coding agents, repo-scale code understanding, SWE-bench and similar
//         benchmarks, autonomous PR generation, code review automation,
//         IDE-integrated coding assistants, fine-tuning for coding tasks that
//         changes agent behavior in non-trivial ways.
//   OUT — vision/NLP work unrelated to code; benchmarks not about code.

export const CODE_GEN_ANCHOR = `
Code generation and coding agents: autonomous program synthesis, repo-scale
code understanding, SWE-bench and similar coding benchmarks, autonomous
pull-request generation, code review automation, IDE-integrated coding
assistants, fine-tuning language models for coding tasks. Includes
parameter-efficient fine-tuning (LoRA, adapters) when the target task is
code generation. Excludes purely non-code text generation.
`.trim();

export const CODE_GEN_SCORING_RUBRIC = `
Score 0.9-1.0: Core coding-agent or code-generation contribution.
Score 0.7-0.8: Substantial coding-task component (fine-tune for code, repo benchmark, code review).
Score 0.4-0.6: Tangential code aspect (small coding eval, mention of code).
Score 0.1-0.3: Code appears only as one of many tasks.
Score 0.0: No code-generation relevance.
`.trim();

export const CODE_GEN_DOMAIN_BLOCK = `
Domain: code-gen
Definition: ${CODE_GEN_ANCHOR}
Rubric:
${CODE_GEN_SCORING_RUBRIC}
`.trim();
