# LimReview - Product Review System Documentation

## 🚀 Tổng Quan Dự Án

**LimReview** là một hệ thống đánh giá sản phẩm toàn diện được xây dựng dưới dạng desktop application với kiến trúc modern. Dự án kết hợp sức mạnh của Tauri để tạo native desktop app với React frontend và FastAPI backend, cung cấp trải nghiệm user mượt mà và hiệu suất cao.

### ✨ Tính Năng Chính

- 🔐 **Hệ thống Authentication**: JWT-based với role management (User/Admin)
- 📱 **Desktop Application**: Cross-platform app được build với Tauri
- 🛍️ **Product Management**: CRUD operations đầy đủ cho sản phẩm
- ⭐ **Review System**: Đánh giá chi tiết với rating, pros/cons, media attachments
- 👥 **User Social Features**: Following system, user profiles, activity tracking
- 📊 **Admin Dashboard**: Comprehensive management panel với analytics
- 🎯 **Review Requests**: Users có thể request reviews cho sản phẩm mới
- 💬 **Contact System**: Built-in contact form và management
- 🌙 **Dark/Light Theme**: Flexible theme switching
- 🔍 **Advanced Search**: Filtering, sorting, và full-text search

### 🏗️ Kiến Trúc Công Nghệ

```
┌─────────────────────────────────────────┐
│            Desktop Application          │
│              (Tauri + React)            │
├─────────────────────────────────────────┤
│              Frontend Layer             │
│          React + TypeScript             │
│            Tailwind CSS                 │
├─────────────────────────────────────────┤
│               Backend API               │
│            FastAPI (Python)             │
│          PostgreSQL Database            │
├─────────────────────────────────────────┤
│             External Services           │
│         Discord (Media Storage)         │
└─────────────────────────────────────────┘
```

---

## 📚 Tài Liệu Tham Khảo

### 📖 Documentation Index

| Tài Liệu | Mô Tả | Đối Tượng |
|----------|-------|-----------|
| **[Installation Guide](./installation.md)** | Hướng dẫn cài đặt và setup môi trường phát triển | Developer, DevOps |
| **[Architecture Documentation](./architecture.md)** | Kiến trúc hệ thống chi tiết và design decisions | Developer, Architect |
| **[API Documentation](./api-endpoints.md)** | Comprehensive API endpoint reference | Frontend Dev, API Consumer |
| **[Database Schema](./database-schema.md)** | Database structure, relationships và optimization | Backend Dev, DBA |
| **[Coding Standards](./coding-standards.md)** | Code style, best practices và conventions | All Developers |
| **[Development Workflow](./workflow.md)** | Git workflow, deployment process và team collaboration | All Team Members |

### 🎯 Quick Navigation

#### 🏁 Getting Started
1. **First Time Setup**: Đọc [Installation Guide](./installation.md)
2. **Understanding Architecture**: Tham khảo [Architecture Documentation](./architecture.md)
3. **Development Standards**: Review [Coding Standards](./coding-standards.md)

#### 👨‍💻 For Developers
- **Frontend Development**: React components trong `src/` + API integration
- **Backend Development**: FastAPI endpoints trong `databaseAPI/routes/`
- **Database Work**: Schema documentation trong [Database Schema](./database-schema.md)

#### 🚀 For DevOps/Deployment
- **Environment Setup**: [Installation Guide](./installation.md)
- **Deployment Process**: [Development Workflow](./workflow.md)
- **Monitoring**: Architecture considerations trong [Architecture Documentation](./architecture.md)

---

## 🛠️ Tech Stack Detail

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3.1 | UI Library |
| **TypeScript** | 5.5.3 | Type Safety |
| **Tauri** | 2.7.1 | Desktop App Framework |
| **Tailwind CSS** | 3.4.1 | Styling Framework |
| **React Router** | 7.7.0 | Client-side Routing |
| **Axios** | 1.11.0 | HTTP Client |
| **Vite** | 5.4.2 | Build Tool |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Python** | 3.10+ | Programming Language |
| **FastAPI** | 0.116.1 | Web Framework |
| **PostgreSQL** | 12+ | Primary Database |
| **psycopg2** | 2.9.10 | Database Driver |
| **JWT** | - | Authentication |
| **Discord.py** | 2.6.3 | Media Storage Integration |
| **Bcrypt** | 4.3.0 | Password Hashing |

