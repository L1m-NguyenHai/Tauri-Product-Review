# API Documentation - LimReview

## Tổng Quan API

LimReview API được xây dựng với FastAPI và cung cấp RESTful endpoints cho hệ thống đánh giá sản phẩm.

**Base URL**: `http://localhost:8000`
**API Base URL**: `http://localhost:8000/api/v1`
**API Documentation**: `http://localhost:8000/docs` (Swagger UI)
**Alternative Documentation**: `http://localhost:8000/redoc`

> **Lưu ý**: Tất cả business API endpoints sử dụng prefix `/api/v1` trừ các system endpoints như docs, health check.

## Authentication

### Kiểu Authentication
- **Bearer Token**: JWT tokens trong Authorization header
- **Format**: `Authorization: Bearer <token>`

### Token Expiration
- **Access Token**: 30 phút (mặc định)
- **Refresh**: Có thể làm mới token thông qua `/auth/refresh`

---

## Authentication Endpoints

### POST `/api/v1/auth/register`
Đăng ký tài khoản mới.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "strongpassword",
  "avatar": "avatar_url" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "avatar": "avatar_url",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

### POST `/api/v1/auth/login`
Đăng nhập và nhận token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

**Response:**
```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "expires_in": 1800
}
```

### GET `/api/v1/auth/me`
Lấy thông tin user hiện tại (requires authentication).

### POST `/api/v1/auth/refresh`
Làm mới access token (requires authentication).

### POST `/api/v1/auth/logout`
Đăng xuất (client-side logout).

### POST `/api/v1/auth/logout-server`
Server-side logout - invalidate token trên server (requires authentication).

### POST `/api/v1/auth/logout-all`
Đăng xuất khỏi tất cả devices (requires authentication).

---

## User Management Endpoints

### GET `/api/v1/users/profile/stats`
Lấy thống kê profile user (requires authentication).

**Response:**
```json
{
  "total_reviews": 25,
  "average_rating_given": 4.2,
  "followers_count": 10,
  "following_count": 5,
  "helpful_votes_received": 150
}
```

### POST `/api/v1/users/profile/avatar`
Upload avatar mới (requires authentication).

**Request:** Multipart form với file upload

### GET `/api/v1/users/profile`
Lấy thông tin profile (requires authentication).

### PUT `/api/v1/users/profile`
Cập nhật thông tin profile (requires authentication).

### GET `/api/v1/users/{user_id}`
Lấy thông tin user công khai.

### GET `/api/v1/users/{user_id}/reviews`
Lấy danh sách reviews của user.

### POST `/api/v1/users/follow`
Follow user khác (requires authentication).

**Request Body:**
```json
{
  "followed_id": "uuid"
}
```

### DELETE `/api/v1/users/unfollow/{followed_id}`
Unfollow user (requires authentication).

### GET `/api/v1/users/followers`
Lấy danh sách followers (requires authentication).

### GET `/api/v1/users/following`
Lấy danh sách following (requires authentication).

### GET `/api/v1/users/`
Lấy danh sách tất cả users (requires admin).

### DELETE `/api/v1/users/{user_id}`
Xóa user account (requires admin).

---

## Product Management Endpoints

### GET `/api/v1/products/`
Lấy danh sách sản phẩm với filtering và pagination.

