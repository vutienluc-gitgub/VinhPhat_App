# Checklist Mobile QA

Tài liệu này dùng để kiểm tra giao diện mobile của app theo từng tác vụ, giúp bạn đánh dấu pass/fail trong quá trình test và ghi nhận lỗi có hệ thống.

## Mục tiêu

- Kiểm tra layout mobile có hiển thị đúng không
- Kiểm tra các thao tác nhập liệu trên màn hình nhỏ
- Phát hiện lỗi tràn ngang, vỡ grid, che input, modal/toast lỗi hiển thị
- Ghi nhận bug theo mẫu thống nhất để dễ tái hiện

## Cách sử dụng

1. Chạy app local hoặc môi trường test.
2. Mở DevTools và bật Device Toolbar.
3. Chọn từng viewport trong danh sách bên dưới.
4. Đi qua checklist theo từng trang.
5. Đánh dấu `Pass`, `Fail`, hoặc `N/A` cho từng mục.
6. Nếu lỗi xuất hiện, chụp màn hình và ghi lại theo mẫu ở cuối tài liệu.

## Cấu hình test

### Viewport / thiết bị

- [`Fail` ] 320 x 568
- [`Fail` ] 375 x 812
- [`Fail` ] 390 x 844
- [`Fail` ] 430 x 932
- [`Fail` ] 768 x 1024

### Orientation

- [ ] Portrait
- [ ] Landscape

### Trình duyệt

- [ ] Chrome mobile emulation
- [ ] Safari iPhone nếu có
- [ ] Chrome Android nếu có

## Kiểm tra chung

- [ ] Không có scroll ngang ngoài ý muốn
- [ ] Thanh điều hướng mobile không che nội dung
- [ ] Topbar không quá cao và không chiếm quá nhiều diện tích hiển thị
- [ ] Card, form, bảng không tràn mép màn hình
- [ ] Input, select, button đủ lớn để bấm mà không cần zoom
- [ ] Khi mở bàn phím ảo, input đang focus vẫn nhìn thấy được
- [ ] Toast và modal không bị tràn khỏi màn hình
- [ ] Chuyển page không làm layout nhảy bất thường

## Điều hướng mobile

- [ ] Thanh nav hiển thị đúng trên mobile
- [ ] Icon active dễ nhận biết
- [ ] Có thể cuộn nav nếu thiếu chỗ
- [ ] Chuyển trang qua nav hoạt động đúng
- [ ] Badge tồn kho nếu có vẫn hiển thị rõ

## Nhập vải mộc

Page: `Nhập vải mộc`

- [ ] Form thông tin lô hàng rơi về 1 cột trên mobile
- [ ] Card thông tin lô hàng không bị bó ngang
- [ ] Date input, select, number input hiển thị đúng chiều rộng
- [ ] Bảng cây vải không vỡ cột
- [ ] Nút thêm/bớt/reset cây vẫn bấm được
- [ ] Khu vực tóm tắt rơi xuống dưới trên mobile
- [ ] Nút lưu full width, không tràn

## Vải thành phẩm

Page: `Vải thành phẩm`

- [ ] Layout form và cột tóm tắt rơi về 1 cột
- [ ] Roll table không cắt cột tiền/cây
- [ ] Tổng cây, tổng kg, nợ nhuộm hiển thị đầy đủ
- [ ] Nút lưu full width, không bị che
- [ ] Các field lô mộc, nhà nhuộm, giá nhuộm dễ nhập trên mobile

## Xuất kho

Page: `Xuất kho`

- [ ] Layout 2 cột rơi về 1 cột trên mobile
- [ ] Card thông tin phiếu xuất hiển thị đầy đủ trường
- [ ] Tabs mặt hàng không đẩy nút `+` ra ngoài
- [ ] Khu thông tin hàng hóa không bị vỡ bố cục
- [ ] Bảng cây vẫn thấy đủ số thứ tự, kg, tiền/cây và nút xóa
- [ ] Preview phiếu không tràn ngang
- [ ] Sau khi thêm/xóa cây, preview cập nhật và layout không giật
- [ ] Khi nhập đơn giá, tổng tiền hiển thị đúng và không bị cắt
- [ ] Thông báo validation dễ đọc trên mobile
- [ ] Chặn xuất vượt tồn hiển thị thông báo rõ ràng

