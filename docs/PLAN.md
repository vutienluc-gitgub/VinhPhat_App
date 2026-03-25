# Kế Hoạch Phát Triển — VinhPhat_App

> Cập nhật: 25/03/2026 | Phiên bản: 1.0

## Trạng thái tổng quan

| Phase | Tên                      | Ngày dự kiến | Trạng thái      |
| ----- | ------------------------ | ------------ | --------------- |
| 1     | Nền tảng & Ổn định       | Ngày 1-2     | ✅ Hoàn thành   |
| 2     | Tìm kiếm & Lịch sử phiếu | Ngày 3-4     | ✅ Hoàn thành   |
| 3     | Quản lý Tồn kho          | Ngày 5-6     | ✅ Hoàn thành   |
| 4     | Báo cáo & Biểu đồ        | Ngày 7-9     | ✅ Hoàn thành   |
| 5     | In phiếu & PDF           | Ngày 9-10    | 🔲 Chưa bắt đầu |
| 6     | PWA & Offline            | Ngày 11-12   | 🔲 Chưa bắt đầu |
| 7     | Phân quyền               | Ngày 13-14   | 🔲 Chưa bắt đầu |

---

## Phase 1 — Nền tảng & Ổn định _(Ngày 1-2)_

- [x] **T01** — Chuẩn hóa error handling & retry logic trong `src/js/sync.js`
- [x] **T02** — Bổ sung unit tests cho `src/js/forms.js`
- [x] **T03** — Bổ sung unit tests cho `src/js/sync.js`
- [x] **T04** — Fix toàn bộ ESLint warnings

## Phase 2 — Tìm kiếm & Lịch sử phiếu _(Ngày 3-4)_

- [x] **T05** — Tạo `src/js/history.js` — module trang lịch sử
- [x] **T06** — Thêm GAS endpoint `?action=getHistory&type=&from=&to=` trong `scripts/VinhPhat_AppsScript.gs`
- [x] **T07** — Bộ lọc: theo ngày, loại phiếu, khách hàng, nhà cung cấp
- [x] **T08** — Tìm kiếm text nhanh (client-side filter)
- [x] **T09** — Thêm nav "Lịch sử" vào `index.html` + `src/js/navigation.js` + `src/js/config.js`

## Phase 3 — Quản lý Tồn kho _(Ngày 5-6)_ ✅

- [x] **T10** — Tạo `src/js/tonkho.js` — module trang tồn kho
- [x] **T11** — Thêm GAS endpoint `?action=getTonKho` (tính NVM − VTP − XK)
- [x] **T12** — Hiển thị tồn kho theo loại vải, màu, khổ
- [x] **T13** — Badge cảnh báo tồn thấp trên nav
- [x] **T14** — Thêm nav "Tồn kho" vào `index.html` + `src/js/navigation.js` + `src/js/config.js`

## Phase 4 — Báo cáo & Biểu đồ _(Ngày 7-9)_ ✅

- [x] **T15** — Tạo `src/js/baocao.js` — module trang báo cáo
- [x] **T16** — Thêm GAS endpoint `?action=getReport&period=`
- [x] **T17** — Tích hợp Chart.js (CDN) — 3 widget: Doanh thu, Công nợ, Sản lượng
- [x] **T18** — Bộ lọc theo tháng/quý/năm
- [x] **T19** — Nút xuất báo cáo ra PDF (`window.print()` + `@media print`)
- [x] **T20** — Thêm nav "Báo cáo" vào `index.html` + `src/js/navigation.js` + `src/js/config.js`

## Phase 5 — In phiếu & PDF _(Ngày 9-10)_

- [ ] **T21** — Tạo `src/css/print.css` — print stylesheet chuyên biệt
- [ ] **T22** — Nâng cấp layout phiếu giao hàng trong `src/js/phieu.js` (logo, border)
- [ ] **T23** — Thêm nút "In phiếu" cho trang Thu tiền (TT)

## Phase 6 — PWA & Offline _(Ngày 11-12)_

- [ ] **T24** — Tạo `public/manifest.json` (app icon, tên, theme color)
- [ ] **T25** — Thêm PWA meta tags vào `index.html`
- [ ] **T26** — Tạo `public/sw.js` — Service Worker (cache-first cho assets)
- [ ] **T27** — Offline fallback page
- [ ] **T28** — Lưu draft form vào IndexedDB khi mất mạng, tự sync khi có mạng lại

## Phase 7 — Phân quyền _(Ngày 13-14)_

- [ ] **T29** — Tạo `src/js/auth.js` — màn hình nhập PIN khi khởi động
- [ ] **T30** — Phân 3 role: Xem-only / Nhập liệu / Admin (ẩn/hiện trang theo role)
- [ ] **T31** — GAS: thêm sheet "Config" lưu danh sách role/PIN
- [ ] **T32** — Cập nhật `src/js/app.js` — gọi auth trước khi init app

---

## Files cần tạo mới

| File                   | Mục đích                   |
| ---------------------- | -------------------------- |
| `src/js/history.js`    | Module trang lịch sử phiếu |
| `src/js/tonkho.js`     | Module trang tồn kho       |
| `src/js/baocao.js`     | Module trang báo cáo       |
| `src/js/auth.js`       | Phân quyền PIN             |
| `src/css/print.css`    | Print stylesheet           |
| `public/manifest.json` | PWA manifest               |
| `public/sw.js`         | Service Worker             |

## Files cần chỉnh sửa

| File                             | Thay đổi                                          |
| -------------------------------- | ------------------------------------------------- |
| `index.html`                     | Nav items mới, trang mới, PWA meta tags           |
| `src/js/navigation.js`           | Đăng ký trang mới                                 |
| `src/js/config.js`               | `PAGE_META` cho trang mới                         |
| `src/js/sync.js`                 | 3 endpoint mới (getHistory, getTonKho, getReport) |
| `src/js/app.js`                  | Init trang mới, gọi auth                          |
| `src/js/phieu.js`                | Nâng cấp layout in                                |
| `src/css/styles.css`             | Chart containers, badge styles                    |
| `scripts/VinhPhat_AppsScript.gs` | 3 GET endpoint mới + sheet Config                 |

---

## Quyết định kỹ thuật

- **Chart.js via CDN** — không cần thay đổi build pipeline
- **Auth bằng PIN localStorage** — phù hợp môi trường nội bộ
- **PDF bằng `window.print()`** — không cần thư viện nặng
- **Tồn kho tính phía GAS** — dữ liệu đã sẵn trong Sheets
- **IndexedDB cho offline drafts** — native API, không cần thư viện thứ 3

---

## Hướng dẫn cập nhật trạng thái

Khi hoàn thành task, đổi `- [ ]` thành `- [x]` và cập nhật bảng tổng quan:

- 🔲 Chưa bắt đầu
- 🔄 Đang thực hiện
- ✅ Hoàn thành
