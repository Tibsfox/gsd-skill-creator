/**
 * GroveNamespace — append-only name → hash binding layer on top of Grove.
 *
 * This is the module that turns the hash-addressed Grove substrate into
 * something humans can talk to by name. Without it, every operation must
 * know the content hash of what it wants; with it, callers can say
 * `resolve("vision-to-mission")` and get back a hash they can walk.
 *
 * # Model
 *
 * A namespace is a chain of `NamespaceRecord`s. Each record's payload is
 * a map of string name → HashRef plus a `previous` pointer to the prior
 * namespace record. Walking `previous` gives the full mutation history
 * of every name ever bound.
 *
 * There is exactly one piece of mutable state in the whole system: the
 * **head pointer**, which names the current (most recent) NamespaceRecord.
 * The head pointer lives at a well-known hash in the `ContentAddressedStore`
 * so readers can find it without out-of-band configuration:
 *
 *     HEAD_POINTER_HASH = sha256("grove:head-namespace:v1")
 *
 * Mutations use `replaceByHash` on the head pointer to swap it to the new
 * namespace hash. The previous namespace record remains fully resolvable
 * for history queries.
 *
 * # Operations
 *
 *   - `resolve(name)`        — name → HashRef in current namespace, or null
 *   - `bind(name, hash)`     — append a new NamespaceRecord with the binding
 *   - `unbind(name)`         — append a new NamespaceRecord omitting the name
 *   - `listBindings()`       — full current name → hash map
 *   - `nameHistory(name)`    — walk back through all versions of a specific name
 *   - `walkHistory()`        — async iterator over all namespace records
 *   - `headHash()`           — the current head namespace record hash
 *
 * # What this is not
 *
 * Not skill-specific. The namespace handles arbitrary name → hash mappings,
 * so future record types (sessions, activations, research artifacts) get
 * name resolution for free without touching this module.
 *
 * @module mesh/grove-namespace
 */

import { createHash } from 'node:crypto';
import type { GroveStore } from '../memory/grove-store.js';
import {
  type CanonicalValue,
  type GroveRecord,
  type HashRef,
  NAMESPACE_TYPE_HASH,
  buildRecord,
  decode,
  decodeRecord,
  encode,
  encodeRecord,
  hashRecord,
  hashRefEquals,
  v,
} from '../memory/grove-format.js';

// ─── Well-known constants ───────────────────────────────────────────────────

/**
 * The lookup key for the head pointer in the content-addressed store.
 * Computed once, deterministic forever, independent of namespace contents.
 * If this value ever changes, every existing store loses its head pointer
 * and appears empty — so it must not change.
 */
export const HEAD_POINTER_HASH: Uint8Array = new Uint8Array(
  createHash('sha256').update('grove:head-namespace:v1').digest(),
);

/**
 * Default author and tool version stamped into bindings when the caller
 * doesn't supply one. Keeps provenance non-null even in test scenarios.
 */
const DEFAULT_TOOL_VERSION = 'grove-namespace/1.0';

// ─── Public types ───────────────────────────────────────────────────────────

/** A single name → hash binding in the current namespace. */
export interface NamespaceBinding {
  name: string;
  hash: HashRef;
}

/** A single namespace record with its computed identity hash. */
export interface NamespaceEntry {
  /** The identity hash of this NamespaceRecord. */
  namespaceHash: HashRef;
  /** The bindings this record defines (fresh state at this point in time). */
  bindings: Record<string, HashRef>;
  /** The previous NamespaceRecord in the chain, or null for the root. */
  previous: HashRef | null;
  /** Provenance metadata from the record envelope. */
  createdAtMs: number;
  author: string | null;
  sessionId: string | null;
}

/** A single step in a name's mutation history. */
export interface NameHistoryStep {
  /** The NamespaceRecord this step lives in. */
  namespaceHash: HashRef;
  /** The hash this name was bound to at this step, or null if unbound. */
  value: HashRef | null;
  /** When this binding was written. */
  createdAtMs: number;
  author: string | null;
}

export interface BindOptions {
  author?: string | null;
  sessionId?: string | null;
  toolVersion?: string;
  createdAtMs?: number;
}

// ─── Payload helpers ────────────────────────────────────────────────────────

/**
 * Encode a namespace payload (the bindings + previous pointer) to canonical
 * bytes. The order of keys in `bindings` is normalized by the Grove canonical
 * encoder (byte-lex sort), so two calls with the same logical state produce
 * the same bytes.
 */
