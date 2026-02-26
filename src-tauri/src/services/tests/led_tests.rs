use crate::services::led::*;
use crate::services::types::*;

#[test]
fn test_offline_is_red() {
    assert_eq!(led_color_for_state(&ServiceState::Offline), LedColor::Red);
}

#[test]
fn test_starting_is_amber() {
    assert_eq!(
        led_color_for_state(&ServiceState::Starting),
        LedColor::Amber
    );
}

#[test]
fn test_online_is_green() {
    assert_eq!(
        led_color_for_state(&ServiceState::Online),
        LedColor::Green
    );
}

#[test]
fn test_degraded_is_amber_blink() {
    assert_eq!(
        led_color_for_state(&ServiceState::Degraded),
        LedColor::AmberBlink
    );
}

#[test]
fn test_failed_is_red_blink() {
    assert_eq!(
        led_color_for_state(&ServiceState::Failed("error".into())),
        LedColor::RedBlink
    );
}

#[test]
fn test_led_color_as_str() {
    assert_eq!(LedColor::Red.as_str(), "red");
    assert_eq!(LedColor::Amber.as_str(), "amber");
    assert_eq!(LedColor::Green.as_str(), "green");
    assert_eq!(LedColor::AmberBlink.as_str(), "amber-blink");
    assert_eq!(LedColor::RedBlink.as_str(), "red-blink");
}

#[test]
fn test_led_color_is_blinking() {
    assert!(LedColor::AmberBlink.is_blinking());
    assert!(LedColor::RedBlink.is_blinking());
    assert!(!LedColor::Green.is_blinking());
    assert!(!LedColor::Red.is_blinking());
    assert!(!LedColor::Amber.is_blinking());
}
