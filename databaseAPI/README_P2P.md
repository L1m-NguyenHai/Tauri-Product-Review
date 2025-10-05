# P2P Database Synchronization Guide

## Overview

The Product Review API includes a Peer-to-Peer (P2P) database synchronization system that allows multiple instances with **separate databases** to automatically sync data in real-time via API calls.

## Architecture - Distributed Databases

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Node 1        │    │   Node 2        │    │   Node 3        │
│   API:8000      │◄──►│   API:8010      │◄──►│   API:8020      │
│   P2P:8001      │    │   P2P:8003      │    │   P2P:8005      │
│   Discovery:8002│    │   Discovery:8004│    │   Discovery:8006│
│  ┌─────────────┐│    │  ┌─────────────┐│    │  ┌─────────────┐│
│  │PostgreSQL   ││    │  │PostgreSQL   ││    │  │PostgreSQL   ││
│  │Database 1   ││    │  │Database 2   ││    │  │Database 3   ││
│  │Port: 5432   ││    │  │Port: 5433   ││    │  │Port: 5434   ││
│  └─────────────┘│    │  └─────────────┘│    │  └─────────────┘│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         └─── Sync via API ──────┼─── Sync via API ──────┘
                                 │
                    📡 P2P Communication Protocol
```

## Key Features

### 1. **Separate Database Instances**

- Each node has its own PostgreSQL database
- No shared database dependency
- True distributed architecture
- Data independence with synchronization

### 2. **Incremental Synchronization**

- Only syncs changed data since last sync
- Timestamp-based change detection
- Minimal network overhead
- Efficient conflict resolution

### 3. **Automatic Peer Discovery**

- UDP broadcast for node discovery
- No manual peer configuration needed
- Automatic health monitoring
- Self-healing network topology

### 4. **Real-time Sync Events**

- WebSocket notifications for sync events
- Live monitoring of data changes
- Instant conflict resolution alerts
- Performance metrics tracking

### 5. **Robust Conflict Resolution**

- Timestamp-based precedence
- Node ID tie-breaking
- Transaction-safe operations
- Data consistency guarantees

## Quick Start

### 1. Single Instance Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your settings
# Key P2P settings:
API_PORT=8000
P2P_PORT=8001
DISCOVERY_PORT=8002
NODE_NAME=node1
ENABLE_P2P_SYNC=true

# Install dependencies
pip install -r requirement.txt

# Run the application
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 2. Multi-Instance Setup with Docker Compose

```bash
# Build and start all nodes
docker-compose -f docker-compose.p2p.yml up --build

# This will start:
# - Node 1: API on port 8000, P2P on 8001
# - Node 2: API on port 8010, P2P on 8003
# - Node 3: API on port 8020, P2P on 8005
# - PostgreSQL database on port 5432
```

### 3. Manual Peer Addition

If automatic discovery doesn't work, you can manually add peers:

```bash
curl -X POST "http://localhost:8000/api/v1/p2p/peers" \
  -H "Content-Type: application/json" \
  -d '{
    "peer_id": "node2-uuid",
    "host": "192.168.1.100",
    "port": 8010,
    "last_seen": "2025-01-01T12:00:00",
    "api_version": "1.0.1",
    "status": "active"
  }'
