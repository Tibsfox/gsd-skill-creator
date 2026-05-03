//! Intelligence Dashboard — Rust module.
//!
//! Re-exports all public symbols from the intelligence submodules.
//! Phase 824 / C07.

pub mod real_kb;
pub mod server;
pub mod types;
pub mod watchers;

pub use server::{
    IntelligenceState,
    intelligence_list_projects,
    intelligence_get_project,
    intelligence_register_project,
    intelligence_get_briefing,
    intelligence_list_findings,
    intelligence_dismiss_finding,
    intelligence_start_meeting,
    intelligence_park_meeting,
    intelligence_resume_meeting,
    intelligence_add_decision,
    intelligence_edit_decision,
    intelligence_withdraw_decision,
    intelligence_send_now,
    intelligence_preview_bundle,
    intelligence_commit_bundle,
    intelligence_request_briefing_refresh,
    intelligence_request_snapshot_diff,
    intelligence_get_meeting_record,
};
