/**
 * Tests for CapabilityScaffolder.
 *
 * Validates that create-verb capability references produce scaffold tasks
 * with correct templates, paths, and XML definitions. Non-create verbs
 * are filtered out. Existing files are detected and skipped.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import matter from 'gray-matter';
import { CapabilityScaffolder } from './capability-scaffolder.js';
import type { CapabilityRef } from './types.js';

describe('CapabilityScaffolder', () => {
  let tempDir: string;
  let scaffolder: CapabilityScaffolder;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'scaffolder-test-'));
    scaffolder = new CapabilityScaffolder(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  // ==========================================================================
  // generateTasks - filtering
  // ==========================================================================

  describe('generateTasks filtering', () => {
    it('returns ScaffoldTask for create:skill ref', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'my-new-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].type).toBe('skill');
      expect(tasks[0].capabilityName).toBe('my-new-skill');
    });

    it('returns ScaffoldTask for create:agent ref', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'agent', name: 'my-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].type).toBe('agent');
      expect(tasks[0].capabilityName).toBe('my-agent');
    });

    it('filters out use:skill ref (returns empty)', () => {
      const refs: CapabilityRef[] = [
        { verb: 'use', type: 'skill', name: 'existing-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(0);
    });

    it('filters out after:skill ref', () => {
      const refs: CapabilityRef[] = [
        { verb: 'after', type: 'skill', name: 'some-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(0);
    });

    it('filters out create:team ref (teams not scaffoldable)', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'team', name: 'my-team' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(0);
    });

    it('returns only create-verb tasks from mixed verbs', () => {
      const refs: CapabilityRef[] = [
        { verb: 'use', type: 'skill', name: 'existing-skill' },
        { verb: 'create', type: 'skill', name: 'new-skill' },
        { verb: 'after', type: 'agent', name: 'some-agent' },
        { verb: 'create', type: 'agent', name: 'new-agent' },
        { verb: 'adapt', type: 'skill', name: 'adapted-skill' },
        { verb: 'create', type: 'team', name: 'new-team' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks).toHaveLength(2);
      expect(tasks[0].capabilityName).toBe('new-skill');
      expect(tasks[1].capabilityName).toBe('new-agent');
    });
  });

  // ==========================================================================
  // Skill template validation
  // ==========================================================================

  describe('skill template', () => {
    it('has valid gray-matter frontmatter (parseable)', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'test-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const parsed = matter(tasks[0].templateContent);
      expect(parsed.data).toBeDefined();
      expect(parsed.content).toBeDefined();
    });

    it('has name matching capabilityName in frontmatter', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'my-custom-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const parsed = matter(tasks[0].templateContent);
      expect(parsed.data.name).toBe('my-custom-skill');
    });

    it('has description field in frontmatter', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'desc-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const parsed = matter(tasks[0].templateContent);
      expect(typeof parsed.data.description).toBe('string');
      expect(parsed.data.description.length).toBeGreaterThan(0);
    });

    it('targetPath is .claude/skills/{name}/SKILL.md', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'cool-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks[0].targetPath).toBe('.claude/skills/cool-skill/SKILL.md');
    });
  });

  // ==========================================================================
  // Agent template validation
  // ==========================================================================

  describe('agent template', () => {
    it('has valid agent frontmatter (name, description, tools)', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'agent', name: 'test-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const parsed = matter(tasks[0].templateContent);
      expect(parsed.data.name).toBe('test-agent');
      expect(typeof parsed.data.description).toBe('string');
      expect(typeof parsed.data.tools).toBe('string');
    });

    it('targetPath is .claude/agents/{name}.md', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'agent', name: 'my-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks[0].targetPath).toBe('.claude/agents/my-agent.md');
    });
  });

  // ==========================================================================
  // Task XML validation
  // ==========================================================================

  describe('taskXml', () => {
    it('contains proper XML structure with name, files, action, verify, done', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'xml-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const xml = tasks[0].taskXml;

      expect(xml).toContain('<task type="auto">');
      expect(xml).toContain('<name>');
      expect(xml).toContain('Scaffold skill/xml-skill');
      expect(xml).toContain('<files>');
      expect(xml).toContain('<action>');
      expect(xml).toContain('<verify>');
      expect(xml).toContain('<done>');
      expect(xml).toContain('</task>');
    });

    it('references the correct targetPath in files element', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'agent', name: 'xml-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const xml = tasks[0].taskXml;

      expect(xml).toContain('.claude/agents/xml-agent.md');
    });
  });

  // ==========================================================================
  // Task name
  // ==========================================================================

  describe('task name', () => {
    it('contains human-readable scaffold description', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'named-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      expect(tasks[0].name).toContain('Scaffold');
      expect(tasks[0].name).toContain('skill/named-skill');
    });
  });

  // ==========================================================================
  // checkExisting
  // ==========================================================================

  describe('checkExisting', () => {
    it('all proceed when no files exist', () => {
      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'brand-new' },
        { verb: 'create', type: 'agent', name: 'brand-new-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const result = scaffolder.checkExisting(tasks);

      expect(result.proceed).toHaveLength(2);
      expect(result.skipped).toHaveLength(0);
    });

    it('skips task when file already exists', () => {
      // Create the file that would conflict
      const skillDir = join(tempDir, '.claude', 'skills', 'existing-skill');
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(join(skillDir, 'SKILL.md'), '---\nname: existing\n---\n');

      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'existing-skill' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const result = scaffolder.checkExisting(tasks);

      expect(result.proceed).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].reason).toContain('already exists');
    });

    it('separates existing and non-existing files correctly', () => {
      // Create only one conflicting file
      const agentDir = join(tempDir, '.claude', 'agents');
      mkdirSync(agentDir, { recursive: true });
      writeFileSync(join(agentDir, 'old-agent.md'), '---\nname: old-agent\n---\n');

      const refs: CapabilityRef[] = [
        { verb: 'create', type: 'skill', name: 'new-skill' },
        { verb: 'create', type: 'agent', name: 'old-agent' },
      ];

      const tasks = scaffolder.generateTasks(refs);
      const result = scaffolder.checkExisting(tasks);

      expect(result.proceed).toHaveLength(1);
      expect(result.proceed[0].capabilityName).toBe('new-skill');
      expect(result.skipped).toHaveLength(1);
      expect(result.skipped[0].task.capabilityName).toBe('old-agent');
    });
  });
});
