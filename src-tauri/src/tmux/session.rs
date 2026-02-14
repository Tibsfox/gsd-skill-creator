use std::process::Command;

/// Represents a tmux session with its metadata.
#[derive(Debug, Clone)]
pub struct TmuxSession {
    pub name: String,
    pub created: String,
    pub attached: bool,
    pub windows: u32,
}

/// Parse a single tmux list-sessions output line.
///
/// Expected format: `name|created_timestamp|attached_flag|window_count`
/// where attached_flag is "0" or "1" and window_count is a number.
pub fn parse_session_line(line: &str) -> Option<TmuxSession> {
    let parts: Vec<&str> = line.split('|').collect();
    if parts.len() != 4 {
        return None;
    }

    let name = parts[0].to_string();
    if name.is_empty() {
        return None;
    }

    let created = parts[1].to_string();
    let attached = parts[2] == "1";
    let windows = parts[3].parse::<u32>().ok()?;

    Some(TmuxSession {
        name,
        created,
        attached,
        windows,
    })
}

/// List all running tmux sessions.
///
/// Runs `tmux list-sessions` and parses the output. Returns an empty
/// vec if the tmux server is not running (not an error condition).
pub fn list_sessions() -> Result<Vec<TmuxSession>, String> {
    let output = Command::new("tmux")
        .args([
            "list-sessions",
            "-F",
            "#{session_name}|#{session_created}|#{session_attached}|#{session_windows}",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        // "no server running" or "no sessions" means no tmux server -- not an error
        if stderr.contains("no server running") || stderr.contains("no sessions") {
            return Ok(vec![]);
        }
        return Err(format!("tmux list-sessions failed: {}", stderr.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let sessions = stdout
        .lines()
        .filter(|line| !line.is_empty())
        .filter_map(parse_session_line)
        .collect();

    Ok(sessions)
}

/// Check whether a tmux session with the given name exists.
pub fn has_session(name: &str) -> bool {
    Command::new("tmux")
        .args(["has-session", "-t", name])
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

/// Create a new detached tmux session with the given name.
///
/// Sets initial window size to 200x50 to avoid the tmux 80x24 default
/// which may be too small for the desktop terminal.
pub fn create_session(name: &str) -> Result<(), String> {
    let output = Command::new("tmux")
        .args(["new-session", "-d", "-s", name, "-x", "200", "-y", "50"])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("tmux new-session failed: {}", stderr.trim()))
    }
}

/// Kill a tmux session by name.
pub fn kill_session(name: &str) -> Result<(), String> {
    let output = Command::new("tmux")
        .args(["kill-session", "-t", name])
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("tmux kill-session failed: {}", stderr.trim()))
    }
}

/// Return the command args to attach to a tmux session.
///
/// This is a pure function -- it does not execute any command. The
/// returned args are passed to pty_open so the PTY spawns inside tmux.
pub fn attach_command(name: &str) -> Vec<String> {
    vec![
        "tmux".into(),
        "attach-session".into(),
        "-t".into(),
        name.into(),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_attach_command_format() {
        let args = attach_command("gsd");
        assert_eq!(args, vec!["tmux", "attach-session", "-t", "gsd"]);
    }

    #[test]
    fn test_parse_session_line_valid() {
        let session = parse_session_line("gsd|1707900000|1|3").unwrap();
        assert_eq!(session.name, "gsd");
        assert_eq!(session.created, "1707900000");
        assert!(session.attached);
        assert_eq!(session.windows, 3);
    }

    #[test]
    fn test_parse_session_line_unattached() {
        let session = parse_session_line("dev|1707800000|0|1").unwrap();
        assert_eq!(session.name, "dev");
        assert!(!session.attached);
        assert_eq!(session.windows, 1);
    }

    #[test]
    fn test_parse_session_line_invalid() {
        assert!(parse_session_line("").is_none());
        assert!(parse_session_line("only-name").is_none());
        assert!(parse_session_line("a|b").is_none());
    }

    #[test]
    fn test_list_sessions_empty_on_no_server() {
        // When tmux is not running or no sessions exist, should return empty vec.
        // We can't guarantee tmux state in CI, so this test validates the
        // parsing logic returns empty for empty input.
        let empty_output = "";
        // parse_session_line on empty returns None, so empty input => empty vec
        let sessions: Vec<TmuxSession> = empty_output
            .lines()
            .filter_map(parse_session_line)
            .collect();
        assert!(sessions.is_empty());
    }
}
