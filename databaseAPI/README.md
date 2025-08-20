# Product Review API

A comprehensive FastAPI application for managing product reviews and ratings with advanced features including user authentication, admin dashboard, and analytics.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication system
- Role-based access control (User/Admin)
- Secure password hashing with bcrypt
- Token refresh functionality

### 👥 User Management  
- User registration and profile management
- User following system
- Profile customization with avatars
- Admin user management

### 📦 Product Management
- Complete CRUD operations for products
- Product categorization system
- Product features, images, and specifications
- Store links and pricing information
- Advanced search and filtering

### ⭐ Review System
- Comprehensive review creation with ratings (1-5 stars)
- Pros and cons lists
- Media attachments (images/videos)
- Helpful vote system
- Review moderation (pending/published/rejected)

### 📝 Review Requests
- Users can request reviews for new products
- Admin approval workflow
- Status tracking and notifications

### 📞 Contact System
- Contact form submissions
- Message status management (unread/read/replied)
- Admin contact management dashboard

### 📊 Admin Dashboard
- Comprehensive analytics and statistics
- User, product, and review analytics
- System health monitoring
- Data cleanup utilities
- Recent activity logs

## API Routes Overview

### Authentication Routes (`/api/v1/auth`)
- `POST /register` - User registration
- `POST /login` - User login  
- `GET /me` - Get current user info
- `POST /refresh` - Refresh access token

### User Management (`/api/v1/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `GET /{user_id}` - Get user by ID
- `GET /{user_id}/reviews` - Get user's reviews
- `POST /follow` - Follow user
- `DELETE /unfollow/{user_id}` - Unfollow user
- `GET /followers` - Get user's followers
- `GET /following` - Get users being followed
- `GET /` - List all users (admin)
- `DELETE /{user_id}` - Delete user (admin)

### Categories (`/api/v1/categories`)
- `GET /` - List all categories
- `GET /{category_id}` - Get category by ID
- `GET /slug/{slug}` - Get category by slug
- `GET /{category_id}/products` - Get products in category
- `POST /` - Create category (admin)
- `PUT /{category_id}` - Update category (admin)
- `DELETE /{category_id}` - Delete category (admin)

### Products (`/api/v1/products`)
- `GET /` - List products with filtering and search
- `GET /{product_id}` - Get detailed product info
- `POST /` - Create product (admin)
- `PUT /{product_id}` - Update product (admin)
- `DELETE /{product_id}` - Delete product (admin)

#### Product Features
- `POST /{product_id}/features` - Add product feature (admin)
- `DELETE /features/{feature_id}` - Delete product feature (admin)

#### Product Images
- `POST /{product_id}/images` - Add product image (admin)
- `DELETE /images/{image_id}` - Delete product image (admin)

#### Product Specifications
- `POST /{product_id}/specifications` - Add product spec (admin)
- `DELETE /specifications/{spec_id}` - Delete product spec (admin)

#### Store Links
- `POST /{product_id}/store-links` - Add store link (admin)
- `DELETE /store-links/{link_id}` - Delete store link (admin)

### Reviews (`/api/v1/reviews`)
- `GET /` - List reviews with filtering
- `GET /{review_id}` - Get detailed review info
- `POST /` - Create review
- `PUT /{review_id}` - Update review (owner/admin)
- `DELETE /{review_id}` - Delete review (owner/admin)

#### Review Components
- `POST /{review_id}/pros` - Add review pro
- `POST /{review_id}/cons` - Add review con
- `POST /{review_id}/media` - Add review media
- `POST /{review_id}/helpful` - Vote review as helpful
- `DELETE /{review_id}/helpful` - Remove helpful vote

#### Admin Review Management
- `GET /pending` - List pending reviews (admin)
- `PUT /{review_id}/approve` - Approve review (admin)
- `PUT /{review_id}/reject` - Reject review (admin)

### Review Requests (`/api/v1/review-requests`)
- `GET /` - List user's review requests
- `GET /{request_id}` - Get review request details
- `POST /` - Submit review request
- `PUT /{request_id}` - Update review request
- `DELETE /{request_id}` - Delete review request