---

## 🚀 Quick Start

### Prerequisites Check
```bash
# Check required tools
node --version    # >= 16.0.0
pnpm --version    # Latest
rustc --version   # Latest stable
python --version  # >= 3.10
psql --version    # >= 12.0
```

### Development Setup (5 phút)
```bash
# 1. Clone repository
git clone <repository-url>
cd Tauri-Product-Review

# 2. Install dependencies
pnpm install
cd databaseAPI && pip install -r req.txt

# 3. Setup database
createdb limreview
psql -d limreview -f schema.sql  # if available

# 4. Start development
# Terminal 1: API
cd databaseAPI && python app.py

# Terminal 2: Desktop App
cd .. && pnpm tauri dev
```

### Production Build
```bash
# Build optimized version
pnpm build
pnpm tauri build

# Output: src-tauri/target/release/bundle/
```

---

## 📊 Project Statistics

### 📈 Codebase Overview
- **Total Files**: 100+ source files
- **Frontend Components**: 15+ React components
- **API Endpoints**: 50+ REST endpoints
- **Database Tables**: 15+ normalized tables
- **Test Coverage**: Expanding test suite

### 🏛️ Project Structure
```
Tauri-Product-Review/
├── 📁 src/                    # Frontend React application
│   ├── 📁 components/         # Reusable UI components
│   ├── 📁 pages/             # Page components & routing
│   ├── 📁 contexts/          # React Context providers
│   └── 📁 services/          # API service layer
├── 📁 src-tauri/             # Tauri desktop app configuration
├── 📁 databaseAPI/           # Python FastAPI backend
│   ├── 📁 routes/            # API endpoint modules
│   ├── 📁 models/            # Pydantic data models
│   ├── 📁 database/          # Database connection & utilities
│   └── 📁 auth/              # Authentication & security
├── 📁 docs/                  # 📚 Project documentation (THIS FOLDER!)
└── 📄 Configuration files    # package.json, tauri.conf.json, etc.
```

---

## 🔐 Security Features

### Authentication & Authorization
- ✅ **JWT Token Authentication** với expiration handling
- ✅ **Role-based Access Control** (User/Admin)
- ✅ **Password Hashing** với bcrypt
- ✅ **Input Validation** với Pydantic models
- ✅ **CORS Configuration** cho API security
- ✅ **SQL Injection Prevention** với parameterized queries

### Data Protection
- ✅ **Secure Password Storage** (bcrypt hashing)
- ✅ **Token-based Authentication** (stateless)
- ✅ **Input Sanitization** (XSS prevention)
- ✅ **API Rate Limiting** capabilities
- ✅ **Trusted Host Middleware** configuration

---

## 🎯 Key Features Deep Dive

### 🛍️ Product Management System
- **CRUD Operations**: Full Create, Read, Update, Delete cho products
- **Category System**: Hierarchical product categorization
- **Specifications**: Detailed product specifications tracking
- **Image Gallery**: Multiple product images với Discord storage
- **Store Links**: Integration với multiple retail stores
- **Search & Filtering**: Advanced search với multiple criteria

### ⭐ Advanced Review System
- **Comprehensive Reviews**: Rating, title, content, pros/cons
- **Media Attachments**: Images và videos trong reviews
- **Helpful Votes**: Community-driven review quality assessment
- **Review Moderation**: Admin tools cho content management
- **Verified Purchase**: Optional purchase verification flags

### 👥 Social Features
- **User Profiles**: Customizable profiles với avatar uploads
- **Following System**: Follow other reviewers
- **Activity Feeds**: Track user activities và updates
- **User Statistics**: Review counts, ratings given, followers

