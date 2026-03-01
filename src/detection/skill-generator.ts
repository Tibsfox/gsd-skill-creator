import { SkillStore } from '../storage/skill-store.js';
import { SkillMetadata, SkillTrigger } from '../types/skill.js';
import { type GsdSkillCreatorExtension } from '../types/extensions.js';
import { SkillCandidate, PatternEvidence } from '../types/detection.js';
import { detectArguments, suggestArgumentHint, checkInjectionRisk } from '../validation/arguments-validation.js';
import { shouldForkContext, suggestAgent } from '../validation/context-fork-detection.js';
import { ContentDecomposer } from '../disclosure/index.js';
import type { ReferenceFile, ScriptFile } from '../disclosure/index.js';
import { injectGsdReferences } from './gsd-reference-injector.js';
import { inferAllowedTools, sanitizeGeneratedContent, scanForDangerousCommands } from '../validation/generation-safety.js';

export interface GeneratedSkill {
  name: string;
  metadata: SkillMetadata;
  body: string;
  /** Reference files extracted by progressive disclosure (>2000 words) */
  references?: ReferenceFile[];
  /** Script files extracted by progressive disclosure (deterministic ops) */
  scripts?: ScriptFile[];
}

export class SkillGenerator {
  constructor(private skillStore: SkillStore, private gsdInstalled = false) {}

  /**
   * Generate skill scaffold from candidate
   * Returns skill data without saving (user must confirm)
   */
  generateScaffold(candidate: SkillCandidate): GeneratedSkill {
    const name = this.sanitizeName(candidate.suggestedName);

    const ext: GsdSkillCreatorExtension = {
      enabled: true,
      triggers: this.generateTriggers(candidate),
    };

    const metadata: SkillMetadata = {
      name,
      description: candidate.suggestedDescription,
      metadata: {
        extensions: {
          'gsd-skill-creator': ext,
        },
      },
    };

    let body = this.generateBody(candidate);

    // SEC-05: Sanitize generated content to block dangerous commands
    const dangerousFindings = scanForDangerousCommands(body);
    const { sanitized: sanitizedBody, findings: sanitizeFindings } = sanitizeGeneratedContent(body);
    body = sanitizedBody;
    if (dangerousFindings.length > 0) {
      body = `<!-- WARNING: ${dangerousFindings.length} dangerous command(s) were detected and blocked during generation. -->\n${body}`;
    }

    // SEC-07: Infer allowed-tools and set on metadata
    const allowedTools = inferAllowedTools({
      type: candidate.type,
      pattern: candidate.pattern,
      suggestedDescription: candidate.suggestedDescription,
    });
    (metadata as unknown as Record<string, unknown>)['allowed-tools'] = allowedTools;

    // SPEC-02: Detect $ARGUMENTS and set argument-hint
    const argDetection = detectArguments(body);
    if (argDetection.found) {
      const hint = suggestArgumentHint(body);
      if (hint) {
        metadata['argument-hint'] = hint;
      }
    }

    // SPEC-07: Check for injection risk ($ARGUMENTS inside !`command`)
    const injectionRisk = checkInjectionRisk(body);
    if (injectionRisk.risk === 'high') {
      body = `<!-- WARNING: This skill combines $ARGUMENTS with !command preprocessing. Ensure arguments are sanitized before use in shell context. -->\n${body}`;
    }

    // SPEC-05: Detect research/analysis workflows for context:fork
    const forkDetection = shouldForkContext(candidate.suggestedDescription, body);
    if (forkDetection.shouldFork) {
      metadata.context = 'fork';
      const agent = suggestAgent(candidate.suggestedDescription, body);
      if (agent) {
        metadata.agent = agent;
      }
    }

    // DISC-01/DISC-02: Decompose large generated skills via progressive disclosure
    const decomposer = new ContentDecomposer();
    const decomposed = decomposer.decompose(name, metadata, body);
    if (decomposed.decomposed) {
      return {
        name,
        metadata,
        body: decomposed.skillMd,
        references: decomposed.references,
        scripts: decomposed.scripts,
      };
    }

    return { name, metadata, body };
  }

  /**
   * Create skill from candidate (saves to disk)
   * If the generated skill was decomposed, writes reference and script files
   * alongside the SKILL.md created by the store.
   */
  async createFromCandidate(candidate: SkillCandidate): Promise<string> {
    const { name, metadata, body, references, scripts } = this.generateScaffold(candidate);
    await this.skillStore.create(name, metadata, body);

    // Write decomposed reference/script files if progressive disclosure triggered
    if ((references && references.length > 0) || (scripts && scripts.length > 0)) {
      const { mkdir, writeFile, chmod } = await import('fs/promises');
      const { join } = await import('path');

      const skillDir = join(this.getSkillsDir(), name);

      if (references && references.length > 0) {
        const refsDir = join(skillDir, 'references');
        await mkdir(refsDir, { recursive: true });
        for (const ref of references) {
          await writeFile(join(refsDir, ref.filename), ref.content, 'utf-8');
        }
      }

      if (scripts && scripts.length > 0) {
        const scriptsDir = join(skillDir, 'scripts');
        await mkdir(scriptsDir, { recursive: true });
        for (const script of scripts) {
          const scriptPath = join(scriptsDir, script.filename);
          await writeFile(scriptPath, script.content, 'utf-8');
          if (script.executable) {
            await chmod(scriptPath, 0o755);
          }
        }
      }
    }

    return name;
  }

