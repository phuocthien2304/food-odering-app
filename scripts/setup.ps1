# Food Ordering App - Windows Setup Script
# Run with: powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

param(
    [switch]$SkipDocker = $false
)

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-CommandExists {
    param([string]$Command)
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# Start setup
Write-Header "Food Ordering App - Windows Setup"

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Cyan

if (-not (Test-CommandExists docker)) {
    Write-Error-Custom "Docker is not installed"
    Write-Host "Please install Docker Desktop from https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}
Write-Success "Docker is installed"

if (-not (Test-CommandExists docker-compose)) {
    Write-Error-Custom "Docker Compose is not installed"
    exit 1
}
Write-Success "Docker Compose is installed"

if (-not (Test-CommandExists node)) {
    Write-Error-Custom "Node.js is not installed"
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
$nodeVersion = & node --version
Write-Success "Node.js is installed: $nodeVersion"

if (-not (Test-CommandExists npm)) {
    Write-Error-Custom "npm is not installed"
    exit 1
}
$npmVersion = & npm --version
Write-Success "npm is installed: $npmVersion"

# Organize backend
Write-Host "`nOrganizing backend services..." -ForegroundColor Cyan

if (-not (Test-Path "backend")) {
    New-Item -ItemType Directory -Path "backend" | Out-Null
    Write-Success "Created backend directory"
}

$services = @("api-gateway", "user-service", "order-service", "restaurant-service", "delivery-service", "payment-service")

foreach ($service in $services) {
    if ((Test-Path $service) -and -not (Test-Path "backend\$service")) {
        Move-Item -Path $service -Destination "backend\" -Force
        Write-Success "Moved $service to backend"
    }
}

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Success "Frontend dependencies installed"
} else {
    Write-Error-Custom "Failed to install frontend dependencies"
    Pop-Location
    exit 1
}
Pop-Location

# Build Docker images
if (-not $SkipDocker) {
    Write-Host "`nBuilding Docker images..." -ForegroundColor Cyan
    docker-compose build
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Docker images built successfully"
    } else {
        Write-Error-Custom "Failed to build Docker images"
        exit 1
    }
}

# Success message
Write-Header "Setup completed successfully!"

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Start backend: " -NoNewline
Write-Host "npm run docker:up" -ForegroundColor Blue
Write-Host "2. In another terminal, start frontend: " -NoNewline
Write-Host "cd frontend && npm run dev" -ForegroundColor Blue
Write-Host "3. Open http://localhost:5173 in your browser" -ForegroundColor Blue

Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "View logs: " -NoNewline
Write-Host "npm run docker:logs" -ForegroundColor Blue
Write-Host "Stop services: " -NoNewline
Write-Host "docker-compose down" -ForegroundColor Blue
Write-Host "Clean up: " -NoNewline
Write-Host "npm run docker:clean" -ForegroundColor Blue

Write-Host ""
