import pc from "picocolors";
import { loadConfig } from "../../fs/config.js";
import { ProjectManager } from "../../fs/project-manager.js";

export async function projectCommand(args: string[]): Promise<number> {
  const root = process.cwd();
  const config = await loadConfig(root);
  const mgr = new ProjectManager(root, config);
  const sub = args[0];

  if (!sub || sub === "--help" || sub === "-h") {
    console.log("Usage: sc project <command>\n");
    console.log("Commands:");
    console.log("  init <name>   Create a new GSD project");
    console.log("  list          List all projects");
    console.log("  status        Show workspace summary");
    return sub ? 0 : 1;
  }

  try {
    switch (sub) {
      case "init": {
        const name = args[1];
        if (!name) {
          console.error(pc.red("Error: project name required"));
          return 1;
        }
        const desc = await mgr.init(name);
        console.log(pc.green(`Created project '${desc.name}' at ${desc.path}`));
        console.log(`Run 'cd ${desc.path}' to get started`);
        return 0;
      }
      case "list": {
        const projects = await mgr.list();
        if (projects.length === 0) {
          console.log("No projects found.");
          return 0;
        }
        console.log(pc.bold("NAME".padEnd(20) + "PATH".padEnd(40) + "PLANNING"));
        for (const p of projects) {
          const planning = p.hasPlanning ? pc.green("✓") : pc.yellow("✗");
          const suffix = p.external ? " (external)" : "";
          console.log(p.name.padEnd(20) + pc.dim(p.path.padEnd(40)) + planning + suffix);
        }
        return 0;
      }
      case "status": {
        console.log(await mgr.status());
        return 0;
      }
      default:
        console.error(pc.red(`Unknown project command: ${sub}`));
        return 1;
    }
  } catch (err) {
    console.error(pc.red(`Error: ${(err as Error).message}`));
    return 1;
  }
}
