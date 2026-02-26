//! Tests for magic level definitions, event visibility, and filter engine.

use crate::magic::types::{MagicLevel, EVENT_VISIBILITY};
use crate::magic::filter::MagicFilter;

#[test]
fn test_magic_level_values() {
    assert_eq!(MagicLevel::FullMagic as u8, 1);
    assert_eq!(MagicLevel::Guided as u8, 2);
    assert_eq!(MagicLevel::Annotated as u8, 3);
    assert_eq!(MagicLevel::Verbose as u8, 4);
    assert_eq!(MagicLevel::NoMagic as u8, 5);
}

#[test]
fn test_default_level_annotated() {
    let filter = MagicFilter::default();
    assert_eq!(filter.get_level(), MagicLevel::Annotated);
}

#[test]
fn test_chat_delta_visible_at_all_levels() {
    for level_val in 1..=5u8 {
        let level = match level_val {
            1 => MagicLevel::FullMagic,
            2 => MagicLevel::Guided,
            3 => MagicLevel::Annotated,
            4 => MagicLevel::Verbose,
            5 => MagicLevel::NoMagic,
            _ => unreachable!(),
        };
        let filter = MagicFilter::new(level);
        assert!(
            filter.should_render("chat:delta"),
            "chat:delta should be visible at level {}",
            level_val
        );
    }
}

#[test]
fn test_chat_error_visible_at_all_levels() {
    for level_val in 1..=5u8 {
        let level = match level_val {
            1 => MagicLevel::FullMagic,
            2 => MagicLevel::Guided,
            3 => MagicLevel::Annotated,
            4 => MagicLevel::Verbose,
            5 => MagicLevel::NoMagic,
            _ => unreachable!(),
        };
        let filter = MagicFilter::new(level);
        assert!(
            filter.should_render("chat:error"),
            "chat:error should be visible at level {}",
            level_val
        );
    }
}

#[test]
fn test_debug_ipc_raw_only_at_level_5() {
    let filter_4 = MagicFilter::new(MagicLevel::Verbose);
    assert!(!filter_4.should_render("debug:ipc_raw"));

    let filter_5 = MagicFilter::new(MagicLevel::NoMagic);
    assert!(filter_5.should_render("debug:ipc_raw"));
}

#[test]
fn test_service_stdout_at_level_4() {
    let filter_4 = MagicFilter::new(MagicLevel::Verbose);
    assert!(filter_4.should_render("service:stdout"));

    let filter_3 = MagicFilter::new(MagicLevel::Annotated);
    assert!(!filter_3.should_render("service:stdout"));
}

#[test]
fn test_unknown_event_defaults_to_annotated() {
    let filter_3 = MagicFilter::new(MagicLevel::Annotated);
    assert!(filter_3.should_render("unknown:event"));

    let filter_2 = MagicFilter::new(MagicLevel::Guided);
    assert!(!filter_2.should_render("unknown:event"));
}

#[test]
fn test_magic_level_serde_roundtrip() {
    let json = serde_json::to_string(&MagicLevel::FullMagic).unwrap();
    assert_eq!(json, "1");

    let deserialized: MagicLevel = serde_json::from_str("3").unwrap();
    assert_eq!(deserialized, MagicLevel::Annotated);
}

#[test]
fn test_event_visibility_completeness() {
    assert_eq!(
        EVENT_VISIBILITY.len(),
        29,
        "EVENT_VISIBILITY must have entries for all 29 IPC event types"
    );
}
