#!/usr/bin/env pwsh
# TrialGo Local Development Startup Script

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TrialGo Docker Compose Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

# Step 1: Stop existing containers
Write-Host "`n[1/4] Stopping existing containers..." -ForegroundColor Yellow
docker compose down

# Step 2: Build images
Write-Host "`n[2/4] Building Docker images (this may take 5-10 minutes)..." -ForegroundColor Yellow
docker compose build --no-cache

# Step 3: Start services
Write-Host "`n[3/4] Starting services..." -ForegroundColor Yellow
docker compose up -d

# Step 4: Wait for services and check status
Write-Host "`n[4/4] Waiting for services to become healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n" -ForegroundColor Green
docker compose ps

Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Services Available At:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor Green
Write-Host "  Backend API:     http://localhost:8000" -ForegroundColor Green
Write-Host "  API Docs:        http://localhost:8000/docs" -ForegroundColor Green
Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor Green
Write-Host "  Redis:           localhost:6379" -ForegroundColor Green
Write-Host "`n" -ForegroundColor Cyan

# Check health
Write-Host "Checking backend health..." -ForegroundColor Yellow
$maxRetries = 30
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend is healthy!" -ForegroundColor Green
            break
        }
    }
    catch {
        $retryCount++
        Write-Host "  Attempt $retryCount/$maxRetries - Waiting for backend..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if ($retryCount -eq $maxRetries) {
    Write-Host "✗ Backend health check timed out" -ForegroundColor Red
}

Write-Host "`nTo view logs, run: docker compose logs -f backend" -ForegroundColor Cyan
Write-Host "To stop services, run: docker compose down" -ForegroundColor Cyan
