//! Anthropic Messages API client with TLS enforcement.
//!
//! Phase 376 -- API Client
//!
//! Security invariants:
//! - API key is never stored in or returned from any public method
//! - TLS 1.2+ enforced via reqwest https_only(true)
//! - Error messages never contain the API key
//! - The key is injected into the x-api-key header only in send_message

use crate::api::keystore::{KeyStore, KeyStoreError};
use crate::api::retry::RetryPolicy;
use crate::api::streaming::{self, MessageResponse};

// ============================================================================
// Error types
// ============================================================================

/// API client errors. No variant ever contains the API key.
#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("API key not configured")]
    NoApiKey,
    #[error("Network error")]
    Network(#[from] reqwest::Error),
    #[error("SSE parse error: {0}")]
    SseParse(String),
    #[error("HTTP {status}: {message}")]
    HttpError { status: u16, message: String },
    #[error("Stream interrupted: {0}")]
    StreamInterrupted(String),
    #[error("Protocol error: HTTPS required")]
    ProtocolError,
}

// ============================================================================
// Message types
// ============================================================================

/// A single message in a conversation.
#[derive(Debug, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

// ============================================================================
// Client
// ============================================================================

/// Client for the Anthropic Messages API with streaming support.
///
/// Uses reqwest with TLS enforcement. The API key is held in a KeyStore
/// and never exposed through any public method.
pub struct AnthropicClient {
    http_client: reqwest::Client,
    keystore: KeyStore,
    model: String,
    max_tokens: u32,
}

impl std::fmt::Debug for AnthropicClient {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "AnthropicClient {{ model: {:?}, max_tokens: {} }}",
            self.model, self.max_tokens
        )
    }
}

impl AnthropicClient {
    /// Create a new client with the given keystore.
    ///
    /// Fails immediately if no API key is loaded (NoApiKey error).
    /// Configures reqwest with https_only(true) for TLS enforcement.
    pub fn new(keystore: KeyStore) -> Result<Self, ApiError> {
        if !keystore.has_key() {
            return Err(ApiError::NoApiKey);
        }
        let http_client = reqwest::Client::builder()
            .https_only(true)
            .timeout(std::time::Duration::from_secs(120))
            .build()
            .map_err(ApiError::Network)?;
        Ok(Self {
            http_client,
            keystore,
            model: "claude-sonnet-4-5-20250929".to_string(),
            max_tokens: 4096,
        })
    }

    /// The default model used for requests.
    pub fn default_model(&self) -> &str {
        &self.model
    }

    /// The default max_tokens limit for requests.
    pub fn default_max_tokens(&self) -> u32 {
        self.max_tokens
    }

    /// Build the JSON request body for the Messages API.
    ///
    /// Always sets `stream: true`. System prompt is optional.
    pub fn build_request_body(
        messages: &[Message],
        system: Option<&str>,
        model: &str,
        max_tokens: u32,
    ) -> serde_json::Value {
        let mut body = serde_json::json!({
            "model": model,
            "max_tokens": max_tokens,
            "stream": true,
            "messages": messages.iter().map(|m| {
                serde_json::json!({ "role": m.role, "content": m.content })
            }).collect::<Vec<_>>(),
        });
        if let Some(sys) = system {
            body["system"] = serde_json::json!(sys);
        }
        body
    }

    /// Send a message to the Anthropic Messages API with SSE streaming.
    ///
    /// Emits IPC events as streaming deltas arrive. Returns the accumulated
    /// response with full text and token usage.
    ///
    /// SECURITY: The API key is injected into the x-api-key header here
    /// and nowhere else. It never appears in error messages or IPC events.
    pub async fn send_message(
        &self,
        messages: Vec<Message>,
        system: Option<String>,
        app_handle: &tauri::AppHandle,
        conversation_id: &str,
    ) -> Result<MessageResponse, ApiError> {
        let body = Self::build_request_body(
            &messages,
            system.as_deref(),
            &self.model,
            self.max_tokens,
        );
        let api_key = self.keystore.get_key().map_err(|_| ApiError::NoApiKey)?;
        let response = self
            .http_client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .json(&body)
            .send()
            .await?;

        let status = response.status().as_u16();
        if status == 429 {
            // Capture retry-after header for rate limiting
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(5);
            return Err(ApiError::HttpError {
                status: 429,
                message: format!("retry-after:{}", retry_after),
            });
        }
        if status != 200 {
            // Do NOT include response body in error (could leak key in reflection attacks)
            return Err(ApiError::HttpError {
                status,
                message: format!("API returned HTTP {}", status),
            });
        }

        streaming::stream_response(response, app_handle, conversation_id).await
    }

    /// Send a message with retry logic wrapping send_message.
    ///
    /// Retries with exponential backoff on network errors and server errors.
    /// Honors retry-after headers on 429 rate-limit responses.
    /// Emits chat:retry and chat:rate_limited IPC events during retry loops.
    pub async fn send_message_with_retry(
        &self,
        messages: Vec<Message>,
        system: Option<String>,
        app_handle: &tauri::AppHandle,
        conversation_id: &str,
    ) -> Result<MessageResponse, ApiError> {
        use tauri::Emitter;

        let policy = RetryPolicy::default();
        let mut last_error: Option<ApiError> = None;

        for attempt in 1..=(policy.max_attempts + 1) {
            match self
                .send_message(messages.clone(), system.clone(), app_handle, conversation_id)
                .await
            {
                Ok(response) => return Ok(response),
                Err(e) => {
                    if !policy.should_retry(attempt, &e) {
                        return Err(e);
                    }

                    let delay = if policy.is_rate_limited(&e) {
                        let retry_after_ms =
                            extract_retry_after_from_error(&e).unwrap_or(5000);
                        let _ = app_handle.emit(
                            crate::ipc::events::CHAT_RATE_LIMITED,
                            serde_json::json!({"retry_after_ms": retry_after_ms}),
                        );
                        policy.delay_for_rate_limit(retry_after_ms / 1000)
                    } else {
                        policy.delay_for_attempt(attempt)
                    };

                    // Emit chat:retry IPC event
                    let _ = app_handle.emit(
                        crate::ipc::events::CHAT_RETRY,
                        serde_json::json!({
                            "conversation_id": conversation_id,
                            "attempt": attempt,
                            "max_attempts": policy.max_attempts,
                            "delay_ms": delay.as_millis() as u64,
                        }),
                    );

                    tokio::time::sleep(delay).await;
                    last_error = Some(e);
                }
            }
        }

        Err(last_error.unwrap_or(ApiError::NoApiKey))
    }
}

/// Extract retry-after value from a 429 HttpError message field.
fn extract_retry_after_from_error(error: &ApiError) -> Option<u64> {
    if let ApiError::HttpError {
        status: 429,
        message,
    } = error
    {
        message
            .strip_prefix("retry-after:")
            .and_then(|s| s.parse::<u64>().ok())
            .map(|secs| secs * 1000)
    } else {
        None
    }
}
