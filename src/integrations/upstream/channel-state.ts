import type { ChannelState } from './types.js';

/* ------------------------------------------------------------------ */
/*  Injectable dependency types                                        */
/* ------------------------------------------------------------------ */

/** Read file contents */
export type ReadFileFn = (path: string) => Promise<string>;

/** Write file contents (overwrite) */
export type WriteFileFn = (path: string, content: string) => Promise<void>;

/** Check if file exists */
export type ExistsFn = (path: string) => Promise<boolean>;

/** All injectable dependencies for channel state operations */
export interface ChannelStateDeps {
  readFile: ReadFileFn;
  writeFile: WriteFileFn;
  exists: ExistsFn;
}

/* ------------------------------------------------------------------ */
/*  State persistence                                                  */
/* ------------------------------------------------------------------ */

/**
 * Save channel state to the state file.
 * If the channel already exists in the state file, it is updated in place.
 * If it does not exist, it is appended.
 * State is stored as a JSON array of ChannelState objects.
 */
export async function saveChannelState(
  statePath: string,
  state: ChannelState,
  deps: ChannelStateDeps,
): Promise<void> {
  const existing = await loadAllChannelStates(statePath, deps);

  const idx = existing.findIndex((s) => s.channel === state.channel);
  if (idx >= 0) {
    existing[idx] = state;
  } else {
    existing.push(state);
  }

  await deps.writeFile(statePath, JSON.stringify(existing, null, 2));
}

/**
 * Load a single channel's state by name.
 * Returns null if the state file does not exist or the channel is not found.
 */
export async function loadChannelState(
  statePath: string,
  channel: string,
  deps: ChannelStateDeps,
): Promise<ChannelState | null> {
  const all = await loadAllChannelStates(statePath, deps);
  return all.find((s) => s.channel === channel) ?? null;
}

/**
 * Load all persisted channel states.
 * Returns empty array for missing or corrupted state files.
 */
export async function loadAllChannelStates(
  statePath: string,
  deps: Pick<ChannelStateDeps, 'readFile' | 'exists'>,
): Promise<ChannelState[]> {
  const fileExists = await deps.exists(statePath);
  if (!fileExists) return [];

  try {
    const raw = await deps.readFile(statePath);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as ChannelState[];
  } catch {
    // Corrupted JSON — return empty array gracefully
    return [];
  }
}

/* ------------------------------------------------------------------ */
/*  Pure state transformers                                            */
/* ------------------------------------------------------------------ */

/**
 * Return a new ChannelState with updated hash and last_checked timestamp.
 * Pure function — does not mutate the input.
 */
export function updateHash(state: ChannelState, newHash: string): ChannelState {
  return {
    ...state,
    last_hash: newHash,
    last_checked: new Date().toISOString(),
  };
}

/**
 * Return a new ChannelState with last_changed set to the current timestamp.
 * Pure function — does not mutate the input.
 */
export function markChanged(state: ChannelState): ChannelState {
  return {
    ...state,
    last_changed: new Date().toISOString(),
  };
}
