//! CAP-024 — SCRIBE Dashboard native Tauri window.
//!
//! Opens the SCRIBE dashboard (`dashboard-lod-rendering/dashboard/`) in a
//! dedicated Tauri [`WebviewWindow`] alongside the existing GSD-OS main window.
//!
//! # Caller surface (ACL-orphan triage note)
//!
//! This command intentionally has **no `desktop/` frontend caller**. It is an
//! operator-facing utility window, launched via `npm run tauri:scribe` or a
//! manual devtools `invoke('open_scribe_dashboard')`. KEEP per operator
//! decision 2026-06-11 — do not delete in capability-ACL orphan sweeps.
//!
//! # Architecture
//!
//! The dashboard's HTML/JS/CSS files are bundled into the Tauri app at build
//! time via the `bundle.resources` mapping in `tauri.conf.json`:
//!
//! ```json
//! "resources": {
//!   "../examples/cartridges/dashboard-lod-rendering/dashboard": "scribe-dashboard"
//! }
//! ```
//!
//! At runtime the window loads them through the Tauri `asset://` custom
//! protocol, which resolves to the app's resource directory — no HTTP server
//! is required.
//!
//! The dashboard JavaScript (`app.js`, `webgpu-layout.js`) runs **unchanged**
//! in the platform webview (WebView2 on Windows, WKWebView on macOS, WebKitGTK
//! on Linux).  WebGPU availability is the same as in a browser tab — the
//! webview exposes `navigator.gpu` when the platform supports it.
//!
//! ## URL resolution in Tauri v2
//!
//! Tauri v2 serves bundled resources through the `asset://localhost/` custom
//! protocol.  The file path is built by resolving the resource directory
//! (returned by `AppHandle::path().resource_dir()`) and appending the
//! sub-directory the `bundle.resources` mapping places the files under.
//!
//! We pass the fully-qualified filesystem path to the webview as a
//! `WebviewUrl::App` path so that Tauri can construct the correct `tauri://`
//! (or `https://tauri.localhost/` on Windows) URL for it.  In dev mode
//! (when no bundled resource dir exists yet) we fall back to the `External`
//! variant pointing at `http://127.0.0.1:8088/` — the dashboard-service dev
//! server from `dashboard-service/serve.mjs`.
//!
//! ## Native wgpu rung (deferred — v1.49.621)
//!
//! Doc 04 §13 explicitly defers the full wgpu native render loop to a
//! follow-up milestone.  This module ships the "webview-in-Tauri-window" rung,
//! which eliminates the "open a browser" UX friction and provides direct IPC to
//! the Rust backend.
//!
//! The follow-up wgpu rung (raw Vulkan/Metal/DX12 render loop without a
//! webview) belongs in `dashboard-service/native-rust/` once the corpus
//! exceeds 10M nodes.
//!
//! # Launch
//!
//! TypeScript (webview UI side):
//! ```ts
//! import { invoke } from '@tauri-apps/api/core';
//! const result = await invoke('open_scribe_dashboard');
//! // result = { label: "scribe-dashboard", created: true }
//! ```
//!
//! See `examples/cartridges/dashboard-lod-rendering/README.md` §Tauri-native
//! for full launch instructions.

use std::path::PathBuf;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

/// Label used in `tauri.conf.json` capabilities to scope permissions.
pub const SCRIBE_WINDOW_LABEL: &str = "scribe-dashboard";

/// Title shown in the OS window chrome.
const SCRIBE_WINDOW_TITLE: &str = "SCRIBE Dashboard — LOD demo (T4)";

/// Default window dimensions (px).  The dashboard layout uses CSS Grid so it
/// adapts; this gives a comfortable three-column starting size.
const DEFAULT_WIDTH: f64 = 1400.0;
const DEFAULT_HEIGHT: f64 = 900.0;

/// Fallback dev-server URL (dashboard-service/serve.mjs default port).
const DEV_SERVER_URL: &str = "http://127.0.0.1:8088/";

