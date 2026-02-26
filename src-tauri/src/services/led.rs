//! LED color mapping from service state to visual indicator.
//!
//! Maps each ServiceState variant to a specific LED color for the
//! GSD-OS taskbar indicator strip. Supports blinking for degraded/failed states.

use serde::{Deserialize, Serialize};
use std::fmt;

use super::types::ServiceState;

/// LED color for a service indicator.
///
/// Colors map to the GSD-OS taskbar LED strip:
/// - Red: service offline (not running)
/// - Amber: service starting (transitioning)
/// - Green: service online (healthy)
/// - AmberBlink: service degraded (health checks failing)
/// - RedBlink: service failed (critical, needs restart)
#[derive(Serialize, Deserialize, Debug, Clone, Copy, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum LedColor {
    Red,
    Amber,
    Green,
    AmberBlink,
    RedBlink,
}

impl LedColor {
    /// Return the string representation of this LED color.
    pub fn as_str(&self) -> &'static str {
        match self {
            LedColor::Red => "red",
            LedColor::Amber => "amber",
            LedColor::Green => "green",
            LedColor::AmberBlink => "amber-blink",
            LedColor::RedBlink => "red-blink",
        }
    }

    /// Return true if this LED color is blinking.
    pub fn is_blinking(&self) -> bool {
        matches!(self, LedColor::AmberBlink | LedColor::RedBlink)
    }
}

impl fmt::Display for LedColor {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

/// Map a service state to its corresponding LED color.
///
/// - Offline -> Red
/// - Starting -> Amber
/// - Online -> Green
/// - Degraded -> AmberBlink
/// - Failed(_) -> RedBlink
pub fn led_color_for_state(state: &ServiceState) -> LedColor {
    match state {
        ServiceState::Offline => LedColor::Red,
        ServiceState::Starting => LedColor::Amber,
        ServiceState::Online => LedColor::Green,
        ServiceState::Degraded => LedColor::AmberBlink,
        ServiceState::Failed(_) => LedColor::RedBlink,
    }
}
