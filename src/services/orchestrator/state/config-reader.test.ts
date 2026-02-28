/**
 * Tests for the config.json parser.
 *
 * Covers:
 * - Complete template config parsing (full object form)
 * - Simplified flat config parsing (this project's actual config.json)
 * - Zod default filling for missing fields
 * - Nested planning.commit_docs hoisting to top level
 * - Top-level commit_docs precedence over nested
 * - Null return for empty/invalid/non-object input
 * - Boolean and object parallelization formats
 * - Missing subsection defaults (workflow, gates, safety, git)
 * - model_profile preservation
 */

import { describe, it, expect } from 'vitest';
import { parseConfig } from './config-reader.js';

// ============================================================================
// Fixtures
// ============================================================================

/** Full GSD template config (all fields present, object parallelization). */
const FULL_TEMPLATE_CONFIG = JSON.stringify({
  mode: 'interactive',
  depth: 'standard',
  workflow: { research: true, plan_check: true, verifier: true },
  planning: { commit_docs: true, search_gitignored: false },
  parallelization: {
    max_parallel: 5,
  },
  gates: {
    require_plan_approval: true,
    require_checkpoint_approval: false,
  },
  safety: {
    max_files_per_commit: 15,
    require_tests: false,
  },
  git: {
    auto_commit: false,
    commit_style: 'freeform',
  },
});

/** This project's actual config.json format (flat, minimal). */
const FLAT_CONFIG = JSON.stringify({
  mode: 'yolo',
  depth: 'comprehensive',
  parallelization: true,
  commit_docs: false,
  model_profile: 'quality',
  workflow: {
    research: true,
    plan_check: true,
    verifier: true,
  },
});

// ============================================================================
// Core parsing
// ============================================================================

describe('parseConfig', () => {
  it('parses complete template config with all fields', () => {
    const result = parseConfig(FULL_TEMPLATE_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('interactive');
    expect(result!.depth).toBe('standard');
    expect(result!.workflow).toEqual({ research: true, plan_check: true, verifier: true });
    expect(result!.gates).toMatchObject({
      require_plan_approval: true,
      require_checkpoint_approval: false,
    });
    expect(result!.safety).toMatchObject({
      max_files_per_commit: 15,
      require_tests: false,
    });
    expect(result!.git).toMatchObject({
      auto_commit: false,
      commit_style: 'freeform',
    });
  });

  it('parses simplified flat config (this project format)', () => {
    const result = parseConfig(FLAT_CONFIG);
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('yolo');
    expect(result!.depth).toBe('comprehensive');
    expect(result!.parallelization).toBe(true);
    expect(result!.commit_docs).toBe(false);
    expect(result!.model_profile).toBe('quality');
    expect(result!.workflow).toEqual({ research: true, plan_check: true, verifier: true });
  });

  it('fills in defaults for missing fields (empty object)', () => {
    const result = parseConfig('{}');
    expect(result).not.toBeNull();
    expect(result!.mode).toBe('interactive');
    expect(result!.depth).toBe('standard');
    expect(result!.model_profile).toBe('balanced');
    expect(result!.parallelization).toBe(false);
    expect(result!.commit_docs).toBe(true);
    expect(result!.workflow).toEqual({ research: true, plan_check: true, verifier: true });
    expect(result!.gates).toMatchObject({
      require_plan_approval: false,
      require_checkpoint_approval: true,
    });
    expect(result!.safety).toMatchObject({
      max_files_per_commit: 20,
      require_tests: true,
    });
    expect(result!.git).toMatchObject({
      auto_commit: true,
      commit_style: 'conventional',
    });
  });

  // ============================================================================
  // Nested planning.commit_docs hoisting
  // ============================================================================

  it('hoists planning.commit_docs to top level when commit_docs not present', () => {
    const config = JSON.stringify({
      mode: 'interactive',
      planning: { commit_docs: true },
    });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.commit_docs).toBe(true);
  });

  it('top-level commit_docs takes precedence over planning.commit_docs', () => {
    const config = JSON.stringify({
      mode: 'interactive',
      commit_docs: false,
      planning: { commit_docs: true },
    });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.commit_docs).toBe(false);
  });

  // ============================================================================
  // Null returns
  // ============================================================================

  it('returns null for empty string', () => {
    expect(parseConfig('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseConfig('   \n\t  ')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseConfig('not json')).toBeNull();
  });

  it('returns null for non-object JSON string', () => {
    expect(parseConfig('"hello"')).toBeNull();
  });

  it('returns null for non-object JSON number', () => {
    expect(parseConfig('42')).toBeNull();
  });

  it('returns null for non-object JSON array', () => {
    expect(parseConfig('[1,2,3]')).toBeNull();
  });

  // ============================================================================
  // Missing subsection defaults
  // ============================================================================

  it('handles missing workflow section (applies defaults)', () => {
    const config = JSON.stringify({ mode: 'yolo' });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.workflow).toEqual({ research: true, plan_check: true, verifier: true });
  });

  it('handles missing gates section (applies defaults)', () => {
    const config = JSON.stringify({ mode: 'yolo' });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.gates).toMatchObject({
      require_plan_approval: false,
      require_checkpoint_approval: true,
    });
  });

  it('handles missing safety section (applies defaults)', () => {
    const config = JSON.stringify({ mode: 'yolo' });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.safety).toMatchObject({
      max_files_per_commit: 20,
      require_tests: true,
    });
  });

  it('handles missing git section (applies defaults)', () => {
    const config = JSON.stringify({ mode: 'yolo' });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.git).toMatchObject({
      auto_commit: true,
      commit_style: 'conventional',
    });
  });

  // ============================================================================
  // Parallelization formats
  // ============================================================================

  it('accepts boolean parallelization (true)', () => {
    const config = JSON.stringify({ parallelization: true });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.parallelization).toBe(true);
  });

  it('accepts boolean parallelization (false)', () => {
    const config = JSON.stringify({ parallelization: false });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.parallelization).toBe(false);
  });

  it('accepts object parallelization with max_parallel', () => {
    const config = JSON.stringify({ parallelization: { max_parallel: 4 } });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.parallelization).toEqual({ max_parallel: 4 });
  });

  it('accepts object parallelization with extra fields (passthrough)', () => {
    const config = JSON.stringify({
      parallelization: { max_parallel: 3, plan_level: true, task_level: false },
    });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    const para = result!.parallelization as Record<string, unknown>;
    expect(para.max_parallel).toBe(3);
    expect(para.plan_level).toBe(true);
    expect(para.task_level).toBe(false);
  });

  // ============================================================================
  // model_profile preservation
  // ============================================================================

  it('preserves model_profile field as-is', () => {
    const config = JSON.stringify({ model_profile: 'quality' });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    expect(result!.model_profile).toBe('quality');
  });

  it('defaults model_profile to balanced when not provided', () => {
    const result = parseConfig('{}');
    expect(result).not.toBeNull();
    expect(result!.model_profile).toBe('balanced');
  });

  // ============================================================================
  // planning.search_gitignored hoisting
  // ============================================================================

  it('hoists planning.search_gitignored when top-level not present', () => {
    const config = JSON.stringify({
      planning: { search_gitignored: true },
    });
    const result = parseConfig(config);
    expect(result).not.toBeNull();
    // search_gitignored should be preserved via passthrough
    expect((result as Record<string, unknown>).search_gitignored).toBe(true);
  });
});
