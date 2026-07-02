#!/usr/bin/env node
/**
 * Download lobby music from YouTube into client/public/audio/.
 * Requires: pip install yt-dlp  (or yt-dlp on PATH)
 *
 * Source: https://youtu.be/iGx5a1ifSDs
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../client/public/audio");
const URL = "https://youtu.be/iGx5a1ifSDs";
const OUT_TEMPLATE = path.join(OUT_DIR, "lobby-music.%(ext)s");

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const old of fs.readdirSync(OUT_DIR)) {
  if (old.startsWith("lobby-music.")) fs.unlinkSync(path.join(OUT_DIR, old));
}

const attempts = [
  ["python", ["-m", "yt_dlp"]],
  ["yt-dlp", []],
];

let ok = false;
for (const [bin, prefixArgs] of attempts) {
  const r = spawnSync(
    bin,
    [
      ...prefixArgs,
      "-f",
      "ba[ext=m4a]/ba/bestaudio",
      "--no-playlist",
      "-o",
      OUT_TEMPLATE,
      URL,
    ],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (r.status === 0) {
    ok = true;
    break;
  }
}

if (!ok) {
  console.error("\nInstall yt-dlp: pip install yt-dlp");
  process.exit(1);
}

const file = fs.readdirSync(OUT_DIR).find((f) => f.startsWith("lobby-music."));
console.log(`\nLobby music ready → client/public/audio/${file}`);
