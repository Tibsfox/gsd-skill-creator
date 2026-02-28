import { describe, it, expect } from 'vitest';
import { TrustManager } from './trust-manager.js';
import { computeToolHash, detectHashDriftWithTools } from './hash-gate.js';
import type { Tool } from '../../core/types/mcp.js';

// ============================================================================
// Test fixtures
// ============================================================================

function makeTool(name: string, description = 'Test tool'): Tool {
  return {
    name,
    description,
    inputSchema: { type: 'object' },
  };
}

const toolA = makeTool('tool-a');
const toolB = makeTool('tool-b');
const toolAModified = makeTool('tool-a', 'Changed description');

// ============================================================================
// registerServer / quarantine entry (SECR-04)
// ============================================================================

describe('TrustManager: quarantine entry (SECR-04)', () => {
  it('new server starts in quarantine', () => {
    const tm = new TrustManager();
    const transition = tm.registerServer('s1');
    expect(transition.to).toBe('quarantine');
    expect(tm.getTrustState('s1')).toBe('quarantine');
  });

  it('requiresApproval returns true for quarantine server', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    expect(tm.requiresApproval('s1')).toBe(true);
  });

  it('unknown server returns quarantine state', () => {
    const tm = new TrustManager();
    expect(tm.getTrustState('unknown')).toBe('quarantine');
  });

  it('unknown server requires approval', () => {
    const tm = new TrustManager();
    expect(tm.requiresApproval('unknown')).toBe(true);
  });
});

// ============================================================================
// Trust transitions
// ============================================================================

describe('TrustManager: trust transitions', () => {
  it('can transition from quarantine to provisional', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    const transition = tm.setTrustState('s1', 'provisional', 'Initial review passed');
    expect(transition.from).toBe('quarantine');
    expect(transition.to).toBe('provisional');
    expect(tm.getTrustState('s1')).toBe('provisional');
  });

  it('can transition from provisional to trusted', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'provisional', 'Review passed');
    const transition = tm.setTrustState('s1', 'trusted', 'Fully verified');
    expect(transition.from).toBe('provisional');
    expect(transition.to).toBe('trusted');
    expect(tm.getTrustState('s1')).toBe('trusted');
  });

  it('requiresApproval returns false for trusted server', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');
    expect(tm.requiresApproval('s1')).toBe(false);
  });

  it('transition history is recorded', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'provisional', 'Step 1');
    tm.setTrustState('s1', 'trusted', 'Step 2');
    const history = tm.getTransitionHistory('s1');
    expect(history.length).toBe(3); // register + 2 transitions
    expect(history[0].to).toBe('quarantine');
    expect(history[1].to).toBe('provisional');
    expect(history[2].to).toBe('trusted');
  });
});

// ============================================================================
// Trust decay (SECR-05)
// ============================================================================

describe('TrustManager: trust decay (SECR-05)', () => {
  it('server with recent activity does not decay', () => {
    const tm = new TrustManager({ inactivityDecayMs: 100 });
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');
    tm.recordActivity('s1');
    const decay = tm.checkDecay('s1');
    expect(decay).toBeNull();
    expect(tm.getTrustState('s1')).toBe('trusted');
  });

  it('server with expired inactivity decays to quarantine', () => {
    const tm = new TrustManager({ inactivityDecayMs: 100 });
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');
    // Simulate inactivity by setting lastActivity to past
    tm.setLastActivity('s1', Date.now() - 200);
    const decay = tm.checkDecay('s1');
    expect(decay).not.toBeNull();
    expect(decay!.from).toBe('trusted');
    expect(decay!.to).toBe('quarantine');
    expect(tm.getTrustState('s1')).toBe('quarantine');
  });

  it('provisional server decays to quarantine', () => {
    const tm = new TrustManager({ inactivityDecayMs: 100 });
    tm.registerServer('s1');
    tm.setTrustState('s1', 'provisional', 'Under review');
    tm.setLastActivity('s1', Date.now() - 200);
    const decay = tm.checkDecay('s1');
    expect(decay).not.toBeNull();
    expect(decay!.from).toBe('provisional');
    expect(decay!.to).toBe('quarantine');
  });

  it('already quarantined server does not decay further', () => {
    const tm = new TrustManager({ inactivityDecayMs: 100 });
    tm.registerServer('s1');
    tm.setLastActivity('s1', Date.now() - 200);
    const decay = tm.checkDecay('s1');
    expect(decay).toBeNull();
  });

  it('custom inactivityDecayMs is respected', () => {
    const tm = new TrustManager({ inactivityDecayMs: 50 });
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');
    tm.setLastActivity('s1', Date.now() - 60);
    expect(tm.checkDecay('s1')).not.toBeNull();

    // Reset and use longer decay
    const tm2 = new TrustManager({ inactivityDecayMs: 500 });
    tm2.registerServer('s2');
    tm2.setTrustState('s2', 'trusted', 'Approved');
    tm2.setLastActivity('s2', Date.now() - 60);
    expect(tm2.checkDecay('s2')).toBeNull(); // 60ms < 500ms
  });
});

// ============================================================================
// Hash change reset (SECR-06)
// ============================================================================

describe('TrustManager: hash change reset (SECR-06)', () => {
  it('trusted server resets to quarantine on hash drift', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');

    const prev = computeToolHash('s1', [toolA]);
    const drift = detectHashDriftWithTools('s1', [toolAModified], prev, [toolA]);

    const transition = tm.onHashChange('s1', drift);
    expect(transition).not.toBeNull();
    expect(transition!.from).toBe('trusted');
    expect(transition!.to).toBe('quarantine');
    expect(tm.getTrustState('s1')).toBe('quarantine');
  });

  it('provisional server resets to quarantine on hash drift', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'provisional', 'Under review');

    const prev = computeToolHash('s1', [toolA]);
    const drift = detectHashDriftWithTools('s1', [toolB], prev, [toolA]);

    const transition = tm.onHashChange('s1', drift);
    expect(transition).not.toBeNull();
    expect(transition!.from).toBe('provisional');
    expect(transition!.to).toBe('quarantine');
  });

  it('non-drifted hash change does not reset trust', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');

    const prev = computeToolHash('s1', [toolA]);
    const drift = detectHashDriftWithTools('s1', [toolA], prev, [toolA]);

    const transition = tm.onHashChange('s1', drift);
    expect(transition).toBeNull();
    expect(tm.getTrustState('s1')).toBe('trusted');
  });

  it('transition reason includes drift information', () => {
    const tm = new TrustManager();
    tm.registerServer('s1');
    tm.setTrustState('s1', 'trusted', 'Approved');

    const prev = computeToolHash('s1', [toolA]);
    const drift = detectHashDriftWithTools('s1', [toolAModified, toolB], prev, [toolA]);

    const transition = tm.onHashChange('s1', drift);
    expect(transition).not.toBeNull();
    expect(transition!.reason).toContain('Tool definition change');
    expect(transition!.reason).toContain('added: tool-b');
    expect(transition!.reason).toContain('modified: tool-a');
  });
});
