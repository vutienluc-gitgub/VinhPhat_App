# Giới thiệu tổng quan

VinhPhat_App là một ứng dụng web nội bộ (Internal Web App) được thiết kế riêng cho công ty Dệt May Vĩnh Phát. Mục tiêu chính của ứng dụng là số hóa và đơn giản hóa quy trình quản lý sản xuất, từ việc nhập vải mộc, ghi nhận vải thành phẩm, xuất kho bán hàng, cho đến quản lý công nợ và xem báo cáo.

Ứng dụng được xây dựng theo kiến trúc serverless gọn nhẹ, sử dụng Google Sheets làm cơ sở dữ liệu và Google Apps Script (GAS) làm backend API, giúp giảm thiểu chi phí vận hành và dễ dàng triển khai. Giao diện người dùng được xây dựng bằng Vanilla JavaScript (ES Modules), đảm bảo hiệu năng và khả năng chạy trên nhiều thiết bị.

Đặc biệt, ứng dụng được phát triển thành một Progressive Web App (PWA), cho phép cài đặt lên máy tính hoặc điện thoại và có khả năng hoạt động offline, tự động đồng bộ dữ liệu khi có mạng trở lại, đảm bảo công việc không bị gián đoạn.

# Các tính năng chính

Ứng dụng được chia thành các module chức năng tương ứng với các trang.

## 1. Nhập liệu và giao dịch

- Nhập vải mộc: Ghi nhận các lô vải mộc nhập từ nhà dệt, bao gồm thông tin nhà cung cấp, loại hàng, giá và chi tiết cân nặng của từng cây vải.
- Vải thành phẩm: Ghi nhận vải sau khi đã qua công đoạn nhuộm, liên kết với lô mộc gốc.
- Xuất kho: Tạo phiếu xuất kho cho khách hàng, cho phép xuất nhiều mặt hàng với đơn giá và số lượng cây hoặc kg khác nhau trong cùng một phiếu.
- Thu tiền: Ghi nhận các khoản thanh toán từ khách hàng, tự động cập nhật vào công nợ.
- Quản lý khách hàng: Thêm mới và xem danh sách khách hàng.

## 2. Tra cứu và phân tích

- Lịch sử phiếu: Tra cứu, tìm kiếm và lọc tất cả các loại phiếu như nhập, xuất, thu tiền theo ngày, loại phiếu và khách hàng.
- Tồn kho: Xem báo cáo tồn kho theo thời gian thực của vải mộc và vải thành phẩm, được tính toán tự động dựa trên dữ liệu nhập và xuất. Có cảnh báo tồn thấp.
- Báo cáo: Trang tổng quan với các biểu đồ sử dụng Chart.js về doanh thu, công nợ phải thu và sản lượng xuất kho theo thời gian như tháng, quý, năm.

## 3. In ấn và xuất file

- In phiếu giao hàng: Tự động tạo một layout phiếu giao hàng chuyên nghiệp, sẵn sàng để in ra giấy A4.
- In phiếu thu tiền: Tạo và in nhanh phiếu thu tiền khổ A5.
- Xuất báo cáo: In trang báo cáo ra file PDF bằng chức năng in của trình duyệt.

## 4. PWA và khả năng offline

- Cài đặt ứng dụng (PWA): Có thể được cài đặt lên màn hình chính của máy tính hoặc điện thoại từ trình duyệt Chrome hoặc Edge.
- Hoạt động offline: Toàn bộ giao diện ứng dụng có thể được truy cập ngay cả khi không có mạng.
- Lưu nháp tự động (Drafts): Dữ liệu form đang điền dở được tự động lưu vào IndexedDB, không bị mất nếu lỡ đóng tab.
- Hàng chờ gửi (Outbox): Khi người dùng nhấn Lưu lúc mất mạng, phiếu sẽ được lưu vào một hàng chờ. Ứng dụng sẽ tự động gửi lại các phiếu này khi có mạng trở lại.

## 5. Phân quyền và bảo mật

