#!/usr/bin/env node
/**
 * Fetch openly licensed photos from Openverse for starter quiz questions,
 * resize to 640×360 WebP, and write manifest.json with attribution.
 *
 * Usage:
 *   node scripts/fetch-starter-images.mjs           # fetch all missing
 *   node scripts/fetch-starter-images.mjs --only house-party:0
 *   node scripts/fetch-starter-images.mjs --force   # re-fetch everything
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { COVER_ART, QUESTION_ART } from "../server/src/starterImages.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "server/assets/starter-images");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

const OPENVERSE_URL = "https://api.openverse.org/v1/images/";
const WIDTH = 640;
const HEIGHT = 360;

function parseArgs() {
  const args = process.argv.slice(2);
  let only = null;
  let force = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--only" && args[i + 1]) {
      only = args[++i];
    } else if (args[i] === "--force") {
      force = true;
    }
  }
  return { only, force };
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return [];
  }
}

function saveManifest(entries) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + "\n");
}

async function searchOpenverse(query) {
  const params = new URLSearchParams({
    q: query.slice(0, 100),
    page_size: "8",
    mature: "false",
  });

  const res = await fetch(`${OPENVERSE_URL}?${params}`, {
    headers: { "User-Agent": "Alkheeloot starter-image-fetch (https://alkheelan.xyz)" },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
  const body = await res.json();
  return (body.results || []).filter(
    (r) => typeof r.url === "string" && r.url.startsWith("https://"),
  );
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Alkheeloot starter-image-fetch" },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function processImage(buffer) {
  return sharp(buffer)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();
}

function entryKey(entry) {
  if (entry.cover) return `${entry.quizId}:cover`;
  return `${entry.quizId}:${entry.index}`;
}

function upsertManifestEntry(manifest, entry) {
  const key = entryKey(entry);
  const idx = manifest.findIndex((e) => entryKey(e) === key);
  if (idx >= 0) manifest[idx] = entry;
  else manifest.push(entry);
}

async function fetchOne(quizId, index, art, force, { cover = false } = {}) {
  const relFile = cover ? `${quizId}/cover.webp` : `${quizId}/${index}.webp`;
  const outPath = path.join(OUT_DIR, relFile);
  const tag = cover ? `${quizId}:cover` : `${quizId}:${index}`;

  if (!force && fs.existsSync(outPath)) {
    console.log(`  skip (exists): ${tag}`);
    return null;
  }

  console.log(`  search: "${art.query}" (${tag})`);
  const results = await searchOpenverse(art.query);
  if (!results.length) throw new Error(`No Openverse results for "${art.query}"`);

  let lastErr;
  for (const hit of results) {
    try {
      const raw = await downloadImage(hit.url);
      const webp = await processImage(raw);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, webp);

      const entry = {
        quizId,
        ...(cover ? { cover: true } : { index }),
        file: relFile,
        query: art.query,
        label: art.label,
        title: hit.title || "",
        creator: hit.creator || "",
        license: hit.license || "",
        sourceUrl: hit.foreign_landing_url || hit.url,
        openverseUrl: hit.url,
      };
      console.log(`  saved: ${relFile} (${(webp.length / 1024).toFixed(1)} KB) — ${hit.title || "untitled"}`);
      return entry;
    } catch (err) {
      lastErr = err;
      console.log(`  try next (${err.message})`);
    }
  }
  throw lastErr || new Error(`All downloads failed for ${tag}`);
}

async function main() {
  const { only, force } = parseArgs();
  let manifest = loadManifest();

  const tasks = [];
  for (const [quizId, items] of Object.entries(QUESTION_ART)) {
    items.forEach((art, index) => {
      if (only && only !== `${quizId}:${index}`) return;
      tasks.push({ quizId, index, art, cover: false });
    });
  }
  for (const [quizId, art] of Object.entries(COVER_ART)) {
    if (only && only !== `${quizId}:cover`) continue;
    if (only && only.includes(":") && only !== `${quizId}:cover`) continue;
    tasks.push({ quizId, index: null, art, cover: true });
  }

  if (!tasks.length) {
    console.error(`No tasks matched${only ? ` for --only ${only}` : ""}.`);
    process.exit(1);
  }

  console.log(`Fetching ${tasks.length} starter image(s)…`);
  let ok = 0;
  let fail = 0;

  for (const { quizId, index, art, cover } of tasks) {
    try {
      const entry = await fetchOne(quizId, index, art, force, { cover });
      if (entry) {
        upsertManifestEntry(manifest, entry);
        ok++;
      }
      // brief pause to be polite to Openverse
      await new Promise((r) => setTimeout(r, 400));
    } catch (err) {
      console.error(`  FAIL ${cover ? `${quizId}:cover` : `${quizId}:${index}`}: ${err.message}`);
      fail++;
    }
  }

  manifest.sort((a, b) => {
    if (a.quizId !== b.quizId) return a.quizId.localeCompare(b.quizId);
    if (a.cover && !b.cover) return -1;
    if (!a.cover && b.cover) return 1;
    return (a.index ?? -1) - (b.index ?? -1);
  });
  saveManifest(manifest);
  console.log(`\nDone: ${ok} saved, ${fail} failed. Manifest: ${MANIFEST_PATH}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
