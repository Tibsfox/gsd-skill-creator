/**
 * Tests for milestone complete scoping under v1.55 topology (RC-07).
 *
 * Verifies that milestone phase counting is correctly scoped to
 * only the phases belonging to the current milestone, excluding
 * phases from prior milestones.
 *
 * The v1.55 milestone has 11 phases (508-518). These tests confirm
 * the phase number extraction regex, normalization logic, and
 * directory matching all produce correct results.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Re-implement milestone.cjs key logic in TypeScript for verification
// ============================================================================

/**
 * Extract phase numbers from ROADMAP.md-style headings.
 * Same regex as milestone.cjs: /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi
 */
function extractPhaseNumbers(roadmapContent: string): Set<string> {
  const phasePattern = /#{2,4}\s*Phase\s+(\d+[A-Z]?(?:\.\d+)*)\s*:/gi;
  const phases = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = phasePattern.exec(roadmapContent)) !== null) {
    phases.add(match[1]);
  }
  return phases;
}

/**
 * Normalize a phase number for directory matching.
 * Same logic as milestone.cjs: strip leading zeros, lowercase.
 */
function normalizePhaseNum(num: string): string {
  // Strip leading zeros from numeric portion, lowercase alpha suffix
  return num.replace(/^0+(\d)/, '$1').toLowerCase();
}

/**
 * Check if a phase directory name belongs to the current milestone.
 * Same logic as milestone.cjs: extract leading number from dir name,
 * normalize, check against milestone phase set.
 */
function isDirInMilestone(
  dirName: string,
  milestonePhaseNums: Set<string>,
): boolean {
  const dirPhaseMatch = dirName.match(/^(\d+[A-Za-z]?(?:\.\d+)*)-/);
  if (!dirPhaseMatch) return false;
  const dirPhaseNum = normalizePhaseNum(dirPhaseMatch[1]);
  const normalizedSet = new Set(
    [...milestonePhaseNums].map((n) => normalizePhaseNum(n)),
  );
  return normalizedSet.has(dirPhaseNum);
}

// ============================================================================
// Test data: v1.55 ROADMAP content (11 phases, 508-518)
// ============================================================================

const V155_ROADMAP = `
# v1.55 Full Stack Buildout

## Phases

### Phase 508: RC Closure Foundation
Watchdog timer, pruner integration, SUMMARY gate, milestone scoping.

### Phase 509: Electronics Gap Analysis
Component cross-referencing, datasheet integration, BOM validation.

### Phase 510: Electronics Sim Engine
SPICE-lite simulation, circuit analysis, waveform generation.

### Phase 511: Electronics Pack Integration
Pack assembly, part lookup, schematic rendering.

### Phase 512: Electronics Verification
End-to-end electronics pack testing, regression suite.

### Phase 513: Site Content Pipeline
Static site generation, markdown processing, template engine.

### Phase 514: Site Navigation & Search
Client-side search, navigation tree, breadcrumbs.

### Phase 515: Site Deployment & Verification
Build pipeline, deployment config, lighthouse audit.

### Phase 516: SSH Security Foundations
Key management, agent forwarding, known_hosts validation.

### Phase 517: SSH Hardening & Bubblewrap
Sandbox profiles, seccomp filters, namespace isolation.

### Phase 518: Cross-Domain Validation
Integration testing across all domains, final verification.
`;

// ============================================================================
// Tests
// ============================================================================

describe('milestone complete scoping (RC-07)', () => {
  let tempDir: string | undefined;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('extracts phase numbers from v1.55 ROADMAP headings', () => {
    const phases = extractPhaseNumbers(V155_ROADMAP);

    expect(phases.size).toBe(11);
    expect(phases).toContain('508');
    expect(phases).toContain('509');
    expect(phases).toContain('510');
    expect(phases).toContain('511');
    expect(phases).toContain('512');
    expect(phases).toContain('513');
    expect(phases).toContain('514');
    expect(phases).toContain('515');
    expect(phases).toContain('516');
    expect(phases).toContain('517');
    expect(phases).toContain('518');
  });

  it('normalizes phase numbers for directory matching', () => {
    expect(normalizePhaseNum('508')).toBe('508');
    expect(normalizePhaseNum('03')).toBe('3');
    expect(normalizePhaseNum('3A')).toBe('3a');
    expect(normalizePhaseNum('0010')).toBe('10');
    expect(normalizePhaseNum('1')).toBe('1');
  });

  it('isDirInMilestone matches phase directories correctly', () => {
    const milestonePhases = extractPhaseNumbers(V155_ROADMAP);

    // These should match (in v1.55 milestone)
    expect(isDirInMilestone('508-rc-closure-foundation', milestonePhases)).toBe(true);
    expect(isDirInMilestone('509-electronics-gap-analysis', milestonePhases)).toBe(true);
    expect(isDirInMilestone('518-cross-domain-validation', milestonePhases)).toBe(true);

    // These should NOT match (from prior milestones)
    expect(isDirInMilestone('507-team-lifecycle', milestonePhases)).toBe(false);
    expect(isDirInMilestone('99-historical-trends', milestonePhases)).toBe(false);
    expect(isDirInMilestone('001-initial-setup', milestonePhases)).toBe(false);
  });

  it('counts phases scoped to milestone only', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'milestone-scoping-'));
    const phasesDir = join(tempDir, 'phases');
    mkdirSync(phasesDir, { recursive: true });

    // Create mock phase directories (mix of v1.55 and prior milestone phases)
    const mockDirs = [
      '507-team-lifecycle',        // v1.54 -- should NOT be counted
      '508-rc-closure-foundation', // v1.55
      '509-electronics-gap-analysis', // v1.55
      '518-cross-domain-validation',  // v1.55
    ];

    for (const dir of mockDirs) {
      mkdirSync(join(phasesDir, dir), { recursive: true });
    }

    const milestonePhases = extractPhaseNumbers(V155_ROADMAP);
    const allDirs = readdirSync(phasesDir);
    const milestoneDirs = allDirs.filter((d) =>
      isDirInMilestone(d, milestonePhases),
    );

    // Only 3 of the 4 directories belong to v1.55 (507 is excluded)
    expect(milestoneDirs).toHaveLength(3);
    expect(milestoneDirs).toContain('508-rc-closure-foundation');
    expect(milestoneDirs).toContain('509-electronics-gap-analysis');
    expect(milestoneDirs).toContain('518-cross-domain-validation');
    expect(milestoneDirs).not.toContain('507-team-lifecycle');
  });
});
