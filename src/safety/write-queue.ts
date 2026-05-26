/**
 * Serialize file-write operations through a per-store promise chain without
 * letting the chain self-poison.
 *
 * The naive pattern `holder.writeQueue = holder.writeQueue.then(work)` plus
 * `await holder.writeQueue` has a silent failure mode: if `work` rejects
 * once (transient EACCES, ENOSPC, etc.), `writeQueue` becomes a permanently-
 * rejected promise and every subsequent `.then()` returns the same rejection,
 * killing the store with no recovery. The caller of the failing write sees
 * the error, but every later writer also throws the *same* error forever.
 *
 * This helper separates two concerns:
 *  - the queue used for serialization always resolves (errors are swallowed
 *    inside `.then(() => {}, () => {})` so the chain stays alive)
 *  - the awaited result still carries the work's actual outcome, so the
 *    caller of *this* write sees their error, not a stale one
 */
export interface WriteQueueHolder {
  writeQueue: Promise<unknown>;
}

export function serializeWrite<T>(
  holder: WriteQueueHolder,
  work: () => Promise<T>,
): Promise<T> {
  const enqueued = holder.writeQueue.then(work);
  holder.writeQueue = enqueued.then(
    () => undefined,
    () => undefined,
  );
  return enqueued;
}
