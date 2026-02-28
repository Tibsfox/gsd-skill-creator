/**
 * Tests for CE-1 contribution registry.
 *
 * Covers: registration with validation, updates with version tracking,
 * dependency declarations with circular detection, lookup and filtering,
 * and error cases.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ContributionRegistry,
} from '../contribution-registry.js';
import type {
  Contributor,
  ContributorVersion,
  DependencyDeclaration,
} from '../contribution-registry.js';

// ============================================================================
// Registration Tests
// ============================================================================

describe('ContributionRegistry', () => {
  let registry: ContributionRegistry;

  beforeEach(() => {
    registry = new ContributionRegistry();
  });

  describe('constructor', () => {
    it('creates an empty registry', () => {
      expect(registry).toBeInstanceOf(ContributionRegistry);
    });

    it('count() returns 0 on a fresh registry', () => {
      expect(registry.count()).toBe(0);
    });
  });

  // ==========================================================================
  // Registration Tests
  // ==========================================================================

  describe('register', () => {
    it('registers a human contributor and returns the Contributor', () => {
      const result = registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      expect(result).toBeDefined();
      expect(result.id).toBe('contrib-alice');
      expect(result.name).toBe('Alice');
      expect(result.type).toBe('human');
    });

    it('increments count after register', () => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      expect(registry.count()).toBe(1);
    });

    it('sets registered_at and initial version on registration', () => {
      const result = registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      expect(result.registered_at).toBeDefined();
      expect(result.versions).toHaveLength(1);
    });

    it('initial version has version 1, changed_at, and description', () => {
      const result = registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      const v1 = result.versions[0];
      expect(v1.version).toBe(1);
      expect(v1.changed_at).toBeDefined();
      expect(v1.description).toBe('initial registration');
    });

    it('throws on invalid ContributorID format', () => {
      expect(() => registry.register({ id: 'bad-id', name: 'Bad', type: 'human' })).toThrow();
    });

    it('throws on duplicate ContributorID', () => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      expect(() => registry.register({ id: 'contrib-alice', name: 'Alice2', type: 'human' }))
        .toThrow('Contributor already registered: contrib-alice');
    });

    it('registers an agent contributor', () => {
      const result = registry.register({ id: 'contrib-bot-one', name: 'Bot One', type: 'agent' });
      expect(result.type).toBe('agent');
    });

    it('registers a skill contributor', () => {
      const result = registry.register({ id: 'contrib-skill-lint', name: 'Lint Skill', type: 'skill' });
      expect(result.type).toBe('skill');
    });
  });

  // ==========================================================================
  // Lookup Tests
  // ==========================================================================

  describe('lookup', () => {
    beforeEach(() => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      registry.register({ id: 'contrib-bot-one', name: 'Bot One', type: 'agent' });
      registry.register({ id: 'contrib-skill-lint', name: 'Lint Skill', type: 'skill' });
    });

    it('get() returns the full Contributor record', () => {
      const result = registry.get('contrib-alice');
      expect(result).toBeDefined();
      expect(result!.id).toBe('contrib-alice');
      expect(result!.name).toBe('Alice');
    });

    it('get() returns undefined for non-existent contributor', () => {
      const result = registry.get('contrib-nonexistent');
      expect(result).toBeUndefined();
    });

    it('list() returns all registered contributors', () => {
      const all = registry.list();
      expect(all).toHaveLength(3);
    });

    it('list({ type: "human" }) returns only human contributors', () => {
      const humans = registry.list({ type: 'human' });
      expect(humans).toHaveLength(1);
      expect(humans[0].type).toBe('human');
    });

    it('list({ type: "agent" }) returns only agent contributors', () => {
      const agents = registry.list({ type: 'agent' });
      expect(agents).toHaveLength(1);
      expect(agents[0].type).toBe('agent');
    });
  });

  // ==========================================================================
  // Update Tests
  // ==========================================================================

  describe('update', () => {
    beforeEach(() => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
    });

    it('creates a new version on update', () => {
      registry.update('contrib-alice', { name: 'Alice Updated', description: 'Changed display name' });
      const contributor = registry.get('contrib-alice')!;
      expect(contributor.versions).toHaveLength(2);
    });

    it('updates the contributor name', () => {
      registry.update('contrib-alice', { name: 'Alice Updated', description: 'Changed display name' });
      const contributor = registry.get('contrib-alice')!;
      expect(contributor.name).toBe('Alice Updated');
    });

    it('version 2 has correct metadata', () => {
      registry.update('contrib-alice', { name: 'Alice Updated', description: 'Changed display name' });
      const contributor = registry.get('contrib-alice')!;
      const v2 = contributor.versions[1];
      expect(v2.version).toBe(2);
      expect(v2.changed_at).toBeDefined();
      expect(v2.description).toBe('Changed display name');
    });

    it('version 1 preserves the original state', () => {
      registry.update('contrib-alice', { name: 'Alice Updated', description: 'Changed display name' });
      const contributor = registry.get('contrib-alice')!;
      const v1 = contributor.versions[0];
      expect(v1.name).toBe('Alice');
    });

    it('multiple updates produce incrementing version numbers', () => {
      registry.update('contrib-alice', { name: 'Alice v2', description: 'Update 2' });
      registry.update('contrib-alice', { name: 'Alice v3', description: 'Update 3' });
      registry.update('contrib-alice', { name: 'Alice v4', description: 'Update 4' });
      const contributor = registry.get('contrib-alice')!;
      expect(contributor.versions).toHaveLength(4);
      expect(contributor.versions[3].version).toBe(4);
    });

    it('throws on updating non-existent contributor', () => {
      expect(() => registry.update('contrib-nonexistent', { description: 'No such person' }))
        .toThrow('Contributor not found: contrib-nonexistent');
    });
  });

  // ==========================================================================
  // Dependency Declaration Tests
  // ==========================================================================

  describe('declareDependency', () => {
    beforeEach(() => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      registry.register({ id: 'contrib-bot-one', name: 'Bot One', type: 'agent' });
      registry.register({ id: 'contrib-skill-lint', name: 'Lint Skill', type: 'skill' });
    });

    it('declares a dependency between two contributors', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      const contributor = registry.get('contrib-alice')!;
      expect(contributor.dependencies).toHaveLength(1);
    });

    it('dependency has correct fields', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      const dep = registry.get('contrib-alice')!.dependencies[0];
      expect(dep.depends_on).toBe('contrib-bot-one');
      expect(dep.relationship).toBe('uses');
      expect(dep.declared_at).toBeDefined();
    });

    it('supports extends relationship', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'extends' });
      const dep = registry.get('contrib-alice')!.dependencies[0];
      expect(dep.relationship).toBe('extends');
    });

    it('supports derives_from relationship', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'derives_from' });
      const dep = registry.get('contrib-alice')!.dependencies[0];
      expect(dep.relationship).toBe('derives_from');
    });

    it('throws when dependency target not found', () => {
      expect(() => registry.declareDependency('contrib-alice', { depends_on: 'contrib-nonexistent', relationship: 'uses' }))
        .toThrow('Dependency target not found: contrib-nonexistent');
    });

    it('throws when source contributor not found', () => {
      expect(() => registry.declareDependency('contrib-nonexistent', { depends_on: 'contrib-alice', relationship: 'uses' }))
        .toThrow('Contributor not found: contrib-nonexistent');
    });

    it('accumulates multiple dependencies', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-skill-lint', relationship: 'extends' });
      const contributor = registry.get('contrib-alice')!;
      expect(contributor.dependencies).toHaveLength(2);
    });

    it('throws on self-dependency', () => {
      expect(() => registry.declareDependency('contrib-alice', { depends_on: 'contrib-alice', relationship: 'uses' }))
        .toThrow('Circular dependency: contributor cannot depend on itself');
    });
  });

  // ==========================================================================
  // Circular Dependency Tests
  // ==========================================================================

  describe('circular dependency detection', () => {
    beforeEach(() => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      registry.register({ id: 'contrib-bot-one', name: 'Bot One', type: 'agent' });
      registry.register({ id: 'contrib-skill-lint', name: 'Lint Skill', type: 'skill' });
    });

    it('detects A -> B -> A cycle', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      expect(() => registry.declareDependency('contrib-bot-one', { depends_on: 'contrib-alice', relationship: 'uses' }))
        .toThrow(/Circular dependency detected.*contrib-bot-one.*contrib-alice.*contrib-bot-one/);
    });

    it('detects A -> B -> C -> A three-node cycle', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      registry.declareDependency('contrib-bot-one', { depends_on: 'contrib-skill-lint', relationship: 'uses' });
      expect(() => registry.declareDependency('contrib-skill-lint', { depends_on: 'contrib-alice', relationship: 'uses' }))
        .toThrow(/Circular dependency detected/);
    });

    it('allows non-circular chains', () => {
      registry.declareDependency('contrib-alice', { depends_on: 'contrib-bot-one', relationship: 'uses' });
      registry.declareDependency('contrib-bot-one', { depends_on: 'contrib-skill-lint', relationship: 'uses' });
      // No back-link to alice -- should succeed
      expect(registry.get('contrib-bot-one')!.dependencies).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Edge Case Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('registers contributor with minimum valid ID (contrib-a)', () => {
      const result = registry.register({ id: 'contrib-a', name: 'Minimal', type: 'human' });
      expect(result.id).toBe('contrib-a');
    });

    it('getVersionHistory() returns versions in chronological order', () => {
      registry.register({ id: 'contrib-alice', name: 'Alice', type: 'human' });
      registry.update('contrib-alice', { name: 'Alice v2', description: 'Update 1' });
      registry.update('contrib-alice', { name: 'Alice v3', description: 'Update 2' });
      const history = registry.getVersionHistory('contrib-alice');
      expect(history).toHaveLength(3);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
      expect(history[2].version).toBe(3);
    });
  });
});
