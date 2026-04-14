/**
 * Shared interface for content-addressed stores used by Grove consumers.
 *
 * Both `ContentAddressedStore` (single arena) and `ContentAddressedSetStore`
 * (multi-pool ArenaSet) implement this interface, so Grove consumers
 * (GroveNamespace, SkillCodebase, SignatureView, etc.) can accept either
 * via dependency injection.
 *
 * @module memory/grove-store
 */

/**
 * Result of a `put` operation.
 */
export interface PutResult {
  hash: string;
  chunkId: number;
  created: boolean;
}

/**
 * The minimal content-addressed store interface that Grove consumers need.
 * Both ContentAddressedStore and ContentAddressedSetStore satisfy this.
 */
export interface GroveStore {
  /** Rebuild the hash index from arena state. Call once after init. */
  loadIndex(): Promise<void>;

  /** True after loadIndex has been called. */
  isIndexLoaded(): boolean;

  /** Number of indexed entries. */
  size(): number;

  /** Store bytes under hash. Deduplicates. */
  put(hash: Uint8Array | string, bytes: Uint8Array): Promise<PutResult>;

  /** Hash with SHA-256 and store. */
  putAuto(bytes: Uint8Array): Promise<PutResult>;

  /** Overwrite an existing entry by hash. */
  replaceByHash(hash: Uint8Array | string, bytes: Uint8Array): Promise<PutResult>;

  /** Fetch bytes by hash, or null. */
  getByHash(hash: Uint8Array | string): Promise<Uint8Array | null>;

  /** True if a chunk exists for this hash. */
  hasHash(hash: Uint8Array | string): Promise<boolean>;

  /** Look up chunk id without fetching payload. */
  chunkIdForHash(hash: Uint8Array | string): Promise<number | null>;

  /** Free the chunk backing hash. Returns true if removed. */
  removeByHash(hash: Uint8Array | string): Promise<boolean>;

  /** Return all indexed hashes. */
  listHashes(): Promise<string[]>;

  /** Count of indexed entries. */
  count(): Promise<number>;

  /** Advisory prefetch. Returns count of hits. */
  preload(hashes: Array<Uint8Array | string>): Promise<number>;
}
