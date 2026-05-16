// === skill-design domain prompts ===
//
// Boundaries:
//   IN  — how LLMs use skills, tools, slash commands, sub-agents; context
//         engineering for tool-use; skill discovery and activation;
//         prompt-as-program patterns; agentic decomposition.
//   OUT — pure prompt-engineering papers with no tool/skill dimension;
//         chain-of-thought studies that do not invoke external skills.

export const SKILL_DESIGN_ANCHOR = `
Skill design and tool-use for LLM agents: how language models invoke
external skills, tools, slash commands, or sub-agents; context
engineering for tool-use; skill discovery and activation; prompt-as-program
patterns; agentic decomposition of complex tasks into reusable skills;
function-calling and structured tool invocation. Excludes pure
prompt-engineering work without a tool dimension.
`.trim();

export const SKILL_DESIGN_SCORING_RUBRIC = `
Score 0.9-1.0: Core contribution to skill/tool design or activation.
Score 0.7-0.8: Substantial tool-use or sub-agent component.
Score 0.4-0.6: Tangential or applied use of tool-calling ideas.
Score 0.1-0.3: Mentions tools in passing without a design contribution.
Score 0.0: No skill/tool dimension.
`.trim();

export const SKILL_DESIGN_DOMAIN_BLOCK = `
Domain: skill-design
Definition: ${SKILL_DESIGN_ANCHOR}
Rubric:
${SKILL_DESIGN_SCORING_RUBRIC}
`.trim();
