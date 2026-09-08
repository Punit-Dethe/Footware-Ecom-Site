# Bootstrap Spree Commerce Backend and populate sample catalog
$ErrorActionPreference = "Stop"

$BackendDir = $PSScriptRoot
$StorefrontDir = Join-Path (Split-Path $BackendDir -Parent) "storefront"
$EnvLocalFile = Join-Path $StorefrontDir ".env.local"
$SpreeUrl = "http://localhost:4000"

Write-Host "==> Starting Spree Docker containers..."
docker compose -f (Join-Path $BackendDir "docker-compose.yml") up -d --wait

Write-Host "==> Waiting for Spree health endpoint at $SpreeUrl/up..."
$retries = 30
$healthy = $false
while ($retries -gt 0) {
    try {
        $res = Invoke-WebRequest -Uri "$SpreeUrl/up" -UseBasicParsing -TimeoutSec 3
        if ($res.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        # Retry
    }
    Start-Sleep -Seconds 2
    $retries--
}

if (-not $healthy) {
    Write-Error "Spree backend did not become healthy in time. Check 'docker compose logs web'."
    exit 1
}

Write-Host "==> Seeding base store data..."
npx --prefix $BackendDir @spree/cli seed

Write-Host "==> Loading sample catalog products and categories..."
npx --prefix $BackendDir @spree/cli sample-data

Write-Host "==> Generating Storefront Publishable API Key..."
$apiKeyOutput = npx --prefix $BackendDir @spree/cli api-key create --name "Storefront Baseline" --type publishable
$match = [regex]::Match($apiKeyOutput, 'pk_[A-Za-z0-9_-]+')

if ($match.Success) {
    $publishableKey = $match.Value
    Write-Host "Publishable Key: $publishableKey"
    
    # Update storefront/.env.local
    $envContent = @"
# Local Spree Commerce Configuration
SPREE_API_URL=$SpreeUrl
SPREE_PUBLISHABLE_KEY=$publishableKey
NEXT_PUBLIC_SITE_URL=http://localhost:3001
NEXT_PUBLIC_STORE_NAME=Mirza Footwear
NEXT_PUBLIC_STORE_DESCRIPTION=High-Performance Footwear Storefront by Mirza Footwear
NEXT_PUBLIC_DEFAULT_COUNTRY=us
NEXT_PUBLIC_DEFAULT_LOCALE=en
"@
    Set-Content -Path $EnvLocalFile -Value $envContent
    Write-Host "==> Updated $EnvLocalFile with active credentials!"
} else {
    Write-Warning "Could not automatically parse publishable key from output:"
    Write-Host $apiKeyOutput
}

Write-Host "==> Spree backend setup complete!"