**Query Parameters:**
- `limit`: Số lượng kết quả (1-100, default: 20)
- `offset`: Vị trí bắt đầu (default: 0)
- `category_id`: Filter theo category
- `manufacturer`: Filter theo nhà sản xuất
- `min_price`, `max_price`: Filter theo giá
- `min_rating`: Filter theo rating tối thiểu
- `status`: Filter theo status (default: "active")
- `sort_by`: Sắp xếp theo trường (default: "created_at")
- `sort_order`: Thứ tự sắp xếp (asc/desc, default: "desc")
- `search`: Tìm kiếm text

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Product Name",
      "description": "Product description",
      "manufacturer": "Brand Name",
      "price": 99.99,
      "original_price": 120.00,
      "product_url": "https://example.com/product",
      "availability": "in_stock",
      "status": "active",
      "image": "image_url",
      "category_id": "uuid",
      "category_name": "Category Name",
      "average_rating": 4.5,
      "review_count": 10,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "limit": 20,
  "offset": 0
}
```

### GET `/api/v1/products/{product_id}`
Lấy chi tiết sản phẩm bao gồm features, images, specifications.

### POST `/api/v1/products/`
Tạo sản phẩm mới (requires admin).

### PUT `/api/v1/products/{product_id}`
Cập nhật sản phẩm (requires admin).

### DELETE `/api/v1/products/{product_id}`
Xóa sản phẩm (requires admin).

### POST `/api/v1/products/{product_id}/features`
Thêm tính năng cho sản phẩm (requires admin).

**Request Body:**
```json
{
  "feature_text": "Wireless charging support",
  "sort_order": 1
}
```

### DELETE `/api/v1/products/features/{feature_id}`
Xóa tính năng sản phẩm (requires admin).

### POST `/api/v1/products/{product_id}/images`
Thêm hình ảnh sản phẩm (requires admin).

**Request Body:**
```json
{
  "image_url": "https://example.com/image.jpg",
  "alt_text": "Product front view",
  "sort_order": 1
}
```

### DELETE `/api/v1/products/images/{image_id}`
Xóa hình ảnh sản phẩm (requires admin).

### POST `/api/v1/products/{product_id}/specifications`
Thêm thông số kỹ thuật (requires admin).

**Request Body:**
```json
{
  "spec_name": "Display Size",
  "spec_value": "6.1 inches",
  "sort_order": 1
}
```

### DELETE `/api/v1/products/specifications/{spec_id}`
Xóa thông số kỹ thuật (requires admin).

### POST `/api/v1/products/{product_id}/store-links`
Thêm link cửa hàng (requires admin).

**Request Body:**
```json
{
  "store_name": "Amazon",
  "store_url": "https://amazon.com/product",
  "price": 99.99,
  "currency": "USD"
}
```

### DELETE `/api/v1/products/store-links/{link_id}`
Xóa link cửa hàng (requires admin).

---

## Review System Endpoints

### GET `/api/v1/reviews/`
Lấy danh sách reviews với filtering.

**Query Parameters:**
- `limit`, `offset`: Pagination
- `product_id`: Filter theo sản phẩm
- `user_id`: Filter theo user
- `rating`: Filter theo rating (1-5)
- `status`: Filter theo status (default: "published")
- `sort_by`, `sort_order`: Sắp xếp

### GET `/api/v1/reviews/{review_id}`
Lấy chi tiết review.

### POST `/api/v1/reviews/`
Tạo review mới (requires authentication).

**Request Body:**
```json
{
  "product_id": "uuid",
  "rating": 5,
  "title": "Great product!",
  "content": "Detailed review content...",
  "verified_purchase": true
}
```

### PUT `/api/v1/reviews/{review_id}`
Cập nhật review (requires authentication - chỉ owner hoặc admin).

### DELETE `/api/v1/reviews/{review_id}`
Xóa review (requires authentication - chỉ owner hoặc admin).

### POST `/api/v1/reviews/{review_id}/helpful`
Vote review hữu ích (requires authentication).

**Request Body:**
```json
{
  "is_helpful": true
}
```

### POST `/api/v1/reviews/{review_id}/pros`
Thêm ưu điểm cho review (requires authentication).

**Request Body:**
```json
{
  "pro_text": "Excellent battery life"
}
```

### POST `/api/v1/reviews/{review_id}/cons`
Thêm nhược điểm cho review (requires authentication).

**Request Body:**
```json
{
  "con_text": "Camera could be better in low light"
}
```

### POST `/api/v1/reviews/{review_id}/media`
Thêm media URL cho review (requires authentication).

**Request Body:**
```json
{
  "media_url": "https://example.com/image.jpg",
  "media_type": "image",
  "alt_text": "Product in use"
}
```

### POST `/api/v1/reviews/{review_id}/media/upload`
Upload media file trực tiếp (requires authentication).

**Request:** Multipart form với file upload

### DELETE `/api/v1/reviews/{review_id}/helpful`
Hủy vote helpful (requires authentication).

### GET `/api/v1/reviews/pending`
Lấy reviews đang chờ duyệt (requires admin).

### PUT `/api/v1/reviews/{review_id}/approve`
Duyệt review (requires admin).

### PUT `/api/v1/reviews/{review_id}/reject`
Từ chối review (requires admin).

### GET `/api/v1/reviews/{review_id}/comments`
Lấy comments của review.

### POST `/api/v1/reviews/{review_id}/comments`
Thêm comment vào review (requires authentication).

**Request Body:**
```json
{
  "content": "Great review, very helpful!"
}
```

### PUT `/api/v1/reviews/comments/{comment_id}`
Cập nhật comment (requires authentication - chỉ owner).

### DELETE `/api/v1/reviews/comments/{comment_id}`
Xóa comment (requires authentication - chỉ owner hoặc admin).

---

## Category Endpoints

### GET `/api/v1/categories/`
Lấy danh sách tất cả categories.

### GET `/api/v1/categories/{category_id}`
Lấy chi tiết category theo ID.

### GET `/api/v1/categories/slug/{slug}`
Lấy category theo slug.

### GET `/api/v1/categories/{category_id}/products`
Lấy danh sách sản phẩm trong category.

**Query Parameters:**
- `limit`: Số lượng kết quả (default: 20)
- `offset`: Vị trí bắt đầu (default: 0)
- `sort_by`: Sắp xếp theo (default: "created_at")
- `sort_order`: Thứ tự (asc/desc, default: "desc")

### POST `/api/v1/categories/`
Tạo category mới (requires admin).

**Request Body:**
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and gadgets"
}
```

