declare global {
  interface Window {
    __TAURI_INTERNALS__: {
      invoke: (cmd: string, args?: unknown, options?: unknown) => Promise<unknown>;
      transformCallback: (callback?: (data: unknown) => void, once?: boolean) => number;
      unregisterCallback: (id: number) => void;
      runCallback: (id: number, data: unknown) => void;
      callbacks: Map<number, (data: unknown) => void>;
    };
  }
}

export {};
