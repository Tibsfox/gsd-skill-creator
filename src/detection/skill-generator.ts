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

    let body = `# ${candidate.suggestedName}

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

    // QOL-04: Inject GSD command references if applicable
    body = injectGsdReferences(body, candidate.suggestedDescription, this.gsdInstalled);

    return body;
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
