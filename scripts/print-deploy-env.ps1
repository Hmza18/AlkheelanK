# Prints Vercel / Render env vars from client/.env (run after local .env is filled).
$Root = Split-Path $PSScriptRoot -Parent
$envPath = Join-Path $Root "client\.env"
if (-not (Test-Path $envPath)) {
  Write-Error "Missing client/.env - run scripts/setup.ps1 first"
}

$vars = @{}
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -notmatch '=') { return }
  $i = $_.IndexOf('=')
  $vars[$_.Substring(0, $i).Trim()] = $_.Substring($i + 1).Trim()
}

Write-Host ""
Write-Host "=== Paste into Vercel -> Settings -> Environment Variables ==="
Write-Host ""
@("VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_SERVER_URL") | ForEach-Object {
  if ($vars[$_]) { Write-Host "$_=$($vars[$_])" }
  else { Write-Host "# MISSING: $_" }
}

Write-Host ""
Write-Host "=== Render server (alkheelank-server) ==="
Write-Host ""
Write-Host "CORS_ORIGIN=https://YOUR-VERCEL-URL.vercel.app"
Write-Host "(Use your real Vercel URL, then Redeploy both client and server)"
Write-Host ""
Write-Host "=== Supabase -> Authentication -> URL configuration ==="
Write-Host ""
Write-Host "Site URL: https://YOUR-VERCEL-URL.vercel.app"
Write-Host "Redirect URLs:"
Write-Host "  https://YOUR-VERCEL-URL.vercel.app/host"
Write-Host "  http://localhost:5173/host"
Write-Host ""
