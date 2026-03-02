/**
 * Certificate agent for TLS configuration.
 *
 * Creates undici Agent instances with custom CA bundles, client certificates,
 * and SHA-256 certificate pinning verification.
 */

import { readFileSync } from 'node:fs';
import { Agent } from 'undici';
import type { Dispatcher } from 'undici';
import type { CurlCertConfig } from './types.js';

/**
 * Normalize a SHA-256 fingerprint: strip colons, lowercase.
 */
function normalizePin(pin: string): string {
  return pin.replace(/:/g, '').toLowerCase();
}

/**
 * Create an undici Agent with custom TLS configuration.
 *
 * Supports:
 * - Custom CA bundle from PEM file
 * - Client certificate and key for mutual TLS
 * - SHA-256 certificate pinning
 * - Disabling TLS verification (--insecure)
 */
export function createCertAgent(config: CurlCertConfig): Dispatcher {
  const connectOptions: Record<string, unknown> = {};

  if (config.caBundle) {
    connectOptions.ca = readFileSync(config.caBundle, 'utf-8');
  }

  if (config.clientCert) {
    connectOptions.cert = readFileSync(config.clientCert, 'utf-8');
  }

  if (config.clientKey) {
    connectOptions.key = readFileSync(config.clientKey, 'utf-8');
  }

  if (config.rejectUnauthorized === false) {
    connectOptions.rejectUnauthorized = false;
  }

  if (config.pinSha256) {
    const expectedPin = normalizePin(config.pinSha256);
    connectOptions.checkServerIdentity = (_hostname: string, cert: { fingerprint256?: string }) => {
      if (!cert.fingerprint256) {
        return new Error('Certificate pinning failed: no fingerprint available');
      }
      const actualPin = normalizePin(cert.fingerprint256);
      if (actualPin !== expectedPin) {
        return new Error(
          `Certificate pinning failed: expected ${expectedPin}, got ${actualPin}`,
        );
      }
      return undefined;
    };
  }

  return new Agent({
    connect: connectOptions,
  } as ConstructorParameters<typeof Agent>[0]);
}
