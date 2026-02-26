//! Tauri commands for magic level get/set with file persistence.
//!
//! Replaces the stubs from Phase 375-02 in commands/ipc.rs.

use serde_json::json;
use std::path::PathBuf;

use crate::magic::persistence;
use crate::magic::types::MagicLevel;

fn config_dir() -> PathBuf {
    // .planning/config/ relative to the app's working directory
    PathBuf::from(".planning/config")
}

/// Set the magic verbosity level (1-5) with persistence.
#[tauri::command]
pub async fn set_magic_level(level: u8) -> Result<serde_json::Value, String> {
    if !(1..=5).contains(&level) {
        return Err("Magic level must be 1-5".to_string());
    }
    let new_level = match level {
        1 => MagicLevel::FullMagic,
        2 => MagicLevel::Guided,
        3 => MagicLevel::Annotated,
        4 => MagicLevel::Verbose,
        5 => MagicLevel::NoMagic,
        _ => unreachable!(),
    };
    let previous = persistence::load_magic_level(&config_dir());
    persistence::save_magic_level(&config_dir(), new_level)?;
    Ok(json!({ "level": level, "previous_level": previous as u8 }))
}

/// Get the current magic verbosity level from persisted config.
#[tauri::command]
pub async fn get_magic_level() -> Result<serde_json::Value, String> {
    let level = persistence::load_magic_level(&config_dir());
    Ok(json!({ "level": level as u8 }))
}
