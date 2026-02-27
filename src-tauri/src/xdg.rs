//! XDG Base Directory Specification utilities.
//!
//! Resolves user directories per <https://specifications.freedesktop.org/basedir-spec/>
//! using the `dirs` crate which provides XDG-compliant paths on Linux and
//! platform-appropriate equivalents on macOS/Windows.
//!
//! Key rules from the spec:
//! - Environment variable values MUST be absolute paths (starting with `/`).
//! - `XDG_RUNTIME_DIR` has no safe fallback — returns None when unset.
//! - Never create `XDG_RUNTIME_DIR` — it is managed by `pam_systemd`.

use std::path::PathBuf;

/// Application name used as subdirectory within XDG base directories.
pub const APP_NAME: &str = "gsd-os";

/// User configuration directory (`~/.config/gsd-os/`).
pub fn config_dir() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join(APP_NAME))
}

/// User data directory (`~/.local/share/gsd-os/`).
pub fn data_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|d| d.join(APP_NAME))
}

/// User state directory (`~/.local/state/gsd-os/`).
///
/// The `dirs` crate does not provide `state_dir` on all platforms, so we
/// fall back to `XDG_STATE_HOME` or `~/.local/state` manually.
pub fn state_dir() -> Option<PathBuf> {
    std::env::var("XDG_STATE_HOME")
        .ok()
        .filter(|p| p.starts_with('/'))
        .map(PathBuf::from)
        .or_else(|| dirs::home_dir().map(|h| h.join(".local/state")))
        .map(|d| d.join(APP_NAME))
}

/// User cache directory (`~/.cache/gsd-os/`).
pub fn cache_dir() -> Option<PathBuf> {
    dirs::cache_dir().map(|d| d.join(APP_NAME))
}

/// Runtime directory (`/run/user/$UID/gsd-os/`).
///
/// Returns `None` if `XDG_RUNTIME_DIR` is not set — no fallback path is
/// invented, since this directory requires system-level setup by `pam_systemd`.
pub fn runtime_dir() -> Option<PathBuf> {
    dirs::runtime_dir().map(|d| d.join(APP_NAME))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn config_dir_returns_some() {
        let dir = config_dir();
        assert!(dir.is_some(), "config_dir should return Some on Linux");
        let path = dir.unwrap();
        assert!(path.ends_with(APP_NAME), "path should end with {APP_NAME}");
    }

    #[test]
    fn data_dir_returns_some() {
        let dir = data_dir();
        assert!(dir.is_some(), "data_dir should return Some on Linux");
        let path = dir.unwrap();
        assert!(path.ends_with(APP_NAME), "path should end with {APP_NAME}");
    }

    #[test]
    fn state_dir_returns_some() {
        let dir = state_dir();
        assert!(dir.is_some(), "state_dir should return Some on Linux");
        let path = dir.unwrap();
        assert!(path.ends_with(APP_NAME), "path should end with {APP_NAME}");
    }

    #[test]
    fn cache_dir_returns_some() {
        let dir = cache_dir();
        assert!(dir.is_some(), "cache_dir should return Some on Linux");
        let path = dir.unwrap();
        assert!(path.ends_with(APP_NAME), "path should end with {APP_NAME}");
    }

    #[test]
    fn all_dirs_are_absolute() {
        for (name, dir) in [
            ("config", config_dir()),
            ("data", data_dir()),
            ("state", state_dir()),
            ("cache", cache_dir()),
        ] {
            if let Some(path) = dir {
                assert!(
                    path.is_absolute(),
                    "{name}_dir should return an absolute path, got: {}",
                    path.display()
                );
            }
        }
    }

    #[test]
    fn app_name_is_correct() {
        assert_eq!(APP_NAME, "gsd-os");
    }
}
