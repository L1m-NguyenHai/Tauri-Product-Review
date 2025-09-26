-- Tạo bảng user_activities với UUID cho id
-- Chạy script này trong PostgreSQL để tạo bảng

-- Xóa bảng cũ nếu tồn tại
DROP TABLE IF EXISTS user_activities CASCADE;

-- Đảm bảo extension uuid-ossp được bật (để tạo UUID)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tạo bảng user_activities
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    activity_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tạo index để tối ưu hóa truy vấn
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- Thêm comment để mô tả bảng
COMMENT ON TABLE user_activities IS 'Bảng lưu trữ hoạt động của người dùng';
COMMENT ON COLUMN user_activities.id IS 'ID duy nhất của hoạt động (UUID)';
COMMENT ON COLUMN user_activities.user_id IS 'ID người dùng thực hiện hoạt động';
COMMENT ON COLUMN user_activities.activity_type IS 'Loại hoạt động (view_product, etc.)';
COMMENT ON COLUMN user_activities.activity_data IS 'Dữ liệu chi tiết của hoạt động (JSON)';
COMMENT ON COLUMN user_activities.created_at IS 'Thời gian tạo hoạt động';