function encodeNamespacePayload(
  bindings: Record<string, HashRef>,
  previous: HashRef | null,
): Uint8Array {
  const bindingsMap: Record<string, CanonicalValue> = {};
  for (const [name, hash] of Object.entries(bindings)) {
    bindingsMap[name] = v.hashref(hash.algoId, hash.hash);
  }
  return encode({
    bindings: bindingsMap,
    previous: previous === null ? v.null() : v.hashref(previous.algoId, previous.hash),
  });
}

/**
 * Decode a namespace payload back into the bindings map + previous pointer.
 * Throws on shape mismatch.
 */
function decodeNamespacePayload(bytes: Uint8Array): {
  bindings: Record<string, HashRef>;
  previous: HashRef | null;
} {
  const { value } = decode(bytes);
  if (typeof value !== 'object' || value === null || Array.isArray(value) || 'kind' in value) {
    throw new Error('GroveNamespace: payload is not a map');
  }
  const map = value as Record<string, CanonicalValue>;

  const bindingsValue = map.bindings;
  if (
    !bindingsValue ||
    typeof bindingsValue !== 'object' ||
    Array.isArray(bindingsValue) ||
    'kind' in bindingsValue
  ) {
    throw new Error('GroveNamespace: bindings field missing or not a map');
  }

  const bindings: Record<string, HashRef> = {};
  for (const [name, hashVal] of Object.entries(bindingsValue as Record<string, CanonicalValue>)) {
    if (
      hashVal &&
      typeof hashVal === 'object' &&
      !Array.isArray(hashVal) &&
      'kind' in hashVal &&
      hashVal.kind === 'hashref'
    ) {
      bindings[name] = hashVal.value;
    } else {
      throw new Error(`GroveNamespace: binding '${name}' is not a hashref`);
    }
  }

  let previous: HashRef | null = null;
  const previousValue = map.previous;
  if (previousValue === null) {
    previous = null;
  } else if (
    previousValue &&
    typeof previousValue === 'object' &&
    !Array.isArray(previousValue) &&
    'kind' in previousValue &&
    previousValue.kind === 'hashref'
  ) {
    previous = previousValue.value;
  } else {
    throw new Error('GroveNamespace: previous must be null or hashref');
  }

  return { bindings, previous };
}

// ─── GroveNamespace ─────────────────────────────────────────────────────────

export class GroveNamespace {
  private readonly cas: GroveStore;

  constructor(cas: GroveStore) {
    this.cas = cas;
  }

  // ─── Head pointer ─────────────────────────────────────────────────────────

