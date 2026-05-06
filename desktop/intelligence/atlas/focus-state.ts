/**
 * Focus state — URL-hash <-> Focus codec.
 *
 * Hash format (single-project): #atlas/{kind}/{id}
 * Hash format (multi-project):  #atlas/{kind}/{id}?pid={projectId}
 *
 * The `project_id` field is optional. Existing single-project hashes without
 * a `?pid=` query segment parse cleanly — `project_id` is undefined, which
 * callers interpret as "bind to the primary project". This preserves full
 * backward compatibility with all pre-J3 bookmarks and shared links.
 *
 * Examples:
 *   #atlas/symbol/ts:src/foo.ts:MyClass
 *   #atlas/file/src/foo.ts
 *   #atlas/folder/src/utils
 *   #atlas/mission/v1.49.606
 *   #atlas/file/src/foo.ts?pid=proj-b
 */

export interface Focus {
  kind: 'file' | 'folder' | 'symbol' | 'mission';
  id: string;
  /** Which project this selection belongs to. Undefined → primary project. */
  project_id?: string;
}

const PREFIX = 'atlas/';
const VALID_KINDS = new Set(['file', 'folder', 'symbol', 'mission']);

export function parseHash(hash: string): Focus | null {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!raw.startsWith(PREFIX)) return null;
  const rest = raw.slice(PREFIX.length);
  const slashIdx = rest.indexOf('/');
  if (slashIdx === -1) return null;
  const kind = rest.slice(0, slashIdx);
  // Split id from optional ?pid= suffix
  const idAndQuery = rest.slice(slashIdx + 1);
  const qIdx = idAndQuery.indexOf('?');
  const rawId = qIdx === -1 ? idAndQuery : idAndQuery.slice(0, qIdx);
  const query = qIdx === -1 ? '' : idAndQuery.slice(qIdx + 1);
  if (!VALID_KINDS.has(kind) || !rawId) return null;
  const focus: Focus = { kind: kind as Focus['kind'], id: decodeURIComponent(rawId) };
  if (query) {
    const params = new URLSearchParams(query);
    const pid = params.get('pid');
    if (pid) focus.project_id = decodeURIComponent(pid);
  }
  return focus;
}

export function serializeHash(focus: Focus): string {
  let hash = `#${PREFIX}${focus.kind}/${encodeURIComponent(focus.id)}`;
  if (focus.project_id) {
    hash += `?pid=${encodeURIComponent(focus.project_id)}`;
  }
  return hash;
}
