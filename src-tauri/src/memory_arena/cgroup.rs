//! cgroup v2 memory enforcement for the arena subsystem.
//!
//! Reads and writes the process's own cgroup `memory.max` and
//! `memory.swap.max` to enforce:
//!
//! - Start at 8 GiB
//! - Grow in 4 GiB increments on demand
//! - Hard cap at 48 GiB (never exceed)
//! - Swap = 0 always (OS swap is forbidden by design)
//!
//! This is NOT a general cgroup library. It's a single-purpose enforcer
//! for the memory arena's budget: 32–48 GiB RAM working set, NVMe as
//! the swap tier (managed by us, not the kernel).

use std::fs;
use std::io;
use std::path::{Path, PathBuf};

use crate::memory_arena::error::{ArenaError, ArenaResult};

// =========================================================================
// Constants
// =========================================================================

/// Initial memory budget: 8 GiB.
pub const INITIAL_LIMIT_BYTES: u64 = 8 * 1024 * 1024 * 1024;

/// Growth step: 4 GiB per expansion.
pub const GROWTH_STEP_BYTES: u64 = 4 * 1024 * 1024 * 1024;

/// Absolute ceiling: 48 GiB. Never exceed this.
pub const HARD_CAP_BYTES: u64 = 48 * 1024 * 1024 * 1024;

/// Swap limit: always 0 (swap is forbidden).
pub const SWAP_LIMIT_BYTES: u64 = 0;

// =========================================================================
// CgroupEnforcer
// =========================================================================

/// Reads and writes cgroup v2 memory controls for this process's cgroup.
///
/// The enforcer finds the process's cgroup path from `/proc/self/cgroup`,
/// then reads/writes `memory.max`, `memory.swap.max`, and `memory.current`
/// under `/sys/fs/cgroup/<path>/`.
#[derive(Debug)]
pub struct CgroupEnforcer {
    /// Resolved path to the cgroup directory.
    cgroup_dir: PathBuf,
    /// Current memory.max setting (cached after last write).
    current_limit: u64,
}

/// Snapshot of cgroup memory state.
#[derive(Debug, Clone)]
pub struct CgroupMemoryState {
    /// memory.max in bytes (u64::MAX if "max").
    pub limit_bytes: u64,
    /// memory.current in bytes.
    pub current_bytes: u64,
    /// memory.swap.max in bytes (u64::MAX if "max").
    pub swap_limit_bytes: u64,
    /// Headroom: limit - current (0 if over limit).
    pub headroom_bytes: u64,
    /// Utilization ratio: current / limit (0.0..=1.0).
    pub utilization: f64,
}

impl CgroupEnforcer {
    /// Discover this process's cgroup and create an enforcer.
    ///
    /// Reads `/proc/self/cgroup` to find the cgroup v2 path, then
    /// verifies `memory.max` is writable.
    pub fn discover() -> ArenaResult<Self> {
        let cgroup_path = read_self_cgroup_path()?;
        let cgroup_dir = Path::new("/sys/fs/cgroup").join(cgroup_path.trim_start_matches('/'));

        if !cgroup_dir.exists() {
            return Err(ArenaError::CgroupError(format!(
                "cgroup dir not found: {}",
                cgroup_dir.display()
            )));
        }

        let limit = read_memory_file(&cgroup_dir.join("memory.max"))?;

        Ok(Self {
            cgroup_dir,
            current_limit: limit,
        })
    }

    /// Create an enforcer for a specific cgroup path (for testing or
    /// when the cgroup is known).
    pub fn from_path(cgroup_dir: PathBuf) -> ArenaResult<Self> {
        let limit = read_memory_file(&cgroup_dir.join("memory.max"))?;
        Ok(Self {
            cgroup_dir,
            current_limit: limit,
        })
    }

    /// Read the current cgroup memory state.
    pub fn state(&self) -> ArenaResult<CgroupMemoryState> {
        let limit = read_memory_file(&self.cgroup_dir.join("memory.max"))?;
        let current = read_memory_file(&self.cgroup_dir.join("memory.current"))?;
        let swap_limit = read_memory_file(&self.cgroup_dir.join("memory.swap.max"))
            .unwrap_or(u64::MAX);

        let headroom = limit.saturating_sub(current);
        let utilization = if limit > 0 && limit < u64::MAX {
            current as f64 / limit as f64
        } else {
            0.0
        };

        Ok(CgroupMemoryState {
            limit_bytes: limit,
            current_bytes: current,
            swap_limit_bytes: swap_limit,
            headroom_bytes: headroom,
            utilization,
        })
    }