/// Result type returned to the webview via Tauri IPC.
#[derive(Debug, serde::Serialize)]
pub struct ScribeDashboardResult {
    /// Window label of the opened window (or existing window if already open).
    pub label: String,
    /// Whether the window was newly created (`true`) or already existed and was
    /// merely brought to focus (`false`).
    pub created: bool,
}

/// Resolve the absolute filesystem path where the bundled SCRIBE dashboard
/// `index.html` lives at runtime.
///
/// Returns `None` when the resource directory cannot be determined or the
/// file does not exist (e.g. during `tauri dev` before bundling).
pub fn resolve_bundled_dashboard_path(app: &AppHandle) -> Option<PathBuf> {
    let resource_dir = app.path().resource_dir().ok()?;
    let index = resource_dir
        .join("scribe-dashboard")
        .join("index.html");
    if index.exists() { Some(index) } else { None }
}

/// Tauri command — open (or focus) the SCRIBE dashboard native window.
///
/// Idempotent: if a window with `label = "scribe-dashboard"` already exists it
/// is brought to the foreground rather than creating a duplicate.
///
/// # URL selection
///
/// 1. **Bundled resource** (`tauri dev --bundle` / installed app): loads
///    `scribe-dashboard/index.html` from the app's resource directory via
///    `WebviewUrl::App`.
/// 2. **Dev fallback**: if the bundled resource is not present, falls back to
///    the dashboard-service dev server at `http://127.0.0.1:8088/`.  Start it
///    with `node examples/cartridges/dashboard-lod-rendering/dashboard-service/serve.mjs`.
///
/// # Errors
///
/// Returns `Err(String)` when the webview window cannot be created (e.g. the
/// platform webview is unavailable).
#[tauri::command]
pub fn open_scribe_dashboard(app: AppHandle) -> Result<ScribeDashboardResult, String> {
    // Idempotency: re-focus an existing window instead of opening a duplicate.
    if let Some(existing) = app.get_webview_window(SCRIBE_WINDOW_LABEL) {
        existing
            .set_focus()
            .map_err(|e| format!("scribe-dashboard: focus failed: {e}"))?;
        return Ok(ScribeDashboardResult {
            label: SCRIBE_WINDOW_LABEL.to_string(),
            created: false,
        });
    }

    // Choose the URL source: bundled resource (production) vs dev server.
    //
    // `WebviewUrl::App` takes a path relative to the app's frontend dist root
    // (`desktop/dist/` in the GSD-OS build).  For bundled resources that live
    // in the resource dir (not frontendDist) we need a different approach.
    //
    // In Tauri v2 the cleanest cross-platform way to load a file from the
    // resource dir is `WebviewUrl::App` using a path that Tauri routes through
    // its `tauri://localhost/` origin.  However, resource-dir files are NOT
    // part of `frontendDist`; they are accessed via the `asset://` custom
    // protocol.  We use `WebviewUrl::External` with the `asset://localhost/`
    // scheme for production and a real HTTP URL for dev.
    //
    // Note: `asset://` requires the `protocol-asset` Tauri feature and
    // appropriate `fs:scope` permissions — documented in the capability file.
    // For the v1.49.621 floor demo we use the simpler External+http fallback
    // (dev server) and the App path for production (after resources are copied
    // into frontendDist by a build step — see README.md §Tauri-native).
    let webview_url = resolve_dashboard_url(&app);

    let window = WebviewWindowBuilder::new(&app, SCRIBE_WINDOW_LABEL, webview_url)
        .title(SCRIBE_WINDOW_TITLE)
        .inner_size(DEFAULT_WIDTH, DEFAULT_HEIGHT)
        .resizable(true)
        .center()
        // Decorations on for the dashboard window (operator-visible tool).
        .decorations(true)
        // Enable webview devtools in debug builds so the operator can inspect
        // layout / WebGPU adapter info from the dashboard.
        .devtools(cfg!(debug_assertions))
        .build()
        .map_err(|e| format!("scribe-dashboard: window build failed: {e}"))?;

    window
        .set_focus()
        .map_err(|e| format!("scribe-dashboard: initial focus failed: {e}"))?;

    Ok(ScribeDashboardResult {
        label: SCRIBE_WINDOW_LABEL.to_string(),
        created: true,
    })
}

