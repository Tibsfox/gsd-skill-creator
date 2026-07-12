//! Intelligence Dashboard — Rust module.
//!
//! Re-exports all public symbols from the intelligence submodules.
//! Phase 824 / C07. Atlas commands added v1.49.607 W1 Track C.
//! Atlas sidecar (Node.js child-process dispatch) added v1.49.607 H1.

pub mod atlas;
pub mod atlas_sidecar;
pub mod real_kb;
pub mod server;
pub mod types;
pub mod watchers;

pub use server::{
    intelligence_add_decision, intelligence_commit_bundle, intelligence_dismiss_finding,
    intelligence_edit_decision, intelligence_get_briefing, intelligence_get_meeting_record,
    intelligence_get_project, intelligence_list_findings, intelligence_list_projects,
    intelligence_park_meeting, intelligence_preview_bundle, intelligence_register_project,
    intelligence_request_briefing_refresh, intelligence_request_snapshot_diff,
    intelligence_resume_meeting, intelligence_send_now, intelligence_start_meeting,
    intelligence_withdraw_decision, IntelligenceState,
};

pub use atlas::{
    atlas_find_symbols_by_qualified_name, atlas_get_symbol, atlas_list_callees, atlas_list_callers,
    atlas_list_files_changed_by_mission, atlas_list_missions_for_file,
    atlas_list_provenance_for_line, atlas_list_references_for_symbol, atlas_list_symbols_for_file,
    atlas_list_type_relations_from, atlas_list_type_relations_to, atlas_request_index_snapshot,
    AtlasState,
};
