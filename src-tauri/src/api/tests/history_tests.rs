//! Tests for conversation history persistence to JSON files.

use crate::api::client::Message;
use crate::api::history::{ConversationHistory, ConversationRecord, SerializedMessage, TokenUsage};

#[test]
fn save_conversation_to_file() {
    let temp_dir = tempfile::tempdir().unwrap();
    let record = ConversationRecord {
        id: "test-session".to_string(),
        started_at: "2026-02-26T14:30:00Z".to_string(),
        model: "claude-sonnet-4-5-20250929".to_string(),
        messages: vec![
            SerializedMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
            },
            SerializedMessage {
                role: "assistant".to_string(),
                content: "Hi there!".to_string(),
            },
        ],
        token_usage: TokenUsage {
            total_input: 10,
            total_output: 20,
        },
    };
    let path = ConversationHistory::save(&record, temp_dir.path()).unwrap();
    assert!(path.exists());
    assert!(path.extension().unwrap() == "json");

    // Read and verify JSON
    let content = std::fs::read_to_string(&path).unwrap();
    let parsed: serde_json::Value = serde_json::from_str(&content).unwrap();
    assert_eq!(parsed["id"], "test-session");
    assert_eq!(parsed["model"], "claude-sonnet-4-5-20250929");
    assert!(parsed["messages"].is_array());
    assert_eq!(parsed["messages"].as_array().unwrap().len(), 2);
    assert_eq!(parsed["token_usage"]["total_input"], 10);
    assert_eq!(parsed["token_usage"]["total_output"], 20);
}

#[test]
fn append_message_to_history() {
    let mut history = ConversationHistory::new(
        "test-append".to_string(),
        "claude-sonnet-4-5-20250929".to_string(),
    );
    history.add_message(&Message {
        role: "user".to_string(),
        content: "Hello".to_string(),
    });
    assert_eq!(history.messages().len(), 1);

    history.add_message(&Message {
        role: "assistant".to_string(),
        content: "Hi!".to_string(),
    });
    assert_eq!(history.messages().len(), 2);
}

#[test]
fn load_conversation_from_file() {
    let temp_dir = tempfile::tempdir().unwrap();
    let record = ConversationRecord {
        id: "load-test".to_string(),
        started_at: "2026-02-26T15:00:00Z".to_string(),
        model: "claude-sonnet-4-5-20250929".to_string(),
        messages: vec![
            SerializedMessage {
                role: "user".to_string(),
                content: "Test".to_string(),
            },
        ],
        token_usage: TokenUsage {
            total_input: 5,
            total_output: 15,
        },
    };
    let path = ConversationHistory::save(&record, temp_dir.path()).unwrap();
    let loaded = ConversationHistory::load(&path).unwrap();
    assert_eq!(loaded.id, "load-test");
    assert_eq!(loaded.messages.len(), 1);
    assert_eq!(loaded.token_usage.total_input, 5);
    assert_eq!(loaded.token_usage.total_output, 15);
}

#[test]
fn token_totals_accumulate() {
    let mut history = ConversationHistory::new(
        "tokens-test".to_string(),
        "claude-sonnet-4-5-20250929".to_string(),
    );
    history.update_usage(10, 20);
    history.update_usage(15, 30);
    history.update_usage(5, 10);
    assert_eq!(history.total_input_tokens(), 30);
    assert_eq!(history.total_output_tokens(), 60);
}

#[test]
fn filename_contains_timestamp() {
    let temp_dir = tempfile::tempdir().unwrap();
    let record = ConversationRecord {
        id: "ts-test".to_string(),
        started_at: "2026-02-26T14:30:00Z".to_string(),
        model: "claude-sonnet-4-5-20250929".to_string(),
        messages: vec![],
        token_usage: TokenUsage {
            total_input: 0,
            total_output: 0,
        },
    };
    let path = ConversationHistory::save(&record, temp_dir.path()).unwrap();
    let filename = path.file_name().unwrap().to_str().unwrap();
    assert!(
        filename.starts_with("session-"),
        "Filename should start with 'session-': {}",
        filename
    );
    assert!(
        filename.ends_with(".json"),
        "Filename should end with '.json': {}",
        filename
    );
}

#[test]
fn list_conversations() {
    let temp_dir = tempfile::tempdir().unwrap();
    for i in 0..3 {
        let record = ConversationRecord {
            id: format!("list-test-{}", i),
            started_at: format!("2026-02-26T14:3{}:00Z", i),
            model: "claude-sonnet-4-5-20250929".to_string(),
            messages: vec![],
            token_usage: TokenUsage {
                total_input: 0,
                total_output: 0,
            },
        };
        ConversationHistory::save(&record, temp_dir.path()).unwrap();
        // Small delay to ensure different filenames
        std::thread::sleep(std::time::Duration::from_millis(10));
    }
    let files = ConversationHistory::list(temp_dir.path()).unwrap();
    assert_eq!(files.len(), 3);
}

#[test]
fn conversation_record_json_shape() {
    let record = ConversationRecord {
        id: "shape-test".to_string(),
        started_at: "2026-02-26T14:30:00Z".to_string(),
        model: "claude-sonnet-4-5-20250929".to_string(),
        messages: vec![
            SerializedMessage {
                role: "user".to_string(),
                content: "Hello".to_string(),
            },
            SerializedMessage {
                role: "assistant".to_string(),
                content: "Hi".to_string(),
            },
        ],
        token_usage: TokenUsage {
            total_input: 100,
            total_output: 200,
        },
    };
    let json = serde_json::to_value(&record).unwrap();
    // Verify component spec shape
    assert!(json["id"].is_string());
    assert!(json["started_at"].is_string());
    assert!(json["model"].is_string());
    assert!(json["messages"].is_array());
    assert!(json["token_usage"]["total_input"].is_number());
    assert!(json["token_usage"]["total_output"].is_number());
}
