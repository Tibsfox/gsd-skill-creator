use std::collections::HashMap;
use tempfile::TempDir;

use crate::staging::debrief::{
    CalibrationData, Debrief, DebriefCollector, ErrorRecord, TokenUsage,
};

#[test]
fn test_debrief_types_exist() {
    let debrief = Debrief {
        mission: "test-mission".to_string(),
        completed_at: "2026-02-26T18:00:00Z".to_string(),
        wall_time_seconds: 10800,
        token_usage: TokenUsage {
            input: 85000,
            output: 46000,
            total: 131000,
            by_model: HashMap::new(),
        },
        phases_completed: 4,
        phases_total: 4,
        errors_encountered: vec![],
        skill_observations: vec![],
        calibration: CalibrationData {
            estimated_tokens: 131000,
            actual_tokens: 131000,
            estimated_wall_time: 21600,
            actual_wall_time: 10800,
            accuracy_ratio: 1.0,
        },
    };
    assert_eq!(debrief.mission, "test-mission");
    assert_eq!(debrief.wall_time_seconds, 10800);
    assert_eq!(debrief.phases_completed, 4);
    assert_eq!(debrief.phases_total, 4);
}

#[test]
fn test_token_usage_types() {
    let mut by_model = HashMap::new();
    by_model.insert("opus".to_string(), 100000);
    by_model.insert("sonnet".to_string(), 31000);

    let usage = TokenUsage {
        input: 85000,
        output: 46000,
        total: 131000,
        by_model,
    };
    assert_eq!(usage.input, 85000);
    assert_eq!(usage.output, 46000);
    assert_eq!(usage.total, 131000);
    assert_eq!(usage.by_model.len(), 2);
}

#[test]
fn test_calibration_data_types() {
    let cal = CalibrationData {
        estimated_tokens: 131000,
        actual_tokens: 131000,
        estimated_wall_time: 21600,
        actual_wall_time: 10800,
        accuracy_ratio: 1.0,
    };
    assert_eq!(cal.estimated_tokens, 131000);
    assert_eq!(cal.actual_tokens, 131000);
    assert_eq!(cal.estimated_wall_time, 21600);
    assert_eq!(cal.actual_wall_time, 10800);
    assert!((cal.accuracy_ratio - 1.0).abs() < f64::EPSILON);
}

#[test]
fn test_error_record_types() {
    let err = ErrorRecord {
        phase: "381".to_string(),
        plan: "01".to_string(),
        error: "compilation failed".to_string(),
        recovered: true,
    };
    assert_eq!(err.phase, "381");
    assert_eq!(err.plan, "01");
    assert_eq!(err.error, "compilation failed");
    assert!(err.recovered);
}

#[test]
fn test_calibration_accuracy_perfect() {
    let cal = CalibrationData::compute(100, 100, 1000, 1000);
    assert!((cal.accuracy_ratio - 1.0).abs() < f64::EPSILON);
}

#[test]
fn test_calibration_accuracy_overestimate() {
    let cal = CalibrationData::compute(200, 100, 2000, 1000);
    assert!((cal.accuracy_ratio - 0.5).abs() < f64::EPSILON);
}

#[test]
fn test_calibration_accuracy_underestimate() {
    let cal = CalibrationData::compute(100, 150, 1000, 1500);
    assert!((cal.accuracy_ratio - 1.5).abs() < f64::EPSILON);
}

#[test]
fn test_calibration_accuracy_zero_estimated() {
    // When estimated is zero, accuracy_ratio should be 0.0 (not infinity)
    let cal = CalibrationData::compute(0, 100, 0, 1000);
    assert!((cal.accuracy_ratio - 0.0).abs() < f64::EPSILON);
}

