/**
 * XDG Base Directory Specification utilities.
 *
 * Resolves user directories per https://specifications.freedesktop.org/basedir-spec/
 * with correct fallback defaults. All returned paths are absolute.
 *
 * Key rules from the spec:
 * - Environment variable values MUST be absolute paths (starting with /). Relative paths are ignored.
 * - XDG_RUNTIME_DIR has no safe fallback — returns undefined when unset.
 * - Never create XDG_RUNTIME_DIR — it is managed by pam_systemd.
 */

import { join } from "node:path";
import { homedir } from "node:os";

/** Application name used as subdirectory within XDG base directories. */
export const APP_NAME = "gsd-os";

/**
 * Resolve an XDG base directory with fallback to spec default.
 * Ignores non-absolute environment variable values per the spec.
 */
function xdgDir(envVar: string, fallbackSuffix: string): string {
  const envValue = process.env[envVar];
  if (envValue && envValue.startsWith("/")) {
    return join(envValue, APP_NAME);
  }
  return join(homedir(), fallbackSuffix, APP_NAME);
}

/** User configuration directory (~/.config/gsd-os/) */
export function configDir(): string {
  return xdgDir("XDG_CONFIG_HOME", ".config");
}

/** User data directory (~/.local/share/gsd-os/) */
export function dataDir(): string {
  return xdgDir("XDG_DATA_HOME", ".local/share");
}

/** User state directory (~/.local/state/gsd-os/) */
export function stateDir(): string {
  return xdgDir("XDG_STATE_HOME", ".local/state");
}

/** User cache directory (~/.cache/gsd-os/) */
export function cacheDir(): string {
  return xdgDir("XDG_CACHE_HOME", ".cache");
}

/**
 * Runtime directory (/run/user/$UID/gsd-os/).
 * Returns undefined when XDG_RUNTIME_DIR is not set — no fallback path
 * is invented, since this directory requires system-level setup.
 */
export function runtimeDir(): string | undefined {
  const dir = process.env.XDG_RUNTIME_DIR;
  if (dir && dir.startsWith("/")) {
    return join(dir, APP_NAME);
  }
  return undefined;
}