## Thu tiền

Page: `Thu tiền`

- [ ] Các field khách hàng, số tiền, ngày thu không bị chồng nhau
- [ ] Khu vực debt info hiển thị đúng nếu có dữ liệu
- [ ] Nút in phiếu thu bấm được trên mobile
- [ ] Input số tiền không bị bàn phím che khuất

## Khách hàng

Page: `Khách hàng`

- [ ] Form thêm khách hàng rơi về 1 cột
- [ ] Bảng danh sách vẫn đọc được nếu dữ liệu dài
- [ ] Nếu bảng rộng, có thể cuộn ngang hợp lý
- [ ] Nút lưu và các trường nhập không bị tràn

## Lịch sử

Page: `Lịch sử`

- [ ] Bộ lọc ngày, loại phiếu, khách hàng không chồng lên nhau
- [ ] Bảng lịch sử đọc được trên mobile
- [ ] Nếu bảng rộng, có thể cuộn ngang
- [ ] Badge loại phiếu không bị vỡ dòng xấu

## Tồn kho

Page: `Tồn kho`

- [ ] Summary cards sắp xếp hợp lý trên mobile
- [ ] Bảng tồn kho không tràn vỡ toàn bộ màn hình
- [ ] Nếu bảng rộng, có thể cuộn ngang
- [ ] Badge `Hết hàng / Sắp hết / Còn hàng` vẫn dễ đọc
- [ ] Nút tải tồn kho bấm được trên mobile

## Báo cáo

Page: `Báo cáo`

- [ ] Hai chart xếp dọc trên mobile
- [ ] Bộ lọc năm / kỳ thống kê không bị chật
- [ ] Biểu đồ không méo, không tràn card
- [ ] Bảng công nợ có thể cuộn ngang nếu cần
- [ ] Các label và số liệu vẫn đọc được

## Cài đặt

Page: `Cài đặt`

- [ ] Các input cấu hình full width
- [ ] Nút kiểm tra kết nối / xóa cấu hình / đồng bộ ngay không chồng nhau
- [ ] Khu vực realtime sync hiển thị ổn trên mobile
- [ ] Nội dung hướng dẫn dài vẫn đọc được, không tràn
- [ ] Không có đoạn text nào bị cắt mất

## Kiểm tra tương tác

- [ ] Focus vào input gần cuối form và mở bàn phím ảo
- [ ] Xoay màn hình portrait sang landscape và ngược lại
- [ ] Chuyển page khi đang nhập liệu dở dang
- [ ] Mở modal xác nhận lưu phiếu trên mobile
- [ ] Tạo toast liên tiếp để xem có che input hay nav không
- [ ] Test thêm / xóa / reset cây với số lượng lớn

## Mẫu ghi nhận lỗi

Sử dụng mẫu sau cho mỗi lỗi gặp phải:

```text
Page:
Viewport:
Orientation:
Browser:
Bước tái hiện:
Kết quả thực tế:
Kết quả mong đợi:
Ảnh chụp / video:
Ghi chú thêm:
```

## Kết quả tổng hợp

- [ ] Nhập vải mộc: Pass
- [ ] Vải thành phẩm: Pass
- [ ] Xuất kho: Pass
- [ ] Thu tiền: Pass
- [ ] Khách hàng: Pass
- [ ] Lịch sử: Pass
- [ ] Tồn kho: Pass
- [ ] Báo cáo: Pass
- [ ] Cài đặt: Pass

## Ghi chú

- Ưu tiên test page `Xuất kho` và `Nhập vải mộc` trước, vì đây là 2 màn hình có nhiều thành phần và bảng nhập liệu nhất.
- Nếu phát hiện lỗi layout, ghi kèm viewport và thao tác ngay trước khi lỗi xảy ra để dễ tái hiện.
