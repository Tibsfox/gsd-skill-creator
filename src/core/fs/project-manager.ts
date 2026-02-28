import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import type { ProjectDescriptor, ZoneManager } from "./types.js";
import type { ScConfig } from "./config.js";
import { resolveProjectPath } from "./config.js";

export class ProjectManager implements ZoneManager<ProjectDescriptor> {
  constructor(private root: string, private config: ScConfig) {}

  async list(): Promise<ProjectDescriptor[]> {
    const results: ProjectDescriptor[] = [];
    const home = resolveProjectPath(this.root, this.config);

    // Local projects
    if (existsSync(home)) {
      const entries = await readdir(home, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".")) {
          const path = join(home, entry.name);
          results.push({
            name: entry.name,
            path,
            external: false,
            hasPlanning: existsSync(join(path, ".planning")),
          });
        }
      }
    }

    // External projects
    for (const ext of this.config.external_projects) {
      results.push({
        name: ext.name,
        path: ext.path,
        external: true,
        hasPlanning: existsSync(join(ext.path, ".planning")),
      });
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  async init(name: string): Promise<ProjectDescriptor> {
    // Validate name
    if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
      throw new Error(
        `Invalid project name '${name}': must be lowercase alphanumeric with hyphens`
      );
    }
    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      throw new Error(
        `Invalid project name '${name}': contains path traversal characters`
      );
    }

    const home = resolveProjectPath(this.root, this.config);
    const projectPath = join(home, name);

    if (existsSync(projectPath)) {
      throw new Error(`Project '${name}' already exists at ${projectPath}`);
    }

    await mkdir(join(projectPath, ".planning"), { recursive: true });

    return {
      name,
      path: projectPath,
      external: false,
      hasPlanning: true,
    };
  }

  async status(): Promise<string> {
    const projects = await this.list();
    const local = projects.filter((p) => !p.external).length;
    const external = projects.filter((p) => p.external).length;
    return `${projects.length} projects (${local} local, ${external} external)`;
  }
}
