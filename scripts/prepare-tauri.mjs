// Copies the static SPA build (TAURI=1 vite build) into dist-tauri/ with an index.html entry.
import { cpSync, existsSync, readdirSync, rmSync, copyFileSync, statSync } from "node:fs";
import { join } from "node:path";

const candidates = ["dist/client", ".output/public", "dist"];
const find = (dir, name) => {
  if (!existsSync(dir)) return null;
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (f === name) return p;
    if (statSync(p).isDirectory() && f !== "assets" && f !== "server") {
      const r = find(p, name);
      if (r) return r;
    }
  }
  return null;
};

const src = candidates.find((d) => existsSync(d) && (find(d, "index.html") || find(d, "_shell.html")));
if (!src) {
  console.error("No index.html / _shell.html found in build output");
  process.exit(1);
}
rmSync("dist-tauri", { recursive: true, force: true });
cpSync(src, "dist-tauri", { recursive: true });
if (!existsSync("dist-tauri/index.html")) {
  const shell = find("dist-tauri", "_shell.html") || find("dist-tauri", "index.html");
  copyFileSync(shell, "dist-tauri/index.html");
}
console.log(`Prepared dist-tauri from ${src}`);
