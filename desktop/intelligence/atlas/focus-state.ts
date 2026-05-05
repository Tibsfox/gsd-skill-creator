/**
 * Focus state — URL-hash <-> Focus codec.
 *
 * Hash format: #atlas/{kind}/{id}
 * Examples:
 *   #atlas/symbol/ts:src/foo.ts:MyClass
 *   #atlas/file/src/foo.ts
 *   #atlas/folder/src/utils
 *   #atlas/mission/v1.49.606
 */

export interface Focus {
  kind: 'file' | 'folder' | 'symbol' | 'mission';
  id: string;
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
  const id = rest.slice(slashIdx + 1);
  if (!VALID_KINDS.has(kind) || !id) return null;
  return { kind: kind as Focus['kind'], id: decodeURIComponent(id) };
}

export function serializeHash(focus: Focus): string {
  return `#${PREFIX}${focus.kind}/${encodeURIComponent(focus.id)}`;
}