    /// Current memory.max in bytes.
    pub fn current_limit(&self) -> u64 {
        self.current_limit
    }

    /// Path to the cgroup directory.
    pub fn cgroup_dir(&self) -> &Path {
        &self.cgroup_dir
    }

    /// Set the initial memory limit (8 GiB) and disable swap.
    pub fn initialize(&mut self) -> ArenaResult<()> {
        self.set_limit(INITIAL_LIMIT_BYTES)?;
        self.disable_swap()?;
        Ok(())
    }

    /// Grow the memory limit by one step (4 GiB), up to the hard cap.
    /// Returns the new limit, or the current limit if already at cap.
    pub fn grow(&mut self) -> ArenaResult<u64> {
        let new_limit = (self.current_limit + GROWTH_STEP_BYTES).min(HARD_CAP_BYTES);
        if new_limit == self.current_limit {
            return Ok(self.current_limit);
        }
        self.set_limit(new_limit)?;
        Ok(new_limit)
    }

    /// Check if we can grow (not yet at hard cap).
    pub fn can_grow(&self) -> bool {
        self.current_limit < HARD_CAP_BYTES
    }

    /// Set memory.max to a specific value. Clamped to HARD_CAP_BYTES.
    pub fn set_limit(&mut self, bytes: u64) -> ArenaResult<()> {
        let clamped = bytes.min(HARD_CAP_BYTES);
        write_memory_file(&self.cgroup_dir.join("memory.max"), clamped)?;
        self.current_limit = clamped;
        Ok(())
    }

    /// Set memory.swap.max to 0 (disable OS swap).
    pub fn disable_swap(&self) -> ArenaResult<()> {
        let swap_path = self.cgroup_dir.join("memory.swap.max");
        if swap_path.exists() {
            write_memory_file(&swap_path, SWAP_LIMIT_BYTES)?;
        }
        Ok(())
    }

    /// Check if there's enough headroom for an allocation of `bytes`.
    /// Returns true if headroom >= bytes.
    pub fn has_headroom(&self, bytes: u64) -> ArenaResult<bool> {
        let state = self.state()?;
        Ok(state.headroom_bytes >= bytes)
    }

    /// Try to ensure headroom for `bytes` by growing if needed.
    /// Returns Ok(true) if headroom is sufficient (possibly after growing),
    /// Ok(false) if at hard cap and still insufficient.
    pub fn ensure_headroom(&mut self, bytes: u64) -> ArenaResult<bool> {
        loop {
            let state = self.state()?;
            if state.headroom_bytes >= bytes {
                return Ok(true);
            }
            if !self.can_grow() {
                return Ok(false);
            }
            self.grow()?;
        }
    }
}

// =========================================================================
// Helpers
// =========================================================================

/// Read `/proc/self/cgroup` and extract the cgroup v2 path.
/// On cgroup v2, the file contains a single line: `0::/path`.
fn read_self_cgroup_path() -> ArenaResult<String> {
    let content = fs::read_to_string("/proc/self/cgroup")
        .map_err(|e| ArenaError::CgroupError(format!("/proc/self/cgroup: {e}")))?;

    // cgroup v2 format: "0::<path>\n"
    for line in content.lines() {
        if line.starts_with("0::") {
            return Ok(line[3..].to_string());
        }
    }

    Err(ArenaError::CgroupError(
        "no cgroup v2 entry in /proc/self/cgroup".to_string(),
    ))
}

/// Read a cgroup memory control file. Returns the value in bytes.
/// "max" is mapped to u64::MAX.
fn read_memory_file(path: &Path) -> ArenaResult<u64> {
    let content = fs::read_to_string(path)
        .map_err(|e| ArenaError::CgroupError(format!("{}: {e}", path.display())))?;
    let trimmed = content.trim();
    if trimmed == "max" {
        return Ok(u64::MAX);
    }
    trimmed
        .parse::<u64>()
        .map_err(|e| ArenaError::CgroupError(format!("{}: parse error: {e}", path.display())))
}

/// Write a value to a cgroup memory control file.
fn write_memory_file(path: &Path, bytes: u64) -> ArenaResult<()> {
    let value = if bytes == u64::MAX {
        "max".to_string()
    } else {
        bytes.to_string()
    };
    fs::write(path, value.as_bytes())
        .map_err(|e| ArenaError::CgroupError(format!("{}: write error: {e}", path.display())))
}
