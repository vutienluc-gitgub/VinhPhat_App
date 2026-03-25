# Quy Tắc Code - Dự Án Vĩnh Phát

## Quy Tắc Đặt Tên

### HTML & CSS

- Tên class: `kebab-case` (ví dụ: `fabric-list`, `input-field`)
- ID: `camelCase` (ví dụ: `fabricTable`, `submitBtn`)
- Tên hàm/biến: `camelCase` (ví dụ: `calculateTotal`, `userData`)

### Google Apps Script

- Tên hàm: `camelCase` (ví dụ: `updateSheet`, `getDataFromForm`)
- Tên hằng số: `UPPER_SNAKE_CASE` (ví dụ: `SHEET_NAME`, `API_URL`)
- Tên thuộc tính: `camelCase` (ví dụ: `sheetName`, `userId`)

## Cấu Trúc File

### HTML

- Phải có DOCTYPE và meta tags cơ bản
- Thẻ title phải mô tả rõ chức năng
- CSS nhúng hoặc tách thành từng section logic

### Google Apps Script

- Một hàm chính (onOpen, doGet, doPost, etc.)
- Các hàm phụ tổ chức theo chức năng
- Comment mô tả cho mỗi hàm chính

## Khuyến Nghị

- Không dùng inline styles, dùng class CSS
- Sử dụng console.log chỉ cho debugging, trước khi commit phải xóa
- Kiểm tra lỗi trên console browser trước khi push
- Tránh hard-code: dùng biến cấu hình
