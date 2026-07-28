import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const distDirectory = path.join(projectRoot, "dist");

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
  copyFile(
    path.join(projectRoot, "public", "tutorial.html"),
    path.join(distDirectory, "tutorial.html"),
  ),
  copyFile(
    path.join(projectRoot, "public", "tutorial.css"),
    path.join(distDirectory, "tutorial.css"),
  ),
]);

await build({
  absWorkingDir: projectRoot,
  entryPoints: {
    app: "src/main.ts",
    tutorial: "src/tutorial.ts",
  },
  bundle: true,
  platform: "browser",
  format: "iife",
  outdir: "dist",
  sourcemap: true,
  minify: false,
  legalComments: "none",
  logLevel: "info",
});

console.log(`Build completed: ${distDirectory}`);
