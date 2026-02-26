//! Magic level persistence to `.planning/config/magic-level.json`.
//!
//! Loads and saves the magic level. Returns Annotated (3) on any error
//! (missing file, invalid JSON, out-of-range value).

use std::fs;
use std::path::Path;
use std::time::SystemTime;

use super::types::{MagicConfig, MagicLevel};

const CONFIG_FILE: &str = "magic-level.json";

/// Load magic level from config dir. Returns Annotated (3) on any error.
pub fn load_magic_level(config_dir: &Path) -> MagicLevel {
    let path = config_dir.join(CONFIG_FILE);
    match fs::read_to_string(&path) {
        Ok(contents) => match serde_json::from_str::<MagicConfig>(&contents) {
            Ok(config) => config.level,
            Err(_) => MagicLevel::default(),
        },
        Err(_) => MagicLevel::default(),
    }
}

/// Save magic level to config dir. Creates file if it does not exist.
pub fn save_magic_level(config_dir: &Path, level: MagicLevel) -> Result<(), String> {
    let path = config_dir.join(CONFIG_FILE);
    // Ensure directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Failed to create config dir: {}", e))?;
    }
    let config = MagicConfig {
        level,
        updated: iso_timestamp(),
    };
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}

/// Generate an ISO 8601 timestamp from SystemTime.
fn iso_timestamp() -> String {
    let duration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // Simple UTC date-time calculation
    let days = secs / 86400;
    let time_of_day = secs % 86400;
    let hours = time_of_day / 3600;
    let minutes = (time_of_day % 3600) / 60;
    let seconds = time_of_day % 60;

    // Days since 1970-01-01 to Y-M-D
    let (year, month, day) = days_to_ymd(days);

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day, hours, minutes, seconds
    )
}

/// Convert days since Unix epoch to (year, month, day).
fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    // Algorithm from https://howardhinnant.github.io/date_algorithms.html
    let z = days + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
