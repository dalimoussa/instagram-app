# 🚀 Start Instagram Auto-Poster
# Simple script to start both backend and frontend servers

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  Instagram Auto-Poster" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "✓ Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\backend'; npm run start:dev"

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "✓ Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectPath\frontend'; npm run dev"

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "  ✓ Servers Started!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""
Write-Host "➜ Open your browser to: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C in each terminal to stop servers" -ForegroundColor Gray
Write-Host ""
