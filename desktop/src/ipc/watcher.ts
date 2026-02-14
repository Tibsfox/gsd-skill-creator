export interface FileChangeEvent {
  path: string;
  kind: "create" | "modify" | "remove" | "access" | "other";
}

export interface WatcherEventBatch {
  events: FileChangeEvent[];
  count: number;
}

export async function startWatcher(
  _path: string,
  _projectRoot: string,
): Promise<void> {
  throw new Error("not implemented");
}

export async function stopWatcher(): Promise<void> {
  throw new Error("not implemented");
}

export async function watcherStatus(): Promise<boolean> {
  throw new Error("not implemented");
}

export async function onFileChanged(
  _callback: (batch: WatcherEventBatch) => void,
): Promise<() => void> {
  throw new Error("not implemented");
}

export async function onWatcherError(
  _callback: (error: string) => void,
): Promise<() => void> {
  throw new Error("not implemented");
}
