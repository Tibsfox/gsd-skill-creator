/**
 * Unit tests for GatewayConfigSchema port-boundary validation.
 *
 * These pin the schema contract that `startGateway` relies on. The
 * load-bearing assertion is that `port: 0` is ACCEPTED -- it is the
 * OS-assigned-ephemeral sentinel that the integration tests use to avoid
 * fixed-port collisions under vitest file-parallelism. Reverting the schema
 * bound from `min(0)` back to `min(1)` reds the `accepts port 0` case.
 */

import { describe, it, expect } from 'vitest';
import { GatewayConfigSchema, DEFAULT_GATEWAY_PORT } from './types.js';

describe('GatewayConfigSchema port validation', () => {
  it('accepts port 0 (OS-assigned ephemeral)', () => {
    const parsed = GatewayConfigSchema.parse({ port: 0 });
    expect(parsed.port).toBe(0);
  });

  it('rejects negative ports', () => {
    expect(() => GatewayConfigSchema.parse({ port: -1 })).toThrow();
  });

  it('rejects non-integer ports', () => {
    expect(() => GatewayConfigSchema.parse({ port: 8080.5 })).toThrow();
  });

  it('accepts the maximum valid port (65535)', () => {
    expect(GatewayConfigSchema.parse({ port: 65535 }).port).toBe(65535);
  });

  it('rejects ports above 65535', () => {
    expect(() => GatewayConfigSchema.parse({ port: 65536 })).toThrow();
  });

  it('applies the default port when omitted', () => {
    expect(GatewayConfigSchema.parse({}).port).toBe(DEFAULT_GATEWAY_PORT);
  });
});
