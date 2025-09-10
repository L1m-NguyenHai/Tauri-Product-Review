# Database Schema - LimReview

## Tổng Quan Database

LimReview sử dụng PostgreSQL làm primary database với schema được thiết kế để hỗ trợ hệ thống đánh giá sản phẩm đầy đủ.

## Database Connection
- **Engine**: PostgreSQL 12+
- **Driver**: psycopg2-binary
- **Pool Management**: Custom connection pooling
- **Default Port**: 5432

---

## Core Tables

### `users` - Quản Lý User
Lưu trữ thông tin tài khoản và profile người dùng.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash TEXT NOT NULL,
    avatar TEXT, -- URL to avatar image
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'admin'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### `categories` - Danh Mục Sản Phẩm
Phân loại sản phẩm theo category.

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
```

### `products` - Sản Phẩm
Thông tin chi tiết về sản phẩm.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    manufacturer VARCHAR(255),
    price DECIMAL(10,2),
    original_price DECIMAL(10,2),
    product_url TEXT, -- Link to product page
    availability VARCHAR(50), -- 'in_stock', 'out_of_stock', 'discontinued'
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'pending'
    image TEXT, -- Primary product image URL
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_manufacturer ON products(manufacturer);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_rating ON products(average_rating);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(
    to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(manufacturer, ''))
);
```

### `reviews` - Đánh Giá Sản Phẩm
Lưu trữ reviews và ratings từ users.

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(500),
    content TEXT,
    verified_purchase BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'published', -- 'published', 'pending', 'rejected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(user_id, product_id) -- One review per user per product
);

-- Indexes
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_reviews_helpful_votes ON reviews(helpful_votes);
```

---

## Extended Product Information

### `product_features` - Tính Năng Sản Phẩm
Danh sách các tính năng chính của sản phẩm.

```sql
CREATE TABLE product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    feature_text VARCHAR(500) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_features_product_id ON product_features(product_id);
CREATE INDEX idx_product_features_sort_order ON product_features(sort_order);
```

### `product_images` - Hình Ảnh Sản Phẩm
Gallery hình ảnh cho sản phẩm.

```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order);
```

### `product_specifications` - Thông Số Kỹ Thuật
Chi tiết thông số kỹ thuật của sản phẩm.

```sql
CREATE TABLE product_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_name VARCHAR(255) NOT NULL,
    spec_value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_product_specifications_product_id ON product_specifications(product_id);
CREATE INDEX idx_product_specifications_name ON product_specifications(spec_name);
```

### `store_links` - Link Cửa Hàng
Links đến các cửa hàng bán sản phẩm.

```sql
CREATE TABLE store_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    store_name VARCHAR(255) NOT NULL,
    store_url TEXT NOT NULL,
    price DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'USD',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_store_links_product_id ON store_links(product_id);
CREATE INDEX idx_store_links_store_name ON store_links(store_name);
```

---

## Review System Extended

### `review_pros` - Ưu Điểm Trong Review
Danh sách ưu điểm được mention trong review.

```sql
CREATE TABLE review_pros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    pro_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_review_pros_review_id ON review_pros(review_id);
```

### `review_cons` - Nhược Điểm Trong Review
Danh sách nhược điểm được mention trong review.

```sql
CREATE TABLE review_cons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    con_text VARCHAR(500) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_review_cons_review_id ON review_cons(review_id);
```

### `review_media` - Media Files Trong Review
Hình ảnh, video đính kèm trong review.

```sql
CREATE TABLE review_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(50) NOT NULL, -- 'image', 'video'
    alt_text VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_review_media_review_id ON review_media(review_id);
CREATE INDEX idx_review_media_type ON review_media(media_type);
```

### `review_helpful_votes` - Votes Hữu Ích
Tracking votes cho reviews.

```sql
CREATE TABLE review_helpful_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(review_id, user_id) -- One vote per user per review
);

-- Indexes
CREATE INDEX idx_helpful_votes_review_id ON review_helpful_votes(review_id);
CREATE INDEX idx_helpful_votes_user_id ON review_helpful_votes(user_id);
```

---

## User Social System

### `user_follows` - Following System
Hệ thống follow users.

```sql
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(follower_id, followed_id), -- Prevent duplicate follows
    CHECK (follower_id != followed_id) -- Prevent self-follow
);

