//! Retry policy for API requests with exponential backoff and rate-limit compliance.
//!
//! Phase 376 -- API Client
//!
//! Default: 3 max attempts for network errors, 2 for server errors,
//! 1000ms base delay with exponential backoff (1s, 2s, 4s).
//! Rate-limited (429) requests honor the retry-after header,
//! capped at 60s with a minimum of 1s.

use std::time::Duration;

use crate::api::client::ApiError;

/// Retry policy configuration.
pub struct RetryPolicy {
    pub max_attempts: u32,
    pub base_delay_ms: u64,
    pub rate_limit_cap_secs: u64,
    pub server_error_max_attempts: u32,
}

impl Default for RetryPolicy {
    fn default() -> Self {
        Self {
            max_attempts: 3,
            base_delay_ms: 1000,
            rate_limit_cap_secs: 60,
            server_error_max_attempts: 2,
        }
    }
}

/// Outcome of a retry-wrapped operation.
pub enum RetryOutcome<T> {
    /// Operation succeeded.
    Success(T),
    /// All retry attempts exhausted.
    Exhausted { attempts: u32, last_error: ApiError },
}

impl RetryPolicy {
    /// Compute the delay for a given attempt number (1-indexed).
    ///
    /// Exponential backoff: attempt 1 = base_delay_ms, attempt 2 = base * 2, attempt 3 = base * 4.
    /// Formula: base_delay_ms * 2^(attempt - 1)
    pub fn delay_for_attempt(&self, attempt: u32) -> Duration {
        let multiplier = 2u64.pow(attempt.saturating_sub(1));
        Duration::from_millis(self.base_delay_ms * multiplier)
    }

    /// Compute the delay for a rate-limited (429) response.
    ///
    /// Uses the retry-after value in seconds. Minimum 1 second (never zero),
    /// capped at rate_limit_cap_secs (default 60s).
    pub fn delay_for_rate_limit(&self, retry_after_secs: u64) -> Duration {
        let clamped = retry_after_secs
            .max(1) // minimum 1 second
            .min(self.rate_limit_cap_secs); // cap at max
        Duration::from_secs(clamped)
    }

    /// Whether the given error should be retried at the given attempt number.
    ///
    /// - Network/stream errors: retry up to max_attempts
    /// - 429 rate-limited: retry up to max_attempts (with special delay handling)
    /// - 5xx server errors: retry up to server_error_max_attempts (2)
    /// - 401, NoApiKey, ProtocolError, SseParse: NEVER retry
    pub fn should_retry(&self, attempt: u32, error: &ApiError) -> bool {
        match error {
            // Network and stream errors: retry up to max
            ApiError::Network(_) | ApiError::StreamInterrupted(_) => {
                attempt <= self.max_attempts
            }
            ApiError::HttpError { status, .. } => {
                match status {
                    // Rate-limited: retry up to max attempts
                    429 => attempt <= self.max_attempts,
                    // Server errors: reduced retry count
                    500 | 502 | 503 => attempt <= self.server_error_max_attempts,
                    // Auth errors and others: never retry
                    _ => false,
                }
            }
            // Never retry these
            ApiError::NoApiKey | ApiError::ProtocolError | ApiError::SseParse(_) => false,
        }
    }

    /// Whether the error is a rate-limit (429) response.
    pub fn is_rate_limited(&self, error: &ApiError) -> bool {
        matches!(error, ApiError::HttpError { status: 429, .. })
    }
}
