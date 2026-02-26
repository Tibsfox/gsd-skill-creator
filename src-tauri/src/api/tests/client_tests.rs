//! Tests for AnthropicClient construction and configuration.

use crate::api::client::{AnthropicClient, ApiError, Message};
use crate::api::keystore::KeyStore;

#[test]
fn client_requires_key() {
    let ks = KeyStore::empty();
    let result = AnthropicClient::new(ks);
    assert!(result.is_err());
    match result.unwrap_err() {
        ApiError::NoApiKey => {} // expected
        other => panic!("Expected NoApiKey, got: {:?}", other),
    }
}

#[test]
fn client_default_model() {
    unsafe { std::env::set_var("ANTHROPIC_API_KEY", "sk-ant-test-model"); }
    let ks = KeyStore::load().unwrap();
    let client = AnthropicClient::new(ks).unwrap();
    assert_eq!(client.default_model(), "claude-sonnet-4-5-20250929");
    unsafe { std::env::remove_var("ANTHROPIC_API_KEY"); }
}

#[test]
fn client_default_max_tokens() {
    unsafe { std::env::set_var("ANTHROPIC_API_KEY", "sk-ant-test-tokens"); }
    let ks = KeyStore::load().unwrap();
    let client = AnthropicClient::new(ks).unwrap();
    assert_eq!(client.default_max_tokens(), 4096);
    unsafe { std::env::remove_var("ANTHROPIC_API_KEY"); }
}

#[test]
fn request_body_shape() {
    let messages = vec![
        Message {
            role: "user".to_string(),
            content: "Hello".to_string(),
        },
    ];
    let body = AnthropicClient::build_request_body(&messages, Some("You are a helper"), "claude-sonnet-4-5-20250929", 4096);

    // Must have model, max_tokens, stream, messages
    assert_eq!(body["model"], "claude-sonnet-4-5-20250929");
    assert_eq!(body["max_tokens"], 4096);
    assert_eq!(body["stream"], true);
    assert!(body["messages"].is_array());
    let msgs = body["messages"].as_array().unwrap();
    assert_eq!(msgs.len(), 1);
    assert_eq!(msgs[0]["role"], "user");
    assert_eq!(msgs[0]["content"], "Hello");

    // System prompt present when provided
    assert_eq!(body["system"], "You are a helper");

    // Without system prompt
    let body2 = AnthropicClient::build_request_body(&messages, None, "claude-sonnet-4-5-20250929", 4096);
    assert!(body2.get("system").is_none());
}
