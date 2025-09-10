# Hướng Dẫn Cài Đặt và Chạy Project LimReview

## Yêu Cầu Hệ Thống

### Phần Mềm Bắt Buộc
- **Node.js**: >= 16.0.0 ([Download](https://nodejs.org/))
- **pnpm**: Package manager ([Install guide](https://pnpm.io/installation))
- **Rust & Cargo**: Để build Tauri app ([Install guide](https://rustup.rs/))
- **Python**: >= 3.10 ([Download](https://python.org/))
- **PostgreSQL**: >= 12.0 ([Download](https://postgresql.org/download/))

### Platform Support
- **Windows**: 10/11 (64-bit)
- **macOS**: 10.15+ (Intel/Apple Silicon)
- **Linux**: Ubuntu 18.04+ / Debian 10+ / Fedora 32+

## Bước 1: Cài Đặt Dependencies

### 1.1 Cài Đặt Tauri CLI
```bash
pnpm install -g @tauri-apps/cli
# Hoặc
cargo install tauri-cli
```

### 1.2 Verify Installation
```bash
# Kiểm tra Node.js
node --version

# Kiểm tra pnpm
pnpm --version

# Kiểm tra Rust
rustc --version
cargo --version

# Kiểm tra Tauri CLI
tauri --version

# Kiểm tra Python
python --version
# Hoặc trên một số hệ thống
python3 --version
```

## Bước 2: Clone và Setup Project

### 2.1 Clone Repository
```bash
git clone <repository-url>
cd Tauri-Product-Review
```

### 2.2 Cài Đặt Frontend Dependencies
```bash
pnpm install
```

### 2.3 Cài Đặt Backend Dependencies
```bash
cd databaseAPI
pip install -r req.txt
# Hoặc sử dụng virtual environment (khuyến nghị)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r req.txt
```

## Bước 3: Thiết Lập Database

### 3.1 Cài Đặt PostgreSQL
**Windows:**
1. Download PostgreSQL installer từ [postgresql.org](https://postgresql.org/download/windows/)
2. Chạy installer và làm theo hướng dẫn
3. Ghi nhớ password cho user `postgres`

**macOS:**
```bash
# Sử dụng Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 3.2 Tạo Database và User
```bash
# Truy cập PostgreSQL console
sudo -u postgres psql
# Hoặc trên Windows
psql -U postgres
```

```sql
-- Tạo database
CREATE DATABASE limreview;

-- Tạo user (tuỳ chọn)
CREATE USER limreview_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE limreview TO limreview_user;

-- Thoát console
\q
```

### 3.3 Import Database Schema
```bash
# Nếu có file schema.sql
psql -U postgres -d limreview -f schema.sql
```

### 3.4 Cấu Hình Database Connection
Tạo file `.env` trong thư mục `databaseAPI/`:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/limreview
SECRET_KEY=your_secret_key_here
DISCORD_BOT_TOKEN=your_discord_bot_token
```

## Bước 4: Thiết Lập Discord Bot (Tuỳ chọn)

### 4.1 Tạo Discord Bot
1. Truy cập [Discord Developer Portal](https://discord.com/developers/applications)
2. Tạo New Application
3. Vào Bot section và tạo bot
4. Copy Bot Token

### 4.2 Mời Bot Vào Server
1. Vào OAuth2 > URL Generator
2. Chọn scope: `bot`
3. Chọn permissions: `Send Messages`, `Attach Files`
4. Mời bot vào server để upload media

## Bước 5: Chạy Ứng Dụng

### 5.1 Khởi Động Backend API
```bash
cd databaseAPI
python app.py
```
Backend sẽ chạy trên `http://localhost:8000`

### 5.2 Khởi Động Frontend (Development)
Mở terminal mới:
```bash
# Từ root directory
pnpm tauri dev
```

### 5.3 Build Production
```bash
# Build frontend
pnpm build

# Build Tauri app
pnpm tauri build
```

## Bước 6: Xác Minh Setup

### 6.1 Kiểm Tra API
Truy cập `http://localhost:8000/docs` để xem Swagger UI

### 6.2 Kiểm Tra Database Connection
```bash
# Test connection
python -c "
import psycopg2
try:
    conn = psycopg2.connect('postgresql://postgres:your_password@localhost:5432/limreview')
    print('Database connection successful!')
    conn.close()
except Exception as e:
    print(f'Connection failed: {e}')
"
```

### 6.3 Test API Endpoints
```bash
# Test health check
curl http://localhost:8000/
```

## Troubleshooting

### Frontend Issues

#### Lỗi: "Tauri CLI not found"
```bash
npm install -g @tauri-apps/cli
# Hoặc
cargo install tauri-cli
```

#### Lỗi: "Failed to resolve dependencies"
```bash
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### Lỗi: Rust compilation failed
```bash
# Cập nhật Rust
rustup update
# Clean cache
cargo clean
```

### Backend Issues

#### Lỗi: "Module not found"
```bash
# Cài lại dependencies
pip install -r req.txt
# Hoặc upgrade pip
pip install --upgrade pip
```

#### Lỗi: "Could not connect to PostgreSQL"
1. Kiểm tra PostgreSQL service đang chạy:
   ```bash
   # Windows
   sc query postgresql-x64-14
   # macOS
   brew services list | grep postgresql
   # Linux
   sudo systemctl status postgresql
   ```
2. Kiểm tra connection string trong `.env`
3. Kiểm tra firewall settings

#### Lỗi: "Port already in use"
```bash
# Tìm process sử dụng port 8000
# Windows
netstat -ano | findstr :8000
# macOS/Linux
lsof -i :8000

# Kill process
# Windows
taskkill /PID <process_id> /F
# macOS/Linux
kill -9 <process_id>
```

### Database Issues

#### Lỗi: "Role does not exist"
```sql
-- Tạo lại user
CREATE USER limreview_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE limreview TO limreview_user;
```

#### Lỗi: "Database does not exist"
```sql
-- Tạo lại database
CREATE DATABASE limreview;
```

#### Lỗi: "Permission denied"
```bash
# Reset PostgreSQL password
sudo -u postgres psql
\password postgres
```

## Development Tips

### Hot Reload
- Frontend: Vite hỗ trợ hot reload tự động
- Backend: Sử dụng `uvicorn --reload` cho auto-reload
- Tauri: `pnpm tauri dev` có built-in reload

### Debugging
- Frontend: Sử dụng browser DevTools
- Backend: FastAPI automatic docs tại `/docs`
- Database: pgAdmin hoặc CLI tools

### Performance
- Frontend: Sử dụng React DevTools
- Backend: FastAPI có built-in profiling
- Database: PostgreSQL EXPLAIN ANALYZE

## Production Deployment

### Build Optimized Version
```bash
# Frontend build
pnpm build

# Backend preparation
pip freeze > requirements.txt

# Tauri build
pnpm tauri build
```

### Environment Variables
Đảm bảo set đúng environment variables cho production:
- `DATABASE_URL`
- `SECRET_KEY` 
- `DISCORD_BOT_TOKEN`
- `CORS_ORIGINS`

### Security Checklist
- [ ] Change default passwords
- [ ] Use environment variables cho sensitive data
- [ ] Enable HTTPS cho production API
- [ ] Configure CORS properly
- [ ] Update dependencies regularly

## Tài Liệu Tham Khảo
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://reactjs.org/docs/)
- [PostgreSQL Documentation](https://postgresql.org/docs/)