#[test]
fn test_debrief_serializes_to_json() {
    let debrief = Debrief {
        mission: "test".to_string(),
        completed_at: "2026-02-26T18:00:00Z".to_string(),
        wall_time_seconds: 3600,
        token_usage: TokenUsage {
            input: 50000,
            output: 25000,
            total: 75000,
            by_model: HashMap::new(),
        },
        phases_completed: 2,
        phases_total: 3,
        errors_encountered: vec![ErrorRecord {
            phase: "1".to_string(),
            plan: "01".to_string(),
            error: "test error".to_string(),
            recovered: true,
        }],
        skill_observations: vec!["pattern observed".to_string()],
        calibration: CalibrationData::compute(75000, 75000, 3600, 3600),
    };

    let json = serde_json::to_string(&debrief).unwrap();
    let roundtrip: Debrief = serde_json::from_str(&json).unwrap();
    assert_eq!(roundtrip.mission, debrief.mission);
    assert_eq!(roundtrip.wall_time_seconds, debrief.wall_time_seconds);
    assert_eq!(roundtrip.phases_completed, debrief.phases_completed);
}

#[test]
fn test_debrief_collector_writes_to_missions_dir() {
    let dir = TempDir::new().unwrap();
    let missions_path = dir.path().join("missions");
    let mission_dir = missions_path.join("test-mission");
    std::fs::create_dir_all(&mission_dir).unwrap();

    // Create a completion marker
    std::fs::write(mission_dir.join("COMPLETE"), "done").unwrap();

    // Create a minimal STATE.md
    std::fs::write(
        mission_dir.join("STATE.md"),
        "---\nprogress:\n  completed_phases: 4\n  total_phases: 4\n---\nStatus: complete\n",
    )
    .unwrap();

    let collector = DebriefCollector::new(missions_path);
    let debrief = collector.collect_debrief("test-mission").unwrap();

    assert_eq!(debrief.mission, "test-mission");

    // Write the debrief
    let path = collector.write_debrief(&debrief).unwrap();
    assert!(path.exists(), "debrief.json must be written");

    let content = std::fs::read_to_string(&path).unwrap();
    let _json: serde_json::Value = serde_json::from_str(&content).unwrap();
}

#[test]
fn test_debrief_collector_reads_state_files() {
    let dir = TempDir::new().unwrap();
    let missions_path = dir.path().join("missions");
    let mission_dir = missions_path.join("state-test");
    std::fs::create_dir_all(&mission_dir).unwrap();

    std::fs::write(
        mission_dir.join("STATE.md"),
        "---\nprogress:\n  completed_phases: 7\n  total_phases: 9\n---\nLast activity: 2026-02-26\n",
    )
    .unwrap();

    let collector = DebriefCollector::new(missions_path);
    let debrief = collector.collect_debrief("state-test").unwrap();

    assert_eq!(debrief.phases_completed, 7);
    assert_eq!(debrief.phases_total, 9);
}

#[test]
fn test_debrief_json_schema_matches_spec() {
    let debrief = Debrief {
        mission: "schema-test".to_string(),
        completed_at: "2026-02-26T18:00:00Z".to_string(),
        wall_time_seconds: 7200,
        token_usage: TokenUsage {
            input: 60000,
            output: 30000,
            total: 90000,
            by_model: HashMap::new(),
        },
        phases_completed: 3,
        phases_total: 3,
        errors_encountered: vec![],
        skill_observations: vec![],
        calibration: CalibrationData::compute(90000, 90000, 7200, 7200),
    };

    let json_str = serde_json::to_string(&debrief).unwrap();
    let json: serde_json::Value = serde_json::from_str(&json_str).unwrap();

    // Verify top-level keys match spec
    let expected_keys = [
        "mission",
        "completed_at",
        "wall_time_seconds",
        "token_usage",
        "phases_completed",
        "phases_total",
        "errors_encountered",
        "skill_observations",
        "calibration",
    ];

    for key in &expected_keys {
        assert!(
            json.get(key).is_some(),
            "debrief JSON must contain key: {}",
            key
        );
    }

    // Verify calibration sub-keys
    let cal = json.get("calibration").unwrap();
    let cal_keys = [
        "estimated_tokens",
        "actual_tokens",
        "estimated_wall_time",
        "actual_wall_time",
        "accuracy_ratio",
    ];
    for key in &cal_keys {
        assert!(
            cal.get(key).is_some(),
            "calibration must contain key: {}",
            key
        );
    }
}
