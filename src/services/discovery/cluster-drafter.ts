/**
 * Activation-focused SKILL.md draft generation for cluster candidates.
 *
 * Generates drafts that emphasize "When to Activate" as the primary section
 * (unlike tool pattern drafts which focus on workflow steps). Cluster drafts
 * reflect recurring user intent discovered through semantic clustering, with
 * placeholder guidance for users to fill in domain-specific workflow steps.
 *
 * Structure:
 * 1. YAML frontmatter (name + description)
 * 2. "When to Activate" section with label blockquote and example prompts
 * 3. "Guidance" section with placeholder steps
 * 4. "Pattern Evidence" table with cluster metrics
 * 5. Footer noting semantic clustering origin
 */

import type { ClusterCandidate } from './cluster-scorer.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum length for example prompts in display */
const MAX_PROMPT_DISPLAY_LENGTH = 80;

/** Maximum length for label in blockquote */
const MAX_LABEL_DISPLAY_LENGTH = 100;

// ============================================================================
// generateClusterDraft
// ============================================================================

/**
 * Generate a complete activation-focused SKILL.md draft from a cluster candidate.
 *
 * Returns an object with the suggested skill name and the full markdown
 * content including YAML frontmatter, activation patterns, placeholder
 * guidance, and cluster evidence metadata.
 */
export function generateClusterDraft(
  candidate: ClusterCandidate,
): { name: string; content: string } {
  // Build frontmatter manually (no gray-matter dependency needed)
  const frontmatter =
    '---\n' +
    `name: ${candidate.suggestedName}\n` +
    `description: ${candidate.suggestedDescription}\n` +
    '---\n\n';

  // Build body sections
  const title = `# ${truncate(candidate.label, MAX_LABEL_DISPLAY_LENGTH)}\n\n`;
  const activation = generateActivationSection(candidate);
  const guidance = generateGuidanceSection();
  const evidence = generateEvidenceSection(candidate);
  const footer = generateFooter();

  return {
    name: candidate.suggestedName,
    content: frontmatter + title + activation + guidance + evidence + footer,
  };
}

// ============================================================================
// Section generators
// ============================================================================

/**
 * Generate the "When to Activate" section.
 *
 * This is the primary section for cluster drafts, featuring:
 * - A blockquote with the cluster label (intent pattern)
 * - A list of related example prompts
 */
function generateActivationSection(candidate: ClusterCandidate): string {
  const labelDisplay = truncate(candidate.label, MAX_LABEL_DISPLAY_LENGTH);

  let section =
    '## When to Activate\n\n' +
    'Use when the user\'s request matches this intent pattern:\n\n' +
    `> ${labelDisplay}\n\n` +
    'Related prompt patterns:\n';

  for (const prompt of candidate.examplePrompts) {
    const display = truncate(prompt, MAX_PROMPT_DISPLAY_LENGTH);
    section += `- "${display}"\n`;
  }

  section += '\n';
  return section;
}

/**
 * Generate the "Guidance" section with placeholder steps.
 *
 * Users fill in domain-specific workflow guidance.
 */
function generateGuidanceSection(): string {
  return (
    '## Guidance\n\n' +
    '<!-- Fill in your preferred workflow for this type of request -->\n\n' +
    '1. Understand the user\'s specific requirements\n' +
    '2. [Add domain-specific steps here]\n' +
    '3. Verify the result meets the stated intent\n\n'
  );
}

/**
 * Generate the "Pattern Evidence" section with cluster metrics.
 */
function generateEvidenceSection(candidate: ClusterCandidate): string {
  return (
    '## Pattern Evidence\n\n' +
    '| Metric | Value |\n' +
    '| --- | --- |\n' +
    `| Projects | ${candidate.evidence.projects.length} |\n` +
    `| Prompts in cluster | ${candidate.clusterSize} |\n` +
    `| Coherence | ${candidate.coherence} |\n` +
    `| Confidence score | ${candidate.score} |\n\n`
  );
}

/**
 * Generate the footer noting semantic clustering origin.
 */
function generateFooter(): string {
  return (
    '---\n\n' +
    '*This skill draft was generated from semantic clustering of user prompts.\n' +
    'The activation pattern reflects recurring user intent.\n' +
    'Review and add specific workflow guidance.*\n'
  );
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Truncate a string to the specified maximum length.
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength);
}
