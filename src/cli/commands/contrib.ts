import pc from "picocolors";
import { loadConfig } from "../../fs/config.js";
import { ContribManager } from "../../fs/contrib-manager.js";

export async function contribCommand(args: string[]): Promise<number> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const mgr = new ContribManager(root, config);
  const sub = args[0];

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc contrib <command>\n");
    console.log("Commands:");
    console.log("  status        Show contrib zone summary");
    console.log("  list          List all contrib entries");
    return sub ? 0 : 1;
  }

  try {
    switch (sub) {
      case "status": {
        console.log(await mgr.status());
        return 0;
      }
      case "list": {
        const entries = await mgr.list();
        if (entries.length === 0) {
          console.log("No contrib entries found.");
          return 0;
        }
        console.log(pc.bold("NAME".padEnd(24) + "DIRECTION".padEnd(14) + "STATUS"));
        for (const e of entries) {
          const dir = e.direction === "upstream"
            ? pc.cyan(e.direction.padEnd(14))
            : e.direction === "downstream"
              ? pc.yellow(e.direction.padEnd(14))
              : pc.green(e.direction.padEnd(14));
          const status = e.status === "active"
            ? pc.green(e.status)
            : e.status === "staged"
              ? pc.yellow(e.status)
              : pc.dim(e.status);
          console.log(e.name.padEnd(24) + dir + status);
        }
        return 0;
      }
      default:
        console.error(pc.red(`Unknown contrib command: ${sub}`));
        return 1;
    }
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    return 1;
  }
}
