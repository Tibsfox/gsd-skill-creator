/**
 * Spatial Awareness — Multi-Tier Communication Bus
 * Paula Chipset Release 2
 *
 * Three communication tiers:
 *   COVERT   — point-to-point, invisible to non-recipients
 *   DIRECTED — named recipients only
 *   BROADCAST — all registered agents
 *
 * Conforms to CF-11 (broadcast <1s), CF-12 (zero missed broadcasts),
 * CF-13 (covert invisibility).
 */

import type {
  CoordinationMessage,
  CommTier,
  FrogPhase,
} from './types.js';
import { CoordinationMessageSchema } from './types.js';

// ============================================================================
// Signal file protocol interface (filesystem coordination)
// ============================================================================

/**
 * File-system signal paths for chorus coordination.
 * Defined as constants — actual file I/O is handled by the
 * Chorus Protocol layer, not the comm bus.
 */
export const SIGNAL_FILES = {
  CHORUS_PAUSE: '.planning/CHORUS_PAUSE',
  CHORUS_RESUME: '.planning/CHORUS_RESUME',
} as const;

export type SignalFileType = keyof typeof SIGNAL_FILES;

export interface SignalFileEvent {
  type: SignalFileType;
  path: string;
  timestamp: number;
  payload?: Record<string, unknown>;
}

// ============================================================================
// Comm bus types
// ============================================================================

export type MessageHandler = (message: CoordinationMessage) => void;

export interface CommBusSubscription {
  id: string;
  agentId: string;
  tier: CommTier | 'ALL';
  handler: MessageHandler;
}

export interface CommBusStats {
  totalSent: number;
  totalDelivered: number;
  byTier: Record<CommTier, number>;
  missedBroadcasts: number;
  lastMessageTimestamp: number | null;
}

// ============================================================================
// Multi-Tier Communication Bus
// ============================================================================

export class CommBus {
  private _agents = new Set<string>();
  private _subscriptions = new Map<string, CommBusSubscription>();
  private _messageLog: CoordinationMessage[] = [];
  private _stats: CommBusStats = {
    totalSent: 0,
    totalDelivered: 0,
    byTier: { COVERT: 0, DIRECTED: 0, BROADCAST: 0 },
    missedBroadcasts: 0,
    lastMessageTimestamp: null,
  };
  private _signalListeners = new Set<(event: SignalFileEvent) => void>();

  // --------------------------------------------------------------------------
  // Agent registration
  // --------------------------------------------------------------------------

  /** Register an agent to receive messages. */
  registerAgent(agentId: string): void {
    this._agents.add(agentId);
  }

  /** Unregister an agent — removes all subscriptions. */
  unregisterAgent(agentId: string): void {
    this._agents.delete(agentId);
    for (const [id, sub] of this._subscriptions) {
      if (sub.agentId === agentId) {
        this._subscriptions.delete(id);
      }
    }
  }

  /** Get all registered agent IDs. */
  getRegisteredAgents(): string[] {
    return [...this._agents];
  }

  // --------------------------------------------------------------------------
  // Subscriptions
  // --------------------------------------------------------------------------

