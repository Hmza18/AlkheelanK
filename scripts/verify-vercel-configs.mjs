import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), "utf8"));
}

function rewriteKey(rewrite) {
  return `${rewrite.source} -> ${rewrite.destination}`;
}

function serverRewrites(config) {
  return (config.rewrites || []).filter((rewrite) =>
    String(rewrite.destination || "").startsWith("https://alkheelank-server.onrender.com"),
  );
}

function assert(condition, message) {
  if (!condition) {
    console.error(`ERROR: ${message}`);
    process.exitCode = 1;
  }
}

const rootConfig = readJson("vercel.json");
const clientConfig = readJson("client/vercel.json");
const rootServerRewrites = serverRewrites(rootConfig).map(rewriteKey);
const clientServerRewrites = serverRewrites(clientConfig).map(rewriteKey);

assert(clientConfig.framework === "vite", "client/vercel.json must keep the Vite framework pin");
assert(clientConfig.outputDirectory === "dist", "client/vercel.json must output dist for client-root deploys");
assert(Array.isArray(clientConfig.rewrites), "client/vercel.json must use rewrites");
assert(!("routes" in clientConfig), "client/vercel.json routes would bypass same-origin server rewrites");
assert(
  JSON.stringify(clientServerRewrites) === JSON.stringify(rootServerRewrites),
  "client/vercel.json must mirror repo-root server rewrites",
);
assert(
  clientConfig.rewrites?.at(-1)?.source === "/(.*)" &&
    clientConfig.rewrites?.at(-1)?.destination === "/index.html",
  "client/vercel.json must keep the SPA fallback as the last rewrite",
);

if (process.exitCode) {
  process.exit();
}

console.log("OK: Vercel configs keep server rewrites in sync");
