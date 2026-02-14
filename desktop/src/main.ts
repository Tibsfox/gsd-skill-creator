import { invoke } from "@tauri-apps/api/core";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `<h1>GSD-OS v0.1.0 -- Tauri IPC Active</h1><p id="greet-msg">Loading...</p>`;

  try {
    const response = await invoke<{ message: string }>("greet", {
      name: "World",
    });
    const greetMsg = document.getElementById("greet-msg");
    if (greetMsg) {
      greetMsg.textContent = response.message;
    }
  } catch (err) {
    const greetMsg = document.getElementById("greet-msg");
    if (greetMsg) {
      greetMsg.textContent = `IPC error: ${err}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
