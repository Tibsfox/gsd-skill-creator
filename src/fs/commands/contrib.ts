/**
 * contrib command -- manage contributions in the contrib/ zone.
 *
 * Usage:
 *   sc contrib status        Show contribution counts by direction
 *   sc contrib list          List all contributions grouped by direction
 */

import { ContribManager } from "../contrib-manager.js";
import { loadConfig } from "../config.js";

/**
 * Execute the contrib subcommand.
 *
 * @param args - Arguments after "contrib" (e.g., ["status"])
 * @param root - Project root (defaults to process.cwd())
 * @returns Exit code (0 for success, 1 for error)
 */
export async function contribCommand(args: string[], root?: string): Promise<number> {
  const cwd = root ?? process.cwd();
  const [sub] = args;

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc contrib <status|list>");
    return 0;
  }

  try {
    const config = await loadConfig(cwd);
    const mgr = new ContribManager(cwd, config);

    switch (sub) {
      case "status": {
        const summary = await mgr.status();
        console.log(summary);
        return 0;
      }

      case "list": {
        const contribs = await mgr.list();
        if (contribs.length === 0) {
          console.log("No contributions found");
        } else {
          const byDirection: Record<string, typeof contribs> = {};
          for (const c of contribs) {
            if (!byDirection[c.direction]) byDirection[c.direction] = [];
            byDirection[c.direction].push(c);
          }
          for (const [dir, items] of Object.entries(byDirection)) {
            console.log(`${dir}:`);
            for (const item of items) {
              console.log(`  ${item.name}  [${item.status}]  ${item.path}`);
            }
          }
        }
        return 0;
      }

      default:
        console.error(`Error: unknown contrib subcommand '${sub}'`);
        return 1;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    return 1;
  }
}
