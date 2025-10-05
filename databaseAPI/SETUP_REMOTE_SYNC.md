# P2P Sync Through Ngrok - Setup Guide

## Tình huống

- Bạn có project chạy ở máy A với database A
- Tôi clone project về máy B với database B (cùng schema, có thể khác data)
- Sync data giữa 2 database qua internet bằng ngrok

## Cách setup

### 1. Trên máy của bạn (Node A)

```bash
# 1. Chạy API bình thường
cd databaseAPI
uvicorn app:app --host 0.0.0.0 --port 8000

# 2. Expose qua ngrok (cài ngrok trước: https://ngrok.com/)
ngrok http 8000
# Sẽ có URL như: https://abc123.ngrok.io

# 3. Note lại ngrok URL để share
```

### 2. Trên máy của tôi (Node B)

```bash
# 1. Clone project
git clone https://github.com/L1m-NguyenHai/Tauri-Product-Review.git
cd Tauri-Product-Review/databaseAPI

# 2. Setup database (cùng schema)
# Import schema từ docs/Schema.sql vào PostgreSQL local

# 3. Setup environment
cp .env.example .env
# Edit .env:
DB_HOST=localhost
DB_NAME=LimReview
DB_USER=postgres
DB_PASS=your_password
DB_PORT=5432
API_PORT=8000
P2P_PORT=8001
DISCOVERY_PORT=8002
NODE_NAME=node_remote
ENABLE_P2P_SYNC=true
ENABLE_AUTO_DISCOVERY=false  # Tắt auto discovery qua internet

# 4. Install dependencies
pip install -r requirement.txt

# 5. Chạy API
uvicorn app:app --host 0.0.0.0 --port 8000
```

### 3. Kết nối thủ công giữa 2 nodes

#### Trên máy B (tôi), add peer của bạn:

```bash
curl -X POST "http://localhost:8000/api/v1/p2p/peers" \
  -H "Content-Type: application/json" \
  -d '{
    "peer_id": "node_a_id",
    "host": "abc123.ngrok.io",
    "port": 443,
    "last_seen": "'$(date -u +%Y-%m-%dT%H:%M:%S)'",
    "api_version": "1.0.1",
    "status": "active"
  }'
```

#### Trên máy A (bạn), add peer của tôi:

```bash
# Nếu tôi cũng expose qua ngrok
curl -X POST "http://localhost:8000/api/v1/p2p/peers" \
  -H "Content-Type: application/json" \
  -d '{
    "peer_id": "node_b_id",
    "host": "xyz456.ngrok.io",
    "port": 443,
    "last_seen": "'$(date -u +%Y-%m-%dT%H:%M:%S)'",
    "api_version": "1.0.1",
    "status": "active"
  }'
```

### 4. Test sync

#### Kiểm tra kết nối:

```bash
# Trên máy A
curl "http://localhost:8000/api/v1/p2p/status"

# Trên máy B
curl "http://localhost:8000/api/v1/p2p/status"
```

#### Trigger sync thủ công:

```bash
# Trên bất kỳ máy nào
curl -X POST "http://localhost:8000/api/v1/p2p/sync/trigger"
```

#### Test tạo data:

```bash
# Tạo user trên máy A
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_from_A",
    "email": "testA@example.com",
    "password": "password123",
    "full_name": "Test User From A"
  }'

# Đợi vài giây, check trên máy B
curl "http://localhost:8000/api/v1/users/"
# Sẽ thấy user "test_from_A" xuất hiện
```

## Cấu hình nâng cao

### 1. Sử dụng HTTPS với ngrok

```bash
# Trên .env của máy remote
NGROK_PROTOCOL=https
PEER_USE_HTTPS=true
```

### 2. Cấu hình sync interval

```bash
# Sync mỗi 60 giây thay vì 30 giây
SYNC_INTERVAL=60
```

### 3. Chỉ sync một số bảng

```python
# Trong p2p_sync/config.py
sync_tables: List[str] = [
    "users", "products", "reviews"  # Bỏ các bảng không cần sync
]
```

### 4. Monitor sync qua WebSocket

```javascript
// Kết nối WebSocket để monitor real-time
const ws = new WebSocket("ws://localhost:8000/api/v1/p2p/ws");
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Sync event:", data);
};
```

## Troubleshooting

### 1. Ngrok timeout

```bash
# Tăng timeout trong requests
# Trong sync_manager.py, thay timeout=30 thành timeout=60
```

### 2. SSL issues với ngrok

```python
# Trong aiohttp requests, thêm:
async with session.get(url, ssl=False, timeout=60) as response:
```

### 3. Database schema mismatch

```sql
-- Kiểm tra schema giống nhau
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### 4. Firewall issues

```bash
# Đảm bảo ports được mở:
# - 8000 (API)
# - 8001 (P2P sync - nếu expose)
# - Ngrok ports
```

## Test script cho remote sync

```python
# test_remote_sync.py
import asyncio
import aiohttp

async def test_remote_sync():
    # URLs của 2 nodes
    local_url = "http://localhost:8000"
    remote_url = "https://abc123.ngrok.io"  # Thay bằng ngrok URL thật

    async with aiohttp.ClientSession() as session:
        # Test status của cả 2 nodes
        for name, url in [("Local", local_url), ("Remote", remote_url)]:
            try:
                async with session.get(f"{url}/api/v1/p2p/status") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        print(f"✅ {name}: {data['peer_count']} peers")
                    else:
                        print(f"❌ {name}: HTTP {resp.status}")
            except Exception as e:
                print(f"❌ {name}: {e}")

if __name__ == "__main__":
    asyncio.run(test_remote_sync())
```

## Kết quả mong đợi

1. **Auto Discovery**: Tắt (không hoạt động qua internet)
2. **Manual Peer Addition**: Hoạt động qua ngrok URL
3. **Data Sync**: Hoạt động với incremental sync
4. **Conflict Resolution**: Tự động resolve conflicts
5. **Real-time Updates**: WebSocket notifications

## Lưu ý quan trọng

1. **Ngrok free có limit**: 1 tunnel, bandwidth limit
2. **Latency**: Sync qua internet sẽ chậm hơn local
3. **Security**: Chỉ để test, production cần authentication
4. **Data consistency**: Luôn backup trước khi test
5. **Schema sync**: Đảm bảo 2 database có cùng schema version
