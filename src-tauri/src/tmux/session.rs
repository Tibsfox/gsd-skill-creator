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
    todo!()
}

/// List all running tmux sessions.
///
/// Runs `tmux list-sessions` and parses the output. Returns an empty
/// vec if the tmux server is not running (not an error condition).
pub fn list_sessions() -> Result<Vec<TmuxSession>, String> {
    todo!()
}

/// Check whether a tmux session with the given name exists.
pub fn has_session(name: &str) -> bool {
    todo!()
}

/// Create a new detached tmux session with the given name.
pub fn create_session(name: &str) -> Result<(), String> {
    todo!()
}

/// Kill a tmux session by name.
pub fn kill_session(name: &str) -> Result<(), String> {
    todo!()
}

/// Return the command args to attach to a tmux session.
///
/// This is a pure function -- it does not execute any command. The
/// returned args are passed to pty_open so the PTY spawns inside tmux.
pub fn attach_command(name: &str) -> Vec<String> {
    todo!()
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
