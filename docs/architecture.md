# Kiến Trúc Hệ Thống - LimReview

## Tổng Quan Kiến Trúc

LimReview là một ứng dụng desktop được xây dựng với kiến trúc microservices, bao gồm:

```
┌─────────────────────────────────────────────────────────────┐
│                     Desktop Application                     │
│                    (Tauri + React)                         │
├─────────────────────────────────────────────────────────────┤
│                      Frontend Layer                        │
│                   React + TypeScript                       │
│                      Vite Build                           │
├─────────────────────────────────────────────────────────────┤
│                       API Layer                            │
│                   FastAPI (Python)                         │
│                    RESTful Services                        │
├─────────────────────────────────────────────────────────────┤
│                     Database Layer                         │
│                   PostgreSQL + Discord                     │
│                    Media Storage                           │
└─────────────────────────────────────────────────────────────┘
```

## 1. Frontend (Desktop Application)

### Công Nghệ Sử Dụng
- **Tauri**: Framework để tạo desktop app với web technologies
- **React 18**: Library UI chính 
- **TypeScript**: Type safety và development experience
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Styling framework
- **Vite**: Build tool và dev server
- **Lucide React**: Icon library
- **Axios**: HTTP client cho API calls

### Cấu Trúc Frontend
```
src/
├── components/           # UI Components tái sử dụng
│   ├── Layout/          # Layout components (Header, Sidebar, etc.)
│   ├── ReviewModal/     # Review creation modal
│   ├── DragZone/        # File upload drag zone
│   └── ConfirmDialog.tsx # Confirmation dialogs
├── contexts/            # React Context providers
│   ├── AuthContext.tsx  # Authentication state management
│   └── ThemeContext.tsx # Theme switching (dark/light mode)
├── pages/              # Page components
│   ├── Home.tsx        # Dashboard/Landing page
│   ├── ProductList.tsx # Product catalog with filters
│   ├── ProductDetail.tsx # Single product view
│   ├── ReviewPage.tsx  # Review management
│   ├── UserProfile.tsx # User profile management
│   ├── AdminPanel.tsx  # Admin dashboard
│   └── Auth pages (Login/Register)
└── services/
    └── api.ts          # API service layer
```

### Key Features Frontend
- **Responsive Design**: Giao diện thích ứng với các kích thước màn hình
- **Dark/Light Theme**: Hỗ trợ chuyển đổi theme
- **Real-time Updates**: Live updates cho reviews và ratings
- **File Upload**: Drag & drop upload cho avatars và media
- **Advanced Filtering**: Tìm kiếm, lọc và sắp xếp sản phẩm
- **Authentication State**: Persistent login state management

## 2. Backend API (FastAPI)

### Công Nghệ Sử Dụng
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Primary database với psycopg2-binary
- **JWT Authentication**: JSON Web Tokens cho security
- **Discord.py**: Media storage integration
- **Pydantic**: Data validation và serialization
- **Bcrypt**: Password hashing
- **CORS Middleware**: Cross-origin resource sharing

### API Architecture
```
databaseAPI/
├── app.py              # Main FastAPI application
├── routes/             # API endpoint modules
│   ├── auth.py         # Authentication endpoints
│   ├── users.py        # User management
│   ├── products.py     # Product CRUD operations
│   ├── reviews.py      # Review system
│   ├── categories.py   # Product categories
│   ├── review_requests.py # Review request system
│   ├── contact.py      # Contact form handling
│   └── admin.py        # Admin panel APIs
├── models/
│   └── schemas.py      # Pydantic data models
├── database/
│   └── connection.py   # Database connection management
├── auth/
│   └── security.py     # JWT & authentication utilities
└── uploads/            # File storage directory
    └── avatars/        # User avatar images
```

### Core API Modules

#### Authentication & Authorization
- **JWT-based authentication** với role-based access control
- **Password hashing** với bcrypt
- **Token refresh mechanism**
- **Role system**: User, Admin roles

#### User Management
- User registration và profile management
- Avatar upload và storage
- User following/follower system
- User statistics và activity tracking

#### Product System
- CRUD operations cho products
- Category management
- Product features và specifications
- Product image handling
- Rating và review aggregation

#### Review System
- Complete review creation với ratings
- Pros/cons lists
- Media attachments (images, videos)
- Helpful votes system
- Review moderation tools

#### Admin Panel
- User management
- Product management
- Review moderation
- System analytics
- Content management

### Database Schema (PostgreSQL)

#### Core Tables
- **users**: User accounts và profiles
- **categories**: Product categories
- **products**: Product information
- **reviews**: User reviews và ratings
- **review_requests**: User-submitted product requests
- **user_follows**: User following relationships
- **contact_submissions**: Contact form data

#### Key Relationships
```sql
users (1:N) reviews
users (1:N) review_requests
users (M:N) users (following system)
categories (1:N) products
products (1:N) reviews
```

## 3. Media Storage System

### Discord Integration
- **Discord Bot** cho media storage
- **Automatic upload** của avatars và review images
- **CDN benefits** từ Discord infrastructure
- **File management** qua Discord channels

## 4. Security Architecture

### Authentication Flow
1. User login với email/password
2. Server validate credentials
3. JWT token được generate và return
4. Client store token và attach vào headers
5. Server verify token cho protected endpoints

### Security Features
- **Password hashing** với bcrypt
- **JWT token expiration**
- **CORS configuration**
- **Input validation** với Pydantic
- **SQL injection protection** với parameterized queries
- **Rate limiting** capabilities
- **Trusted host middleware**

## 5. Development & Deployment

### Development Stack
- **Frontend**: Vite dev server trên port 5173
- **Backend**: Uvicorn ASGI server trên port 8000
- **Database**: PostgreSQL local instance
- **Package Management**: pnpm cho frontend, pip cho backend

### Build Process
1. **Frontend Build**: Vite build tạo optimized static files
2. **Tauri Build**: Rust compile desktop application
3. **Backend**: Python application ready to deploy

### Configuration Files
- `tauri.conf.json`: Tauri app configuration
- `vite.config.ts`: Vite build configuration  
- `package.json`: Node.js dependencies
- `req.txt`: Python dependencies
- `tsconfig.json`: TypeScript configuration

## 6. Performance Considerations

### Frontend Optimizations
- **Code splitting** với React lazy loading
- **Image optimization** với LazyImage component
- **Bundle optimization** với Vite
- **State management** optimization với React Context

### Backend Optimizations  
- **Database connection pooling**
- **Async/await** patterns cho I/O operations
- **Response caching** strategies
- **Database query optimization**

### Scalability Features
- **Modular architecture** dễ dàng mở rộng
- **API versioning** support
- **Database migration** capabilities
- **Microservices ready** architecture

## 7. Monitoring & Logging

### Logging System
- **Python logging** với configurable levels
- **Request/Response logging**
- **Error tracking** và exception handling
- **Performance monitoring** hooks

### Health Checks
- **Database connectivity** checks
- **API endpoint** health monitoring
- **Discord bot** status monitoring

Kiến trúc này được thiết kế để dễ dàng maintain, scale và extend với các tính năng mới trong tương lai.