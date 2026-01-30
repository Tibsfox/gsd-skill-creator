import { SkillStore } from '../storage/skill-store.js';
import { SkillMetadata } from '../types/skill.js';
import { SkillCandidate, PatternEvidence } from '../types/detection.js';

export interface GeneratedSkill {
  name: string;
  metadata: SkillMetadata;
  body: string;
}

export class SkillGenerator {
  constructor(private skillStore: SkillStore) {}

  /**
   * Generate skill scaffold from candidate
   * Returns skill data without saving (user must confirm)
   */
  generateScaffold(candidate: SkillCandidate): GeneratedSkill {
    const name = this.sanitizeName(candidate.suggestedName);

    const metadata: SkillMetadata = {
      name,
      description: candidate.suggestedDescription,
      enabled: true,
      triggers: this.generateTriggers(candidate),
    };

    const body = this.generateBody(candidate);

    return { name, metadata, body };
  }

  /**
   * Create skill from candidate (saves to disk)
   */
  async createFromCandidate(candidate: SkillCandidate): Promise<string> {
    const { name, metadata, body } = this.generateScaffold(candidate);
    await this.skillStore.create(name, metadata, body);
    return name;
  }

  /**
   * Generate trigger configuration from candidate
   */
  private generateTriggers(candidate: SkillCandidate): SkillMetadata['triggers'] {
    const triggers: SkillMetadata['triggers'] = {};

    switch (candidate.type) {
      case 'command':
        // Trigger on intent patterns related to the command
        triggers.intents = [candidate.pattern, `${candidate.pattern} workflow`];
        break;
      case 'file':
        // Trigger on file patterns
        triggers.files = [candidate.pattern];
        break;
      case 'tool':
        // Trigger on contexts involving the tool
        triggers.contexts = [`using ${candidate.pattern}`];
        break;
      case 'workflow':
        // Trigger on combined patterns
        triggers.intents = [candidate.pattern];
        if (candidate.evidence.coOccurringFiles.length > 0) {
          triggers.files = candidate.evidence.coOccurringFiles.slice(0, 3);
        }
        break;
    }

    triggers.threshold = 0.5; // Default threshold

    return triggers;
  }

  /**
   * Generate skill body with evidence (DETECT-04)
   */
  private generateBody(candidate: SkillCandidate): string {
    const evidence = this.formatEvidence(candidate.evidence);

    return `# ${candidate.suggestedName}

## Purpose

${candidate.suggestedDescription}

## Pattern Evidence

This skill was suggested based on detected patterns:

${evidence}

## Guidelines

<!-- TODO: Add specific guidelines for this pattern -->

When working with ${candidate.pattern}:

1. [Add step 1]
2. [Add step 2]
3. [Add step 3]

## Examples

<!-- TODO: Add examples based on your workflow -->

\`\`\`
# Example usage
\`\`\`

---
*Generated from pattern detection. Edit this skill to customize for your workflow.*
`;
  }

  /**
   * Format evidence for display in skill body
   */
  formatEvidence(evidence: PatternEvidence): string {
    const lines: string[] = [];

    lines.push(`- **First seen:** ${new Date(evidence.firstSeen).toLocaleDateString()}`);
    lines.push(`- **Last seen:** ${new Date(evidence.lastSeen).toLocaleDateString()}`);
    lines.push(`- **Sessions:** ${evidence.sessionIds.length} occurrences`);

    if (evidence.coOccurringFiles.length > 0) {
      const fileNames = evidence.coOccurringFiles
        .slice(0, 5)
        .map(f => f.split('/').pop())
        .join(', ');
      lines.push(`- **Common files:** ${fileNames}`);
    }

    if (evidence.coOccurringTools.length > 0) {
      lines.push(`- **Common tools:** ${evidence.coOccurringTools.slice(0, 5).join(', ')}`);
    }

    return lines.join('\n');
  }

  /**
   * Sanitize name to meet skill naming requirements
   */
  private sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 64);
  }
}
