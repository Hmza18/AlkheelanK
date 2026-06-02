/**
 * Applies supabase/patch-missing-tables.sql (and optionally full schema.sql)
 * when SUPABASE_DB_PASSWORD is set in server/.env.
 *
 * Password: Supabase Dashboard → Project Settings → Database → Database password
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return out;
}

const clientEnv = loadEnv(join(root, "client", ".env"));
const serverEnv = loadEnv(join(root, "server", ".env"));
const projectRef =
  serverEnv.SUPABASE_PROJECT_REF ||
  (clientEnv.VITE_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null);
const password = process.env.SUPABASE_DB_PASSWORD || serverEnv.SUPABASE_DB_PASSWORD;

if (!projectRef) {
  console.error("Could not parse project ref from VITE_SUPABASE_URL in client/.env");
  process.exit(1);
}

if (!password) {
  console.log(`
No SUPABASE_DB_PASSWORD in server/.env — skipping automatic SQL.

Do this once in the browser (2 min):
  1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new
  2. Paste the file: supabase/patch-missing-tables.sql
  3. Click Run

Or add your database password to server/.env and re-run:
  npm run apply-schema
`);
  process.exit(0);
}

function poolerTargets(ref) {
  const targets = [];
  if (serverEnv.SUPABASE_POOLER_HOST) {
    targets.push({ host: serverEnv.SUPABASE_POOLER_HOST, port: Number(serverEnv.SUPABASE_POOLER_PORT || 6543) });
  }
  const regions = [
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "eu-west-1",
    "eu-west-2",
    "eu-central-1",
    "ap-southeast-1",
    "ap-northeast-1",
    "sa-east-1",
  ];
  for (const prefix of ["aws-0", "aws-1"]) {
    for (const region of regions) {
      for (const port of [6543, 5432]) {
        targets.push({ host: `${prefix}-${region}.pooler.supabase.com`, port });
      }
    }
  }
  return targets;
}

const files = process.argv.includes("--full")
  ? ["supabase/schema.sql"]
  : ["supabase/patch-missing-tables.sql"];

let lastErr = null;

for (const { host, port } of poolerTargets(projectRef)) {
  const client = new pg.Client({
    host,
    port,
    user: `postgres.${projectRef}`,
    password,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    for (const file of files) {
      const sql = readFileSync(join(root, file), "utf8");
      console.log(`Running ${file} on ${host}:${port}…`);
      await client.query(sql);
      console.log(`  ✓ ${file}`);
    }
    await client.end();
    console.log("\nDatabase schema is up to date.");
    process.exit(0);
  } catch (err) {
    lastErr = err;
    try {
      await client.end();
    } catch {}
  }
}

console.error("Schema apply failed:", lastErr?.message ?? "could not connect");
console.error("\nCopy the pooler host from Supabase → Settings → Database → Connection string");
console.error("into server/.env as SUPABASE_POOLER_HOST=... then re-run npm run apply-schema");
process.exit(1);
