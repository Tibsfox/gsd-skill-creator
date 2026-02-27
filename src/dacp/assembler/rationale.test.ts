/**
 * Tests for DACP assembly rationale formatting.
 *
 * @module dacp/assembler/rationale.test
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { AssemblyRationale } from '../types.js';
import { formatRationale, formatAssemblyLog } from './rationale.js';
import type { AssemblyLogInput } from './rationale.js';

// ============================================================================
// formatRationale
// ============================================================================

describe('formatRationale', () => {
  it('produces correct markdown with populated rationale', () => {
    const rationale: AssemblyRationale = {
      level_justification: 'Level 2 selected. Data complexity: structured. 3 skill(s) available.',
      skills_used: ['task-parser', 'schema-validator'],
      generated_artifacts: ['intent.md', 'data/payload.json'],
      reused_artifacts: ['data/schema-task.json', 'code/parser.sh'],
    };

    const result = formatRationale(rationale);

    expect(result).toContain('## Assembly Rationale');
    expect(result).toContain('**Level Justification:** Level 2 selected.');
    expect(result).toContain('**Skills Used:** task-parser, schema-validator');
    expect(result).toContain('- intent.md');
    expect(result).toContain('- data/payload.json');
    expect(result).toContain('- data/schema-task.json');
    expect(result).toContain('- code/parser.sh');
  });

  it('handles empty arrays with "None"', () => {
    const rationale: AssemblyRationale = {
      level_justification: 'Level 0 selected. No structured data.',
      skills_used: [],
      generated_artifacts: [],
      reused_artifacts: [],
    };

    const result = formatRationale(rationale);

    expect(result).toContain('**Skills Used:** None');
    expect(result).toContain('**Generated Artifacts:** None');
    expect(result).toContain('**Reused Artifacts:** None');
  });

  it('formats single-item lists correctly', () => {
    const rationale: AssemblyRationale = {
      level_justification: 'Level 1 selected.',
      skills_used: ['only-skill'],
      generated_artifacts: ['intent.md'],
      reused_artifacts: [],
    };

    const result = formatRationale(rationale);

    expect(result).toContain('**Skills Used:** only-skill');
    expect(result).toContain('- intent.md');
    expect(result).toContain('**Reused Artifacts:** None');
  });
});

// ============================================================================
// formatAssemblyLog
// ============================================================================

describe('formatAssemblyLog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleInput: AssemblyLogInput = {
    handoff_type: 'task-assignment',
    fidelity_decided: 2,
    fidelity_inputs: {
      data_complexity: 'structured',
      historical_drift_rate: 0.15,
      available_skills: 3,
      token_budget_remaining: 80_000,
      safety_critical: false,
    },
    skills_used: ['task-parser', 'schema-validator'],
    artifacts_reused: 2,
    artifacts_generated: 1,
    bundle_size_bytes: 4096,
    assembly_time_ms: 45,
  };

  it('produces valid single-line JSON', () => {
    const result = formatAssemblyLog(sampleInput);

    // Should be valid JSON
    const parsed = JSON.parse(result);
    expect(parsed).toBeDefined();

    // Should be single line (no newlines)
    expect(result).not.toContain('\n');
  });

  it('includes "dacp_assembly" event type', () => {
    const result = formatAssemblyLog(sampleInput);
    const parsed = JSON.parse(result);

    expect(parsed.event).toBe('dacp_assembly');
  });

  it('includes ISO timestamp', () => {
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-02-27T12:00:00.000Z');

    const result = formatAssemblyLog(sampleInput);
    const parsed = JSON.parse(result);

    expect(parsed.timestamp).toBe('2026-02-27T12:00:00.000Z');
  });

  it('includes all input fields', () => {
    const result = formatAssemblyLog(sampleInput);
    const parsed = JSON.parse(result);

    expect(parsed.handoff_type).toBe('task-assignment');
    expect(parsed.fidelity_decided).toBe(2);
    expect(parsed.fidelity_inputs.data_complexity).toBe('structured');
    expect(parsed.fidelity_inputs.historical_drift_rate).toBe(0.15);
    expect(parsed.fidelity_inputs.available_skills).toBe(3);
    expect(parsed.fidelity_inputs.token_budget_remaining).toBe(80_000);
    expect(parsed.fidelity_inputs.safety_critical).toBe(false);
    expect(parsed.skills_used).toEqual(['task-parser', 'schema-validator']);
    expect(parsed.artifacts_reused).toBe(2);
    expect(parsed.artifacts_generated).toBe(1);
    expect(parsed.bundle_size_bytes).toBe(4096);
    expect(parsed.assembly_time_ms).toBe(45);
  });

  it('does not include trailing newline', () => {
    const result = formatAssemblyLog(sampleInput);
    expect(result.endsWith('\n')).toBe(false);
  });
});
