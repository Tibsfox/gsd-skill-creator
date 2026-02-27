/**
 * project command -- manage GSD projects in the projects/ zone.
 *
 * Usage:
 *   sc project init <name>   Create a new project
 *   sc project list          List all projects (local + external)
 *   sc project status        Show project summary
 */

import { ProjectManager } from "../project-manager.js";
import { loadConfig } from "../config.js";

/**
 * Execute the project subcommand.
 *
 * @param args - Arguments after "project" (e.g., ["init", "my-app"])
 * @param root - Project root (defaults to process.cwd())
 * @returns Exit code (0 for success, 1 for error)
 */
export async function projectCommand(args: string[], root?: string): Promise<number> {
  const cwd = root ?? process.cwd();
  const [sub, ...rest] = args;

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc project <init|list|status> [name]");
    return 0;
  }

  try {
    const config = await loadConfig(cwd);
    const mgr = new ProjectManager(cwd, config);

    switch (sub) {
      case "init": {
        const name = rest[0];
        if (!name) {
          console.error("Error: project name is required");
          return 1;
        }
        // Reject path traversal patterns before passing to manager
        if (name.includes("..") || name.includes("/") || name.includes("\\")) {
          console.error(`Error: invalid project name '${name}': path traversal is not allowed`);
          return 1;
        }
        const descriptor = await mgr.init(name);
        console.log(`Created project '${descriptor.name}' at ${descriptor.path}`);
        return 0;
      }

      case "list": {
        const projects = await mgr.list();
        if (projects.length === 0) {
          console.log("No projects found");
        } else {
          for (const p of projects) {
            const tag = p.external ? " [external]" : "";
            const plan = p.hasPlanning ? " (.planning)" : "";
            console.log(`  ${p.name}${tag}${plan}  ${p.path}`);
          }
        }
        return 0;
      }

      case "status": {
        const summary = await mgr.status();
        console.log(summary);
        return 0;
      }

      default:
        console.error(`Error: unknown project subcommand '${sub}'`);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
