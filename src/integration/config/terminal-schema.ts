/**
 * Stub schema for TDD RED phase.
 *
 * This intentionally incomplete schema exists so the test file can import
 * without TypeScript errors, but all tests will FAIL against it.
 *
 * @module integration/config/terminal-schema
 */

import { z } from 'zod';

export const TerminalConfigSchema = z.object({});
export const DEFAULT_TERMINAL_CONFIG = {};
