//! MagicFilter: gates IPC events by current magic level.
//!
//! Returns true from `should_render` if the event's minimum visibility
//! level is <= the current magic level. Unknown events default to Annotated.

use super::types::{MagicLevel, EVENT_VISIBILITY};

pub struct MagicFilter {
    level: MagicLevel,
}

impl Default for MagicFilter {
    fn default() -> Self {
        MagicFilter {
            level: MagicLevel::default(),
        }
    }
}

impl MagicFilter {
    pub fn new(level: MagicLevel) -> Self {
        MagicFilter { level }
    }

    /// Returns true if the event should be rendered at the current level.
    pub fn should_render(&self, event_type: &str) -> bool {
        let min_level = EVENT_VISIBILITY
            .get(event_type)
            .copied()
            .unwrap_or(MagicLevel::Annotated);
        (self.level as u8) >= (min_level as u8)
    }

    pub fn get_level(&self) -> MagicLevel {
        self.level
    }

    pub fn set_level(&mut self, level: MagicLevel) {
        self.level = level;
    }
}
