/**
 * Tests for the deployment commit rationale formatter and parser.
 *
 * Covers formatting, parsing, round-trip verification, isDeploymentCommit
 * detection, optional field handling, and default risk level.
 *
 * @module cloud-ops/git/commit-rationale.test
 */

import { describe, it, expect } from 'vitest';
import {
  formatDeploymentCommit,
  parseDeploymentCommit,
  isDeploymentCommit,
} from './commit-rationale.js';
import type { DeploymentCommitInfo } from './types.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a DeploymentCommitInfo with sensible defaults. */
function makeInfo(overrides: Partial<DeploymentCommitInfo> = {}): DeploymentCommitInfo {
  return {
    changeType: 'config',
    services: ['keystone'],
    sePhase: 'c',
    summary: 'update endpoint URLs',
    rationale: 'migrating to internal DNS for reliability',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// formatDeploymentCommit
// ---------------------------------------------------------------------------

describe('formatDeploymentCommit', () => {
  it('produces correct conventional commit format with deploy type', () => {
    const msg = formatDeploymentCommit(makeInfo());
    expect(msg).toMatch(/^deploy\(keystone\): update endpoint URLs/);
  });

  it('includes SE phase name lookup', () => {
    const msg = formatDeploymentCommit(makeInfo({ sePhase: 'c' }));
    expect(msg).toContain('SE Phase: c (Phase C: Final Design & Fabrication)');
  });

  it('includes SE phase name lookup for other phases', () => {
    const msg = formatDeploymentCommit(makeInfo({ sePhase: 'e' }));
    expect(msg).toContain('SE Phase: e (Phase E: Operations & Sustainment)');
  });

  it('includes rationale and config files when provided', () => {
    const msg = formatDeploymentCommit(makeInfo({
      rationale: 'consolidating endpoints',
      configFiles: ['globals.yml', 'keystone.conf'],
    }));
    expect(msg).toContain('Rationale: consolidating endpoints');
    expect(msg).toContain('Config Files:');
    expect(msg).toContain('  - globals.yml');
    expect(msg).toContain('  - keystone.conf');
  });

  it('omits config files section when none provided', () => {
    const msg = formatDeploymentCommit(makeInfo({ configFiles: undefined }));
    expect(msg).not.toContain('Config Files:');
  });

  it('omits config files section when empty array provided', () => {
    const msg = formatDeploymentCommit(makeInfo({ configFiles: [] }));
    expect(msg).not.toContain('Config Files:');
  });

  it('defaults risk level to low', () => {
    const msg = formatDeploymentCommit(makeInfo({ riskLevel: undefined }));
    expect(msg).toContain('Risk Level: low');
  });

  it('uses provided risk level', () => {
    const msg = formatDeploymentCommit(makeInfo({ riskLevel: 'high' }));
    expect(msg).toContain('Risk Level: high');
  });

  it('joins multiple services in scope', () => {
    const msg = formatDeploymentCommit(makeInfo({
      services: ['keystone', 'nova', 'neutron'],
    }));
    expect(msg).toMatch(/^deploy\(keystone,nova,neutron\):/);
    expect(msg).toContain('Services: keystone, nova, neutron');
  });

  it('includes change type in body', () => {
    const msg = formatDeploymentCommit(makeInfo({ changeType: 'rollback' }));
    expect(msg).toContain('Change Type: rollback');
  });
});

// ---------------------------------------------------------------------------
// parseDeploymentCommit
// ---------------------------------------------------------------------------

describe('parseDeploymentCommit', () => {
  it('round-trips with formatDeploymentCommit', () => {
    const original = makeInfo({
      changeType: 'deploy',
      services: ['keystone', 'nova'],
      sePhase: 'd',
      summary: 'deploy keystone and nova',
      rationale: 'initial service deployment',
      riskLevel: 'medium',
      configFiles: ['keystone.conf', 'nova.conf'],
    });

    const message = formatDeploymentCommit(original);
    const parsed = parseDeploymentCommit(message);

    expect(parsed).not.toBeNull();
    expect(parsed!.changeType).toBe(original.changeType);
    expect(parsed!.services).toEqual(original.services);
    expect(parsed!.sePhase).toBe(original.sePhase);
    expect(parsed!.summary).toBe(original.summary);
    expect(parsed!.rationale).toBe(original.rationale);
    expect(parsed!.riskLevel).toBe(original.riskLevel);
    expect(parsed!.configFiles).toEqual(original.configFiles);
  });

  it('round-trips without optional fields', () => {
    const original = makeInfo({
      configFiles: undefined,
      riskLevel: undefined,
    });

    const message = formatDeploymentCommit(original);
    const parsed = parseDeploymentCommit(message);

    expect(parsed).not.toBeNull();
    expect(parsed!.changeType).toBe(original.changeType);
    expect(parsed!.services).toEqual(original.services);
    expect(parsed!.sePhase).toBe(original.sePhase);
    expect(parsed!.summary).toBe(original.summary);
    expect(parsed!.rationale).toBe(original.rationale);
    // risk defaults to 'low' in format, so parse returns 'low'
    expect(parsed!.riskLevel).toBe('low');
    expect(parsed!.configFiles).toBeUndefined();
  });

  it('returns null for non-deployment commits', () => {
    expect(parseDeploymentCommit('feat(auth): add JWT tokens')).toBeNull();
    expect(parseDeploymentCommit('fix: correct typo')).toBeNull();
    expect(parseDeploymentCommit('')).toBeNull();
  });

  it('handles missing optional fields gracefully', () => {
    // A minimal deploy commit with only required body fields
    const message = [
      'deploy(nova): minimal commit',
      '',
      'SE Phase: b (Phase B: Preliminary Design)',
      'Change Type: config',
      'Risk Level: low',
      'Services: nova',
      '',
      'Rationale: testing minimal parse',
    ].join('\n');

    const parsed = parseDeploymentCommit(message);
    expect(parsed).not.toBeNull();
    expect(parsed!.configFiles).toBeUndefined();
    expect(parsed!.services).toEqual(['nova']);
  });

  it('preserves rawMessage', () => {
    const message = formatDeploymentCommit(makeInfo());
    const parsed = parseDeploymentCommit(message);
    expect(parsed!.rawMessage).toBe(message);
  });
});

// ---------------------------------------------------------------------------
// isDeploymentCommit
// ---------------------------------------------------------------------------

describe('isDeploymentCommit', () => {
  it('returns true for deploy() prefix', () => {
    expect(isDeploymentCommit('deploy(keystone): update config')).toBe(true);
    expect(isDeploymentCommit('deploy(nova,neutron): network changes')).toBe(true);
  });

  it('returns false for other commit types', () => {
    expect(isDeploymentCommit('feat(auth): add tokens')).toBe(false);
    expect(isDeploymentCommit('fix: correct typo')).toBe(false);
    expect(isDeploymentCommit('chore: update deps')).toBe(false);
    expect(isDeploymentCommit('')).toBe(false);
  });

  it('returns false for messages that contain deploy but do not start with it', () => {
    expect(isDeploymentCommit('chore: deploy pipeline update')).toBe(false);
  });
});
