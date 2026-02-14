use serde::Serialize;
use tauri::{ipc::Channel, AppHandle, Emitter};

#[derive(Debug, Clone, Serialize)]
pub struct EchoPayload {
    pub status: String,
    pub detail: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChannelChunk {
    pub index: u32,
    pub data: Vec<u8>,
    pub size: usize,
}

/// Emits an "echo-response" event with the given message.
/// The frontend can listen for this event via `listen('echo-response', ...)`.
#[tauri::command]
pub fn echo_event(app: AppHandle, message: String) -> Result<(), String> {
    let payload = EchoPayload {
        status: "ok".to_string(),
        detail: message,
    };
    app.emit("echo-response", payload)
        .map_err(|e| e.to_string())
}

/// Sends `chunk_count` chunks of `payload_size` bytes via the provided channel.
/// Each byte is filled with 0xAB for deterministic testing.
#[tauri::command]
pub fn echo_channel(
    channel: Channel<ChannelChunk>,
    payload_size: usize,
    chunk_count: u32,
) -> Result<(), String> {
    let data = vec![0xABu8; payload_size];

    for i in 0..chunk_count {
        let chunk = ChannelChunk {
            index: i,
            data: data.clone(),
            size: payload_size,
        };
        channel.send(chunk).map_err(|e| e.to_string())?;
    }

    Ok(())
}
