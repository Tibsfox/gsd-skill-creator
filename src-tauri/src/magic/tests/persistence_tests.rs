//! Tests for magic level persistence (file I/O round-trip, defaults, error handling).

use std::fs;
use std::path::PathBuf;

use crate::magic::persistence::{load_magic_level, save_magic_level};
use crate::magic::types::MagicLevel;

fn temp_dir(name: &str) -> PathBuf {
    let dir = std::env::temp_dir().join(format!("gsd-magic-test-{}-{}", name, std::process::id()));
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(&dir).unwrap();
    dir
}

#[test]
fn test_save_and_load_roundtrip() {
    let dir = temp_dir("roundtrip");
    save_magic_level(&dir, MagicLevel::Verbose).unwrap();
    let level = load_magic_level(&dir);
    assert_eq!(level, MagicLevel::Verbose);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_load_default_when_no_file() {
    let dir = temp_dir("no-file");
    let level = load_magic_level(&dir);
    assert_eq!(level, MagicLevel::Annotated);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_load_default_on_invalid_json() {
    let dir = temp_dir("invalid-json");
    fs::write(dir.join("magic-level.json"), "not json").unwrap();
    let level = load_magic_level(&dir);
    assert_eq!(level, MagicLevel::Annotated);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_load_default_on_invalid_level_value() {
    let dir = temp_dir("invalid-level");
    fs::write(
        dir.join("magic-level.json"),
        r#"{"level": 99, "updated": "2026-01-01T00:00:00Z"}"#,
    )
    .unwrap();
    let level = load_magic_level(&dir);
    assert_eq!(level, MagicLevel::Annotated);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_save_creates_file() {
    let dir = temp_dir("creates-file");
    save_magic_level(&dir, MagicLevel::FullMagic).unwrap();
    let path = dir.join("magic-level.json");
    assert!(path.exists());
    let contents = fs::read_to_string(&path).unwrap();
    assert!(contents.contains("\"level\": 1") || contents.contains("\"level\":1"));
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_save_overwrites_existing() {
    let dir = temp_dir("overwrite");
    save_magic_level(&dir, MagicLevel::Verbose).unwrap();
    save_magic_level(&dir, MagicLevel::Guided).unwrap();
    let level = load_magic_level(&dir);
    assert_eq!(level, MagicLevel::Guided);
    let _ = fs::remove_dir_all(&dir);
}

#[test]
fn test_config_includes_timestamp() {
    let dir = temp_dir("timestamp");
    save_magic_level(&dir, MagicLevel::Annotated).unwrap();
    let contents = fs::read_to_string(dir.join("magic-level.json")).unwrap();
    assert!(contents.contains("\"updated\""));
    // Updated field should be non-empty
    let parsed: serde_json::Value = serde_json::from_str(&contents).unwrap();
    let updated = parsed["updated"].as_str().unwrap();
    assert!(!updated.is_empty());
    let _ = fs::remove_dir_all(&dir);
}