#### Admin Review Request Management
- `GET /admin/all` - List all review requests (admin)
- `GET /admin/pending` - List pending requests (admin)
- `PUT /admin/{request_id}/approve` - Approve request (admin)
- `PUT /admin/{request_id}/reject` - Reject request (admin)
- `PUT /admin/{request_id}/complete` - Mark as completed (admin)
- `PUT /admin/{request_id}/notes` - Update admin notes (admin)

### Contact (`/api/v1/contact`)
- `POST /` - Submit contact message (public)
- `GET /` - List contact messages (admin)
- `GET /unread` - List unread messages (admin)
- `GET /{message_id}` - Get message details (admin)
- `PUT /{message_id}/mark-read` - Mark as read (admin)
- `PUT /{message_id}/mark-replied` - Mark as replied (admin)
- `PUT /{message_id}/status` - Update message status (admin)
- `DELETE /{message_id}` - Delete message (admin)
- `GET /stats/summary` - Get contact statistics (admin)

### Admin Dashboard (`/api/v1/admin`)
- `GET /dashboard` - Get dashboard statistics
- `GET /analytics/products` - Product analytics
- `GET /analytics/reviews` - Review analytics  
- `GET /analytics/users` - User analytics
- `GET /analytics/engagement` - Engagement analytics
- `GET /system/health` - System health check
- `POST /maintenance/cleanup-orphaned` - Clean up orphaned records
- `GET /logs/recent` - Get recent activity logs

### System Routes
- `GET /` - API information
- `GET /health` - Health check
- `GET /version` - API version info

## Installation & Setup

### Prerequisites
- Python 3.8+
- PostgreSQL 12+
- pip package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_NAME=LimReview
DB_USER=postgres
DB_PASS=your_password
DB_PORT=5432
DB_MIN_CONN=1
DB_MAX_CONN=10

# JWT Configuration
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=True
```

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd databaseAPI
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set up PostgreSQL database**
- Create a PostgreSQL database
- Run the provided SQL schema to create tables

5. **Configure environment variables**
- Copy `.env.example` to `.env`
- Update database credentials and other settings

6. **Run the application**
```bash
# Development server
python app.py

# Or using uvicorn directly
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`

### Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Request/Response Examples

#### User Registration
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "secure_password"
  }'
```

#### Create Product Review
```bash
curl -X POST "http://localhost:8000/api/v1/reviews/" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "product-uuid",
    "rating": 5,
    "title": "Excellent Product!",
    "content": "This product exceeded my expectations..."
  }'
```

#### Search Products
```bash
curl "http://localhost:8000/api/v1/products/?search=laptop&min_price=500&max_price=2000&sort_by=average_rating&sort_order=desc"
```

## Database Schema

The application uses the following main tables:
- `users` - User accounts and profiles
- `categories` - Product categories
- `products` - Product information
- `product_features` - Product feature lists
- `product_images` - Product image galleries
- `product_specifications` - Technical specifications
- `store_links` - Where to buy links
- `reviews` - User reviews and ratings
- `review_pros` - Review pros lists
- `review_cons` - Review cons lists
- `review_media` - Review media attachments
- `review_helpful_votes` - Helpful vote tracking
- `review_requests` - User review requests
- `contact_messages` - Contact form submissions
- `user_follows` - User following relationships

## Security Features

- **Password Hashing**: Uses bcrypt for secure password storage
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Role-Based Access**: Separate permissions for users and administrators
- **Input Validation**: Comprehensive request validation using Pydantic
- **SQL Injection Prevention**: Uses parameterized queries
- **CORS Protection**: Configurable cross-origin resource sharing
- **Request Logging**: Comprehensive request/response logging
- **Rate Limiting**: Optional rate limiting middleware support

## Performance Features

- **Database Connection Pooling**: Efficient database connection management
- **Query Optimization**: Indexed database queries for performance
- **Pagination**: All list endpoints support pagination
- **Caching Headers**: Appropriate HTTP caching headers
- **Async/Await**: Fully asynchronous request handling

## Monitoring & Maintenance

### Health Checks
- Database connectivity monitoring
- System health endpoint
- Orphaned record detection

### Analytics
- User engagement metrics
- Product popularity tracking
- Review quality analysis
- System usage statistics

### Maintenance Tools
- Automated orphaned record cleanup
- Database optimization utilities
- Activity logging and monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@productreview.com or create an issue in the repository.
