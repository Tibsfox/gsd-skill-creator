/**
 * Tests for the PROJECT.md parser.
 *
 * Covers:
 * - Project name extraction from H1 heading
 * - Core value extraction from section
 * - Current milestone extraction from heading
 * - Description extraction from What This Is section
 * - Null return for empty/invalid input
 * - Partial PROJECT.md (missing sections)
 */

import { describe, it, expect } from 'vitest';
import { parseProject } from './project-parser.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMPLETE_PROJECT = `# GSD Skill Creator

## What This Is

A skill, agent, and team management tool for Claude Code that creates, validates, maintains, and discovers skills, agents, and teams. Features comprehensive validation (schema, conflicts, activation likelihood), activation testing (test cases, simulation, calibration), team scaffolding from orchestration patterns, team-aware validation, and session log pattern discovery with semantic clustering for automated skill candidate generation.

## Current Milestone: v1.7 GSD Master Orchestration Agent

**Goal:** Build a master orchestrator that routes user intent to default GSD commands/agents.

**Target features:**
- Dynamic discovery of installed GSD commands, agents, and teams at runtime
- Intent classification mapping natural language to GSD commands

## Current State

**Shipped:** v1.6 Example Skills/Agents/Teams (2026-02-07)

## Core Value

Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.

## Requirements

### Validated

- Some requirements here

## Constraints

- Some constraints here

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Some | decision | here |
`;

const MINIMAL_PROJECT = `# My Project

## What This Is

A simple project.

## Core Value

Keep it simple.
`;

const PROJECT_WITHOUT_MILESTONE = `# Legacy Project

## What This Is

An older project without a milestone heading.

## Core Value

Stability above all.
`;

// ============================================================================
// Core parsing
// ============================================================================

describe('parseProject', () => {
  it('parses complete PROJECT.md with all sections', () => {
    const result = parseProject(COMPLETE_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('GSD Skill Creator');
    expect(result!.coreValue).toBe('Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.');
    expect(result!.currentMilestone).toBe('v1.7 GSD Master Orchestration Agent');
    expect(result!.description).toContain('A skill, agent, and team management tool');
  });

  it('extracts project name from H1 heading', () => {
    const result = parseProject(COMPLETE_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('GSD Skill Creator');
  });

  it('extracts core value from section', () => {
    const result = parseProject(COMPLETE_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.coreValue).toBe('Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.');
  });

  it('extracts current milestone name from heading', () => {
    const result = parseProject(COMPLETE_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.currentMilestone).toBe('v1.7 GSD Master Orchestration Agent');
  });

  it('extracts description from What This Is section', () => {
    const result = parseProject(COMPLETE_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.description).not.toBeNull();
    expect(result!.description).toContain('skill, agent, and team management tool');
  });

  it('returns null for empty input', () => {
    expect(parseProject('')).toBeNull();
  });

  it('returns null for whitespace-only input', () => {
    expect(parseProject('  \n\t  ')).toBeNull();
  });

  it('returns null values for missing sections (still returns object, just with nulls)', () => {
    const content = `# Some Project

Just a heading and some text, no standard sections.
`;
    const result = parseProject(content);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Some Project');
    expect(result!.coreValue).toBeNull();
    expect(result!.currentMilestone).toBeNull();
    expect(result!.description).toBeNull();
  });

  it('handles PROJECT.md without milestone heading (older format)', () => {
    const result = parseProject(PROJECT_WITHOUT_MILESTONE);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Legacy Project');
    expect(result!.currentMilestone).toBeNull();
    expect(result!.coreValue).toBe('Stability above all.');
    expect(result!.description).toBe('An older project without a milestone heading.');
  });

  it('handles minimal PROJECT.md', () => {
    const result = parseProject(MINIMAL_PROJECT);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('My Project');
    expect(result!.description).toBe('A simple project.');
    expect(result!.coreValue).toBe('Keep it simple.');
    expect(result!.currentMilestone).toBeNull();
  });
});
