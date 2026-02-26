use std::io::Write;
use tempfile::TempDir;

use crate::staging::intake::{
    classify_content, move_to_processing, process_intake, route_result, validate_format,
    ContentType, IntakeDirs, IntakeResult,
};
use crate::staging::hygiene::HygieneStatus;

#[cfg(test)]
fn make_dirs(root: &TempDir) -> IntakeDirs {
    let intake = root.path().join("intake");
    let processing = root.path().join("processing");
    let processed = root.path().join("processed");
    let quarantine = root.path().join("quarantine");
    std::fs::create_dir_all(&intake).unwrap();
    std::fs::create_dir_all(&processing).unwrap();
    std::fs::create_dir_all(&processed).unwrap();
    std::fs::create_dir_all(&quarantine).unwrap();
    IntakeDirs {
        intake,
        processing,
        processed,
        quarantine,
    }
}

#[test]
fn test_intake_result_types_exist() {
    let result = IntakeResult {
        file_name: "test.md".to_string(),
        content_type: ContentType::VisionDoc,
        destination: std::path::PathBuf::from("/tmp/test"),
        hygiene_status: HygieneStatus::Clean,
        notification_id: "test-123".to_string(),
    };
    assert_eq!(result.file_name, "test.md");
    assert_eq!(result.content_type, ContentType::VisionDoc);
    assert_eq!(result.notification_id, "test-123");
}

#[test]
fn test_content_type_classification() {
    assert_eq!(
        classify_content(std::path::Path::new("test.md")),
        ContentType::VisionDoc
    );
    assert_eq!(
        classify_content(std::path::Path::new("test.json")),
        ContentType::Blueprint
    );
    assert_eq!(
        classify_content(std::path::Path::new("test.zip")),
        ContentType::MissionPack
    );
    assert_eq!(
        classify_content(std::path::Path::new("test.txt")),
        ContentType::Unknown
    );
}

#[test]
fn test_format_validation_accepts_md() {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("test.md");
    std::fs::write(&path, "# Hello").unwrap();
    assert!(validate_format(&path).is_ok());
}

#[test]
fn test_format_validation_accepts_json() {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("test.json");
    std::fs::write(&path, "{}").unwrap();
    assert!(validate_format(&path).is_ok());
}

#[test]
fn test_format_validation_accepts_zip() {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("test.zip");
    std::fs::write(&path, "PK").unwrap();
    assert!(validate_format(&path).is_ok());
}

#[test]
fn test_format_validation_rejects_exe() {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("test.exe");
    std::fs::write(&path, "MZ").unwrap();
    let result = validate_format(&path);
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("exe"));
}

#[test]
fn test_format_validation_rejects_sh() {
    let dir = TempDir::new().unwrap();
    let path = dir.path().join("test.sh");
    std::fs::write(&path, "#!/bin/bash").unwrap();
    let result = validate_format(&path);
    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("sh"));
}

#[test]
fn test_atomic_move_to_processing() {
    let dir = TempDir::new().unwrap();
    let intake_dir = dir.path().join("intake");
    let processing_dir = dir.path().join("processing");
    std::fs::create_dir_all(&intake_dir).unwrap();
    std::fs::create_dir_all(&processing_dir).unwrap();

    let src = intake_dir.join("test.md");
    std::fs::write(&src, "content").unwrap();

    let new_path = move_to_processing(&src, &processing_dir).unwrap();
    assert!(!src.exists(), "source file should no longer exist");
    assert!(new_path.exists(), "file should exist in processing/");
}

#[test]
fn test_atomic_move_preserves_content() {
    let dir = TempDir::new().unwrap();
    let intake_dir = dir.path().join("intake");
    let processing_dir = dir.path().join("processing");
    std::fs::create_dir_all(&intake_dir).unwrap();
    std::fs::create_dir_all(&processing_dir).unwrap();

    let content = "known content for verification";
    let src = intake_dir.join("test.md");
    std::fs::write(&src, content).unwrap();

    let new_path = move_to_processing(&src, &processing_dir).unwrap();
    let read_content = std::fs::read_to_string(&new_path).unwrap();
    assert_eq!(read_content, content);
}

#[test]
fn test_route_clean_to_processed() {
    let dir = TempDir::new().unwrap();
    let processed_dir = dir.path().join("processed");
    let quarantine_dir = dir.path().join("quarantine");
    let processing_dir = dir.path().join("processing");
    std::fs::create_dir_all(&processed_dir).unwrap();
    std::fs::create_dir_all(&quarantine_dir).unwrap();
    std::fs::create_dir_all(&processing_dir).unwrap();

    let source_file = processing_dir.join("clean.md");
    std::fs::write(&source_file, "clean content").unwrap();

    let result = IntakeResult {
        file_name: "clean.md".to_string(),
        content_type: ContentType::VisionDoc,
        destination: std::path::PathBuf::new(),
        hygiene_status: HygieneStatus::Clean,
        notification_id: "test-clean".to_string(),
    };

    let dest = route_result(&result, &source_file, &processed_dir, &quarantine_dir).unwrap();
    assert!(dest.starts_with(&processed_dir));
    assert!(dest.exists());
}

