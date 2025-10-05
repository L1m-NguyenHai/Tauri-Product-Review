# P2P Database Synchronization System

## Overview

This system implements **true bidirectional P2P synchronization** between separate database instances. Each node runs its own independent PostgreSQL database and syncs data with other nodes via HTTP API calls.

## Key Features

- ✅ **Separate Databases**: Each node has its own PostgreSQL instance
- ✅ **Bidirectional Sync**: All nodes can sync to each other automatically
- ✅ **Real-time Triggers**: Data changes trigger immediate sync
- ✅ **Conflict Resolution**: Handles data conflicts intelligently
- ✅ **Remote Connectivity**: Supports ngrok for remote nodes
- ✅ **WebSocket Monitoring**: Real-time sync status updates
- ✅ **Auto Discovery**: Nodes discover each other automatically

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Node 1    │────▶│   Node 2    │────▶│   Node 3    │
│ Port: 8001  │◄────│ Port: 8002  │◄────│ Port: 8003  │
│ DB: 5432    │     │ DB: 5433    │     │ DB: 5434    │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   ▲                   ▲
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    Bidirectional Sync
```

## Quick Start

### 1. Start the System

```bash
# Start all nodes with separate databases
docker-compose -f docker-compose.p2p.yml up

# Or run complete automated test
python test_complete_p2p_system.py
```

### 2. Access the Nodes

- **Node 1**: http://localhost:8001
- **Node 2**: http://localhost:8002
- **Node 3**: http://localhost:8003

### 3. Test P2P Sync

```bash
# Run bidirectional sync test
python test_bidirectional_p2p_sync.py

# Test remote P2P sync
python test_remote_p2p.py
```

## Manual Setup

### 1. Database Setup

```bash
# Start databases only
docker-compose -f docker-compose.p2p.yml up postgres1 postgres2 postgres3
```

### 2. Node Configuration

Create `.env.node1`, `.env.node2`, `.env.node3`:

```env
# Node 1 Configuration
NODE_ID=node1
API_PORT=8001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/product_review_node1
P2P_ENABLED=true
P2P_DISCOVERY_PORT=6001
P2P_PEER_PORT=8001
P2P_SYNC_INTERVAL=30
```

### 3. Start Nodes

```bash
# Terminal 1 - Node 1
export $(cat .env.node1 | xargs) && uvicorn app:app --host 0.0.0.0 --port 8001

# Terminal 2 - Node 2
export $(cat .env.node2 | xargs) && uvicorn app:app --host 0.0.0.0 --port 8002

# Terminal 3 - Node 3
export $(cat .env.node3 | xargs) && uvicorn app:app --host 0.0.0.0 --port 8003
```

## P2P Sync Features

### Automatic Sync Triggers

The system automatically triggers sync when data changes:

```python
# Example: Creating a product triggers sync
@router.post("/products/")
async def create_product(product: ProductCreate):
    # ... create product in database ...

    # Automatic sync trigger
    await p2p_hooks.on_product_created(product_id)

    return new_product
```

### Sync Tables

The following tables are synchronized:

- `users` - User accounts and profiles
- `categories` - Product categories
- `products` - Product information
- `reviews` - Product reviews and ratings

### Conflict Resolution

- **Last-Writer-Wins**: Most recent update takes precedence
- **Node Priority**: Higher priority nodes override conflicts
- **Timestamp Based**: Uses `updated_at` timestamps

## API Endpoints

### P2P Management

```http
GET /p2p/status                    # Get sync status
GET /p2p/peers                     # List active peers
POST /p2p/peers                    # Add manual peer
DELETE /p2p/peers/{peer_id}        # Remove peer
POST /p2p/sync/manual              # Trigger manual sync
GET /p2p/sync/history              # Sync history
WebSocket /p2p/ws                  # Real-time sync monitoring
```

### Bidirectional Sync

```http
POST /p2p/notify-changes           # Notify peers of changes
POST /p2p/sync/bidirectional       # Bidirectional table sync
GET /p2p/table/{table}/changes     # Get table changes since timestamp
```

## Remote Connectivity

### Using ngrok

1. **Install ngrok**: https://ngrok.com/download

2. **Start ngrok tunnel**:

```bash
# For Node 1
ngrok http 8001
```

3. **Add remote peer**:

```bash
curl -X POST http://localhost:8002/p2p/peers \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io",
    "peer_id": "remote-node-1"
  }'