### PUT `/api/v1/categories/{category_id}`
Cập nhật category (requires admin).

### DELETE `/api/v1/categories/{category_id}`
Xóa category (requires admin).

---

## Review Request Endpoints

### GET `/api/v1/review-requests/`
Lấy danh sách yêu cầu review.

### GET `/api/v1/review-requests/{request_id}`
Lấy chi tiết yêu cầu review.

### POST `/api/v1/review-requests/`
Tạo yêu cầu review mới (requires authentication).

**Request Body:**
```json
{
  "product_name": "Product Name",
  "manufacturer": "Brand Name",
  "product_url": "https://example.com/product",
  "reason": "Why you want this product reviewed",
  "priority": "normal"
}
```

### PUT `/api/v1/review-requests/{request_id}`
Cập nhật yêu cầu review (requires admin).

### DELETE `/api/v1/review-requests/{request_id}`
Xóa yêu cầu review (requires authentication).

### GET `/api/v1/review-requests/admin/all`
Lấy tất cả review requests (requires admin).

### GET `/api/v1/review-requests/admin/pending`
Lấy review requests đang chờ xử lý (requires admin).

### PUT `/api/v1/review-requests/admin/{request_id}/approve`
Duyệt review request (requires admin).

### PUT `/api/v1/review-requests/admin/{request_id}/reject`
Từ chối review request (requires admin).

**Request Body:**
```json
{
  "admin_notes": "Request does not meet criteria"
}
```

### PUT `/api/v1/review-requests/admin/{request_id}/complete`
Đánh dấu hoàn thành review request (requires admin).

### PUT `/api/v1/review-requests/admin/{request_id}/notes`
Cập nhật admin notes (requires admin).

**Request Body:**
```json
{
  "admin_notes": "Updated notes from admin"
}
```

---

## Contact Endpoints

