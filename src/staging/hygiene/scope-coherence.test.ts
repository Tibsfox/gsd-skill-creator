/**
 * Tests for scope/privilege coherence checking.
 *
 * Verifies that checkScopeCoherence detects mismatches between
 * declared purpose and requested tools/permissions.
 *
 * @module staging/hygiene/scope-coherence.test
 */

import { describe, expect, it } from 'vitest';
import {
  checkScopeCoherence,
  type ScopeDeclaration,
  type CoherenceResult,
  type CoherenceFinding,
} from './scope-coherence.js';

describe('checkScopeCoherence', () => {
  it('returns coherent result when purpose matches tools', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'build and test TypeScript',
      requestedTools: ['Read', 'Bash'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.riskLevel).toBe('info');
  });

  it('returns coherent result when no tools are requested', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'format markdown',
      requestedTools: [],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.riskLevel).toBe('info');
  });

  it('flags incoherent tools that do not match purpose', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'format markdown',
      requestedTools: ['Bash', 'WebFetch'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    expect(result.findings).toHaveLength(2);

    const bashFinding = result.findings.find((f) => f.tool === 'Bash');
    expect(bashFinding).toBeDefined();
    expect(bashFinding!.severity).toBe('high');
    expect(bashFinding!.reason).toContain('Bash');

    const webFinding = result.findings.find((f) => f.tool === 'WebFetch');
    expect(webFinding).toBeDefined();
    expect(webFinding!.severity).toBe('medium');
  });

  it('flags Write when purpose is read-only', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'read files',
      requestedTools: ['Write'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].tool).toBe('Write');
    expect(result.findings[0].severity).toBe('medium');
  });

  it('handles mixed coherent and incoherent tools', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'generate API client',
      requestedTools: ['Write', 'Bash', 'WebSearch'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);

    // Write matches "generate" -> coherent
    const writeFinding = result.findings.find((f) => f.tool === 'Write');
    expect(writeFinding).toBeUndefined();

    // Bash doesn't match "generate API client" -> incoherent
    const bashFinding = result.findings.find((f) => f.tool === 'Bash');
    expect(bashFinding).toBeDefined();

    // WebSearch doesn't match "generate API client" -> incoherent
    const webFinding = result.findings.find((f) => f.tool === 'WebSearch');
    expect(webFinding).toBeDefined();
  });

  it('uses scopeKeywords for additional matching', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'helper',
      requestedTools: ['Bash'],
      scopeKeywords: ['build', 'deploy'],
    };
    const result = checkScopeCoherence(declaration);
    // Bash matches via scopeKeywords 'build' and 'deploy'
    expect(result.isCoherent).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('never flags safe tools (Read, Edit, Glob, Grep)', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'anything',
      requestedTools: ['Read', 'Edit', 'Glob', 'Grep'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(true);
    expect(result.findings).toEqual([]);
    expect(result.riskLevel).toBe('info');
  });

  it('flags everything when purpose is empty', () => {
    const declaration: ScopeDeclaration = {
      purpose: '',
      requestedTools: ['Bash'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].tool).toBe('Bash');
    expect(result.findings[0].severity).toBe('high');
  });

  it('riskLevel reflects highest severity among findings', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'format text',
      requestedTools: ['Bash', 'NotebookEdit'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    // Bash is 'high', NotebookEdit is 'low' -> riskLevel should be 'high'
    expect(result.riskLevel).toBe('high');
  });

  it('riskLevel is low when only low-severity findings exist', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'format text',
      requestedTools: ['NotebookEdit'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    expect(result.riskLevel).toBe('low');
  });

  it('handles purpose matching case-insensitively', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'BUILD AND TEST TypeScript',
      requestedTools: ['Bash'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(true);
  });

  it('handles unknown tools not in the map (treated as safe)', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'anything',
      requestedTools: ['SomeUnknownTool'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('provides meaningful reason in findings', () => {
    const declaration: ScopeDeclaration = {
      purpose: 'display dashboard',
      requestedTools: ['Bash'],
    };
    const result = checkScopeCoherence(declaration);
    expect(result.isCoherent).toBe(false);
    expect(result.findings[0].reason).toBeTruthy();
    expect(typeof result.findings[0].reason).toBe('string');
    expect(result.findings[0].reason.length).toBeGreaterThan(10);
  });
});
