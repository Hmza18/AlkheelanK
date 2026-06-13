#!/usr/bin/env node
/** Copy server starter WebP assets into client/public for same-origin serving on Vercel. */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "server/assets/starter-images");
const DEST = path.join(ROOT, "client/public/starter-images");

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    if (fs.statSync(from).isDirectory()) copyDir(from, to);
    else if (name.endsWith(".webp")) fs.copyFileSync(from, to);
  }
}

if (!fs.existsSync(SRC)) {
  console.error(`Missing source: ${SRC}`);
  process.exit(1);
}

copyDir(SRC, DEST);
const count = fs.readdirSync(DEST, { recursive: true }).filter((f) => String(f).endsWith(".webp")).length;
console.log(`Synced ${count} starter image(s) → client/public/starter-images/`);
