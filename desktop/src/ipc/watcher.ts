import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export interface FileChangeEvent {
  path: string;
  kind: "create" | "modify" | "remove" | "access" | "other";
}

export interface WatcherEventBatch {
  events: FileChangeEvent[];
  count: number;
}

export async function startWatcher(
  path: string,
  projectRoot: string,
): Promise<void> {
  return invoke("start_watcher", { path, projectRoot });
}

export async function stopWatcher(): Promise<void> {
  return invoke("stop_watcher");
}

export async function watcherStatus(): Promise<boolean> {
  return invoke<boolean>("watcher_status");
}

export async function onFileChanged(
  callback: (batch: WatcherEventBatch) => void,
): Promise<() => void> {
  return listen<WatcherEventBatch>("fs:changed", (event) =>
    callback(event.payload),
  );
}

export async function onWatcherError(
  callback: (error: string) => void,
): Promise<() => void> {
  return listen<string>("fs:watcher-error", (event) =>
    callback(event.payload),
  );
}