- Đăng nhập bằng PIN: Trước khi vào ứng dụng, người dùng phải đăng nhập bằng mã PIN.
- Ba vai trò người dùng:
  - Xem (Read-only): Chỉ có thể xem các trang Lịch sử, Tồn kho, Báo cáo.
  - Nhập liệu (Data Entry): Có thể thực hiện mọi thao tác nhập liệu và giao dịch nhưng không thể truy cập trang Cài đặt.
  - Admin (Quản trị): Toàn quyền truy cập, bao gồm cả trang Cài đặt để cấu hình kết nối Google Sheets.
- Quản lý PIN linh hoạt: Các mã PIN có thể được thay đổi trực tiếp trong sheet Config của Google Sheets.

# Kiến trúc kỹ thuật

## 1. Frontend

- Ngôn ngữ: Vanilla JavaScript (ES Modules).
- Styling: CSS thuần với Custom Properties (biến CSS).
- Thư viện: Chart.js từ CDN để vẽ biểu đồ.
- Kiến trúc: Single Page Application (SPA), quản lý state qua một object global (`STATE`) và render lại các phần của UI một cách thủ công.
- Build tool: Không sử dụng. Các file được tham chiếu trực tiếp trong `index.html`.

## 2. Backend

- Nền tảng: Google Apps Script (GAS) được deploy dưới dạng Web App.
- Cơ sở dữ liệu: Google Sheets. Mỗi sheet tương ứng với một bảng dữ liệu, ví dụ nhập vải mộc, phiếu xuất kho.
- API:
  - `doGet(e)`: Xử lý các request GET để lấy dữ liệu như `?action=getAll`, `?action=getHistory`.
  - `doPost(e)`: Xử lý các request POST để ghi dữ liệu, được bảo vệ bởi `LockService` để tránh ghi đè dữ liệu khi có nhiều request cùng lúc.

## 3. PWA và offline

- Service Worker (`sw.js`):
  - Sử dụng chiến lược cache-first cho các tài sản tĩnh như HTML, CSS, JS, images, giúp app tải nhanh và hoạt động offline.
  - Bỏ qua, không cache, các request tới API của Google để đảm bảo dữ liệu luôn được lấy mới.
  - Cung cấp một trang `offline.html` khi người dùng cố gắng truy cập mà không có cache và không có mạng.
- Web App Manifest (`manifest.json`): Khai báo thông tin cho PWA như tên, icon, màu sắc chủ đề.
- IndexedDB (`idb.js`):
  - Store `drafts`: Lưu dữ liệu form đang nhập.
  - Store `outbox`: Lưu các payload submit thất bại do mất mạng.

# Luồng dữ liệu chính

```mermaid
graph TD
   subgraph Client["Trình duyệt Client"]
      A[index.html] --> B[app.js]
      B --> C{initAuth()}
      C -- PIN OK --> D[Init App Logic]
      D --> E[forms.js]
      D --> F[sync.js]
      D --> G[idb.js]
      E -- Submit --> H{doSubmit}
      H -- Online --> I[fetch POST]
      H -- Offline --> G
      F -- Polling --> J[fetch GET]
      G -- Online Event --> F
   end

   I --> K[Google Apps Script API]
   J --> K
   K --> L[(Google Sheets)]
```

# Các quyết định kỹ thuật quan trọng

- Sử dụng Vanilla JS: Để giữ cho dự án nhẹ, không phụ thuộc vào framework và không cần bước build phức tạp, phù hợp cho một ứng dụng nội bộ đơn giản ban đầu.
- Backend là GAS và Google Sheets: Tận dụng nền tảng có sẵn của Google, miễn phí, dễ cài đặt và phù hợp cho lượng dữ liệu vừa phải.
- In ấn bằng `window.print()`: Một giải pháp đơn giản, hiệu quả, không cần các thư viện tạo PDF nặng nề, đáp ứng tốt nhu cầu in phiếu nội bộ.
- Offline-first với IndexedDB: Lựa chọn API native của trình duyệt để đảm bảo tính năng offline mạnh mẽ, không phụ thuộc thư viện bên ngoài và đảm bảo không mất dữ liệu.
- Xác thực bằng PIN: Một cơ chế đơn giản nhưng hiệu quả cho môi trường nội bộ, nơi không yêu cầu mức độ bảo mật phức tạp như ứng dụng công cộng.
