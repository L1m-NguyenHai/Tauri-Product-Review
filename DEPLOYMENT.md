# Docker Deployment Guide

## Triển khai với Docker Compose

### 1. Chuẩn bị môi trường

```bash
# Tạo network web nếu chưa có (shared with Caddy)
docker network create web

# Copy và cấu hình environment variables
cp .env.production .env
# Chỉnh sửa .env với các giá trị thực tế
```

### 2. Cấu hình cần thiết

Chỉnh sửa các giá trị trong `.env`:

- `SECRET_KEY`: JWT secret key mạnh (tối thiểu 32 ký tự)
- `DB_PASS`: Password database bảo mật
- `SMTP_*`: Cấu hình email SMTP
- `DISCORD_*`: Token và IDs cho Discord bot

### 3. Deploy

```bash
# Build và start services
docker-compose up -d

# Kiểm tra logs
docker-compose logs -f api

# Kiểm tra health
docker-compose ps
```

### 4. Caddy Configuration

API sẽ được expose qua domain `api.nguyenhai.site` thông qua Caddy reverse proxy.

Caddy sẽ tự động nhận diện service thông qua labels trong docker-compose.yml.

### 5. Database

- PostgreSQL sẽ được khởi tạo với schema từ `docs/Schema.sql`
- Data được lưu trữ trong volume `postgres_data`

### 6. Maintenance

```bash
# Xem logs
docker-compose logs api

# Restart services
docker-compose restart api

# Update
docker-compose pull
docker-compose up -d --build

# Backup database
docker-compose exec db pg_dump -U postgres LimReview > backup.sql
```

## Security Notes

- Thay đổi tất cả passwords mặc định
- Sử dụng secrets management trong production
- Cấu hình firewall cho database port
- Regularly update images và dependencies
