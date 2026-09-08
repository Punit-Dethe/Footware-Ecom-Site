# Mirza Footwear - Development Launcher
# Starts the Spree Commerce API and Next.js Storefront

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Mirza Footwear High-Performance Storefront     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot
$StorefrontDir = Join-Path $ProjectRoot "storefront"
$BackendDir = Join-Path $ProjectRoot "backend"

# 1. Start API service (Mock Server if Docker not running)
Write-Host "`n[1/3] Starting Spree Commerce API Service on port 4000..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    param($root)
    node (Join-Path $root "backend\mock-spree-server.mjs")
} -ArgumentList $ProjectRoot

Start-Sleep -Seconds 2

# Verify API is reachable
try {
    $health = Invoke-RestMethod -Uri "http://localhost:4000/up" -TimeoutSec 3
    if ($health -eq "OK") {
        Write-Host "  --> Spree API is LIVE on http://localhost:4000" -ForegroundColor Green
    }
} catch {
    Write-Warning "Could not connect to Spree API on port 4000. It may still be starting."
}

# 2. Start Next.js Storefront
Write-Host "`n[2/3] Launching Next.js 16 Storefront on http://localhost:3001..." -ForegroundColor Yellow
Write-Host "  --> Press Ctrl+C in this terminal to stop both servers.`n" -ForegroundColor DarkGray

# Open browser
Start-Process "http://localhost:3001/us/en"

# Run storefront in foreground
try {
    Set-Location $StorefrontDir
    pnpm run dev
} finally {
    Write-Host "`nStopping background API service..." -ForegroundColor Yellow
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    Set-Location $ProjectRoot
    Write-Host "Mirza Footwear servers stopped." -ForegroundColor Green
}