```

### SSL/HTTPS Support

The system automatically handles HTTPS connections for ngrok tunnels and other SSL endpoints.

## Monitoring and Debugging

### WebSocket Monitoring

```javascript
// Connect to sync monitoring
const ws = new WebSocket("ws://localhost:8001/p2p/ws");
ws.onmessage = (event) => {
  const syncEvent = JSON.parse(event.data);
  console.log("Sync Event:", syncEvent);
};
```

### Sync Status

```bash
# Check sync status
curl http://localhost:8001/p2p/status

# Response
{
  "active_peers": 2,
  "last_sync": "2024-01-15T10:30:00Z",
  "sync_running": true,
  "conflicts_resolved": 0,
  "tables_synced": 4
}
```

### Logs

```bash
# View sync logs
docker-compose -f docker-compose.p2p.yml logs app1

# Filter P2P logs
docker-compose -f docker-compose.p2p.yml logs app1 | grep "p2p_sync"
```

## Testing

### Automated Tests

```bash
# Complete system test
python test_complete_p2p_system.py

# Bidirectional sync test
python test_bidirectional_p2p_sync.py

# Remote connectivity test
python test_remote_p2p.py
```

### Manual Testing

1. **Create data on Node 1**:

```bash
curl -X POST http://localhost:8001/products/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Product", "description": "From Node 1"}'
```

2. **Check sync on Node 2**:

```bash
curl http://localhost:8002/products/
```

3. **Verify bidirectional sync**:

```bash
# Create on Node 2
curl -X POST http://localhost:8002/categories/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Category", "description": "From Node 2"}'

# Check on Node 1
curl http://localhost:8001/categories/
```

## Performance Optimization

### Sync Configuration

```python
# p2p_sync/config.py
SYNC_CONFIG = {
    "sync_interval": 30,          # Sync every 30 seconds
    "batch_size": 100,            # Process 100 records per batch
    "max_retries": 3,             # Retry failed syncs 3 times
    "timeout": 30,                # 30 second timeout
    "incremental": True           # Use incremental sync
}
```

### Database Indexing

Ensure proper indexes for sync performance:

```sql
-- Add indexes for sync timestamps
CREATE INDEX idx_users_updated_at ON users(updated_at);
CREATE INDEX idx_products_updated_at ON products(updated_at);
CREATE INDEX idx_reviews_updated_at ON reviews(updated_at);
CREATE INDEX idx_categories_updated_at ON categories(updated_at);
```

## Troubleshooting

### Common Issues

1. **Nodes not discovering each other**:

   - Check firewall settings
   - Verify UDP ports 6001-6003 are open
   - Check network connectivity

2. **Sync failures**:

   - Check database connections
   - Verify table schemas match
   - Review sync logs for errors

3. **Data conflicts**:
   - Check `updated_at` timestamps
   - Review conflict resolution logs
   - Manually resolve if needed

### Debug Commands

```bash
# Check peer discovery
curl http://localhost:8001/p2p/peers

# Force manual sync
curl -X POST http://localhost:8001/p2p/sync/manual

# Check specific table sync
curl http://localhost:8001/p2p/table/products/changes?since=2024-01-01T00:00:00Z
```

## Security Considerations

- **Authentication**: API endpoints require proper authentication
- **SSL/TLS**: Use HTTPS for remote connections
- **Network Security**: Restrict P2P ports in production
- **Data Validation**: All synced data is validated
- **Access Control**: Role-based permissions enforced

## Production Deployment

### Docker Swarm

```yaml
# docker-swarm.yml
version: "3.8"
services:
  app:
    image: product-review-api:latest
    deploy:
      replicas: 3
    environment:
      - P2P_ENABLED=true
      - P2P_DISCOVERY_MODE=manual
```

### Kubernetes

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: product-review-p2p
spec:
  replicas: 3
  selector:
    matchLabels:
      app: product-review
  template:
    spec:
      containers:
        - name: api
          image: product-review-api:latest
          env:
            - name: P2P_ENABLED
              value: "true"
```

## License

MIT License - See LICENSE file for details.

## Support

For questions and support:

- Create an issue in the repository
- Check the troubleshooting section
- Review the test scripts for examples
