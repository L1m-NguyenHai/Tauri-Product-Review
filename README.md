# Project Setup & Run Guide

## Yêu cầu môi trường
- Node.js >= 16  
- pnpm (nếu thay đổi hãy update trong config của Tauri)  
- Rust & Cargo (để build Tauri app)  
- Tauri CLI:  
  ```bash
  npm install -g @tauri-apps/cli
  ```
- Python >= 3.10 (chưa test dưới 3.10)

---

## 1. Cài đặt dependencies
Chạy lệnh sau để cài toàn bộ dependencies cho project:
```bash
pnpm i
```

---

## 2. Chạy API database

### Bước 1: Di chuyển vào thư mục API
```bash
cd ../databaseAPI/
```

### Bước 2: Cài các thư viện Python
```bash
pip install -r requirements.txt
```

### Bước 3: Khởi động API
```bash
python app.py
```
> Lưu ý: API sẽ chạy dựa trên `schema.sql` đã cấu hình trước trong PostgreSQL.

---

## 3. Chạy ứng dụng Tauri
Từ thư mục chính của app, chạy lệnh:
```bash
pnpm tauri dev
```

Ứng dụng sẽ khởi động với giao diện Tauri kết nối tới API database vừa bật.


## Troubleshooting

### Lỗi 1: Không kết nối được PostgreSQL
- Kiểm tra PostgreSQL đã chạy chưa:
  ```bash
  sudo service postgresql status
  ```
- Đảm bảo user/password/DB name trong `app.py` trùng khớp với config.

### Lỗi 2: Port 5432 bị chiếm dụng
- Kiểm tra port:
  ```bash
  lsof -i:5432
  ```
- Dừng tiến trình cũ hoặc đổi port trong `app.py` và `schema.sql`.

### Lỗi 3: Không chạy được `pnpm tauri dev`
- Kiểm tra đã cài `Rust` và `Cargo`:
  ```bash
  rustc --version
  cargo --version
  ```
- Nếu chưa có, cài bằng:
  ```bash
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
  ```

### Lỗi 4: Không tìm thấy module Python
- Cài lại dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Đảm bảo đang dùng đúng version Python >= 3.10.

### Lỗi 5: API chạy nhưng Tauri không nhận dữ liệu
- Kiểm tra URL trong code frontend (ví dụ `http://localhost:8000`).  
- Đảm bảo API (Python) đang chạy trước khi bật Tauri.

---

## Hoàn thành
- Setup môi trường thành công  
- Cài đặt dependencies  
- Chạy API backend  
- Khởi động ứng dụng Tauri frontend  
- Có hướng dẫn xử lý lỗi thường gặp  
