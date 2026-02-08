/**
 * CapabilityScaffolder service.
 *
 * Generates plan task definitions for create-verb capability declarations.
 * Produces skeleton skill/agent files in project-local `.claude/` that are
 * in the exact format expected by CapabilityDiscovery and SkillStore.
 *
 * Teams are not auto-scaffoldable (too complex) and are silently skipped.
 */

import { existsSync } from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import type { CapabilityRef, CapabilityType } from './types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A scaffold task definition generated from a create-verb capability ref.
 *
 * Contains everything needed to create the skeleton file and embed a
 * plan task XML block referencing it.
 */
export interface ScaffoldTask {
  /** Human-readable task name for plan XML (e.g., "Scaffold skill/my-new-skill") */
  name: string;
  /** The capability type: 'skill' or 'agent' */
  type: CapabilityType;
  /** The capability name (e.g., "my-new-skill") */
  capabilityName: string;
  /** Relative file path (e.g., ".claude/skills/my-new-skill/SKILL.md") */
  targetPath: string;
  /** Full file content with frontmatter */
  templateContent: string;
  /** Pre-rendered XML task definition for embedding in plans */
  taskXml: string;
}

// ============================================================================
// CapabilityScaffolder
// ============================================================================

export class CapabilityScaffolder {
  constructor(private projectRoot: string) {}

  /**
   * Generate scaffold tasks from capability references.
   *
   * Only create-verb refs for skill and agent types produce tasks.
   * Teams are skipped (too complex for auto-scaffolding).
   * Non-create verbs (use, after, adapt) are filtered out.
   */
  generateTasks(refs: CapabilityRef[]): ScaffoldTask[] {
    const tasks: ScaffoldTask[] = [];

    for (const ref of refs) {
      if (ref.verb !== 'create') {
        continue;
      }

      if (ref.type === 'skill') {
        tasks.push(this.generateSkillTask(ref.name));
      } else if (ref.type === 'agent') {
        tasks.push(this.generateAgentTask(ref.name));
      }
      // type === 'team': silently skip
    }

    return tasks;
  }

  /**
   * Check which scaffold tasks target files that already exist on disk.
   *
   * Returns separate arrays for tasks that can proceed and tasks that
   * should be skipped (with reason).
   */
  checkExisting(tasks: ScaffoldTask[]): {
    proceed: ScaffoldTask[];
    skipped: { task: ScaffoldTask; reason: string }[];
  } {
    const proceed: ScaffoldTask[] = [];
    const skipped: { task: ScaffoldTask; reason: string }[] = [];

    for (const task of tasks) {
      const fullPath = join(this.projectRoot, task.targetPath);
      if (existsSync(fullPath)) {
        skipped.push({ task, reason: 'File already exists' });
      } else {
        proceed.push(task);
      }
    }

    return { proceed, skipped };
  }

  // --------------------------------------------------------------------------
  // Skill scaffolding
  // --------------------------------------------------------------------------

  /**
   * Generate a scaffold task for a skill capability.
   *
   * Uses gray-matter stringify to produce frontmatter matching what
   * SkillStore.read() parses, ensuring discoverability by CapabilityDiscovery.
   */
  private generateSkillTask(capabilityName: string): ScaffoldTask {
    const targetPath = `.claude/skills/${capabilityName}/SKILL.md`;

    const body = `\n# ${capabilityName}\n\nTODO: Add skill instructions here.\n\nThis skill was scaffolded by capability declaration.\n`;

    const templateContent = matter.stringify(body, {
      name: capabilityName,
      description: 'TODO: Describe when this skill should activate',
    });

    return {
      name: `Scaffold skill/${capabilityName}`,
      type: 'skill',
      capabilityName,
      targetPath,
      templateContent,
      taskXml: this.generateTaskXml('skill', capabilityName, targetPath),
    };
  }

  // --------------------------------------------------------------------------
  // Agent scaffolding
  // --------------------------------------------------------------------------

  /**
   * Generate a scaffold task for an agent capability.
   *
   * Produces raw markdown with `---` frontmatter matching parseAgentFile()
   * expectations (name, description, tools fields at minimum).
   */
  private generateAgentTask(capabilityName: string): ScaffoldTask {
    const targetPath = `.claude/agents/${capabilityName}.md`;

    const templateContent = `---
name: ${capabilityName}
description: "TODO: Describe when this agent should be delegated to"
tools: Read, Write, Edit, Bash, Glob, Grep
---

TODO: Add agent instructions here.

This agent was scaffolded by capability declaration.
`;

    return {
      name: `Scaffold agent/${capabilityName}`,
      type: 'agent',
      capabilityName,
      targetPath,
      templateContent,
      taskXml: this.generateTaskXml('agent', capabilityName, targetPath),
    };
  }

  // --------------------------------------------------------------------------
  // Task XML generation
  // --------------------------------------------------------------------------

  /**
   * Generate plan task XML for embedding in plan files.
   */
  private generateTaskXml(
    type: CapabilityType,
    capabilityName: string,
    targetPath: string,
  ): string {
    return `<task type="auto">
  <name>Scaffold ${type}/${capabilityName}</name>
  <files>${targetPath}</files>
  <action>Create the ${type} file at ${targetPath} with the skeleton template. Then fill in the description and instructions based on the phase context and plan objectives. The skeleton has TODO markers — replace ALL of them with real content.</action>
  <verify>File exists at ${targetPath} and has valid frontmatter (name and description fields present)</verify>
  <done>${type}/${capabilityName} file exists with real content (no remaining TODO markers)</done>
</task>`;
  }
}
