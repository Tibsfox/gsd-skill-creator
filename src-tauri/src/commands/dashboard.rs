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

/// Generate a single dashboard page by invoking the Node.js generator.
///
/// Spawns a `node` process that imports `dist/dashboard/generator.js`,
/// generates the requested page to a temp directory, reads the HTML,
/// and outputs it as JSON to stdout.
#[tauri::command]
pub fn generate_dashboard(
    page: String,
    planning_dir: String,
) -> Result<GenerateResponse, String> {
    let start = std::time::Instant::now();

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
            planningDir: '{}',
            outputDir: tmpDir,
            force: true,
        }});
        const pageFile = '{}.html';
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
        planning_dir.replace('\'', "\\'"),
        page,
    );

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
