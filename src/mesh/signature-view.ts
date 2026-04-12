/**
 * SignatureView — ed25519-backed SignatureRecord wrapping for Grove records.
 *
 * Implements Grove spec §4.3 + §10.2. Signatures are **additive** — they
 * are separate records that reference the signed record by hash. Unsigned
 * records remain valid forever; signing layers on top. A record can have
 * zero, one, or many signature records, from any number of signers.
 *
 * Trust is a graph query over signature records, NOT a property stored
 * inside the signed record itself. This module provides the storage and
 * verification primitives; policy (whose signatures you accept) is a
 * separate concern.
 *
 * # Key material
 *
 * ed25519 via `node:crypto`. Keys are passed as raw 32-byte `Uint8Array`
 * and converted to PEM/DER internally. This keeps the public API free
 * of Node.js crypto object types so callers in other runtimes can adapt.
 *
 * # What this module does
 *
 *   - `generateSigningKey()` — fresh ed25519 keypair
 *   - `buildSignatureRecord(signedHash, publicKey, privateKey)` — produce a
 *     SignatureRecord over an existing record's identity hash
 *   - `verifySignatureRecord(signatureRecord, signedHash)` — verify the
 *     signature matches the claimed public key + signed hash
 *   - `SignatureView` class — store/query helpers on top of a ContentAddressedStore
 *
 * # What this module does NOT do
 *
 *   - Key management / revocation
 *   - Trust policies (whose keys to accept)
 *   - Retroactive re-signing (just write another SignatureRecord)
 *   - Non-ed25519 algorithms (document the extension point)
 *
 * @module mesh/signature-view
 */

import { createPublicKey, createPrivateKey, generateKeyPairSync, sign, verify } from 'node:crypto';
import type { GroveStore } from '../memory/grove-store.js';
import {
  type CanonicalValue,
  type GroveRecord,
  type HashRef,
  SIGNATURE_TYPE_HASH,
  buildRecord,
  decode,
  decodeRecord,
  encode,
  encodeRecord,
  hashRecord,
  hashRefEquals,
  v,
} from '../memory/grove-format.js';

// ─── Public types ───────────────────────────────────────────────────────────

/**
 * Supported signature algorithms. Only ed25519 in v1; extensions can
 * add new algorithms by updating this union and `algorithmToNodeId`.
 */
export type SignatureAlgorithm = 'ed25519';

/** A raw ed25519 keypair. Public key: 32 bytes. Private key: 32 bytes (seed). */
export interface KeyPair {
  algorithm: SignatureAlgorithm;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** The decoded payload of a SignatureRecord. */
export interface SignaturePayload {
  signedHash: HashRef;
  algorithm: SignatureAlgorithm;
  publicKey: Uint8Array;
  signature: Uint8Array;
}

/** Options for building a signature record. */
export interface SignOptions {
  author?: string | null;
  sessionId?: string | null;
  toolVersion?: string;
  createdAtMs?: number;
}

// ─── Key generation ─────────────────────────────────────────────────────────

/**
 * Generate a fresh ed25519 keypair. Returns raw 32-byte public and
 * 32-byte private seed (the standard "raw" ed25519 representation).
 */
export function generateSigningKey(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  // Export raw bytes. Node exposes DER/PEM; we extract the 32-byte seed
  // from the DER structure via the jwk or pkcs8 export.
  const pubJwk = publicKey.export({ format: 'jwk' });
  const privJwk = privateKey.export({ format: 'jwk' });
  if (pubJwk.kty !== 'OKP' || privJwk.kty !== 'OKP') {
    throw new Error('signature-view: unexpected key type from node:crypto');
  }
  // JWK ed25519 base64url encodes the raw bytes.
  const pub = base64UrlToBytes(pubJwk.x as string);
  const priv = base64UrlToBytes(privJwk.d as string);
  return { algorithm: 'ed25519', publicKey: pub, privateKey: priv };
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice(0, (4 - (b64url.length % 4)) % 4);
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

/**
 * Convert raw ed25519 key bytes into node:crypto KeyObjects so the
 * sign/verify functions can use them. ed25519 JWK format is the
 * standard portable representation.
 */
function publicKeyObject(pubBytes: Uint8Array): ReturnType<typeof createPublicKey> {
  return createPublicKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: bytesToBase64Url(pubBytes),
    },
    format: 'jwk',
  });
}

