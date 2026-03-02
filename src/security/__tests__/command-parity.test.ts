/**
 * SECURITY_COMMANDS Tauri Parity Verification.
 *
 * Confirms every TypeScript SECURITY_COMMANDS entry has a matching
 * Rust #[tauri::command] implementation in security.rs and is registered
 * in the invoke_handler in lib.rs.
 *
 * Phase 517-02 — verify-sandbox.sh wrapper + command parity (SSH-07, SSH-08)
 *
 * @module security/__tests__/command-parity.test
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { SECURITY_COMMANDS } from '../index.js';

// ============================================================================
// SECURITY_COMMANDS Tauri Parity
// ============================================================================

describe('SECURITY_COMMANDS Tauri Parity', () => {
  let libRsContent: string;
  let securityRsContent: string;

  beforeAll(() => {
    const libRsPath = resolve(process.cwd(), 'src-tauri/src/lib.rs');
    const securityRsPath = resolve(process.cwd(), 'src-tauri/src/commands/security.rs');

    libRsContent = readFileSync(libRsPath, 'utf-8');
    securityRsContent = readFileSync(securityRsPath, 'utf-8');
  });

  it('SECURITY_COMMANDS has expected count of 7 entries', () => {
    expect(Object.keys(SECURITY_COMMANDS).length).toBe(7);
  });

  // Dynamic tests for each command value — registered in lib.rs
  for (const [key, commandName] of Object.entries(SECURITY_COMMANDS)) {
    it(`${commandName} is registered in lib.rs invoke_handler`, () => {
      expect(libRsContent).toContain(commandName);
    });
  }

  // Dynamic tests for each command value — has #[tauri::command] fn in security.rs
  for (const [key, commandName] of Object.entries(SECURITY_COMMANDS)) {
    it(`${commandName} has pub async fn in security.rs`, () => {
      expect(securityRsContent).toContain(`pub async fn ${commandName}`);
    });
  }

  it('cargo check passes for security commands', { timeout: 120000 }, () => {
    const cargoToml = resolve(process.cwd(), 'src-tauri/Cargo.toml');
    if (!existsSync(cargoToml)) {
      // Skip if no Cargo.toml (CI without Rust)
      return;
    }

    // Check if Rust toolchain is available
    try {
      execSync('rustc --version', { encoding: 'utf-8', timeout: 10000 });
    } catch {
      // No Rust toolchain — skip silently
      return;
    }

    // Run cargo check
    const result = execSync(
      `cargo check --manifest-path ${cargoToml} 2>&1`,
      { encoding: 'utf-8', timeout: 120000 },
    );
    // If we get here, cargo check succeeded
    expect(result).toBeDefined();
  });
});

// ============================================================================
// verify-sandbox.sh wrapper
// ============================================================================

describe('verify-sandbox.sh wrapper', () => {
  it('wrapper script exists at scripts/verify-sandbox.sh', () => {
    const wrapperPath = resolve(process.cwd(), 'scripts/verify-sandbox.sh');
    expect(existsSync(wrapperPath)).toBe(true);
  });

  it('wrapper delegates to security/verify-sandbox.sh', () => {
    const wrapperPath = resolve(process.cwd(), 'scripts/verify-sandbox.sh');
    const content = readFileSync(wrapperPath, 'utf-8');
    expect(content).toContain('security/verify-sandbox.sh');
  });

  it('actual verification script exists at scripts/security/verify-sandbox.sh', () => {
    const actualPath = resolve(process.cwd(), 'scripts/security/verify-sandbox.sh');
    expect(existsSync(actualPath)).toBe(true);
  });
});