  /**
   * Subscribe an agent to messages on a specific tier (or ALL tiers).
   * Returns an unsubscribe function.
   */
  subscribe(agentId: string, tier: CommTier | 'ALL', handler: MessageHandler): () => void {
    if (!this._agents.has(agentId)) {
      throw new Error(`Agent "${agentId}" is not registered on the comm bus`);
    }

    const subId = `sub-${agentId}-${tier}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const subscription: CommBusSubscription = { id: subId, agentId, tier, handler };
    this._subscriptions.set(subId, subscription);

    return () => {
      this._subscriptions.delete(subId);
    };
  }

  // --------------------------------------------------------------------------
  // Message sending
  // --------------------------------------------------------------------------

  /**
   * Send a message through the bus.
   * Validates against CoordinationMessageSchema, routes by tier.
   */
  send(message: CoordinationMessage): number {
    const validated = CoordinationMessageSchema.parse(message);
    this._messageLog.push(validated);
    this._stats.totalSent++;
    this._stats.byTier[validated.tier]++;
    this._stats.lastMessageTimestamp = validated.timestamp;

    let deliveryCount = 0;

    switch (validated.tier) {
      case 'COVERT':
        deliveryCount = this._deliverCovert(validated);
        break;
      case 'DIRECTED':
        deliveryCount = this._deliverDirected(validated);
        break;
      case 'BROADCAST':
        deliveryCount = this._deliverBroadcast(validated);
        break;
    }

    this._stats.totalDelivered += deliveryCount;
    return deliveryCount;
  }

  /**
   * Convenience: build and send a message in one call.
   */
  emit(
    sender: string,
    tier: CommTier,
    phase: FrogPhase,
    payload: Record<string, unknown> = {},
    recipients: string[] = [],
  ): number {
    const message: CoordinationMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tier,
      sender,
      recipients,
      phase,
      payload,
      timestamp: Date.now(),
      ttl: 30_000,
    };
    return this.send(message);
  }

  // --------------------------------------------------------------------------
  // Signal file protocol (interface only — no actual file I/O)
  // --------------------------------------------------------------------------

  /** Emit a signal file event (for chorus coordination). */
  emitSignal(type: SignalFileType, payload?: Record<string, unknown>): void {
    const event: SignalFileEvent = {
      type,
      path: SIGNAL_FILES[type],
      timestamp: Date.now(),
      payload,
    };
    for (const listener of this._signalListeners) {
      listener(event);
    }
  }

  /** Subscribe to signal file events. Returns unsubscribe function. */
  onSignal(listener: (event: SignalFileEvent) => void): () => void {
    this._signalListeners.add(listener);
    return () => this._signalListeners.delete(listener);
  }

  // --------------------------------------------------------------------------
  // Query and inspection
  // --------------------------------------------------------------------------

  /** Get message history, optionally filtered. */
  getMessages(filter?: {
    tier?: CommTier;
    sender?: string;
    since?: number;
  }): CoordinationMessage[] {
    let result = this._messageLog;
    if (filter?.tier) {
      result = result.filter(m => m.tier === filter.tier);
    }
    if (filter?.sender) {
      result = result.filter(m => m.sender === filter.sender);
    }
    if (filter?.since) {
      result = result.filter(m => m.timestamp >= filter.since!);
    }
    return result;
  }

  /**
   * Get messages visible to a specific agent.
   * COVERT messages are only visible to sender and explicit recipients.
   * CF-13: Non-recipients have zero visibility of covert messages.
   */
  getVisibleMessages(agentId: string): CoordinationMessage[] {
    return this._messageLog.filter(m => {
      if (m.tier === 'BROADCAST') return true;
      if (m.tier === 'DIRECTED') {
        return m.sender === agentId || m.recipients.includes(agentId);
      }
      // COVERT — only sender and explicit recipients
      return m.sender === agentId || m.recipients.includes(agentId);
    });
  }

  /** Get bus statistics. */
  getStats(): CommBusStats {
    return { ...this._stats };
  }

  /** Extract a signal from noisy message stream (CF-12). */
  extractSignal(
    messages: CoordinationMessage[],
    predicate: (m: CoordinationMessage) => boolean,
  ): CoordinationMessage[] {
    return messages.filter(predicate);
  }

  /** Reset bus state — for testing. */
  reset(): void {
    this._agents.clear();
    this._subscriptions.clear();
    this._messageLog = [];
    this._stats = {
      totalSent: 0,
      totalDelivered: 0,
      byTier: { COVERT: 0, DIRECTED: 0, BROADCAST: 0 },
      missedBroadcasts: 0,
      lastMessageTimestamp: null,
    };
    this._signalListeners.clear();
  }

  // --------------------------------------------------------------------------
  // Tier-specific delivery
  // --------------------------------------------------------------------------

  /**
   * COVERT: point-to-point delivery.
   * Only explicit recipients receive the message.
   * Non-recipients cannot see it even in message logs (CF-13).
   */
  private _deliverCovert(message: CoordinationMessage): number {
    let delivered = 0;
    for (const sub of this._subscriptions.values()) {
      if (!message.recipients.includes(sub.agentId)) continue;
      if (sub.tier !== 'COVERT' && sub.tier !== 'ALL') continue;
      sub.handler(message);
      delivered++;
    }
    return delivered;
  }

  /**
   * DIRECTED: named-recipient delivery.
   * Only agents listed in recipients[] receive the message.
   */
  private _deliverDirected(message: CoordinationMessage): number {
    let delivered = 0;
    for (const sub of this._subscriptions.values()) {
      if (!message.recipients.includes(sub.agentId)) continue;
      if (sub.tier !== 'DIRECTED' && sub.tier !== 'ALL') continue;
      sub.handler(message);
      delivered++;
    }
    return delivered;
  }

  /**
   * BROADCAST: delivery to all registered agents.
   * CF-11: All agents receive within 1 second.
   * CF-12: Zero missed broadcasts — every registered agent gets every broadcast.
   */
  private _deliverBroadcast(message: CoordinationMessage): number {
    let delivered = 0;
    const targetAgents = new Set<string>();

    // Collect all agents that should receive this broadcast
    for (const agentId of this._agents) {
      if (agentId !== message.sender) {
        targetAgents.add(agentId);
      }
    }

    // Deliver to all subscribers on BROADCAST or ALL tier
    const deliveredTo = new Set<string>();
    for (const sub of this._subscriptions.values()) {
      if (sub.tier !== 'BROADCAST' && sub.tier !== 'ALL') continue;
      if (sub.agentId === message.sender) continue;
      if (!targetAgents.has(sub.agentId)) continue;
      if (deliveredTo.has(sub.agentId)) continue; // one delivery per agent

      sub.handler(message);
      deliveredTo.add(sub.agentId);
      delivered++;
    }

    // Track missed broadcasts (agents registered but not subscribed)
    const missed = targetAgents.size - deliveredTo.size;
    if (missed > 0) {
      this._stats.missedBroadcasts += missed;
    }

    return delivered;
  }
}

// ============================================================================
// Factory
// ============================================================================

/** Create a new CommBus instance. */
export function createCommBus(): CommBus {
  return new CommBus();
}
