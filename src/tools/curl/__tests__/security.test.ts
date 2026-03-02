import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dns before importing security module
vi.mock('node:dns', () => ({
  promises: {
    lookup: vi.fn(),
  },
}));

import { validateUrl, isPrivateIp, DEFAULT_SECURITY_POLICY } from '../security.js';
import { promises as dns } from 'node:dns';

const mockLookup = vi.mocked(dns.lookup);

beforeEach(() => {
  mockLookup.mockReset();
});

describe('URL security validation (CURL-04)', () => {
  describe('scheme blocking', () => {
    it('blocks file:// scheme', async () => {
      const result = await validateUrl('file:///etc/passwd');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked scheme');
    });

    it('blocks ftp:// scheme', async () => {
      const result = await validateUrl('ftp://ftp.example.com/file');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked scheme');
    });

    it('blocks data: scheme', async () => {
      const result = await validateUrl('data:text/html,<script>alert(1)</script>');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked scheme');
    });

    it('blocks gopher: scheme', async () => {
      const result = await validateUrl('gopher://evil.com/1');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked scheme');
    });

    it('blocks unknown custom:// scheme', async () => {
      const result = await validateUrl('custom://internal.service/api');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Blocked scheme');
    });
  });

  describe('RFC-1918 private IP ranges', () => {
    it('blocks 10.0.0.1 as RFC-1918 Class A', async () => {
      const result = await validateUrl('http://10.0.0.1/admin');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('RFC-1918');
    });

    it('blocks 172.16.0.1 as RFC-1918 Class B', async () => {
      const result = await validateUrl('http://172.16.0.1/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('RFC-1918');
    });

    it('blocks 172.31.255.255 as RFC-1918 Class B upper bound', async () => {
      const result = await validateUrl('http://172.31.255.255/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('RFC-1918');
    });

    it('does NOT block 172.15.0.1 (below Class B range)', async () => {
      // 172.15.x.x is public -- only 172.16-31.x.x is private
      mockLookup.mockResolvedValue({ address: '172.15.0.1', family: 4 } as never);
      const result = await validateUrl('http://172.15.0.1/');
      expect(result.allowed).toBe(true);
    });

    it('blocks 192.168.1.1 as RFC-1918 Class C', async () => {
      const result = await validateUrl('http://192.168.1.1/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('RFC-1918');
    });
  });

  describe('loopback and localhost', () => {
    it('blocks 127.0.0.1 as loopback', async () => {
      const result = await validateUrl('http://127.0.0.1/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Loopback');
    });

    it('blocks localhost hostname', async () => {
      const result = await validateUrl('http://localhost/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('localhost');
    });

    it('blocks [::1] IPv6 loopback', async () => {
      const result = await validateUrl('http://[::1]/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IPv6 loopback');
    });
  });

  describe('link-local and unspecified', () => {
    it('blocks 169.254.169.254 as link-local/AWS metadata', async () => {
      const result = await validateUrl('http://169.254.169.254/latest/meta-data/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Link-local');
    });

    it('blocks 0.0.0.0 as unspecified', async () => {
      const result = await validateUrl('http://0.0.0.0/');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Unspecified');
    });
  });

  describe('positive cases - allowed URLs', () => {
    it('allows http://example.com with public IP', async () => {
      mockLookup.mockResolvedValue({ address: '93.184.216.34', family: 4 } as never);
      const result = await validateUrl('http://example.com');
      expect(result.allowed).toBe(true);
    });

    it('allows https://api.github.com with public IP', async () => {
      mockLookup.mockResolvedValue({ address: '140.82.121.6', family: 4 } as never);
      const result = await validateUrl('https://api.github.com');
      expect(result.allowed).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('returns allowed: false for invalid URL', async () => {
      const result = await validateUrl('not-a-url');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Invalid URL');
    });

    it('returns allowed: false for empty string', async () => {
      const result = await validateUrl('');
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Invalid URL');
    });
  });

  describe('isPrivateIp utility', () => {
    it('classifies 10.x.x.x as private', () => {
      expect(isPrivateIp('10.0.0.1')).toBe(true);
      expect(isPrivateIp('10.255.255.255')).toBe(true);
    });

    it('classifies 172.16-31.x.x as private', () => {
      expect(isPrivateIp('172.16.0.1')).toBe(true);
      expect(isPrivateIp('172.31.255.255')).toBe(true);
    });

    it('classifies 172.15.x.x as public', () => {
      expect(isPrivateIp('172.15.0.1')).toBe(false);
    });

    it('classifies 172.32.x.x as public', () => {
      expect(isPrivateIp('172.32.0.1')).toBe(false);
    });

    it('classifies 192.168.x.x as private', () => {
      expect(isPrivateIp('192.168.0.1')).toBe(true);
    });

    it('classifies 127.x.x.x as private', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
    });

    it('classifies 169.254.x.x as private', () => {
      expect(isPrivateIp('169.254.169.254')).toBe(true);
    });

    it('classifies 0.0.0.0 as private', () => {
      expect(isPrivateIp('0.0.0.0')).toBe(true);
    });

    it('classifies public IPs as not private', () => {
      expect(isPrivateIp('93.184.216.34')).toBe(false);
      expect(isPrivateIp('140.82.121.6')).toBe(false);
      expect(isPrivateIp('8.8.8.8')).toBe(false);
    });

    it('classifies ::1 as private', () => {
      expect(isPrivateIp('::1')).toBe(true);
    });
  });

  describe('DEFAULT_SECURITY_POLICY', () => {
    it('allows only http and https schemes', () => {
      expect(DEFAULT_SECURITY_POLICY.allowedSchemes.has('http:')).toBe(true);
      expect(DEFAULT_SECURITY_POLICY.allowedSchemes.has('https:')).toBe(true);
      expect(DEFAULT_SECURITY_POLICY.allowedSchemes.size).toBe(2);
    });

    it('blocks localhost and link-local by default', () => {
      expect(DEFAULT_SECURITY_POLICY.blockLocalhost).toBe(true);
      expect(DEFAULT_SECURITY_POLICY.blockLinkLocal).toBe(true);
    });

    it('resolves hostnames by default', () => {
      expect(DEFAULT_SECURITY_POLICY.resolveHostnames).toBe(true);
    });
  });
});
