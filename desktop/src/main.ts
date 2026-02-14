import { greet, echoCommand } from "./ipc/commands";
import { onEchoResponse } from "./ipc/events";
import { streamEchoData } from "./ipc/channels";
import { runIpcBenchmark } from "./ipc/benchmark";

async function init(): Promise<void> {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <h1>GSD-OS v0.1.0 -- Tauri IPC Active</h1>
    <section id="ipc-commands">
      <h2>Commands (invoke/response)</h2>
      <p id="greet-msg">Loading...</p>
    </section>
    <section id="ipc-events">
      <h2>Events (emit/listen)</h2>
      <p id="event-msg">Waiting for echo event...</p>
    </section>
    <section id="ipc-channels">
      <h2>Channels (streaming)</h2>
      <ul id="channel-log"></ul>
    </section>
    <section id="ipc-benchmark">
      <h2>IPC Benchmark</h2>
      <button id="run-benchmark">Run Benchmark</button>
      <pre id="benchmark-results"></pre>
    </section>
  `;

  // --- Command demo: invoke greet ---
  try {
    const response = await greet("World");
    const greetMsg = document.getElementById("greet-msg");
    if (greetMsg) {
      greetMsg.textContent = `${response.message} (ts: ${response.timestamp})`;
    }
  } catch (err) {
    const greetMsg = document.getElementById("greet-msg");
    if (greetMsg) {
      greetMsg.textContent = `IPC error: ${err}`;
    }
  }

  // --- Event demo: listen for echo-response, then trigger it ---
  try {
    const unlisten = await onEchoResponse((payload) => {
      const eventMsg = document.getElementById("event-msg");
      if (eventMsg) {
        eventMsg.textContent = `Echo: [${payload.status}] ${payload.detail}`;
      }
      // Unlisten after first event for demo
      unlisten();
    });

    // Trigger the echo event from Rust
    await echoCommand("Hello via event!");
  } catch (err) {
    const eventMsg = document.getElementById("event-msg");
    if (eventMsg) {
      eventMsg.textContent = `Event error: ${err}`;
    }
  }

  // --- Channel demo: stream 5 small chunks ---
  try {
    const channelLog = document.getElementById("channel-log");
    await streamEchoData(8, 5, (chunk) => {
      if (channelLog) {
        const li = document.createElement("li");
        li.textContent = `Chunk ${chunk.index}: ${chunk.size} bytes`;
        channelLog.appendChild(li);
      }
    });
  } catch (err) {
    const channelLog = document.getElementById("channel-log");
    if (channelLog) {
      const li = document.createElement("li");
      li.textContent = `Channel error: ${err}`;
      channelLog.appendChild(li);
    }
  }

  // --- Benchmark demo: run IPC benchmark on button click ---
  const benchmarkBtn = document.getElementById("run-benchmark");
  const benchmarkResults = document.getElementById("benchmark-results");
  if (benchmarkBtn && benchmarkResults) {
    benchmarkBtn.addEventListener("click", async () => {
      benchmarkBtn.setAttribute("disabled", "true");
      benchmarkResults.textContent = "Running benchmark...";
      try {
        const report = await runIpcBenchmark();
        console.log("=== IPC Benchmark Results ===");
        console.table(report.command_roundtrip);
        console.table(report.channel_throughput);

        const lines = [
          "Command Round-Trip (ms):",
          ...Object.entries(report.command_roundtrip).map(
            ([k, v]) => `  ${k.padEnd(6)} ${v.toFixed(2)}ms`,
          ),
          "",
          "Channel Throughput (ms):",
          ...Object.entries(report.channel_throughput).map(
            ([k, v]) => `  ${k.padEnd(6)} ${v.toFixed(2)}ms`,
          ),
          "",
          `Timestamp: ${new Date(report.timestamp).toISOString()}`,
        ];
        benchmarkResults.textContent = lines.join("\n");
      } catch (err) {
        benchmarkResults.textContent = `Benchmark error: ${err}`;
      } finally {
        benchmarkBtn.removeAttribute("disabled");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
