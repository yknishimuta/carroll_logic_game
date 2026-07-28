import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const failures = [];

async function load(name) {
  const target = path.join(dist, name);
  try {
    await access(target);
    const content = await readFile(target, "utf8");
    if (content.length === 0) failures.push(`${name}: file is empty`);
    return content;
  } catch {
    failures.push(`${name}: file is missing or unreadable`);
    return "";
  }
}

const [html, css, javascript, tutorialHtml, tutorialCss, tutorialJs] = await Promise.all([
  load("index.html"),
  load("style.css"),
  load("app.js"),
  load("tutorial.html"),
  load("tutorial.css"),
  load("tutorial.js"),
]);

const checks = [
  ["index.html", /type\s*=\s*["']module["']/i, "type=module is forbidden"],
  ["index.html", /(?:src|href)\s*=\s*["']\//i, "asset paths must be relative"],
  ["app.js", /^\s*(?:import|export)\s/m, "ES module syntax remains"],
  ["app.js", /\bdocument\.write\s*\(/, "document.write is forbidden"],
  ["app.js", /\.innerHTML\b/, "innerHTML is forbidden"],
  ["app.js", /\binsertAdjacentHTML\b/, "insertAdjacentHTML is forbidden"],
  ["app.js", /\beval\s*\(/, "eval is forbidden"],
  ["app.js", /\bnew\s+Function\b/, "new Function is forbidden"],
  ["tutorial.html", /type\s*=\s*["']module["']/i, "type=module is forbidden"],
  ["tutorial.html", /(?:src|href)\s*=\s*["']\//i, "asset paths must be relative"],
  ["tutorial.js", /^\s*(?:import|export)\s/m, "ES module syntax remains"],
  ["tutorial.js", /\bdocument\.write\s*\(/, "document.write is forbidden"],
  ["tutorial.js", /\.innerHTML\b/, "innerHTML is forbidden"],
  ["tutorial.js", /\binsertAdjacentHTML\b/, "insertAdjacentHTML is forbidden"],
  ["tutorial.js", /\beval\s*\(/, "eval is forbidden"],
  ["tutorial.js", /\bnew\s+Function\b/, "new Function is forbidden"],
];
for (const [name, pattern, reason] of checks) {
  const content = name === "index.html"
    ? html
    : name === "tutorial.html"
      ? tutorialHtml
      : name === "tutorial.js"
        ? tutorialJs
        : javascript;
  if (pattern.test(content)) failures.push(`${name}: ${reason}`);
}
if (!/<meta[^>]+name=["']viewport["']/i.test(html)) {
  failures.push("index.html: viewport meta is missing");
}
if (!/id=["']app["']/.test(html)) {
  failures.push("index.html: application mount target is missing");
}
if (!/<noscript[\s>]/i.test(html)) {
  failures.push("index.html: noscript guidance is missing");
}
if (!/<meta[^>]+name=["']viewport["']/i.test(tutorialHtml)) {
  failures.push("tutorial.html: viewport meta is missing");
}
if (!/id=["']tutorial-app["']/.test(tutorialHtml)) {
  failures.push("tutorial.html: tutorial mount target is missing");
}
if (!/<noscript[\s>]/i.test(tutorialHtml)) {
  failures.push("tutorial.html: noscript guidance is missing");
}
for (const asset of ["app.js", "style.css"]) {
  if (!new RegExp(`(?:src|href)=["']\\./${asset.replace(".", "\\.")}["']`).test(html)) {
    failures.push(`index.html: relative ${asset} reference is missing`);
  }
}
for (const asset of ["tutorial.js", "tutorial.css"]) {
  if (!new RegExp(`(?:src|href)=["']\\./${asset.replace(".", "\\.")}["']`).test(tutorialHtml)) {
    failures.push(`tutorial.html: relative ${asset} reference is missing`);
  }
}
if (!/href=["']\.\/tutorial\.html["']/.test(html)) {
  failures.push("index.html: relative tutorial link is missing");
}
if (!/href=["']\.\/index\.html["']/.test(tutorialHtml)) {
  failures.push("tutorial.html: relative game link is missing");
}
if (!/^\s*["']use strict["'];\s*\(\(\)\s*=>\s*\{/m.test(javascript)) {
  failures.push("app.js: expected IIFE wrapper was not found");
}
if (!/^\s*["']use strict["'];\s*\(\(\)\s*=>\s*\{/m.test(tutorialJs)) {
  failures.push("tutorial.js: expected IIFE wrapper was not found");
}
for (const marker of [
  ".skip-link",
  ":focus-visible",
  "forced-colors: active",
  "prefers-reduced-motion: reduce",
]) {
  if (!tutorialCss.includes(marker)) failures.push(`tutorial.css: missing ${marker}`);
}
for (const marker of [
  ".skip-link",
  ":focus-visible",
  ".logic-game__interactive-diagram",
  ".logic-game__counter-target",
  "forced-colors: active",
  "prefers-reduced-motion: reduce",
]) {
  if (!css.includes(marker)) failures.push(`style.css: missing ${marker}`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`verify-dist: ${failure}`);
  process.exitCode = 1;
} else {
  console.log(
    "verify-dist: game and tutorial files, relative assets, IIFE scripts, safe DOM APIs, landmarks, links, and accessibility CSS verified.",
  );
}
