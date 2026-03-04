import { describe, it, expect } from 'vitest';
import { SandboxManager } from './sandbox-manager.js';
import type { IsolationPolicy } from './mission-isolation.js';

describe('SandboxManager', () => {
  describe('policyForTrust', () => {
    it('quarantine allows only bundle read, output write', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(policy.readPaths).toContain('/cartridges/test');
      expect(policy.writePaths).toHaveLength(1);
      expect(policy.maxFileSize).toBe(1024 * 1024); // 1MB
      expect(policy.maxTotalSize).toBe(10 * 1024 * 1024); // 10MB
    });

    it('provisional allows bundle + data read', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('provisional', '/cartridges/test');
      expect(policy.readPaths).toContain('/cartridges/test');
      expect(policy.readPaths.some(p => p.includes('data'))).toBe(true);
    });

    it('trusted has no path restrictions', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('trusted', '/cartridges/test');
      expect(policy.readPaths).toContain('/');
      expect(policy.writePaths).toContain('/');
    });

    it('suspended blocks everything', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('suspended', '/cartridges/test');
      expect(policy.readPaths).toHaveLength(0);
      expect(policy.writePaths).toHaveLength(0);
    });

    it('always blocks sensitive paths', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(policy.blockedPaths.some(p => p.includes('.ssh'))).toBe(true);
      expect(policy.blockedPaths.some(p => p.includes('.env'))).toBe(true);
    });
  });

  describe('canRead', () => {
    it('allows reading within permitted paths', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(mgr.canRead(policy, '/cartridges/test/manifest.json')).toBe(true);
    });

    it('denies reading outside permitted paths', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(mgr.canRead(policy, '/etc/passwd')).toBe(false);
    });

    it('denies reading blocked paths even within allowed', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('trusted', '/cartridges/test');
      expect(mgr.canRead(policy, '/home/user/.ssh/id_rsa')).toBe(false);
    });

    it('blocks path traversal via ../', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(mgr.canRead(policy, '/cartridges/test/../../etc/passwd')).toBe(false);
    });
  });

  describe('canWrite', () => {
    it('allows writing within output path under size limit', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(mgr.canWrite(policy, policy.writePaths[0] + '/output.json', 1024)).toBe(true);
    });

    it('denies writing over file size limit', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('quarantine', '/cartridges/test');
      expect(mgr.canWrite(policy, policy.writePaths[0] + '/big.bin', 2 * 1024 * 1024)).toBe(false);
    });

    it('denies writing to blocked paths', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('trusted', '/cartridges/test');
      expect(mgr.canWrite(policy, '/home/user/.ssh/authorized_keys', 100)).toBe(false);
    });

    it('suspended cannot write anything', () => {
      const mgr = new SandboxManager();
      const policy = mgr.policyForTrust('suspended', '/cartridges/test');
      expect(mgr.canWrite(policy, '/tmp/output', 10)).toBe(false);
    });
  });

  describe('promoteTrust', () => {
    it('promotes quarantine to provisional after clean execution', () => {
      const mgr = new SandboxManager();
      expect(mgr.promoteTrust('quarantine', 1, [])).toBe('provisional');
    });

    it('promotes provisional to trusted after 3 clean executions', () => {
      const mgr = new SandboxManager();
      expect(mgr.promoteTrust('provisional', 3, [])).toBe('trusted');
    });

    it('does not promote provisional with fewer than 3 executions', () => {
      const mgr = new SandboxManager();
      expect(mgr.promoteTrust('provisional', 2, [])).toBe('provisional');
    });

    it('suspends on violation', () => {
      const mgr = new SandboxManager();
      const violations = [{ type: 'read-denied' as const, path: '/etc/shadow', timestamp: '2026-03-04T00:00:00Z' }];
      expect(mgr.promoteTrust('trusted', 10, violations)).toBe('suspended');
    });

    it('suspended stays suspended (manual reset only)', () => {
      const mgr = new SandboxManager();
      expect(mgr.promoteTrust('suspended', 0, [])).toBe('suspended');
    });
  });
});
