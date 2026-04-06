# Ukraine War Monitor - Simple Launcher
# Runs Backend and Frontend in separate windows and opens the browser

Write-Host "--- Launching UWM Dashboard ---" -ForegroundColor Cyan

# 1. Start Backend in a new window
Write-Host "[1/3] Starting Backend (Python)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONPATH='.'; py src/backend/main.py"

# 2. Start Frontend in a new window
Write-Host "[2/3] Starting Frontend (Next.js)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd src/frontend; npm run dev"

# 3. Wait a few seconds for services to warm up
Write-Host "[3/3] Warming up engines..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 4. Open Browser
Write-Host "--- READY: Opening Dashboard ---" -ForegroundColor Green
Start-Process "http://localhost:3000"
