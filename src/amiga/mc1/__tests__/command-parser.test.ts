/**
 * Tests for MC-1 command parser.
 *
 * Covers:
 * - Basic parsing of all 8 commands (LAUNCH through DEBRIEF)
 * - Case-insensitive input handling
 * - Mission ID argument parsing and validation
 * - Target agent argument (--target)
 * - Parameters (--reason, --brief)
 * - ICD-01 CommandDispatchPayload schema validation on output
 * - Ambiguous input with helpful suggestions
 * - Unknown command listing all valid options
 * - Empty/whitespace input rejection
 * - Invalid mission ID format rejection
 * - SUPPORTED_COMMANDS constant
 */

import { describe, it, expect } from 'vitest';
import {
  parseCommand,
  SUPPORTED_COMMANDS,
} from '../command-parser.js';
import type { ParseResult, ParseError } from '../command-parser.js';
import { CommandDispatchPayloadSchema } from '../../icd/icd-01.js';

// ============================================================================
// Basic command parsing (all 8 commands)
// ============================================================================

describe('parseCommand', () => {
  describe('basic command parsing', () => {
    it.each([
      'LAUNCH', 'STATUS', 'REDIRECT', 'REVIEW',
      'HOLD', 'RESUME', 'ABORT', 'DEBRIEF',
    ])('parses %s correctly', (cmd) => {
      const result = parseCommand(cmd);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe(cmd);
      }
    });
  });

  // ============================================================================
  // Case insensitivity
  // ============================================================================

  describe('case insensitivity', () => {
    it('parses lowercase launch', () => {
      const result = parseCommand('launch');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe('LAUNCH');
      }
    });

    it('parses mixed case Hold', () => {
      const result = parseCommand('Hold');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe('HOLD');
      }
    });

    it('parses mixed case aBorT', () => {
      const result = parseCommand('aBorT');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe('ABORT');
      }
    });
  });

  // ============================================================================
  // With mission_id argument
  // ============================================================================

  describe('with mission_id argument', () => {
    it('parses STATUS with mission_id', () => {
      const result = parseCommand('STATUS mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.mission_id).toBe('mission-2026-02-18-001');
      }
    });

    it('parses HOLD with mission_id', () => {
      const result = parseCommand('HOLD mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.mission_id).toBe('mission-2026-02-18-001');
      }
    });

    it('parses LAUNCH with optional mission_id', () => {
      const result = parseCommand('LAUNCH mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.mission_id).toBe('mission-2026-02-18-001');
      }
    });
  });

  // ============================================================================
  // With target agent argument
  // ============================================================================

  describe('with target agent argument', () => {
    it('parses STATUS --target ME-1', () => {
      const result = parseCommand('STATUS --target ME-1');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.target_agent).toBe('ME-1');
      }
    });

    it('parses REDIRECT --target ME-2 with mission_id', () => {
      const result = parseCommand('REDIRECT --target ME-2 mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.target_agent).toBe('ME-2');
        expect(result.command.mission_id).toBe('mission-2026-02-18-001');
      }
    });

    it('defaults target_agent to broadcast when not specified', () => {
      const result = parseCommand('STATUS');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.target_agent).toBe('broadcast');
      }
    });
  });

  // ============================================================================
  // With parameters
  // ============================================================================

  describe('with parameters', () => {
    it('parses --reason parameter', () => {
      const result = parseCommand('REDIRECT --reason "scope change" mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.parameters).toBeDefined();
        expect(result.command.parameters!.reason).toBe('scope change');
      }
    });

    it('parses --brief parameter', () => {
      const result = parseCommand('LAUNCH --brief "Build the dashboard"');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.parameters).toBeDefined();
        expect(result.command.parameters!.brief).toBe('Build the dashboard');
      }
    });
  });

  // ============================================================================
  // ICD-01 schema validation
  // ============================================================================

  describe('ICD-01 schema validation', () => {
    it.each([
      'LAUNCH',
      'STATUS mission-2026-02-18-001',
      'REDIRECT --target ME-2 mission-2026-02-18-001',
      'HOLD mission-2026-02-18-001',
      'RESUME mission-2026-02-18-001',
      'ABORT mission-2026-02-18-001',
      'DEBRIEF mission-2026-02-18-001',
      'REVIEW mission-2026-02-18-001',
    ])('output of "%s" passes CommandDispatchPayloadSchema', (input) => {
      const result = parseCommand(input);
      expect(result.ok).toBe(true);
      if (result.ok) {
        const validation = CommandDispatchPayloadSchema.safeParse(result.command);
        expect(validation.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // Error handling -- ambiguous input
  // ============================================================================

  describe('ambiguous input', () => {
    it('rejects STA with suggestion for STATUS', () => {
      const result = parseCommand('STA');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('STATUS');
      }
    });

    it('rejects RE with multiple suggestions', () => {
      const result = parseCommand('RE');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('REDIRECT');
        expect(result.error.message).toContain('REVIEW');
        expect(result.error.message).toContain('RESUME');
      }
    });

    it('error messages are plain language', () => {
      const result = parseCommand('STA');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        // Should not contain technical jargon like "regex" or "parse error"
        expect(result.error.message).not.toMatch(/regex|parse error|token/i);
      }
    });
  });

  // ============================================================================
  // Error handling -- unknown input
  // ============================================================================

  describe('unknown input', () => {
    it('rejects EXPLODE with list of valid commands', () => {
      const result = parseCommand('EXPLODE');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('LAUNCH');
        expect(result.error.message).toContain('DEBRIEF');
      }
    });

    it('rejects empty string', () => {
      const result = parseCommand('');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/no command|empty/i);
      }
    });

    it('rejects whitespace-only string', () => {
      const result = parseCommand('   ');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/no command|empty/i);
      }
    });
  });

  // ============================================================================
  // Error handling -- invalid mission_id format
  // ============================================================================

  describe('invalid mission_id format', () => {
    it('rejects bad-mission-id format', () => {
      const result = parseCommand('STATUS bad-mission-id');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toMatch(/mission/i);
      }
    });
  });

  // ============================================================================
  // SUPPORTED_COMMANDS constant
  // ============================================================================

  describe('SUPPORTED_COMMANDS', () => {
    it('exports an array of all 8 command strings', () => {
      expect(SUPPORTED_COMMANDS).toHaveLength(8);
    });

    it('includes all expected commands', () => {
      expect(SUPPORTED_COMMANDS).toContain('LAUNCH');
      expect(SUPPORTED_COMMANDS).toContain('STATUS');
      expect(SUPPORTED_COMMANDS).toContain('REDIRECT');
      expect(SUPPORTED_COMMANDS).toContain('REVIEW');
      expect(SUPPORTED_COMMANDS).toContain('HOLD');
      expect(SUPPORTED_COMMANDS).toContain('RESUME');
      expect(SUPPORTED_COMMANDS).toContain('ABORT');
      expect(SUPPORTED_COMMANDS).toContain('DEBRIEF');
    });
  });
});
