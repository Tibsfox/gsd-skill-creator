use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GreetResponse {
    pub message: String,
    pub timestamp: u64,
}

#[tauri::command]
pub fn greet(name: String) -> Result<GreetResponse, String> {
    Ok(GreetResponse {
        message: format!("Hello, {}! From Rust.", name),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    })
}