function privateKeyObject(privBytes: Uint8Array, pubBytes: Uint8Array): ReturnType<typeof createPrivateKey> {
  return createPrivateKey({
    key: {
      kty: 'OKP',
      crv: 'Ed25519',
      x: bytesToBase64Url(pubBytes),
      d: bytesToBase64Url(privBytes),
    },
    format: 'jwk',
  });
}

// ─── Signing ────────────────────────────────────────────────────────────────

/**
 * Sign a record hash with the given keypair, producing a
 * SignatureRecord that references the signed record. The signature is
 * computed over the raw hash bytes (NOT the canonical encoding of the
 * HashRef) so verification is algorithm-agnostic.
 */
export function buildSignatureRecord(
  signedHash: HashRef,
  keyPair: KeyPair,
  opts: SignOptions = {},
): GroveRecord {
  if (keyPair.algorithm !== 'ed25519') {
    throw new Error(`signature-view: unsupported algorithm ${keyPair.algorithm}`);
  }
  const privKey = privateKeyObject(keyPair.privateKey, keyPair.publicKey);
  const signatureBytes = new Uint8Array(sign(null, Buffer.from(signedHash.hash), privKey));

  const payload = encode({
    signed_hash: v.hashref(signedHash.algoId, signedHash.hash),
    algorithm: v.string(keyPair.algorithm),
    public_key: v.bytes(keyPair.publicKey),
    signature: v.bytes(signatureBytes),
  });

  return buildRecord(SIGNATURE_TYPE_HASH, payload, {
    createdAtMs: opts.createdAtMs ?? Date.now(),
    author: opts.author ?? null,
    sessionId: opts.sessionId ?? null,
    toolVersion: opts.toolVersion ?? 'grove-signature/1.0',
    parentHashes: [],
    dependencies: [signedHash],
  });
}

// ─── Verification ───────────────────────────────────────────────────────────

/**
 * Decode a SignatureRecord's payload into its structured fields. Throws
 * if the record's type hash isn't `SIGNATURE_TYPE_HASH`.
 */
export function parseSignatureRecord(record: GroveRecord): SignaturePayload {
  if (!hashRefEquals(record.typeHash, SIGNATURE_TYPE_HASH)) {
    throw new Error('signature-view: record is not a SignatureRecord');
  }
  const { value } = decode(record.payload);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('signature-view: signature payload is not a map');
  }
  const map = value as Record<string, CanonicalValue>;
  const signedHash = unwrapHashRef(map.signed_hash, 'signed_hash');
  const algorithm = unwrapString(map.algorithm, 'algorithm') as SignatureAlgorithm;
  const publicKey = unwrapBytes(map.public_key, 'public_key');
  const signature = unwrapBytes(map.signature, 'signature');
  return { signedHash, algorithm, publicKey, signature };
}

/**
 * Verify a SignatureRecord's cryptographic validity. Returns true iff
 * the signature bytes match the claimed public key and signed hash.
 * Does NOT make any trust decision — that's a caller policy.
 */
export function verifySignatureRecord(record: GroveRecord): boolean {
  let payload: SignaturePayload;
  try {
    payload = parseSignatureRecord(record);
  } catch {
    return false;
  }
  if (payload.algorithm !== 'ed25519') {
    // Unknown algorithm: refuse to verify rather than asserting true.
    return false;
  }
  try {
    const pubKey = publicKeyObject(payload.publicKey);
    return verify(null, Buffer.from(payload.signedHash.hash), pubKey, Buffer.from(payload.signature));
  } catch {
    return false;
  }
}

