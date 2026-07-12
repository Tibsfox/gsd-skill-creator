//! IPC command for generating dashboard HTML via the Node.js generator.
//!
//! The webview cannot import Node.js modules directly. This command
//! shells out to `node` to run the compiled dashboard generator from
//! `dist/dashboard/generator.js` and returns the resulting HTML string.

use serde::{Deserialize, Serialize};
use std::process::Command;

/// Response payload returned to the webview.
#[derive(Debug, Serialize, Deserialize)]
pub struct GenerateResponse {
    pub html: String,
    pub page: String,
    pub duration: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Page slugs are interpolated into the Node script and concatenated with
/// '.html' before being joined to a temp dir. Restrict to a strict
/// lowercase-alnum-dash alphabet to close both the JS-injection vector
/// (line that built `'{page}.html'` unquoted) and the path-traversal
/// vector (`..` would have escaped tmpDir on the readFileSync call).
fn is_safe_page_slug(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 64
        && s.bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
}

/// Generate a single dashboard page by invoking the Node.js generator.
///
/// Spawns a `node` process that imports `dist/dashboard/generator.js`,
/// generates the requested page to a temp directory, reads the HTML,
/// and outputs it as JSON to stdout.
#[tauri::command]
pub fn generate_dashboard(page: String, planning_dir: String) -> Result<GenerateResponse, String> {
    let start = std::time::Instant::now();

    if !is_safe_page_slug(&page) {
        return Err(format!(
            "invalid page slug '{}' (allowed: [a-z0-9-], 1-64 chars)",
            page,
        ));
    }

    // serde_json::to_string emits a properly-quoted JSON string literal,
    // which is also a valid JS string literal — closes the planning_dir
    // injection vector that the previous single-char escape missed.
    let planning_dir_lit = serde_json::to_string(&planning_dir)
        .map_err(|e| format!("Failed to encode planning_dir: {}", e))?;
    let page_lit =
        serde_json::to_string(&page).map_err(|e| format!("Failed to encode page: {}", e))?;

    // Build a Node.js script that:
    // 1. Dynamically imports the compiled ESM generator
    // 2. Generates all pages to a temp dir (generator needs full context)
    // 3. Reads the requested page's HTML file
    // 4. Outputs it to stdout as JSON
    let script = format!(
        r#"
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {{
    const mod = await import('./dist/dashboard/generator.js');
    const generate = mod.generate;
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-dash-'));
    try {{
        const result = await generate({{
            planningDir: {},
            outputDir: tmpDir,
            force: true,
        }});
        const pageFile = {} + '.html';
        const htmlPath = path.join(tmpDir, pageFile);
        let html = '';
        if (fs.existsSync(htmlPath)) {{
            html = fs.readFileSync(htmlPath, 'utf-8');
        }}
        console.log(JSON.stringify({{ html, pages: result.pages, errors: result.errors }}));
    }} finally {{
        fs.rmSync(tmpDir, {{ recursive: true, force: true }});
    }}
}})();
"#,
        planning_dir_lit, page_lit,
    );

    crate::security::process_context::ensure_process_allowed(
        "commands/generate_dashboard",
        crate::security::process_context::ProcessOp::Output,
        "node",
        &["-e", &script],
    )
    .map_err(|e| e.to_string())?;
    let output = Command::new("node")
        .arg("-e")
        .arg(&script)
        .output()
        .map_err(|e| format!("Failed to spawn node: {}", e))?;

    let duration = start.elapsed().as_secs_f64() * 1000.0;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Ok(GenerateResponse {
            html: String::new(),
            page,
            duration,
            error: Some(format!("Node process failed: {}", stderr)),
        });
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let parsed: serde_json::Value = serde_json::from_str(stdout.trim())
        .map_err(|e| format!("Failed to parse generator output: {}", e))?;

    let html = parsed["html"].as_str().unwrap_or("").to_string();

    Ok(GenerateResponse {
        html,
        page,
        duration,
        error: None,
    })
}

#[cfg(test)]
mod tests {
    use super::is_safe_page_slug;

    #[test]
    fn page_slug_accepts_valid() {
        assert!(is_safe_page_slug("index"));
        assert!(is_safe_page_slug("phase-1"));
        assert!(is_safe_page_slug("v1-49-777"));
        assert!(is_safe_page_slug("a"));
        assert!(is_safe_page_slug("0"));
        assert!(is_safe_page_slug(&"a".repeat(64)));
    }

    #[test]
    fn page_slug_rejects_injection_attempts() {
        assert!(!is_safe_page_slug(""));
        assert!(!is_safe_page_slug("../etc/passwd"));
        assert!(!is_safe_page_slug("a/b"));
        assert!(!is_safe_page_slug("a\\b"));
        assert!(!is_safe_page_slug("a'+process.exit(1)+'"));
        assert!(!is_safe_page_slug("a\nb"));
        assert!(!is_safe_page_slug("A"));
        assert!(!is_safe_page_slug("UPPER"));
        assert!(!is_safe_page_slug("a.b"));
        assert!(!is_safe_page_slug(&"a".repeat(65)));
    }
}