  /**
   * Get the skills directory from the store.
   * Accesses the private skillsDir field via bracket notation.
   */
  private getSkillsDir(): string {
    return (this.skillStore as unknown as { skillsDir: string }).skillsDir;
  }

  /**
   * Generate trigger configuration from candidate
   */
  private generateTriggers(candidate: SkillCandidate): SkillTrigger {
    const triggers: SkillTrigger = {};

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
    const guidelines = this.generateGuidelines(candidate);
    const examples = this.generateExamples(candidate);

    let body = `# ${candidate.suggestedName}

## Purpose

${candidate.suggestedDescription}

## Pattern Evidence

This skill was suggested based on detected patterns:

${evidence}

## Guidelines

When working with ${candidate.pattern}:

${guidelines}

## Examples

${examples}

---
*Generated from pattern detection. Edit this skill to customize for your workflow.*
`;

    // QOL-04: Inject GSD command references if applicable
    body = injectGsdReferences(body, candidate.suggestedDescription, this.gsdInstalled);

    return body;
  }

  /**
   * Generate evidence-derived guidelines based on candidate type and data.
   * Replaces static TODO placeholders with contextual content.
   */
  private generateGuidelines(candidate: SkillCandidate): string {
    const { evidence, pattern, type } = candidate;
    const lines: string[] = [];

    // Tool-related guidelines
    if (evidence.coOccurringTools.length > 0) {
      const toolList = evidence.coOccurringTools.slice(0, 3); // @justification Type 6: UI display limit (top 3 tools)
      for (const tool of toolList) {
        lines.push(`- Use ${tool} when working with ${pattern}`);
      }
    }

    // File-related guidelines based on type
    if (evidence.coOccurringFiles.length > 0) {
      const fileNames = evidence.coOccurringFiles
        .slice(0, 3) // @justification Type 6: UI display limit (top 3 files)
        .map(f => f.split('/').pop());

      if (type === 'file') {
        lines.push(`- Check related files: ${fileNames.join(', ')}`);
      } else {
        lines.push(`- Review ${fileNames.join(', ')} for related changes`);
      }
    }

    // Frequency insight
    lines.push(`- Pattern observed in ${evidence.sessionIds.length} session(s)`);

    // Fallback for sparse evidence
    if (evidence.coOccurringTools.length === 0 && evidence.coOccurringFiles.length === 0) {
      lines.push(`- Follow standard practices for ${pattern}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate evidence-derived examples based on candidate type and data.
   * Replaces static TODO placeholders with contextual content.
   */
  private generateExamples(candidate: SkillCandidate): string {
    const { evidence, pattern, type } = candidate;
    const hasFiles = evidence.coOccurringFiles.length > 0;
    const hasTools = evidence.coOccurringTools.length > 0;

    switch (type) {
      case 'command': {
        return `\`\`\`\n# Example: ${pattern}\n${hasTools ? `# Often used with: ${evidence.coOccurringTools.slice(0, 3).join(', ')}` : `# Customize for your ${pattern} workflows`}\n\`\`\``;
      }
      case 'file': {
        const related = hasFiles
          ? evidence.coOccurringFiles.slice(0, 3).map(f => `# Related: ${f}`).join('\n') // @justification Type 6: UI display limit
          : `# Customize for your ${pattern} workflows`;
        return `\`\`\`\n# Working with ${pattern}\n${related}\n\`\`\``;
      }
      case 'tool': {
        return `\`\`\`\n# Using ${pattern}\n${hasFiles ? `# Context files: ${evidence.coOccurringFiles.slice(0, 3).map(f => f.split('/').pop()).join(', ')}` : `# Customize for your ${pattern} workflows`}\n\`\`\``;
      }
      case 'workflow': {
        const parts: string[] = [`# Workflow: ${pattern}`];
        if (hasFiles) {
          parts.push(`# Files: ${evidence.coOccurringFiles.slice(0, 3).map(f => f.split('/').pop()).join(', ')}`);
        }
        if (hasTools) {
          parts.push(`# Tools: ${evidence.coOccurringTools.slice(0, 3).join(', ')}`);
        }
        if (!hasFiles && !hasTools) {
          parts.push(`# Customize for your ${pattern} workflows`);
        }
        return `\`\`\`\n${parts.join('\n')}\n\`\`\``;
      }
      default:
        return `\`\`\`\n# Customize: Add examples from your ${pattern} workflows\n\`\`\``;
    }
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