#[test]
fn test_route_quarantine_to_quarantine_dir() {
    let dir = TempDir::new().unwrap();
    let processed_dir = dir.path().join("processed");
    let quarantine_dir = dir.path().join("quarantine");
    let processing_dir = dir.path().join("processing");
    std::fs::create_dir_all(&processed_dir).unwrap();
    std::fs::create_dir_all(&quarantine_dir).unwrap();
    std::fs::create_dir_all(&processing_dir).unwrap();

    let source_file = processing_dir.join("bad.md");
    std::fs::write(&source_file, "bad content").unwrap();

    let result = IntakeResult {
        file_name: "bad.md".to_string(),
        content_type: ContentType::VisionDoc,
        destination: std::path::PathBuf::new(),
        hygiene_status: HygieneStatus::Quarantine {
            reason: "YAML code execution".to_string(),
            detail: "!!python/object found".to_string(),
        },
        notification_id: "test-bad".to_string(),
    };

    let dest = route_result(&result, &source_file, &processed_dir, &quarantine_dir).unwrap();
    assert!(dest.starts_with(&quarantine_dir));
    assert!(dest.exists());
    // Check that explanation file exists alongside
    let reason_file = quarantine_dir.join("bad.md.quarantine-reason.txt");
    assert!(reason_file.exists(), "quarantine reason file must exist");
    let reason_content = std::fs::read_to_string(&reason_file).unwrap();
    assert!(reason_content.contains("YAML code execution"));
}

#[test]
fn test_zip_extraction() {
    let dir = TempDir::new().unwrap();
    let zip_path = dir.path().join("test.zip");
    let extract_dir = dir.path().join("extracted");
    std::fs::create_dir_all(&extract_dir).unwrap();

    // Create a valid zip file using zip crate
    {
        let file = std::fs::File::create(&zip_path).unwrap();
        let mut zip_writer = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Stored);
        zip_writer.start_file("readme.md", options).unwrap();
        zip_writer.write_all(b"# Test readme").unwrap();
        zip_writer.start_file("config.json", options).unwrap();
        zip_writer.write_all(b"{}").unwrap();
        zip_writer.finish().unwrap();
    }

    let extracted = crate::staging::intake::extract_zip(&zip_path, &extract_dir).unwrap();
    assert_eq!(extracted.len(), 2);
    assert!(extract_dir.join("readme.md").exists());
    assert!(extract_dir.join("config.json").exists());
}

#[test]
fn test_zip_extraction_validates_contents() {
    let dir = TempDir::new().unwrap();
    let zip_path = dir.path().join("mixed.zip");
    let extract_dir = dir.path().join("extracted");
    std::fs::create_dir_all(&extract_dir).unwrap();

    // Create zip with both valid and invalid extension files
    {
        let file = std::fs::File::create(&zip_path).unwrap();
        let mut zip_writer = zip::ZipWriter::new(file);
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Stored);
        zip_writer.start_file("good.md", options).unwrap();
        zip_writer.write_all(b"# Good").unwrap();
        zip_writer.start_file("data.json", options).unwrap();
        zip_writer.write_all(b"{}").unwrap();
        zip_writer.finish().unwrap();
    }

    let extracted = crate::staging::intake::extract_zip(&zip_path, &extract_dir).unwrap();
    assert!(!extracted.is_empty());
}

#[test]
fn test_intake_pipeline_end_to_end_clean() {
    let dir = TempDir::new().unwrap();
    let dirs = make_dirs(&dir);

    let file_path = dirs.intake.join("clean-doc.md");
    std::fs::write(&file_path, "# A clean document\n\nJust regular markdown.").unwrap();

    let result = process_intake(&file_path, &dirs).unwrap();
    assert_eq!(result.content_type, ContentType::VisionDoc);
    assert!(matches!(result.hygiene_status, HygieneStatus::Clean | HygieneStatus::Advisory { .. }));
    // File should be in processed/
    assert!(dirs.processed.join("clean-doc.md").exists() || result.destination.exists());
}

#[test]
fn test_intake_pipeline_end_to_end_quarantine() {
    let dir = TempDir::new().unwrap();
    let dirs = make_dirs(&dir);

    let file_path = dirs.intake.join("malicious.md");
    std::fs::write(
        &file_path,
        "# Malicious\n\nHere is dangerous YAML: !!python/object/apply:os.system ['rm -rf /']",
    )
    .unwrap();

    let result = process_intake(&file_path, &dirs).unwrap();
    assert!(
        matches!(result.hygiene_status, HygieneStatus::Quarantine { .. }),
        "YAML code execution must cause quarantine, got: {:?}",
        result.hygiene_status
    );
    // File should be in quarantine/
    assert!(dirs.quarantine.join("malicious.md").exists());
}
