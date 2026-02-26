//! Magic level type definitions and event visibility map.
//!
//! Defines the 5 magic levels and maps each IPC event type to
//! the minimum level at which it becomes visible.

use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::sync::LazyLock;

/// Five magic levels controlling output verbosity.
///
/// Lower values = less output. Serializes as integer 1-5.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum MagicLevel {
    FullMagic = 1,
    Guided = 2,
    Annotated = 3,
    Verbose = 4,
    NoMagic = 5,
}

// Custom serde: serialize as integer 1-5
impl Serialize for MagicLevel {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_u8(*self as u8)
    }
}

impl<'de> Deserialize<'de> for MagicLevel {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let val = u8::deserialize(deserializer)?;
        match val {
            1 => Ok(MagicLevel::FullMagic),
            2 => Ok(MagicLevel::Guided),
            3 => Ok(MagicLevel::Annotated),
            4 => Ok(MagicLevel::Verbose),
            5 => Ok(MagicLevel::NoMagic),
            _ => Err(serde::de::Error::custom(format!(
                "invalid magic level: {}",
                val
            ))),
        }
    }
}

impl Default for MagicLevel {
    fn default() -> Self {
        MagicLevel::Annotated
    }
}

/// Persistent magic config stored in magic-level.json.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MagicConfig {
    pub level: MagicLevel,
    pub updated: String,
}

/// Maps IPC event type strings to the minimum MagicLevel for visibility.
pub static EVENT_VISIBILITY: LazyLock<HashMap<&'static str, MagicLevel>> = LazyLock::new(|| {
    let mut m = HashMap::new();
    // Always visible (Level 1)
    m.insert("chat:delta", MagicLevel::FullMagic);
    m.insert("chat:complete", MagicLevel::FullMagic);
    m.insert("chat:error", MagicLevel::FullMagic);
    m.insert("chat:needs_key", MagicLevel::FullMagic);
    m.insert("service:state_change", MagicLevel::FullMagic);
    // Guided (Level 2)
    m.insert("chat:start", MagicLevel::Guided);
    m.insert("chat:usage", MagicLevel::Guided);
    m.insert("chat:retry", MagicLevel::Guided);
    m.insert("chat:invalid_key", MagicLevel::Guided);
    m.insert("chat:rate_limited", MagicLevel::Guided);
    m.insert("chat:interrupted", MagicLevel::Guided);
    m.insert("chat:server_error", MagicLevel::Guided);
    m.insert("service:starting", MagicLevel::Guided);
    m.insert("service:failed", MagicLevel::Guided);
    m.insert("staging:intake_complete", MagicLevel::Guided);
    // Annotated (Level 3)
    m.insert("service:status", MagicLevel::Annotated);
    m.insert("service:command", MagicLevel::Annotated);
    m.insert("service:health_check", MagicLevel::Annotated);
    m.insert("staging:hygiene_result", MagicLevel::Annotated);
    m.insert("staging:intake_new", MagicLevel::Annotated);
    m.insert("staging:intake_processing", MagicLevel::Annotated);
    m.insert("staging:quarantine", MagicLevel::Annotated);
    m.insert("staging:debrief_ready", MagicLevel::Annotated);
    m.insert("magic:level_changed", MagicLevel::Annotated);
    // Verbose (Level 4)
    m.insert("service:stdout", MagicLevel::Verbose);
    m.insert("service:stderr", MagicLevel::Verbose);
    m.insert("staging:intake_detail", MagicLevel::Verbose);
    // No Magic (Level 5)
    m.insert("debug:ipc_raw", MagicLevel::NoMagic);
    m.insert("debug:timing", MagicLevel::NoMagic);
    m
});
