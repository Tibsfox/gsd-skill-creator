/**
 * www command -- manage the www/ staging zone.
 *
 * Usage:
 *   sc www status            Show www zone state
 *   sc www list              Show www zone details
 */

import { WWWStager } from "../www-stager.js";
import { loadConfig } from "../config.js";

/**
 * Execute the www subcommand.
 *
 * @param args - Arguments after "www" (e.g., ["status"])
 * @param root - Project root (defaults to process.cwd())
 * @returns Exit code (0 for success, 1 for error)
 */
export async function wwwCommand(args: string[], root?: string): Promise<number> {
  const cwd = root ?? process.cwd();
  const [sub] = args;

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc www <status|list>");
    return 0;
  }

  try {
    const config = await loadConfig(cwd);
    const stager = new WWWStager(cwd, config);

    switch (sub) {
      case "status": {
        const summary = await stager.status();
        console.log(summary);
        return 0;
      }

      case "list": {
        const [desc] = await stager.list();
        console.log(`site: ${desc.hasSite ? "built" : "no content"}`);
        console.log(`tools: ${desc.toolCount} file(s)`);
        console.log(`staging: ${desc.hasStaging ? "yes" : "empty"}`);
        return 0;
      }

      default:
        console.error(`Error: unknown www subcommand '${sub}'`);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
