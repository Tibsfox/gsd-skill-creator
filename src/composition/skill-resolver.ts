import { Skill, SkillMetadata, SkillTrigger, getExtension, hasExtensionData, type GsdSkillCreatorExtension } from '../types/skill.js';
import { SkillStore } from '../storage/skill-store.js';
import { DependencyGraph } from './dependency-graph.js';

export interface SkillResolution {
  resolvedContent: string;      // Merged body (parent + separator + child)
  resolvedMetadata: SkillMetadata;  // Merged frontmatter
  inheritanceChain: string[];   // [grandparent, parent, child]
}

/**
 * SkillResolver merges inherited skill content and metadata.
 * Parent content comes before child content.
 * Child metadata wins for most fields, triggers are unioned.
 */
export class SkillResolver {
  constructor(private skillStore: SkillStore) {}

  /**
   * Resolve a skill with all its inherited content
   * Checks for cycles before resolution
   */
  async resolve(skillName: string): Promise<SkillResolution> {
    // 1. Load the skill
    const skill = await this.skillStore.read(skillName);
    if (!skill) {
      throw new Error(`Skill not found: ${skillName}`);
    }

    // 2. If no extends, return as-is
    const ext = getExtension(skill.metadata);
    if (!ext.extends) {
      return {
        resolvedContent: skill.body,
        resolvedMetadata: { ...skill.metadata },
        inheritanceChain: [skillName],
      };
    }

    // 3. Build dependency graph and get inheritance chain
    const graph = new DependencyGraph();
    await this.buildGraphForSkill(skillName, graph, new Set());

    // 4. Check for cycles
    const cyclResult = graph.detectCycles();
    if (cyclResult.hasCycle) {
      throw new Error(
        `Circular dependency detected in skills: ${cyclResult.cycle!.join(' -> ')}. ` +
        `Remove the cycle by editing the 'extends:' field in one of these skills.`
      );
    }

    // 5. Get inheritance chain (roots first)
    const chain = graph.getInheritanceChain(skillName);

    // 6. Load and merge all skills in chain order
    return this.mergeChain(chain);
  }

  /**
   * Build dependency graph by walking extends relationships
   */
  private async buildGraphForSkill(
    skillName: string,
    graph: DependencyGraph,
    visited: Set<string>
  ): Promise<void> {
    if (visited.has(skillName)) {
      return;
    }
    visited.add(skillName);
    graph.addNode(skillName);

    const skill = await this.skillStore.read(skillName);
    if (skill) {
      const skillExt = getExtension(skill.metadata);
      if (skillExt.extends) {
        graph.addEdge(skillName, skillExt.extends);
        await this.buildGraphForSkill(skillExt.extends, graph, visited);
      }
    }
  }

  /**
   * Merge skills in the inheritance chain
   */
  private async mergeChain(chain: string[]): Promise<SkillResolution> {
    if (chain.length === 0) {
      throw new Error('Cannot merge empty chain');
    }

    // Load all skills in the chain
    const skills: Skill[] = [];
    for (const name of chain) {
      const skill = await this.skillStore.read(name);
      if (!skill) {
        throw new Error(`Parent skill not found: ${name}`);
      }
      skills.push(skill);
    }

    // Merge from root to leaf (index 0 is root)
    let mergedContent = skills[0].body;
    let mergedMetadata = { ...skills[0].metadata };

    for (let i = 1; i < skills.length; i++) {
      const child = skills[i];
      mergedContent = this.mergeContent(mergedContent, child.body);
      mergedMetadata = this.mergeMetadata(mergedMetadata, child.metadata);
    }

    return {
      resolvedContent: mergedContent,
      resolvedMetadata: mergedMetadata,
      inheritanceChain: chain,
    };
  }

  /**
   * Merge two skill metadata objects (parent into child)
   * Child wins for most fields, triggers are unioned
   */
  private mergeMetadata(parent: SkillMetadata, child: SkillMetadata): SkillMetadata {
    const parentExt = getExtension(parent);
    const childExt = getExtension(child);

    // Merge extension data
    const mergedExt: GsdSkillCreatorExtension = {
      // State fields - child wins if defined
      enabled: childExt.enabled ?? parentExt.enabled,
      version: childExt.version ?? parentExt.version,
      createdAt: childExt.createdAt ?? parentExt.createdAt,
      updatedAt: childExt.updatedAt,
      // Don't inherit extends (already resolved)
      extends: undefined,
      // Union triggers
      triggers: this.mergeTriggers(parentExt.triggers, childExt.triggers),
      // Learning is NOT inherited (each skill learns independently)
      learning: childExt.learning,
    };

    // Build result with nested extension structure
    const result: SkillMetadata = {
      // Child always wins for identity
      name: child.name,
      description: child.description,
      // Claude Code fields - child wins if defined
      'disable-model-invocation':
        child['disable-model-invocation'] ?? parent['disable-model-invocation'],
      'user-invocable':
        child['user-invocable'] ?? parent['user-invocable'],
      'allowed-tools':
        child['allowed-tools'] ?? parent['allowed-tools'],
    };

    // Add extension container if there's data
    if (hasExtensionData(mergedExt)) {
      result.metadata = {
        extensions: {
          'gsd-skill-creator': mergedExt,
        },
      };
    }

    return result;
  }

  /**
   * Merge trigger conditions (union arrays, child wins for threshold)
   */
  private mergeTriggers(
    parent: SkillTrigger | undefined,
    child: SkillTrigger | undefined
  ): SkillTrigger | undefined {
    if (!parent && !child) return undefined;
    if (!parent) return child;
    if (!child) return parent;

    return {
      intents: this.unionArrays(parent.intents, child.intents),
      files: this.unionArrays(parent.files, child.files),
      contexts: this.unionArrays(parent.contexts, child.contexts),
      threshold: child.threshold ?? parent.threshold, // Child wins
    };
  }

  /**
   * Union two arrays, removing duplicates
   */
  private unionArrays(a?: string[], b?: string[]): string[] | undefined {
    if (!a && !b) return undefined;
    const combined = [...(a || []), ...(b || [])];
    const unique = [...new Set(combined)];
    return unique.length > 0 ? unique : undefined;
  }

  /**
   * Merge content with separator
   */
  private mergeContent(parent: string, child: string): string {
    return `${parent.trim()}\n\n---\n\n${child.trim()}`;
  }
}
