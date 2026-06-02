# One-shot local setup for AlkheelanK
$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

Write-Host "`nAlkheelanK setup`n" -ForegroundColor Cyan

function Ensure-Env($example, $target) {
  if (-not (Test-Path $target)) {
    Copy-Item $example $target
    Write-Host "Created $target from example"
  }
}

Ensure-Env (Join-Path $Root "client\.env.example") (Join-Path $Root "client\.env")
Ensure-Env (Join-Path $Root "server\.env.example") (Join-Path $Root "server\.env")

Write-Host "Installing dependencies..."
Push-Location (Join-Path $Root "client"); npm install --silent; Pop-Location
Push-Location (Join-Path $Root "server"); npm install --silent; Pop-Location
Push-Location (Join-Path $Root "scripts"); npm install --silent; Pop-Location

Write-Host "Applying database patch (if SUPABASE_DB_PASSWORD is set)..."
Push-Location (Join-Path $Root "scripts"); node apply-schema.mjs; Pop-Location

$patchPath = Join-Path $Root "supabase\patch-missing-tables.sql"
$clientEnv = Get-Content (Join-Path $Root "client\.env") -Raw
if ($clientEnv -match 'VITE_SUPABASE_URL=https://([^.]+)\.supabase\.co') {
  $ref = $Matches[1]
  $sqlUrl = "https://supabase.com/dashboard/project/$ref/sql/new"
  if (-not $env:SUPABASE_DB_PASSWORD -and -not ((Get-Content (Join-Path $Root "server\.env") -Raw) -match 'SUPABASE_DB_PASSWORD=\S+')) {
    Get-Content $patchPath -Raw | Set-Clipboard
    Write-Host "`nPatch SQL copied to clipboard." -ForegroundColor Yellow
    Write-Host "Paste into SQL Editor and Run: $sqlUrl`n"
  }
}

Push-Location (Join-Path $Root "scripts"); node verify-setup.mjs; $code = $LASTEXITCODE; Pop-Location

Write-Host "Start game (terminal 1): cd server; npm run dev"
Write-Host "Start client (terminal 2): cd client; npm run dev"
Write-Host "Login: http://localhost:5173/login`n"

exit $code