-- Indexes
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_followed_id ON user_follows(followed_id);
```

---

## Request & Contact System

### `review_requests` - Yêu Cầu Review
Users có thể request reviews cho sản phẩm mới.

```sql
CREATE TABLE review_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_name VARCHAR(500) NOT NULL,
    manufacturer VARCHAR(255),
    product_url TEXT,
    reason TEXT,
    priority VARCHAR(50) DEFAULT 'normal', -- 'low', 'normal', 'high'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'completed'
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_review_requests_user_id ON review_requests(user_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);
CREATE INDEX idx_review_requests_priority ON review_requests(priority);
CREATE INDEX idx_review_requests_created_at ON review_requests(created_at);
```

### `contact_submissions` - Liên Hệ
Form liên hệ từ users.

```sql
CREATE TABLE contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'responded', 'closed'
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX idx_contact_submissions_created_at ON contact_submissions(created_at);
CREATE INDEX idx_contact_submissions_email ON contact_submissions(email);
```

---

## Database Functions & Triggers

### Auto-Update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Update Product Rating
```sql
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product average rating and review count
    UPDATE products SET 
        average_rating = (
            SELECT COALESCE(AVG(rating::numeric), 0)
            FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND status = 'published'
        ),
        review_count = (
            SELECT COUNT(*)
            FROM reviews 
            WHERE product_id = COALESCE(NEW.product_id, OLD.product_id) 
            AND status = 'published'
        )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply trigger
CREATE TRIGGER update_product_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_product_rating();
```

### Update Review Helpful Votes
```sql
CREATE OR REPLACE FUNCTION update_review_helpful_votes()
RETURNS TRIGGER AS $$
BEGIN
    -- Update helpful votes count
    UPDATE reviews SET 
        helpful_votes = (
            SELECT COUNT(*)
            FROM review_helpful_votes 
            WHERE review_id = COALESCE(NEW.review_id, OLD.review_id) 
            AND is_helpful = true
        )
    WHERE id = COALESCE(NEW.review_id, OLD.review_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Apply trigger
CREATE TRIGGER update_review_helpful_votes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
    FOR EACH ROW EXECUTE FUNCTION update_review_helpful_votes();
```

---

## Database Views

### `product_stats_view` - Thống Kê Sản Phẩm
```sql
CREATE VIEW product_stats_view AS
SELECT 
    p.id,
    p.name,
    p.manufacturer,
    p.average_rating,
    p.review_count,
    c.name as category_name,
    COUNT(DISTINCT r.user_id) as unique_reviewers,
    AVG(CASE WHEN r.rating >= 4 THEN 1.0 ELSE 0.0 END) as satisfaction_rate
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN reviews r ON p.id = r.product_id AND r.status = 'published'
GROUP BY p.id, p.name, p.manufacturer, p.average_rating, p.review_count, c.name;
```

### `user_stats_view` - Thống Kê User
```sql
CREATE VIEW user_stats_view AS
SELECT 
    u.id,
    u.name,
    u.email,
    COUNT(DISTINCT r.id) as total_reviews,
    AVG(r.rating) as avg_rating_given,
    COUNT(DISTINCT f1.followed_id) as following_count,
    COUNT(DISTINCT f2.follower_id) as followers_count,
    SUM(r.helpful_votes) as total_helpful_votes_received
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id AND r.status = 'published'
LEFT JOIN user_follows f1 ON u.id = f1.follower_id
LEFT JOIN user_follows f2 ON u.id = f2.followed_id
GROUP BY u.id, u.name, u.email;
```

---

## Performance Optimization

### Partitioning Strategy
```sql
-- Partition reviews table by created_at (monthly)
CREATE TABLE reviews_y2024m01 PARTITION OF reviews
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Materialized Views for Analytics
```sql
CREATE MATERIALIZED VIEW popular_products_mv AS
SELECT 
    p.id,
    p.name,
    p.average_rating,
    p.review_count,
    COUNT(rhv.id) as total_helpful_votes
FROM products p
LEFT JOIN reviews r ON p.id = r.product_id
LEFT JOIN review_helpful_votes rhv ON r.id = rhv.review_id AND rhv.is_helpful = true
WHERE p.status = 'active'
GROUP BY p.id, p.name, p.average_rating, p.review_count
ORDER BY p.average_rating DESC, p.review_count DESC;

-- Refresh schedule
CREATE INDEX idx_popular_products_mv_rating ON popular_products_mv(average_rating DESC);
```

---

## Backup & Maintenance

### Regular Maintenance Tasks
```sql
-- Update table statistics
ANALYZE;

-- Reindex heavily used tables
REINDEX TABLE products;
REINDEX TABLE reviews;
REINDEX TABLE users;

-- Clean up old data (if needed)
DELETE FROM review_helpful_votes 
WHERE created_at < NOW() - INTERVAL '2 years';
```

### Backup Strategy
```bash
# Full backup
pg_dump -h localhost -U postgres -d limreview > backup_$(date +%Y%m%d).sql

# Schema only backup
pg_dump -h localhost -U postgres -d limreview --schema-only > schema_backup.sql

# Data only backup
pg_dump -h localhost -U postgres -d limreview --data-only > data_backup.sql
```

---

*Database schema được thiết kế để đảm bảo performance cao, data integrity và scalability cho hệ thống review sản phẩm.*