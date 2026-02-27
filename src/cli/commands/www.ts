import pc from "picocolors";
import { loadConfig } from "../../fs/config.js";
import { WWWStager } from "../../fs/www-stager.js";

export async function wwwCommand(args: string[]): Promise<number> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const stager = new WWWStager(root, config);
  const sub = args[0];

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc www <command>\n");
    console.log("Commands:");
    console.log("  status        Show www zone summary");
    return sub ? 0 : 1;
  }

  try {
    switch (sub) {
      case "status": {
        const [desc] = await stager.list();
        console.log(`Site built:  ${desc.hasSite ? pc.green("yes") : pc.yellow("no")}`);
        console.log(`Tools:       ${desc.toolCount}`);
        console.log(`Staging:     ${desc.hasStaging ? pc.green("yes") : pc.yellow("no")}`);
        return 0;
      }
      default:
        console.error(pc.red(`Unknown www command: ${sub}`));
        return 1;
    }
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    return 1;
  }
}
