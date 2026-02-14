fn main() {
    // Generate allow-/deny- permissions for each custom command.
    // This enables the capability ACL so commands must be explicitly
    // permitted in capabilities/default.json.
    let manifest = tauri_build::AppManifest::new().commands(&["greet"]);

    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(manifest),
    )
    .expect("failed to run tauri build");
}
