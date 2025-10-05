# Start P2P nodes with separate databases - Windows PowerShell version

Write-Host "🚀 Starting P2P Product Review API with Separate Databases" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Function to check if port is available
function Test-Port($port) {
    $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
    return -not $connection
}

# Check required ports
Write-Host "🔍 Checking port availability..." -ForegroundColor Blue
$ports = @(5432, 5433, 5434, 8000, 8001, 8002, 8010, 8003, 8004, 8020, 8005, 8006)
$portsInUse = @()

foreach ($port in $ports) {
    if (-not (Test-Port $port)) {
        $portsInUse += $port
        Write-Host "⚠️  Port $port is already in use" -ForegroundColor Yellow
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "❌ Required ports are in use: $($portsInUse -join ', ')" -ForegroundColor Red
    Write-Host "Please free these ports and try again." -ForegroundColor Red
    exit 1
}

Write-Host "✅ All required ports are available" -ForegroundColor Green

# Create necessary directories
Write-Host "📁 Creating directories..." -ForegroundColor Blue
if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
}
if (-not (Test-Path "uploads/avatars")) {
    New-Item -ItemType Directory -Path "uploads/avatars" | Out-Null
}
if (-not (Test-Path "uploads/products")) {
    New-Item -ItemType Directory -Path "uploads/products" | Out-Null
}
Write-Host "✅ Directories created" -ForegroundColor Green

# Start with Docker Compose
Write-Host "🐳 Starting services with Docker Compose..." -ForegroundColor Blue
docker-compose -f docker-compose.p2p.yml up --build -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Docker Compose services" -ForegroundColor Red
    exit 1
}

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Function to check service health
function Test-ServiceHealth($name, $url, $maxAttempts = 10) {
    for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
        try {
            $response = Invoke-WebRequest -Uri "$url/health" -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "✅ $name is healthy" -ForegroundColor Green
                return $true
            }
        }
        catch {
            Write-Host "⏳ Waiting for $name... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    
    Write-Host "❌ $name failed to start properly" -ForegroundColor Red
    return $false
}

# Check all nodes
Write-Host "🏥 Checking service health..." -ForegroundColor Blue
$allHealthy = $true

$allHealthy = $allHealthy -and (Test-ServiceHealth "Node 1" "http://localhost:8000")
$allHealthy = $allHealthy -and (Test-ServiceHealth "Node 2" "http://localhost:8010")
$allHealthy = $allHealthy -and (Test-ServiceHealth "Node 3" "http://localhost:8020")

if (-not $allHealthy) {
    Write-Host "❌ Some services failed to start. Check Docker logs:" -ForegroundColor Red
    Write-Host "docker-compose -f docker-compose.p2p.yml logs" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🎉 P2P Product Review API Started Successfully!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  Node 1 API:    http://localhost:8000" -ForegroundColor White
Write-Host "  Node 1 Docs:   http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Node 2 API:    http://localhost:8010" -ForegroundColor White
Write-Host "  Node 2 Docs:   http://localhost:8010/docs" -ForegroundColor White
Write-Host "  Node 3 API:    http://localhost:8020" -ForegroundColor White
Write-Host "  Node 3 Docs:   http://localhost:8020/docs" -ForegroundColor White
Write-Host ""
Write-Host "🗄️  Database Connections:" -ForegroundColor Cyan
Write-Host "  Node 1 DB:     localhost:5432" -ForegroundColor White
Write-Host "  Node 2 DB:     localhost:5433" -ForegroundColor White
Write-Host "  Node 3 DB:     localhost:5434" -ForegroundColor White
Write-Host ""
Write-Host "🔄 P2P Sync Ports:" -ForegroundColor Cyan
Write-Host "  Node 1 P2P:    8001, Discovery: 8002" -ForegroundColor White
Write-Host "  Node 2 P2P:    8003, Discovery: 8004" -ForegroundColor White
Write-Host "  Node 3 P2P:    8005, Discovery: 8006" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testing:" -ForegroundColor Cyan
Write-Host "  Run tests:     python test_p2p.py" -ForegroundColor White
Write-Host "  Monitor logs:  docker-compose -f docker-compose.p2p.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🛑 To stop:" -ForegroundColor Cyan
Write-Host "  docker-compose -f docker-compose.p2p.yml down" -ForegroundColor White