```

## API Endpoints

### P2P Status

```
GET /api/v1/p2p/status
```

Returns current node status, peer list, and sync configuration.

### Manual Sync Trigger

```
POST /api/v1/p2p/sync/trigger
```

Manually trigger synchronization with all active peers.

### Peer Management

```
POST /api/v1/p2p/peers          # Add peer
DELETE /api/v1/p2p/peers/{id}   # Remove peer
```

### Table Information

```
GET /api/v1/p2p/table-info/{table}  # Get table hash and timestamp
GET /api/v1/p2p/table-data/{table}  # Get complete table data
POST /api/v1/p2p/sync-table/{table} # Receive table data from peer
```

### Configuration

```
GET /api/v1/p2p/config          # Get P2P configuration
POST /api/v1/p2p/config         # Update P2P configuration
```

### WebSocket Monitoring

```
ws://localhost:8000/api/v1/p2p/ws
```

Real-time P2P sync events and notifications.

## Configuration

### Environment Variables

| Variable                | Default        | Description                     |
| ----------------------- | -------------- | ------------------------------- |
| `API_PORT`              | 8000           | Main API port                   |
| `P2P_PORT`              | 8001           | P2P sync port                   |
| `DISCOVERY_PORT`        | 8002           | UDP discovery port              |
| `NODE_NAME`             | auto-generated | Node identifier                 |
| `ENABLE_P2P_SYNC`       | true           | Enable/disable P2P sync         |
| `ENABLE_AUTO_DISCOVERY` | true           | Enable automatic peer discovery |
| `SYNC_INTERVAL`         | 30             | Sync interval in seconds        |

### Sync Configuration

The P2P system automatically syncs these tables:

- `users`
- `products`
- `reviews`
- `categories`
- `product_images`
- `review_media`
- `activity_logs`

## Testing

### Test with Multiple Local Instances

```bash
# Terminal 1 - Node 1
API_PORT=8000 P2P_PORT=8001 DISCOVERY_PORT=8002 uvicorn app:app --port 8000

# Terminal 2 - Node 2
API_PORT=8010 P2P_PORT=8003 DISCOVERY_PORT=8004 uvicorn app:app --port 8010

# Terminal 3 - Node 3
API_PORT=8020 P2P_PORT=8005 DISCOVERY_PORT=8006 uvicorn app:app --port 8020
```

### Test Sync Functionality

1. Create a user on Node 1:

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}'
```

2. Check if user appears on Node 2:

```bash
curl "http://localhost:8010/api/v1/users/"
```

3. Monitor sync status:

```bash
curl "http://localhost:8000/api/v1/p2p/status"
```

## Troubleshooting

### Common Issues

1. **Peers not discovering each other**

   - Check firewall settings for UDP ports
   - Ensure nodes are on the same network
   - Manually add peers using the API

2. **Sync not working**

   - Check database connectivity
   - Verify table permissions
   - Check logs for error messages

3. **Performance issues**
   - Reduce sync interval
   - Limit number of peers
   - Check network bandwidth

### Monitoring Commands

```bash
# Check P2P status
curl "http://localhost:8000/api/v1/p2p/status"

# Trigger manual sync
curl -X POST "http://localhost:8000/api/v1/p2p/sync/trigger"

# Refresh peer discovery
curl -X POST "http://localhost:8000/api/v1/p2p/discovery/refresh"
```

## Security Considerations

1. **Network Security**: P2P communication is not encrypted by default
2. **Authentication**: No authentication required for P2P endpoints
3. **Access Control**: Restrict P2P ports in production environments
4. **Data Validation**: All received data is validated before application

## Production Deployment

For production deployment:

1. Use environment-specific configuration
2. Set up proper firewall rules
3. Monitor P2P traffic and performance
4. Implement backup and recovery procedures
5. Consider using a message queue for additional reliability

## WebSocket Events

The WebSocket endpoint sends these event types:

```json
{
  "type": "status",
  "data": { /* P2P status */ }
}

{
  "type": "sync_event",
  "data": {
    "type": "table_synced",
    "table": "users",
    "count": 10,
    "timestamp": "2025-01-01T12:00:00"
  }
}

{
  "type": "pong",
  "timestamp": "2025-01-01T12:00:00"
}
```

## Performance Optimization

1. **Sync Interval**: Adjust based on data change frequency
2. **Selective Sync**: Only sync tables that actually changed
3. **Batch Operations**: Group multiple changes into single sync
4. **Network Optimization**: Compress large data transfers
5. **Database Optimization**: Use proper indexes for sync queries
