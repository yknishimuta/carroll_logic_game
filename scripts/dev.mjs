import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { context } from "esbuild";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(projectRoot, "dist");
const host = "127.0.0.1";
const port = 4173;

await rm(distDirectory, { recursive: true, force: true });
await mkdir(distDirectory, { recursive: true });

await Promise.all([
  copyFile(
    path.join(projectRoot, "public", "index.html"),
    path.join(distDirectory, "index.html"),
  ),
  copyFile(
    path.join(projectRoot, "public", "style.css"),
    path.join(distDirectory, "style.css"),
  ),
]);

const buildContext = await context({
  absWorkingDir: projectRoot,
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "browser",
  format: "iife",
  outfile: "dist/app.js",
  sourcemap: true,
  minify: false,
  legalComments: "none",
  logLevel: "info",
});

await buildContext.watch();
const server = await buildContext.serve({
  servedir: distDirectory,
  host,
  port,
});

console.log(`Development server: http://${host}:${server.port}`);

let isShuttingDown = false;

async function shutDown() {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  await buildContext.dispose();
  process.exit(0);
}

process.once("SIGINT", () => {
  void shutDown();
});
process.once("SIGTERM", () => {
  void shutDown();
});
