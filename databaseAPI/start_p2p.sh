#!/bin/bash
# Start P2P nodes with separate databases - Linux/Mac version

echo "🚀 Starting P2P Product Review API with Separate Databases"
echo "==========================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Function to check if port is available
check_port() {
    local port=$1
    if netstat -an | grep ":$port " > /dev/null 2>&1; then
        echo "⚠️  Port $port is already in use"
        return 1
    fi
    return 0
}

# Check required ports
echo "🔍 Checking port availability..."
ports=(5432 5433 5434 8000 8001 8002 8010 8003 8004 8020 8005 8006)
for port in "${ports[@]}"; do
    if ! check_port $port; then
        echo "❌ Port $port is required but already in use"
        exit 1
    fi
done
echo "✅ All required ports are available"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p uploads/avatars
mkdir -p uploads/products
echo "✅ Directories created"

# Start with Docker Compose
echo "🐳 Starting services with Docker Compose..."
docker-compose -f docker-compose.p2p.yml up --build -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

check_service() {
    local name=$1
    local url=$2
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url/health" > /dev/null 2>&1; then
            echo "✅ $name is healthy"
            return 0
        fi
        echo "⏳ Waiting for $name... (attempt $attempt/$max_attempts)"
        sleep 3
        ((attempt++))
    done
    
    echo "❌ $name failed to start properly"
    return 1
}

# Check all nodes
check_service "Node 1" "http://localhost:8000"
check_service "Node 2" "http://localhost:8010" 
check_service "Node 3" "http://localhost:8020"

echo ""
echo "🎉 P2P Product Review API Started Successfully!"
echo "=============================================="
echo ""
echo "📊 Service URLs:"
echo "  Node 1 API:    http://localhost:8000"
echo "  Node 1 Docs:   http://localhost:8000/docs"
echo "  Node 2 API:    http://localhost:8010"
echo "  Node 2 Docs:   http://localhost:8010/docs"
echo "  Node 3 API:    http://localhost:8020"
echo "  Node 3 Docs:   http://localhost:8020/docs"
echo ""
echo "🗄️  Database Connections:"
echo "  Node 1 DB:     localhost:5432"
echo "  Node 2 DB:     localhost:5433"
echo "  Node 3 DB:     localhost:5434"
echo ""
echo "🔄 P2P Sync Ports:"
echo "  Node 1 P2P:    8001, Discovery: 8002"
echo "  Node 2 P2P:    8003, Discovery: 8004"
echo "  Node 3 P2P:    8005, Discovery: 8006"
echo ""
echo "🧪 Testing:"
echo "  Run tests:     python test_p2p.py"
echo "  Monitor logs:  docker-compose -f docker-compose.p2p.yml logs -f"
echo ""
echo "🛑 To stop:"
echo "  docker-compose -f docker-compose.p2p.yml down"