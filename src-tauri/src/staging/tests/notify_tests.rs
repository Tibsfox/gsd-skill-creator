use std::path::PathBuf;
use tempfile::TempDir;

use crate::staging::hygiene::HygieneStatus;
use crate::staging::intake::{ContentType, IntakeResult};
use crate::staging::notify::{
    EstimatedScope, NotificationPayload, OrchestratorNotification, OrchestratorNotifier,
};

fn make_intake_result(content_type: ContentType, hygiene_status: HygieneStatus) -> IntakeResult {
    IntakeResult {
        file_name: "test-file.md".to_string(),
        content_type,
        destination: PathBuf::from("/tmp/processed/test-file.md"),
        hygiene_status,
        notification_id: "test-notif-001".to_string(),
    }
}

#[test]
fn test_notification_types_exist() {
    let notification = OrchestratorNotification {
        id: "intake-20260226-abc12345".to_string(),
        type_name: "mission-intake".to_string(),
        timestamp: "2026-02-26T10:00:00Z".to_string(),
        source: "staging-intake-bridge".to_string(),
        payload: NotificationPayload {
            content_type: "vision-doc".to_string(),
            location: "/tmp/processed/test.md".to_string(),
            manifest: None,
            file_count: 1,
            hygiene_status: "clean".to_string(),
            hygiene_report: None,
            estimated_scope: None,
        },
        priority: "normal".to_string(),
        action: "review-vision".to_string(),
    };
    assert_eq!(notification.id, "intake-20260226-abc12345");
    assert_eq!(notification.type_name, "mission-intake");
    assert_eq!(notification.source, "staging-intake-bridge");
}

#[test]
fn test_notification_payload_types() {
    let payload = NotificationPayload {
        content_type: "mission-pack".to_string(),
        location: "/staging/processed/mission/".to_string(),
        manifest: Some("01-milestone-spec.md".to_string()),
        file_count: 10,
        hygiene_status: "clean".to_string(),
        hygiene_report: None,
        estimated_scope: Some(EstimatedScope {
            waves: 4,
            estimated_tokens: 131000,
            parallel_tracks: 3,
        }),
    };
    assert_eq!(payload.content_type, "mission-pack");
    assert_eq!(payload.file_count, 10);
    assert!(payload.manifest.is_some());
    assert!(payload.estimated_scope.is_some());
}

#[test]
fn test_estimated_scope_types() {
    let scope = EstimatedScope {
        waves: 4,
        estimated_tokens: 131000,
        parallel_tracks: 3,
    };
    assert_eq!(scope.waves, 4);
    assert_eq!(scope.estimated_tokens, 131000);
    assert_eq!(scope.parallel_tracks, 3);
}

#[test]
fn test_notify_writes_json_to_inbox() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox.clone());

    let result = make_intake_result(ContentType::VisionDoc, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    assert!(path.exists(), "notification JSON file must exist");
    assert!(path.extension().unwrap() == "json", "must be .json file");
    assert!(path.starts_with(&inbox), "must be in inbox/pending/");
}

#[test]
fn test_notification_json_has_required_fields() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::VisionDoc, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();

    assert!(json.get("id").is_some(), "must have id field");
    assert!(json.get("type").is_some(), "must have type field");
    assert!(json.get("timestamp").is_some(), "must have timestamp field");
    assert!(json.get("source").is_some(), "must have source field");
    assert!(json.get("payload").is_some(), "must have payload field");

    let payload = json.get("payload").unwrap();
    assert!(payload.get("content_type").is_some(), "payload must have content_type");
    assert!(payload.get("location").is_some(), "payload must have location");
    assert!(payload.get("hygiene_status").is_some(), "payload must have hygiene_status");
}

#[test]
fn test_notification_id_format() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::VisionDoc, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let id = json.get("id").unwrap().as_str().unwrap();

    assert!(id.starts_with("intake-"), "ID must start with 'intake-', got: {}", id);
    // ID should contain a date component (YYYYMMDD format)
    assert!(id.len() > 15, "ID must include date component, got: {}", id);
}

#[test]
fn test_notification_source_is_staging_bridge() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::VisionDoc, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let source = json.get("source").unwrap().as_str().unwrap();

    assert_eq!(source, "staging-intake-bridge");
}

#[test]
fn test_notification_from_clean_intake_result() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::VisionDoc, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let payload = json.get("payload").unwrap();

    assert_eq!(
        payload.get("hygiene_status").unwrap().as_str().unwrap(),
        "clean"
    );
    assert!(
        payload.get("hygiene_report").unwrap().is_null(),
        "clean result must have null hygiene_report"
    );
}

#[test]
fn test_notification_from_advisory_intake_result() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(
        ContentType::VisionDoc,
        HygieneStatus::Advisory {
            issues: vec!["Embedded instruction detected: ignore previous instructions".to_string()],
        },
    );
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let payload = json.get("payload").unwrap();

    assert_eq!(
        payload.get("hygiene_status").unwrap().as_str().unwrap(),
        "flagged"
    );
    let report = payload.get("hygiene_report").unwrap().as_str().unwrap();
    assert!(
        report.contains("instruction"),
        "advisory report must contain advisory text, got: {}",
        report
    );
}

#[test]
fn test_notification_action_is_new_milestone_for_mission() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::MissionPack, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let action = json.get("action").unwrap().as_str().unwrap();

    assert_eq!(action, "new-milestone");
}

#[test]
fn test_notification_action_is_review_for_skill() {
    let dir = TempDir::new().unwrap();
    let inbox = dir.path().join("inbox").join("pending");
    let notifier = OrchestratorNotifier::new(inbox);

    let result = make_intake_result(ContentType::Skill, HygieneStatus::Clean);
    let path = notifier.notify_new_work(&result).unwrap();

    let content = std::fs::read_to_string(&path).unwrap();
    let json: serde_json::Value = serde_json::from_str(&content).unwrap();
    let action = json.get("action").unwrap().as_str().unwrap();

    assert_eq!(action, "review-skill");
}