/// Select the [`WebviewUrl`] for the SCRIBE dashboard window.
///
/// Strategy (in priority order):
///
/// 1. **frontendDist copy** — if a `scribe-dashboard/index.html` exists inside
///    the Tauri frontend dist output directory (placed there by the build step
///    in `desktop/package.json` or a Vite plugin), load it via
///    `WebviewUrl::App("scribe-dashboard/index.html")`.  This is the zero-extra-
///    dep production path.
///
/// 2. **Dev-server fallback** — if neither of the above exists (typical during
///    `tauri dev` before the copy step runs), fall back to the dashboard-service
///    dev server.  The operator must start it separately:
///    `node examples/cartridges/dashboard-lod-rendering/dashboard-service/serve.mjs`
fn resolve_dashboard_url(app: &AppHandle) -> WebviewUrl {
    // Strategy 1: app-relative path (works when desktop/dist/scribe-dashboard/ exists).
    // The Tauri `beforeBuildCommand` in tauri.conf.json runs `cd desktop && npm run build`.
    // A postbuild step (see README §Tauri-native) should copy the dashboard into
    // desktop/dist/scribe-dashboard/ so that it's included in frontendDist.
    if let Ok(frontend_dist) = app.path().resource_dir() {
        let candidate = frontend_dist
            .parent()  // step up from _up one level inside the bundle
            .map(|p| p.join("scribe-dashboard").join("index.html"));
        if candidate.as_deref().map(|p| p.exists()).unwrap_or(false) {
            return WebviewUrl::App("scribe-dashboard/index.html".into());
        }
    }

    // Strategy 2: dev-server external URL (always works when serve.mjs is running).
    WebviewUrl::External(
        tauri::Url::parse(DEV_SERVER_URL)
            .expect("DEV_SERVER_URL is a valid constant URL"),
    )
}

/// Return the canonical filesystem sub-path where the SCRIBE dashboard
/// `index.html` will be found after the build-time copy step.
///
/// This is relative to the `frontendDist` output root (`desktop/dist/`).
///
/// Exposed as a helper so tests and build scripts can assert against the
/// expected layout without requiring a running Tauri app handle.
pub fn expected_dist_subpath() -> PathBuf {
    std::path::Path::new("scribe-dashboard").join("index.html")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn window_label_is_valid_tauri_identifier() {
        assert!(!SCRIBE_WINDOW_LABEL.is_empty(), "label must not be empty");
        assert!(
            SCRIBE_WINDOW_LABEL
                .chars()
                .all(|c| c.is_ascii_alphanumeric() || c == '-'),
            "label must only contain ASCII alphanumeric chars or hyphens, \
             got: {SCRIBE_WINDOW_LABEL}"
        );
    }

    #[test]
    fn default_dimensions_are_positive() {
        assert!(DEFAULT_WIDTH > 0.0);
        assert!(DEFAULT_HEIGHT > 0.0);
    }

    #[test]
    fn dev_server_url_is_valid() {
        tauri::Url::parse(DEV_SERVER_URL).expect("DEV_SERVER_URL must be a valid URL");
    }

    #[test]
    fn expected_dist_subpath_ends_with_index_html() {
        let p = expected_dist_subpath();
        assert_eq!(p.file_name().unwrap().to_str().unwrap(), "index.html");
    }

    #[test]
    fn expected_dist_subpath_starts_with_scribe_dashboard() {
        let p = expected_dist_subpath();
        let components: Vec<_> = p.components().collect();
        assert!(
            components.len() >= 2,
            "expected at least scribe-dashboard/index.html, got {p:?}"
        );
        use std::path::Component;
        match components[0] {
            Component::Normal(name) => {
                assert_eq!(name.to_str(), Some("scribe-dashboard"));
            }
            other => panic!("unexpected first component: {other:?}"),
        }
    }
}
