# Mirza Footwear - Production Launcher
# Starts the Spree Commerce API and Next.js Production Server

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Mirza Footwear Production Storefront           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ProjectRoot = $PSScriptRoot
$StorefrontDir = Join-Path $ProjectRoot "storefront"

# 1. Start API service
Write-Host "`n[1/2] Starting Spree Commerce API Service on port 4000..." -ForegroundColor Yellow
$apiJob = Start-Job -ScriptBlock {
    param($root)
    node (Join-Path $root "backend\mock-spree-server.mjs")
} -ArgumentList $ProjectRoot

Start-Sleep -Seconds 2

# 2. Start Production Server
Write-Host "`n[2/2] Launching Next.js Production Server on http://localhost:3001..." -ForegroundColor Yellow
Write-Host "  --> Press Ctrl+C in this terminal to stop both servers.`n" -ForegroundColor DarkGray

Start-Process "http://localhost:3001/us/en"

try {
    Set-Location $StorefrontDir
    pnpm run start
} finally {
    Write-Host "`nStopping background API service..." -ForegroundColor Yellow
    Stop-Job $apiJob -ErrorAction SilentlyContinue
    Remove-Job $apiJob -ErrorAction SilentlyContinue
    Set-Location $ProjectRoot
    Write-Host "Mirza Footwear servers stopped." -ForegroundColor Green
}