function unwrapHashRef(v: CanonicalValue | undefined, ctx: string): HashRef {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'hashref') {
    return v.value;
  }
  throw new Error(`signature-view: expected hashref at ${ctx}`);
}
function unwrapString(v: CanonicalValue | undefined, ctx: string): string {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'string') {
    return v.value;
  }
  throw new Error(`signature-view: expected string at ${ctx}`);
}
function unwrapBytes(v: CanonicalValue | undefined, ctx: string): Uint8Array {
  if (v && typeof v === 'object' && !Array.isArray(v) && 'kind' in v && v.kind === 'bytes') {
    return v.value;
  }
  throw new Error(`signature-view: expected bytes at ${ctx}`);
}

// ─── SignatureView (storage facade) ─────────────────────────────────────────

export interface SignatureViewOptions {
  cas: GroveStore;
}

/**
 * High-level helper for storing and querying signatures in a
 * ContentAddressedStore. Each signature is stored as its own Grove
 * record, dereferenced by hash.
 */
export class SignatureView {
  private readonly cas: GroveStore;

  constructor(options: SignatureViewOptions) {
    this.cas = options.cas;
  }

  /**
   * Sign a record hash and store the resulting SignatureRecord. Returns
   * the signature record's identity hash.
   */
  async sign(signedHash: HashRef, keyPair: KeyPair, opts: SignOptions = {}): Promise<HashRef> {
    const record = buildSignatureRecord(signedHash, keyPair, opts);
    const hash = hashRecord(record);
    const bytes = encodeRecord(record);
    await this.cas.put(hash.hash, bytes);
    return hash;
  }

  /**
   * Fetch and parse a SignatureRecord by its identity hash.
   */
  async get(signatureHash: HashRef): Promise<SignaturePayload | null> {
    const bytes = await this.cas.getByHash(signatureHash.hash);
    if (!bytes) return null;
    const record = decodeRecord(bytes);
    if (!hashRefEquals(record.typeHash, SIGNATURE_TYPE_HASH)) {
      return null;
    }
    return parseSignatureRecord(record);
  }

  /**
   * Find every signature record in the store that signs a given record
   * hash. Walks every chunk, decodes signatures, and collects matches.
   * O(N) in total store size, which is fine for per-skill trust
   * queries but should be cached if called repeatedly in hot paths.
   */
  async findSignaturesOf(signedHash: HashRef): Promise<
    Array<{ hash: HashRef; payload: SignaturePayload; valid: boolean }>
  > {
    const hits: Array<{ hash: HashRef; payload: SignaturePayload; valid: boolean }> = [];
    const hashes = await this.cas.listHashes();
    for (const hex of hashes) {
      const bytes = await this.cas.getByHash(hex);
      if (!bytes) continue;
      let record: GroveRecord;
      try {
        record = decodeRecord(bytes);
      } catch {
        continue;
      }
      if (!hashRefEquals(record.typeHash, SIGNATURE_TYPE_HASH)) continue;
      let payload: SignaturePayload;
      try {
        payload = parseSignatureRecord(record);
      } catch {
        continue;
      }
      if (!hashRefEquals(payload.signedHash, signedHash)) continue;
      const valid = verifySignatureRecord(record);
      hits.push({
        hash: {
          algoId: 1,
          hash: hexToBytes(hex),
        },
        payload,
        valid,
      });
    }
    return hits;
  }

  /**
   * Check whether a given public key has signed a given record.
   * Returns true if there's at least one valid signature by that key
   * over that record hash.
   */
  async isSignedBy(signedHash: HashRef, publicKey: Uint8Array): Promise<boolean> {
    const sigs = await this.findSignaturesOf(signedHash);
    for (const sig of sigs) {
      if (!sig.valid) continue;
      if (equalBytes(sig.payload.publicKey, publicKey)) return true;
    }
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
