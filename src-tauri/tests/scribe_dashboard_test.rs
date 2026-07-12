//! Integration tests for the SCRIBE dashboard native window opener (CAP-024).
//!
//! These tests verify the static properties of the window configuration
//! (label, dimensions, resource path layout) without requiring a running Tauri
//! app handle — a full GUI test would need a display server and is out of scope
//! for the CI environment.

use gsd_os_lib::scribe_dashboard::{expected_dist_subpath, SCRIBE_WINDOW_LABEL};

/// The window label must be valid for use as a Tauri window identifier.
/// Tauri requires labels to be non-empty and contain only alphanumeric
/// characters or hyphens (no spaces, no underscores on all platforms).
#[test]
fn window_label_is_valid_tauri_identifier() {
    assert!(!SCRIBE_WINDOW_LABEL.is_empty(), "label must not be empty");
    assert!(
        SCRIBE_WINDOW_LABEL
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-'),
        "label must only contain ASCII alphanumeric chars or hyphens, got: {SCRIBE_WINDOW_LABEL}"
    );
}

/// The expected dist sub-path must end with `index.html` so the webview
/// knows which file to load as the root document.
#[test]
fn dist_subpath_ends_with_index_html() {
    let path = expected_dist_subpath();
    assert_eq!(
        path.file_name().and_then(|n| n.to_str()),
        Some("index.html"),
        "dist sub-path must end with index.html, got: {path:?}"
    );
}

/// The expected dist sub-path must start with the `scribe-dashboard`
/// directory name so it matches the `WebviewUrl::App` call and the
/// `bundle.resources` mapping in `tauri.conf.json`.
#[test]
fn dist_subpath_is_rooted_at_scribe_dashboard_dir() {
    let path = expected_dist_subpath();
    let first_component = path
        .components()
        .next()
        .expect("path must have at least one component");
    use std::path::Component;
    match first_component {
        Component::Normal(name) => {
            assert_eq!(
                name.to_str(),
                Some("scribe-dashboard"),
                "first path component must be scribe-dashboard"
            );
        }
        other => panic!("unexpected first component: {other:?}"),
    }
}

/// The source dashboard directory (relative to the repo root) must contain
/// `index.html` — the file that the Tauri resource bundle copies.
///
/// This test validates the `bundle.resources` mapping in `tauri.conf.json` is
/// pointed at an actual file, catching drift if the dashboard is moved.
#[test]
fn source_dashboard_index_html_exists() {
    // From `src-tauri/tests/` we walk up two levels to reach the repo root,
    // then descend into the dashboard directory.
    let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let dashboard_index = manifest_dir
        .join("..")
        .join("examples")
        .join("cartridges")
        .join("dashboard-lod-rendering")
        .join("dashboard")
        .join("index.html");

    assert!(
        dashboard_index.exists(),
        "dashboard index.html not found at expected path: {dashboard_index:?}\n\
         Update tauri.conf.json bundle.resources if the dashboard was moved."
    );
}

/// The source dashboard directory must also contain `app.js` and
/// `webgpu-layout.js` (the two JS files the dashboard loads).
/// These are on the no-touch list per the agent coordination note in the task;
/// this test catches accidental deletion.
#[test]
fn source_dashboard_js_files_exist() {
    let manifest_dir = std::path::Path::new(env!("CARGO_MANIFEST_DIR"));
    let dashboard_dir = manifest_dir
        .join("..")
        .join("examples")
        .join("cartridges")
        .join("dashboard-lod-rendering")
        .join("dashboard");

    for filename in &["app.js", "webgpu-layout.js"] {
        let path = dashboard_dir.join(filename);
        assert!(
            path.exists(),
            "required dashboard file missing: {path:?}\n\
             These files are on the no-touch list and must not be deleted."
        );
    }
}
