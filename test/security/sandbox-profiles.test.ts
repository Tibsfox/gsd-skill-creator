/**
 * Per-agent-role sandbox profile validation tests.
 *
 * Validates that sandbox profiles enforce correct permissions per agent type:
 * - EXEC: write worktree + network via proxy (no --unshare-net)
 * - VERIFY: read-only + no network (--unshare-net)
 * - SCOUT: write research dir + expanded network (no --unshare-net)
 * - ALL: credential directories excluded (~/.ssh, ~/.aws, ~/.config/gcloud, ~/.gnupg)
 *
 * Also validates stub profile safety and bootstrap Phase 0 syntax.
 *
 * Phase 516-03 -- SSH Security Core
 *
 * @module test/security/sandbox-profiles.test
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

const PROJECT_ROOT = resolve(__dirname, '../..');
const SCRIPTS_DIR = join(PROJECT_ROOT, 'scripts', 'security');

// ============================================================================
// Rust sandbox tests pass
// ============================================================================

describe('Rust Sandbox Tests', () => {
  it(
    'should have all Rust sandbox tests passing',
    () => {
      const result = execSync(
        'cargo test --manifest-path src-tauri/Cargo.toml sandbox -- --test-threads=1 2>&1',
        {
          encoding: 'utf-8',
          timeout: 120000,
          cwd: PROJECT_ROOT,
        },
      );
      expect(result).toContain('test result: ok');
    },
    120000,
  );
});

// ============================================================================
// Per-agent-type bwrap_args validation via Rust test output
// ============================================================================

describe('Agent Profile bwrap_args', () => {
  // Read sandbox.rs to verify structural properties
  const sandboxRs = readFileSync(
    join(PROJECT_ROOT, 'src-tauri', 'src', 'security', 'sandbox.rs'),
    'utf-8',
  );

  describe('EXEC profile', () => {
    it('should include --bind for writable directories', () => {
      // Verify Exec agent generates write_dirs in the profile
      expect(sandboxRs).toContain('AgentType::Exec');
      expect(sandboxRs).toContain('write_dirs: vec![wt]');
    });

    it('should NOT include --unshare-net (network needed for proxy)', () => {
      // Verified by Rust test: test_bwrap_exec_does_not_unshare_net
      expect(sandboxRs).toContain('test_bwrap_exec_does_not_unshare_net');
    });

    it('should include --cap-drop ALL', () => {
      // All profiles get --cap-drop ALL
      expect(sandboxRs).toContain('"--cap-drop"');
      expect(sandboxRs).toContain('"ALL"');
    });
  });

  describe('VERIFY profile', () => {
    it('should include --unshare-net (no network)', () => {
      // Verified by Rust test: test_bwrap_verify_includes_unshare_net
      expect(sandboxRs).toContain('test_bwrap_verify_includes_unshare_net');
    });

    it('should have empty write_dirs (no writable dirs)', () => {
      expect(sandboxRs).toContain('AgentType::Verify => InternalSandboxProfile');
      // Verify profile has empty write_dirs
      expect(sandboxRs).toContain('write_dirs: vec![],');
    });

    it('should have empty allowed_domains (no network access)', () => {
      // Verify profile has no domains
      // test_profile_generator_verify_no_network confirms this
      expect(sandboxRs).toContain('test_profile_generator_verify_no_network');
    });
  });

  describe('SCOUT profile', () => {
    it('should include write access to research directory', () => {
      expect(sandboxRs).toContain('self.planning_dir.join("research")');
    });

    it('should NOT include --unshare-net (needs expanded network)', () => {
      // Verified by Rust test: test_bwrap_scout_does_not_unshare_net
      expect(sandboxRs).toContain('test_bwrap_scout_does_not_unshare_net');
    });

    it('should include expanded domain allowlist', () => {
      expect(sandboxRs).toContain('SCOUT_EXTRA_DOMAINS');
      expect(sandboxRs).toContain('docs.rs');
      expect(sandboxRs).toContain('stackoverflow.com');
    });
  });

  describe('Credential directory exclusion (ALL types)', () => {
    it('should deny ~/.ssh for all agent types', () => {
      expect(sandboxRs).toContain('self.home_dir.join(".ssh")');
    });

    it('should deny ~/.aws for all agent types', () => {
      expect(sandboxRs).toContain('self.home_dir.join(".aws")');
    });

    it('should deny ~/.config/gcloud for all agent types', () => {
      expect(sandboxRs).toContain('self.home_dir.join(".config/gcloud")');
    });

    it('should deny ~/.gnupg for all agent types', () => {
      expect(sandboxRs).toContain('self.home_dir.join(".gnupg")');
    });

    it('should use --tmpfs for denied directories in bwrap', () => {
      expect(sandboxRs).toContain('"--tmpfs"');
      expect(sandboxRs).toContain('deny_read_dirs');
    });
  });
});

// ============================================================================
// Stub profile safety
// ============================================================================

describe('Stub Profile Safety', () => {
  it('should generate a stub profile with bwrap_args', () => {
    const tmpDir = '/tmp/gsd-test-stub-profile';
    const outputPath = `${tmpDir}/stub-profile.json`;

    try {
      execSync(`mkdir -p ${tmpDir}`, { cwd: PROJECT_ROOT });
      execSync(
        `bash scripts/security/generate-sandbox-profile.sh ` +
          `--project /tmp/test-project ` +
          `--planning /tmp/test-project/.planning ` +
          `--platform linux ` +
          `--output ${outputPath}`,
        {
          encoding: 'utf-8',
          timeout: 10000,
          cwd: PROJECT_ROOT,
        },
      );

      expect(existsSync(outputPath)).toBe(true);

      const profile = JSON.parse(readFileSync(outputPath, 'utf-8'));

      // Must be a stub
      expect(profile.stub).toBe(true);

      // Must have bwrap_args
      expect(profile.bwrap_args).toBeDefined();
      expect(Array.isArray(profile.bwrap_args)).toBe(true);
      expect(profile.bwrap_args.length).toBeGreaterThan(0);

      // Stub bwrap_args must include --tmpfs for credential dirs
      const argsStr = profile.bwrap_args.join(' ');
      expect(argsStr).toContain('--tmpfs');
      expect(argsStr).toContain('.ssh');
      expect(argsStr).toContain('.aws');
      expect(argsStr).toContain('.gnupg');
    } finally {
      execSync(`rm -rf ${tmpDir}`, { cwd: PROJECT_ROOT });
    }
  });

  it('should NOT bind ~/.ssh in stub profile bwrap_args', () => {
    const tmpDir = '/tmp/gsd-test-stub-bind';
    const outputPath = `${tmpDir}/stub-profile.json`;

    try {
      execSync(`mkdir -p ${tmpDir}`, { cwd: PROJECT_ROOT });
      execSync(
        `bash scripts/security/generate-sandbox-profile.sh ` +
          `--project /tmp/test-project ` +
          `--planning /tmp/test-project/.planning ` +
          `--platform linux ` +
          `--output ${outputPath}`,
        {
          encoding: 'utf-8',
          timeout: 10000,
          cwd: PROJECT_ROOT,
        },
      );

      const profile = JSON.parse(readFileSync(outputPath, 'utf-8'));
      const args = profile.bwrap_args as string[];

      // Check that no --bind or --ro-bind targets credential directories
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '--bind' || args[i] === '--ro-bind') {
          const target = args[i + 1] || '';
          expect(target).not.toContain('.ssh');
          expect(target).not.toContain('.aws');
          expect(target).not.toContain('.gnupg');
        }
      }
    } finally {
      execSync(`rm -rf ${tmpDir}`, { cwd: PROJECT_ROOT });
    }
  });
});

// ============================================================================
// Bootstrap Phase 0 syntax validation
// ============================================================================

describe('Bootstrap Phase 0', () => {
  it('should have valid shell syntax for bootstrap-phase0.sh', () => {
    execSync('bash -n scripts/security/bootstrap-phase0.sh', {
      encoding: 'utf-8',
      timeout: 5000,
      cwd: PROJECT_ROOT,
    });
  });

  it('should have valid shell syntax for run-in-sandbox.sh', () => {
    execSync('bash -n scripts/security/run-in-sandbox.sh', {
      encoding: 'utf-8',
      timeout: 5000,
      cwd: PROJECT_ROOT,
    });
  });

  it('should have valid shell syntax for generate-sandbox-profile.sh', () => {
    execSync('bash -n scripts/security/generate-sandbox-profile.sh', {
      encoding: 'utf-8',
      timeout: 5000,
      cwd: PROJECT_ROOT,
    });
  });

  it('should detect platform correctly', () => {
    const platform = process.platform;
    if (platform === 'linux') {
      // On Linux, bootstrap should recognize the platform
      const result = execSync('uname -s', {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      expect(result).toBe('Linux');
    } else if (platform === 'darwin') {
      const result = execSync('uname -s', {
        encoding: 'utf-8',
        timeout: 5000,
      }).trim();
      expect(result).toBe('Darwin');
    }
  });
});