### 📊 Admin Dashboard
- **User Management**: User accounts và role management
- **Content Moderation**: Review approval và content management
- **Analytics**: System statistics và usage metrics
- **Review Requests**: Manage community product requests

---

## 🚦 Development Status

### ✅ Completed Features
- [x] User authentication & authorization system
- [x] Product CRUD operations với full API
- [x] Review system với rating và media support
- [x] Admin dashboard với user management
- [x] Desktop application với Tauri
- [x] Database schema với relationships
- [x] API documentation với Swagger/OpenAPI
- [x] Following/follower social system
- [x] Review request system
- [x] Contact form system

### 🚧 In Progress
- [ ] Advanced search optimization
- [ ] Real-time notifications
- [ ] Performance monitoring
- [ ] Comprehensive test coverage
- [ ] Mobile responsive improvements

### 🔮 Planned Features
- [ ] Email notification system
- [ ] Advanced analytics dashboard  
- [ ] Product comparison features
- [ ] Review templates
- [ ] API rate limiting enhancement
- [ ] Caching optimization
- [ ] Mobile app version

---

## 🤝 Contributing Guidelines

### Getting Involved
1. **Read Documentation**: Familiarize với project structure
2. **Setup Environment**: Follow [Installation Guide](./installation.md)
3. **Understand Standards**: Review [Coding Standards](./coding-standards.md)
4. **Follow Workflow**: Adhere to [Development Workflow](./workflow.md)

### Development Process
1. **Issue Assignment**: Pick hoặc được assign issues
2. **Branch Creation**: Create feature/bugfix branches
3. **Development**: Follow coding standards
4. **Testing**: Write và run tests
5. **Code Review**: Submit PR cho review
6. **Deployment**: Merge sau khi approval

---

## 📞 Support & Resources

### 🆘 Getting Help
- **Documentation**: Tham khảo docs trong thư mục này
- **API Reference**: Swagger UI tại `http://localhost:8000/docs`
- **GitHub Issues**: Report bugs hoặc feature requests
- **Code Examples**: Check existing components cho patterns

### 🔗 External Resources
- **Tauri Documentation**: [tauri.app](https://tauri.app/v1/guides/)
- **FastAPI Documentation**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com/)
- **React Documentation**: [reactjs.org](https://reactjs.org/docs/)
- **PostgreSQL Documentation**: [postgresql.org/docs](https://postgresql.org/docs/)

### 📋 Common Tasks Quick Reference
```bash
# Start development environment
pnpm tauri dev

# Run tests
pnpm test
cd databaseAPI && python -m pytest

# Build production
pnpm build && pnpm tauri build

# Database operations
psql -d limreview
python migrate.py  # if migrations exist

# Code formatting
prettier --write src/
black databaseAPI/
```

---

## 📝 Project Metadata

| Attribute | Value |
|-----------|-------|
| **Project Name** | LimReview - Product Review System |
| **Version** | 0.1.0 (Development) |
| **License** | MIT (presumed) |
| **Language** | TypeScript, Python |
| **Platform** | Cross-platform Desktop (Windows, macOS, Linux) |
| **Database** | PostgreSQL |
| **Architecture** | Desktop App + REST API + Database |

---

## 🏁 Kết Luận

LimReview là một dự án comprehensive với architecture modern và feature set đầy đủ cho một product review system. Với documentation chi tiết này, AI và developers có thể:

- **Hiểu rõ project structure** và technology choices
- **Follow best practices** và coding standards
- **Contribute effectively** với clear workflow
- **Deploy confidently** với detailed guides
- **Maintain efficiently** với proper documentation

**Mục tiêu**: Cung cấp đủ context và thông tin để AI có thể hỗ trợ development, debugging, và optimization một cách hiệu quả nhất.

---

*📚 Tài liệu này được cập nhật thường xuyên. Để có thông tin mới nhất, vui lòng kiểm tra các file documentation riêng lẻ.*

**Happy Coding! 🚀**