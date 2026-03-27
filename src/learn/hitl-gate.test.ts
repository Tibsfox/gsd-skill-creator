// === sc:learn HITL Gate — TDD Tests ===
//
// RED phase: all tests written before implementation.
// Tests auto-approval for clean local files, STRANGER content approval flow,
// finding presentation, decision recording, and prompt function injection.

import { describe, it, expect, vi } from 'vitest';
import type { SourceFamiliarity, AcquisitionSource, StagedContent } from './acquirer.js';
import type {
  SanitizationResult,
  HygieneReport,
  HygieneFinding,
  HygieneSeverity,
  HygieneCategory,
} from './sanitizer.js';
import {
  hitlGate,
  formatFindings,
  type HitlDecision,
  type HitlGateResult,
  type ApprovalStatus,
  type PromptFn,
} from './hitl-gate.js';

// === Helpers ===

function makeFinding(
  category: HygieneCategory = 'prompt-injection',
  severity: HygieneSeverity = 'critical',
): HygieneFinding {
  return {
    category,
    severity,
    description: `Test ${category} finding`,
    location: 'test.md:offset 0',
    evidence: 'test evidence content',
    recommendation: `Review ${category} issue`,
  };
}

function makeSanitizationResult(overrides: {
  familiarity?: SourceFamiliarity;
  autoApproved?: boolean;
  findings?: HygieneFinding[];
  passed?: boolean;
} = {}): SanitizationResult {
  const familiarity = overrides.familiarity ?? 'STRANGER';
  const findings = overrides.findings ?? [];
  const passed = overrides.passed ?? !findings.some(f => f.severity === 'critical');
  const autoApproved = overrides.autoApproved ?? false;

  return {
    source: { input: 'test-source', type: 'local-file', familiarity },
    staged: [{
      filename: 'test.md',
      content: 'Test content for HITL gate',
      byteSize: 25,
      encoding: 'utf-8',
      sourceFile: 'test.md',
    }],
    report: {
      findings,
      tier: familiarity,
      passed,
      summary: `${findings.length} finding(s) \u2014 ${passed ? 'clean' : 'review required'}`,
      checkedAt: new Date().toISOString(),
    },
    autoApproved,
  };
}

// === Group 1: Auto-approval for clean local files ===

describe('auto-approval for clean local files', () => {
  it('auto-approves HOME content with no findings', async () => {
    const input = makeSanitizationResult({
      familiarity: 'HOME',
      autoApproved: true,
      findings: [],
    });

    const result = await hitlGate(input);

    expect(result.decision.status).toBe('approved');
    expect(result.decision.decidedBy).toBe('auto');
    expect(result.decision.rationale).toMatch(/auto-approved/i);
    expect(result.proceed).toBe(true);
  });

  it('auto-approves HOME content with report.passed true', async () => {
    const mockPrompt = vi.fn();
    const input = makeSanitizationResult({
      familiarity: 'HOME',
      autoApproved: true,
      findings: [],
      passed: true,
    });

    await hitlGate(input, mockPrompt);

    // Prompt should NOT be called for auto-approved content
    expect(mockPrompt).not.toHaveBeenCalled();
  });

  it('does NOT auto-approve HOME content with findings', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({
      familiarity: 'HOME',
      autoApproved: false,
      findings: [makeFinding('embedded-code', 'warning')],
    });

    const result = await hitlGate(input, mockPrompt);

    expect(mockPrompt).toHaveBeenCalled();
    expect(result.decision.decidedBy).toBe('user');
  });
});

// === Group 2: STRANGER content requires user approval ===

describe('STRANGER content requires user approval', () => {
  it('prompts user for STRANGER content even when clean', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({
      familiarity: 'STRANGER',
      autoApproved: false,
      findings: [],
    });

    const result = await hitlGate(input, mockPrompt);

    expect(mockPrompt).toHaveBeenCalled();
    expect(result.decision.status).toBe('approved');
    expect(result.proceed).toBe(true);
  });

  it('prompts user for STRANGER content with findings', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved-with-warnings');
    const input = makeSanitizationResult({
      familiarity: 'STRANGER',
      autoApproved: false,
      findings: [
        makeFinding('prompt-injection', 'critical'),
        makeFinding('external-resources', 'warning'),
      ],
    });

    const result = await hitlGate(input, mockPrompt);

    expect(result.decision.status).toBe('approved-with-warnings');
    expect(result.proceed).toBe(true);
    expect(result.decision.reviewedFindings).toBe(2);
  });

  it('user can reject STRANGER content', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('rejected');
    const input = makeSanitizationResult({
      familiarity: 'STRANGER',
      autoApproved: false,
      findings: [makeFinding('prompt-injection', 'critical')],
    });

    const result = await hitlGate(input, mockPrompt);

    expect(result.decision.status).toBe('rejected');
    expect(result.proceed).toBe(false);
  });
});

