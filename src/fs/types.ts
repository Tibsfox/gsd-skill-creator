// Zone identifiers
export type Zone = "projects" | "contrib" | "packs" | "www";

// Project descriptor
export interface ProjectDescriptor {
  name: string;
  path: string;
  external: boolean;
  hasPlanning: boolean;
}

// Pack descriptor
export interface PackDescriptor {
  name: string;
  sourcePath: string;
  description: string;
  moduleCount: number;
}

// Contrib descriptor
export interface ContribDescriptor {
  name: string;
  direction: "upstream" | "downstream" | "publishing";
  path: string;
  status: "active" | "staged" | "archived";
}

// WWW descriptor
export interface WwwDescriptor {
  hasSite: boolean;
  hasTools: boolean;
  hasStaging: boolean;
  toolCount: number;
}

// Manager interface
export interface ZoneManager<T> {
  list(): Promise<T[]>;
  status(): Promise<string>;
}
