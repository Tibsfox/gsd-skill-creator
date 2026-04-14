/**
 * Tests for the peer trust model — Honcho-style bidirectional trust.
 */

import { describe, it, expect } from 'vitest';
import { PeerTrustRegistry, PEER_TRUST_LEVELS } from '../peer-trust.js';
import type { PeerTrustLevel } from '../peer-trust.js';

describe('PeerTrustRegistry', () => {
  // ─── Peer Registration ──────────────────────────────────────────────────

  it('registers peers of different kinds', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('user-foxy', 'user', 'Foxy');
    reg.registerPeer('agent-cedar', 'agent', 'Cedar');
    reg.registerPeer('team-dev', 'team', 'Dev Team');
    reg.registerPeer('mcp-math', 'mcp-server', 'Math Coprocessor');

    expect(reg.peerCount).toBe(4);
    expect(reg.getPeer('user-foxy')?.kind).toBe('user');
    expect(reg.getPeer('agent-cedar')?.kind).toBe('agent');
  });

  it('returns existing peer on duplicate registration', () => {
    const reg = new PeerTrustRegistry();
    const p1 = reg.registerPeer('x', 'user', 'X');
    const p2 = reg.registerPeer('x', 'agent', 'Different');
    expect(p1).toBe(p2); // Same object returned
    expect(reg.peerCount).toBe(1);
  });

  it('filters peers by kind', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u1', 'user', 'User 1');
    reg.registerPeer('a1', 'agent', 'Agent 1');
    reg.registerPeer('a2', 'agent', 'Agent 2');

    expect(reg.listPeers('agent').length).toBe(2);
    expect(reg.listPeers('user').length).toBe(1);
    expect(reg.listPeers().length).toBe(3);
  });

  // ─── Relationships ──────────────────────────────────────────────────────

  it('creates relationships between peers', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('alice', 'user', 'Alice');
    reg.registerPeer('bob', 'agent', 'Bob');

    const rel = reg.relationship('alice', 'bob');
    expect(rel.peerIds).toEqual(['alice', 'bob']);
    expect(rel.forward.level).toBe('stranger');
    expect(rel.reverse.level).toBe('stranger');
    expect(reg.relationshipCount).toBe(1);
  });

  it('returns same relationship regardless of argument order', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('a', 'user', 'A');
    reg.registerPeer('b', 'agent', 'B');

    const r1 = reg.relationship('a', 'b');
    const r2 = reg.relationship('b', 'a');
    expect(r1).toBe(r2);
    expect(reg.relationshipCount).toBe(1);
  });

  it('throws on unregistered peer', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('a', 'user', 'A');
    expect(() => reg.relationship('a', 'unknown')).toThrow('Peer not registered');
  });

  // ─── Trust Progression ────────────────────────────────────────────────

  it('trust starts at stranger', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');
    expect(reg.trustLevel('u', 'a')).toBe('stranger');
  });

  it('trust progresses through levels with successful interactions', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');

    // 1 success → acquaintance
    reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('acquaintance');

    // 3 more → colleague
    reg.recordSuccess('u', 'a');
    reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('colleague');

    // 5 more → trusted (8 total)
    for (let i = 0; i < 5; i++) reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('trusted');

    // 12 more → delegate (20 total)
    for (let i = 0; i < 12; i++) reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('delegate');
  });

  it('trust is asymmetric — A trusting B does not imply B trusts A', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('human', 'user', 'Human');
    reg.registerPeer('bot', 'agent', 'Bot');

    // Human has many successful interactions with Bot
    for (let i = 0; i < 10; i++) reg.recordSuccess('human', 'bot');

    // Bot has had no interaction from its side
    expect(reg.trustLevel('human', 'bot')).toBe('trusted');
    expect(reg.trustLevel('bot', 'human')).toBe('stranger');
  });

  it('failures demote trust (3x weight)', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');

    // Build to colleague (8 successes)
    for (let i = 0; i < 8; i++) reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('trusted');

    // 3 failures = -9 net, reducing from 8-9 = -1 → stranger
    reg.recordFailure('u', 'a');
    reg.recordFailure('u', 'a');
    reg.recordFailure('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('stranger');
  });

  it('resetTrust drops to stranger and clears history', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');

    for (let i = 0; i < 20; i++) reg.recordSuccess('u', 'a');
    expect(reg.trustLevel('u', 'a')).toBe('delegate');

    reg.resetTrust('u', 'a', 'security incident');
    expect(reg.trustLevel('u', 'a')).toBe('stranger');
  });

  // ─── Capability Delegation ────────────────────────────────────────────

  it('delegates capabilities only at trusted level or above', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');

    // At stranger — cannot delegate
    expect(reg.delegateCapability('u', 'a', 'write-files')).toBe(false);

    // Build to trusted
    for (let i = 0; i < 8; i++) reg.recordSuccess('u', 'a');
    expect(reg.delegateCapability('u', 'a', 'write-files')).toBe(true);
    expect(reg.hasCapability('u', 'a', 'write-files')).toBe(true);
    expect(reg.hasCapability('u', 'a', 'read-files')).toBe(false);
  });

  it('revokes delegated capabilities', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');

    for (let i = 0; i < 8; i++) reg.recordSuccess('u', 'a');
    reg.delegateCapability('u', 'a', 'exec');
    expect(reg.hasCapability('u', 'a', 'exec')).toBe(true);

    reg.revokeCapability('u', 'a', 'exec');
    expect(reg.hasCapability('u', 'a', 'exec')).toBe(false);
  });

  // ─── Queries ──────────────────────────────────────────────────────────

  it('lists peers with bidirectional trust info', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a1', 'agent', 'A1');
    reg.registerPeer('a2', 'agent', 'A2');

    for (let i = 0; i < 5; i++) reg.recordSuccess('u', 'a1');
    for (let i = 0; i < 2; i++) reg.recordSuccess('a1', 'u');
    reg.recordSuccess('u', 'a2');

    const peers = reg.peersOf('u');
    expect(peers.length).toBe(2);

    const a1Rel = peers.find(p => p.peer.id === 'a1');
    expect(a1Rel?.trustToward).toBe('colleague');
    expect(a1Rel?.trustFrom).toBe('acquaintance');
  });

  it('finds all peers trusting a given peer above a threshold', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('target', 'agent', 'Target');
    reg.registerPeer('fan1', 'user', 'Fan 1');
    reg.registerPeer('fan2', 'agent', 'Fan 2');
    reg.registerPeer('stranger', 'user', 'Stranger');

    for (let i = 0; i < 5; i++) {
      reg.recordSuccess('fan1', 'target');
      reg.recordSuccess('fan2', 'target');
    }
    reg.recordSuccess('stranger', 'target'); // Only 1 interaction

    const trusters = reg.trustedBy('target', 'colleague');
    expect(trusters.length).toBe(2);
    expect(trusters.map(p => p.id).sort()).toEqual(['fan1', 'fan2']);
  });

  // ─── Agent-to-Agent Trust ─────────────────────────────────────────────

  it('supports agent-to-agent trust (not just user-to-agent)', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('flight-ops', 'agent', 'Flight Ops');
    reg.registerPeer('watchdog', 'agent', 'Watchdog');
    reg.registerPeer('mayor', 'agent', 'Mayor');

    // Mayor trusts flight-ops after many successful missions
    for (let i = 0; i < 15; i++) reg.recordSuccess('mayor', 'flight-ops');
    expect(reg.trustLevel('mayor', 'flight-ops')).toBe('trusted');

    // Watchdog has independently built trust with flight-ops
    for (let i = 0; i < 5; i++) reg.recordSuccess('watchdog', 'flight-ops');
    expect(reg.trustLevel('watchdog', 'flight-ops')).toBe('colleague');

    // Flight-ops trusts mayor back (mutual)
    for (let i = 0; i < 10; i++) reg.recordSuccess('flight-ops', 'mayor');
    expect(reg.trustLevel('flight-ops', 'mayor')).toBe('trusted');
  });

  // ─── Audit Log ────────────────────────────────────────────────────────

  it('records audit trail of all trust events', () => {
    const reg = new PeerTrustRegistry();
    reg.registerPeer('u', 'user', 'U');
    reg.registerPeer('a', 'agent', 'A');
    reg.recordSuccess('u', 'a');
    reg.recordFailure('u', 'a');
    reg.resetTrust('u', 'a', 'test');

    const events = reg.audit;
    expect(events.length).toBeGreaterThan(3);
    expect(events.some(e => e.event.type === 'peer_registered')).toBe(true);
    expect(events.some(e => e.event.type === 'trust_promoted')).toBe(true);
  });

  // ─── Trust Level Constants ────────────────────────────────────────────

  it('trust levels are in correct order', () => {
    expect(PEER_TRUST_LEVELS).toEqual([
      'stranger', 'acquaintance', 'colleague', 'trusted', 'delegate',
    ]);
  });
});