### POST `/api/v1/contact/`
Gửi tin nhắn contact.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Support Request",
  "message": "Message content..."
}
```

### GET `/api/v1/contact/`
Lấy danh sách tất cả contact submissions (requires admin).

### GET `/api/v1/contact/unread`
Lấy danh sách contact submissions chưa đọc (requires admin).

### GET `/api/v1/contact/{message_id}`
Lấy chi tiết contact message (requires admin).

### PUT `/api/v1/contact/{message_id}/mark-read`
Đánh dấu đã đọc (requires admin).

### PUT `/api/v1/contact/{message_id}/mark-replied`
Đánh dấu đã trả lời (requires admin).

### PUT `/api/v1/contact/{message_id}/status`
Cập nhật trạng thái message (requires admin).

**Request Body:**
```json
{
  "status": "resolved"
}
```

### DELETE `/api/v1/contact/{message_id}`
Xóa contact message (requires admin).

### GET `/api/v1/contact/stats/summary`
Lấy thống kê contact messages (requires admin).

**Response:**
```json
{
  "total_messages": 150,
  "unread_count": 10,
  "pending_count": 5,
  "resolved_count": 135
}
```

---

## Admin Endpoints

### GET `/api/v1/admin/dashboard`
Lấy dashboard statistics tổng quan (requires admin).

**Response:**
```json
{
  "total_users": 1000,
  "total_products": 500,
  "total_reviews": 2500,
  "total_categories": 25,
  "pending_reviews": 15,
  "recent_registrations": 50,
  "average_rating": 4.2,
  "top_categories": [...],
  "recent_activity": [...]
}
```

### GET `/api/v1/admin/analytics/products`
Phân tích sản phẩm chi tiết (requires admin).

**Query Parameters:**
- `period`: Khoảng thời gian (7d, 30d, 90d, 1y)
- `category_id`: Lọc theo category

### GET `/api/v1/admin/analytics/reviews`
Phân tích reviews chi tiết (requires admin).

### GET `/api/v1/admin/analytics/users`
Phân tích users và engagement (requires admin).

### GET `/api/v1/admin/analytics/engagement`
Phân tích user engagement metrics (requires admin).

### GET `/api/v1/admin/system/health`
Kiểm tra tình trạng hệ thống (requires admin).

**Response:**
```json
{
  "database": {
    "status": "healthy",
    "connection_count": 10,
    "query_performance": "good"
  },
  "storage": {
    "disk_usage": "45%",
    "available_space": "500GB"
  },
  "performance": {
    "avg_response_time": "150ms",
    "requests_per_minute": 120
  }
}
```

### POST `/api/v1/admin/maintenance/cleanup-orphaned`
Dọn dẹp dữ liệu orphaned (requires admin).

### GET `/api/v1/admin/logs/recent`
Lấy logs gần đây (requires admin).

**Query Parameters:**
- `limit`: Số lượng logs (default: 100)
- `level`: Mức độ log (info, warning, error)

---

## System Endpoints

### GET `/`
Root endpoint với thông tin API.

**Response:**
```json
{
  "message": "Product Review API",
  "version": "1.0.0",
  "status": "operational",
  "documentation": "/docs",
  "openapi_schema": "/openapi.json"
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": 1640995200.0
}
```

### GET `/version`
Thông tin version API.

**Response:**
```json
{
  "version": "1.0.0",
  "build": "production",
  "features": [
    "authentication",
    "user_management",
    "product_management",
    "review_system",
    "admin_dashboard",
    "analytics"
  ]
}
```

### GET `/uploads/{file_path}`
Static file serving cho uploads (avatars, media files).

---

## HTTP Status Codes

### Success Codes
- `200 OK`: Thành công
- `201 Created`: Tạo mới thành công
- `204 No Content`: Xóa thành công

### Client Error Codes
- `400 Bad Request`: Dữ liệu request không hợp lệ
- `401 Unauthorized`: Chưa đăng nhập hoặc token không hợp lệ
- `403 Forbidden`: Không có quyền truy cập
- `404 Not Found`: Resource không tồn tại
- `422 Unprocessable Entity`: Validation error

### Server Error Codes
- `500 Internal Server Error`: Lỗi server

## Error Response Format

```json
{
  "detail": "Error message description",
  "error_code": "SPECIFIC_ERROR_CODE", // optional
  "field_errors": { // optional for validation errors
    "field_name": ["Error message for this field"]
  }
}
```

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated**: 200 requests per minute per user
- **Upload endpoints**: 10 requests per minute per user

## File Upload Specifications

### Avatar Upload
- **Max size**: 5MB
- **Formats**: JPG, PNG, GIF
- **Dimensions**: Tối đa 1024x1024px

### Review Media Upload
- **Images**: Max 10MB, JPG/PNG/GIF
- **Videos**: Max 100MB, MP4/AVI/MOV
- **Limit**: 5 files per review

## WebSocket Support

### Real-time Updates
> **Lưu ý**: WebSocket endpoints chưa được implement trong version hiện tại.

---

*Tài liệu này được tự động cập nhật. Để có thông tin chi tiết nhất, vui lòng truy cập Swagger UI tại `/docs`.*