// === Group 3: Finding presentation ===

describe('finding presentation', () => {
  it('formatFindings produces readable output for critical findings', () => {
    const report: HygieneReport = {
      findings: [makeFinding('prompt-injection', 'critical')],
      tier: 'STRANGER',
      passed: false,
      summary: '1 finding(s) \u2014 review required',
      checkedAt: new Date().toISOString(),
    };

    const output = formatFindings(report);

    expect(output).toContain('prompt-injection');
    expect(output).toContain('CRITICAL');
    expect(output).toContain('test evidence content');
    expect(output).toContain('Review');
  });

  it('formatFindings produces readable output for multiple findings', () => {
    const report: HygieneReport = {
      findings: [
        makeFinding('prompt-injection', 'critical'),
        makeFinding('external-resources', 'warning'),
        makeFinding('hidden-characters', 'info'),
      ],
      tier: 'STRANGER',
      passed: false,
      summary: '3 finding(s) \u2014 review required',
      checkedAt: new Date().toISOString(),
    };

    const output = formatFindings(report);

    // All three should appear
    expect(output).toContain('CRITICAL');
    expect(output).toContain('WARNING');
    expect(output).toContain('INFO');
  });

  it('formatFindings produces clean output when no findings', () => {
    const report: HygieneReport = {
      findings: [],
      tier: 'STRANGER',
      passed: true,
      summary: '0 finding(s) \u2014 clean',
      checkedAt: new Date().toISOString(),
    };

    const output = formatFindings(report);

    expect(output).toMatch(/no issues found/i);
  });

  it('formatFindings includes summary line', () => {
    const report: HygieneReport = {
      findings: [makeFinding('embedded-code', 'warning')],
      tier: 'STRANGER',
      passed: true,
      summary: '1 finding(s) \u2014 clean',
      checkedAt: new Date().toISOString(),
    };

    const output = formatFindings(report);

    expect(output).toContain('1 finding(s)');
  });
});

// === Group 4: Decision recording ===

describe('decision recording', () => {
  it('decision includes ISO timestamp', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({ familiarity: 'STRANGER', autoApproved: false });

    const result = await hitlGate(input, mockPrompt);

    expect(result.decision.decidedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('decision records reviewed finding count', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved-with-warnings');
    const input = makeSanitizationResult({
      familiarity: 'STRANGER',
      autoApproved: false,
      findings: [
        makeFinding('prompt-injection', 'critical'),
        makeFinding('hidden-characters', 'warning'),
        makeFinding('external-resources', 'info'),
      ],
    });

    const result = await hitlGate(input, mockPrompt);

    expect(result.decision.reviewedFindings).toBe(3);
  });

  it('decision records rationale', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({ familiarity: 'STRANGER', autoApproved: false });

    const result = await hitlGate(input, mockPrompt);

    expect(result.decision.rationale).toBeTruthy();
    expect(typeof result.decision.rationale).toBe('string');
  });

  it('result passes through sanitizationResult unchanged', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({ familiarity: 'STRANGER', autoApproved: false });

    const result = await hitlGate(input, mockPrompt);

    // Reference equality — the sanitization result is passed through, not cloned
    expect(result.sanitizationResult).toBe(input);
  });
});

// === Group 5: Prompt function injection ===

describe('prompt function injection', () => {
  it('uses injected promptFn', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({ familiarity: 'STRANGER', autoApproved: false });

    await hitlGate(input, mockPrompt);

    expect(mockPrompt).toHaveBeenCalledTimes(1);
  });

  it('promptFn receives formatted findings in message', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({
      familiarity: 'STRANGER',
      autoApproved: false,
      findings: [makeFinding('prompt-injection', 'critical')],
    });

    await hitlGate(input, mockPrompt);

    const message = mockPrompt.mock.calls[0][0] as string;
    expect(message).toContain('prompt-injection');
  });

  it('promptFn choices include approve, approve-with-warnings, reject', async () => {
    const mockPrompt = vi.fn().mockResolvedValue('approved');
    const input = makeSanitizationResult({ familiarity: 'STRANGER', autoApproved: false });

    await hitlGate(input, mockPrompt);

    const choices = mockPrompt.mock.calls[0][1] as string[];
    expect(choices).toContain('approved');
    expect(choices).toContain('approved-with-warnings');
    expect(choices).toContain('rejected');
  });
});
