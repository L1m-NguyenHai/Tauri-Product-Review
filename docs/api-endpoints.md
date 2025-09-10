# API Documentation - LimReview

## Tổng Quan API

LimReview API được xây dựng với FastAPI và cung cấp RESTful endpoints cho hệ thống đánh giá sản phẩm.

**Base URL**: `http://localhost:8000`
**API Base URL**: `http://localhost:8000/api/v1`
**API Documentation**: `http://localhost:8000/docs` (Swagger UI)
**Alternative Documentation**: `http://localhost:8000/redoc`

> **Lưu ý**: Tất cả API endpoints sử dụng prefix `/api/v1` trừ các endpoints đặc biệt như docs, health check.

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
Lấy chi tiết sản phẩm.

### POST `/api/v1/products/`
Tạo sản phẩm mới (requires admin).

### PUT `/api/v1/products/{product_id}`
Cập nhật sản phẩm (requires admin).

### DELETE `/api/v1/products/{product_id}`
Xóa sản phẩm (requires admin).

### GET `/api/v1/products/{product_id}/features`
Lấy danh sách tính năng của sản phẩm.

### POST `/api/v1/products/{product_id}/features`
Thêm tính năng cho sản phẩm (requires admin).

### GET `/api/v1/products/{product_id}/images`
Lấy danh sách hình ảnh sản phẩm.

### POST `/api/v1/products/{product_id}/images`
Upload hình ảnh sản phẩm (requires admin).

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

### GET `/api/v1/reviews/{review_id}/pros`
Lấy danh sách ưu điểm của review.

### POST `/api/v1/reviews/{review_id}/pros`
Thêm ưu điểm cho review (requires authentication).

### GET `/api/v1/reviews/{review_id}/cons`
Lấy danh sách nhược điểm của review.

### POST `/api/v1/reviews/{review_id}/cons`
Thêm nhược điểm cho review (requires authentication).

### GET `/api/v1/reviews/{review_id}/media`
Lấy danh sách media (hình ảnh, video) của review.

### POST `/api/v1/reviews/{review_id}/media`
Upload media cho review (requires authentication).

---

## Category Endpoints

### GET `/api/v1/categories/`
Lấy danh sách categories.

### GET `/api/v1/categories/{category_id}`
Lấy chi tiết category.

### POST `/api/v1/categories/`
Tạo category mới (requires admin).

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
Lấy danh sách contact submissions (requires admin).

---

## Admin Endpoints

### GET `/api/v1/admin/stats`
Lấy thống kê hệ thống (requires admin).

**Response:**
```json
{
  "total_users": 1000,
  "total_products": 500,
  "total_reviews": 2500,
  "total_review_requests": 100,
  "recent_activity": [...],
  "top_rated_products": [...],
  "active_users": [...]
}
```

### GET `/api/v1/admin/users`
Quản lý users (requires admin).

### GET `/api/v1/admin/products`
Quản lý products (requires admin).

### GET `/api/v1/admin/reviews`
Quản lý reviews (requires admin).

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
- **Endpoint**: `ws://localhost:8000/api/v1/ws`
- **Events**: New reviews, rating updates, user activities
- **Authentication**: Token in query parameter

---

*Tài liệu này được tự động cập nhật. Để có thông tin chi tiết nhất, vui lòng truy cập Swagger UI tại `/docs`.*