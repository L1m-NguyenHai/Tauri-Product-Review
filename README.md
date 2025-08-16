# Project Setup & Run Guide

## 1. Cài đặt dependencies
Chạy lệnh sau để cài tất cả dependencies cần thiết:
```bash
npm i
```

## 2. Chạy ứng dụng với Tauri
Sử dụng lệnh:
```bash
npm tauri dev
```
Lệnh này sẽ build và chạy ứng dụng ở chế độ phát triển thông qua Tauri.

---

### Yêu cầu môi trường
- Node.js >= 16
- npm >= 7
- Rust & Cargo (để build Tauri)
- Tauri CLI (`npm install -g @tauri-apps/cli` nếu chưa cài)

### Thông tin thêm
Nếu gặp lỗi khi chạy `npm tauri dev`, hãy thử:
```bash
npm run tauri dev
```
hoặc
```bash
npx tauri dev
```