  /**
   * Return the hash of the current head namespace record, or null if no
   * namespace has ever been written in this store.
   */
  async headHash(): Promise<HashRef | null> {
    const bytes = await this.cas.getByHash(HEAD_POINTER_HASH);
    if (!bytes) return null;
    // The head pointer value is a canonical-encoded HASHREF.
    const { value } = decode(bytes);
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      'kind' in value &&
      value.kind === 'hashref'
    ) {
      return value.value;
    }
    throw new Error('GroveNamespace: head pointer corrupt — not a hashref');
  }

  /**
   * Overwrite the head pointer to reference `hash`. Uses `replaceByHash`
   * since the head pointer is the one explicitly-mutable value in the
   * Grove model.
   */
  private async writeHead(hash: HashRef): Promise<void> {
    const payload = encode(v.hashref(hash.algoId, hash.hash));
    await this.cas.replaceByHash(HEAD_POINTER_HASH, payload);
  }

  // ─── Record reading ───────────────────────────────────────────────────────

  /**
   * Fetch a NamespaceRecord by hash. Returns the parsed entry or null.
   */
  async getNamespaceRecord(hash: HashRef): Promise<NamespaceEntry | null> {
    const bytes = await this.cas.getByHash(hash.hash);
    if (!bytes) return null;
    const record = decodeRecord(bytes);
    if (!hashRefEquals(record.typeHash, NAMESPACE_TYPE_HASH)) {
      throw new Error('GroveNamespace: record at given hash is not a NamespaceRecord');
    }
    const { bindings, previous } = decodeNamespacePayload(record.payload);
    return {
      namespaceHash: hash,
      bindings,
      previous,
      createdAtMs: record.provenance.createdAtMs,
      author: record.provenance.author,
      sessionId: record.provenance.sessionId,
    };
  }

  /** Return the current head NamespaceEntry, or null if uninitialized. */
  async head(): Promise<NamespaceEntry | null> {
    const h = await this.headHash();
    if (!h) return null;
    return this.getNamespaceRecord(h);
  }

  // ─── Resolution ───────────────────────────────────────────────────────────

  /**
   * Resolve a name to its current hash binding in the head namespace.
   * Returns null if the name is not currently bound (whether it was
   * never bound or was recently unbound).
   */
  async resolve(name: string): Promise<HashRef | null> {
    const head = await this.head();
    if (!head) return null;
    return head.bindings[name] ?? null;
  }

  /** Return the current bindings as a plain object. */
  async listBindings(): Promise<Record<string, HashRef>> {
    const head = await this.head();
    if (!head) return {};
    return { ...head.bindings };
  }

  // ─── Mutation ─────────────────────────────────────────────────────────────

  /**
   * Bind `name` to `hash`, writing a new NamespaceRecord with the prior
   * namespace as its `previous`. The previous record stays resolvable.
   * Returns the hash of the newly-written namespace record.
   *
   * If the store has no head yet, this creates the root namespace record
   * with `previous: null`.
   */
  async bind(name: string, hash: HashRef, opts: BindOptions = {}): Promise<HashRef> {
    return this.mutate(
      (current) => ({ ...current, [name]: hash }),
      opts,
    );
  }

  /**
   * Remove a name from the current bindings. If the name is not bound,
   * this is still a mutation: it writes a new NamespaceRecord whose
   * bindings happen to match the previous one. That keeps the history
   * truthful — every call produces a new head hash.
   */
  async unbind(name: string, opts: BindOptions = {}): Promise<HashRef> {
    return this.mutate(
      (current) => {
        const { [name]: _removed, ...rest } = current;
        return rest;
      },
      opts,
    );
  }

  /**
   * Atomically apply several name bindings at once. Produces a single
   * new NamespaceRecord with all changes. Use this when you want a
   * multi-name change to appear as one step in history.
   */
  async bindMany(
    changes: Array<{ name: string; hash: HashRef | null }>,
    opts: BindOptions = {},
  ): Promise<HashRef> {
    return this.mutate((current) => {
      const next = { ...current };
      for (const change of changes) {
        if (change.hash === null) {
          delete next[change.name];
        } else {
          next[change.name] = change.hash;
        }
      }
      return next;
    }, opts);
  }

  /** Core mutation path used by `bind`, `unbind`, `bindMany`. */
  private async mutate(
    transform: (current: Record<string, HashRef>) => Record<string, HashRef>,
    opts: BindOptions,
  ): Promise<HashRef> {
    const currentHead = await this.head();
    const currentBindings = currentHead?.bindings ?? {};
    const previousHash = currentHead?.namespaceHash ?? null;

    const nextBindings = transform(currentBindings);
    const payload = encodeNamespacePayload(nextBindings, previousHash);
    const record: GroveRecord = buildRecord(NAMESPACE_TYPE_HASH, payload, {
      createdAtMs: opts.createdAtMs ?? Date.now(),
      author: opts.author ?? null,
      sessionId: opts.sessionId ?? null,
      toolVersion: opts.toolVersion ?? DEFAULT_TOOL_VERSION,
      parentHashes: previousHash ? [previousHash] : [],
      dependencies: [],
    });
    const recordBytes = encodeRecord(record);
    const newHash = hashRecord(record);
    await this.cas.put(newHash.hash, recordBytes);
    await this.writeHead(newHash);
    return newHash;
  }

  // ─── History ──────────────────────────────────────────────────────────────

  /**
   * Walk every NamespaceRecord in the chain, newest first. Yields each
   * entry along with its resolved data. Stops when a previous pointer
   * is null (chain root) or when a record fails to resolve (dangling
   * reference — logged but not thrown).
   */
  async *walkHistory(): AsyncGenerator<NamespaceEntry, void, unknown> {
    let cursor = await this.headHash();
    while (cursor) {
      const entry = await this.getNamespaceRecord(cursor);
      if (!entry) return;
      yield entry;
      cursor = entry.previous;
    }
  }

  /**
   * Collect the full mutation history of a specific name. Returns an
   * array where each element is one step — the value the name had at
   * that point in time, plus provenance. The array is newest-first.
   *
   * If the name has never been bound, returns an empty array. The
   * walk is internally oldest-first so we can distinguish "name never
   * bound" from "name currently unbound after having been bound"; the
   * result is reversed before returning.
   */
  async nameHistory(name: string): Promise<NameHistoryStep[]> {
    // Collect everything oldest-first so we can track whether the name
    // has ever been bound before emitting transitions to null.
    const entries: NamespaceEntry[] = [];
    for await (const entry of this.walkHistory()) {
      entries.push(entry);
    }
    entries.reverse();

    const stepsOldestFirst: NameHistoryStep[] = [];
    let lastValue: HashRef | null = null;
    let hasBeenBound = false;

    for (const entry of entries) {
      const current = entry.bindings[name] ?? null;
      const step: NameHistoryStep = {
        namespaceHash: entry.namespaceHash,
        value: current,
        createdAtMs: entry.createdAtMs,
        author: entry.author,
      };

      if (!hasBeenBound) {
        if (current !== null) {
          // First appearance of the name in a binding.
          stepsOldestFirst.push(step);
          lastValue = current;
          hasBeenBound = true;
        }
        // else: name isn't bound yet and we've never seen it bound — skip.
      } else if (!hashRefsEqualOrBothNull(lastValue, current)) {
        stepsOldestFirst.push(step);
        lastValue = current;
      }
    }

    // Return newest-first for caller convenience.
    return stepsOldestFirst.reverse();
  }

  /** Count of namespace records in the chain. */
  async chainLength(): Promise<number> {
    let n = 0;
    for await (const _ of this.walkHistory()) n++;
    return n;
  }

  // ─── Structural Filtering ─────────────────────────────────────────────────
  //
  // Names follow a hierarchical `wing/room` convention:
  //   skills/vision-to-mission   → wing="skills", room="vision-to-mission"
  //   agents/flight-ops          → wing="agents", room="flight-ops"
  //   teams/sc-dev-team          → wing="teams",  room="sc-dev-team"
  //   chipsets/gastown            → wing="chipsets", room="gastown"
  //
  // These methods enable MemPalace-style structural filtering which yields
  // +34% retrieval improvement over unfiltered search.

  /**
   * List all bindings whose name starts with `prefix`.
   * For wing filtering: `listByPrefix("agents/")`.
   * For wing+room: `listByPrefix("agents/gsd-")`.
   */
  async listByPrefix(prefix: string): Promise<Record<string, HashRef>> {
    const all = await this.listBindings();
    const filtered: Record<string, HashRef> = {};
    for (const [name, hash] of Object.entries(all)) {
      if (name.startsWith(prefix)) {
        filtered[name] = hash;
      }
    }
    return filtered;
  }

  /**
   * List distinct wings (top-level categories) present in the namespace.
   * A wing is the substring before the first `/` in each name.
   * Names without `/` are placed in the `_root` wing.
   */
  async listWings(): Promise<string[]> {
    const all = await this.listBindings();
    const wings = new Set<string>();
    for (const name of Object.keys(all)) {
      const slash = name.indexOf('/');
      wings.add(slash >= 0 ? name.slice(0, slash) : '_root');
    }
    return Array.from(wings).sort();
  }

  /**
   * List rooms (second-level names) within a given wing.
   * Returns the portion of the name after `wing/`.
   */
  async listRooms(wing: string): Promise<string[]> {
    const prefix = wing + '/';
    const all = await this.listBindings();
    const rooms: string[] = [];
    for (const name of Object.keys(all)) {
      if (name.startsWith(prefix)) {
        rooms.push(name.slice(prefix.length));
      }
    }
    return rooms.sort();
  }

  /**
   * Filter bindings using a predicate on the name.
   * Enables keyword search, regex matching, or custom logic.
   */
  async filterBindings(
    predicate: (name: string) => boolean,
  ): Promise<Record<string, HashRef>> {
    const all = await this.listBindings();
    const filtered: Record<string, HashRef> = {};
    for (const [name, hash] of Object.entries(all)) {
      if (predicate(name)) {
        filtered[name] = hash;
      }
    }
    return filtered;
  }

  /**
   * Search bindings by keyword: returns all names containing any of the
   * given keywords (case-insensitive). Equivalent to MemPalace's hall
   * filtering — find resources by domain concept.
   */
  async searchByKeyword(...keywords: string[]): Promise<Record<string, HashRef>> {
    const lower = keywords.map(k => k.toLowerCase());
    return this.filterBindings((name) => {
      const n = name.toLowerCase();
      return lower.some(kw => n.includes(kw));
    });
  }

  /**
   * Return per-wing binding counts — useful for namespace health checks
   * and for deciding which wing to filter before deeper search.
   */
  async wingCounts(): Promise<Record<string, number>> {
    const all = await this.listBindings();
    const counts: Record<string, number> = {};
    for (const name of Object.keys(all)) {
      const slash = name.indexOf('/');
      const wing = slash >= 0 ? name.slice(0, slash) : '_root';
      counts[wing] = (counts[wing] ?? 0) + 1;
    }
    return counts;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hashRefsEqualOrBothNull(a: HashRef | null, b: HashRef | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return hashRefEquals(a, b);
}
