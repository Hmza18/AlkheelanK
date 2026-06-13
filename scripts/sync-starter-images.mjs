#!/usr/bin/env node
/**
 * Copy server starter WebP assets into the client for:
 * - client/src/assets/starter-images  → Vite bundle (/assets/*.webp, always works on Vercel)
 * - client/public/starter-images      → static fallback (/starter-images/*.webp)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "server/assets/starter-images");
const DESTS = [
  path.join(ROOT, "client/src/assets/starter-images"),
  path.join(ROOT, "client/public/starter-images"),
];

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

for (const dest of DESTS) copyDir(SRC, dest);
const count = fs
  .readdirSync(DESTS[0], { recursive: true })
  .filter((f) => String(f).endsWith(".webp")).length;
console.log(`Synced ${count} starter image(s) → client/src/assets + client/public`);
