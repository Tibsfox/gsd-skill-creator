use std::process::Command;

/// Check if the tmux binary exists in PATH and return its absolute path.
pub fn detect_tmux() -> Option<String> {
    let output = Command::new("which").arg("tmux").output().ok()?;
    if output.status.success() {
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            None
        } else {
            Some(path)
        }
    } else {
        None
    }
}

/// Return the tmux version string (e.g., "tmux 3.4").
pub fn tmux_version() -> Option<String> {
    let output = Command::new("tmux").arg("-V").output().ok()?;
    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if version.is_empty() {
            None
        } else {
            Some(version)
        }
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_tmux_returns_path_or_none() {
        // Should not panic -- returns Some(path) or None depending on environment
        let result = detect_tmux();
        if let Some(ref path) = result {
            assert!(path.contains("tmux"), "path should contain 'tmux', got: {}", path);
        }
        // Either way, no panic is the test
    }

    #[test]
    fn test_tmux_version_format() {
        let version = tmux_version();
        if let Some(ref v) = version {
            assert!(v.starts_with("tmux "), "version should start with 'tmux ', got: {}", v);
        }
    }
}
