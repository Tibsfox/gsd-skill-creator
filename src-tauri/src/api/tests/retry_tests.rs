//! Tests for retry logic -- exponential backoff, rate-limit compliance, retryability.

use std::time::Duration;
use crate::api::client::ApiError;
use crate::api::retry::{RetryPolicy, RetryOutcome};

#[test]
fn exponential_backoff_delays() {
    let policy = RetryPolicy::default();
    assert_eq!(policy.delay_for_attempt(1), Duration::from_millis(1000));
    assert_eq!(policy.delay_for_attempt(2), Duration::from_millis(2000));
    assert_eq!(policy.delay_for_attempt(3), Duration::from_millis(4000));
}

#[test]
fn max_attempts_honored() {
    let policy = RetryPolicy::default(); // max_attempts: 3
    // Network errors should be retryable up to max_attempts
    let network_err = ApiError::StreamInterrupted("timeout".to_string());
    assert!(policy.should_retry(1, &network_err));
    assert!(policy.should_retry(3, &network_err));
    assert!(!policy.should_retry(4, &network_err));
}

#[test]
fn rate_limit_respects_retry_after() {
    let policy = RetryPolicy::default();
    // Normal case: use the provided retry-after seconds
    assert_eq!(policy.delay_for_rate_limit(5), Duration::from_secs(5));
    // Zero delay: minimum 1 second
    assert_eq!(policy.delay_for_rate_limit(0), Duration::from_secs(1));
    // Huge value: capped at rate_limit_cap_secs (60)
    assert_eq!(policy.delay_for_rate_limit(300), Duration::from_secs(60));
}

#[test]
fn only_retryable_errors_trigger_retry() {
    let policy = RetryPolicy::default();

    // Retryable: network errors, 5xx, stream interrupts
    let net_err = ApiError::StreamInterrupted("connection reset".to_string());
    assert!(policy.should_retry(1, &net_err));

    let server_500 = ApiError::HttpError { status: 500, message: "Internal".to_string() };
    assert!(policy.should_retry(1, &server_500));

    let server_503 = ApiError::HttpError { status: 503, message: "Unavailable".to_string() };
    assert!(policy.should_retry(1, &server_503));

    // Not retryable: auth errors, no key, protocol errors
    let auth_401 = ApiError::HttpError { status: 401, message: "Unauthorized".to_string() };
    assert!(!policy.should_retry(1, &auth_401));

    let no_key = ApiError::NoApiKey;
    assert!(!policy.should_retry(1, &no_key));

    let protocol = ApiError::ProtocolError;
    assert!(!policy.should_retry(1, &protocol));
}

#[test]
fn rate_limited_429_is_retryable_with_special_handling() {
    let policy = RetryPolicy::default();
    let err_429 = ApiError::HttpError { status: 429, message: "retry-after:5".to_string() };
    assert!(policy.should_retry(1, &err_429));
    assert!(policy.is_rate_limited(&err_429));

    // Non-429 errors are not rate-limited
    let err_500 = ApiError::HttpError { status: 500, message: "Internal".to_string() };
    assert!(!policy.is_rate_limited(&err_500));
}

#[test]
fn server_errors_retry_with_reduced_attempts() {
    let policy = RetryPolicy::default(); // server_error_max_attempts: 2
    let server_500 = ApiError::HttpError { status: 500, message: "Internal".to_string() };
    assert!(policy.should_retry(1, &server_500));
    assert!(policy.should_retry(2, &server_500));
    // 3rd attempt exceeds server error max (2)
    assert!(!policy.should_retry(3, &server_500));
}

#[test]
fn retry_outcome_variants() {
    // Success variant
    let _success: RetryOutcome<String> = RetryOutcome::Success("ok".to_string());

    // Exhausted variant
    let _exhausted: RetryOutcome<String> = RetryOutcome::Exhausted {
        attempts: 3,
        last_error: ApiError::NoApiKey,
    };
}
