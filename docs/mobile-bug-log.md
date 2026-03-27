# Mobile Bug Log

Tài liệu này dùng để ghi nhận lỗi phát hiện trong quá trình test mobile.

## Hướng dẫn sử dụng

1. Mỗi lỗi ghi thành một block riêng.
2. Dùng một mã bug ngắn như `MB-001`, `MB-002`.
3. Ghi rõ viewport, orientation, browser và bước tái hiện.
4. Cập nhật trạng thái sau khi đã sửa và retest.

## Trạng thái đề xuất

- `Open`: Mới phát hiện, chưa sửa
- `In Progress`: Đang xử lý
- `Fixed`: Đã sửa xong, chờ retest
- `Retest Passed`: Đã test lại, lỗi không còn
- `Retest Failed`: Đã test lại nhưng lỗi vẫn còn
- `Won't Fix`: Tạm thời không xử lý

## Mức độ ưu tiên đề xuất

- `P1`: Chặn thao tác chính, vỡ layout nghiêm trọng, không thể dùng
- `P2`: Ảnh hưởng rõ đến trải nghiệm, cần sửa sớm
- `P3`: Lỗi nhẹ, vẫn dùng được

---

## Mẫu bug

```text
Bug ID: MB-001
Tiêu đề:
Trạng thái: Open
Mức độ ưu tiên: P2
Trang:
Viewport:
Orientation:
Browser:
Môi trường: Local / Staging / Production

Bước tái hiện:
1.
2.
3.

Kết quả thực tế:

Kết quả mong đợi:

Tần suất xảy ra: Always / Sometimes / Rare

Ảnh chụp / Video:

Ghi chú kỹ thuật:

Người ghi nhận:
Ngày ghi nhận:
Ngày retest:
Kết quả retest:
```

---

## Danh sách bug

### MB-001

- Trạng thái:
- Mức độ ưu tiên:
- Trang:
- Viewport:
- Orientation:
- Browser:
- Môi trường:
- Tiêu đề:
- Bước tái hiện:
  1.
  2.
  3.
- Kết quả thực tế:
- Kết quả mong đợi:
- Tần suất xảy ra:
- Ảnh chụp / Video:
- Ghi chú kỹ thuật:
- Người ghi nhận:
- Ngày ghi nhận:
- Ngày retest:
- Kết quả retest:

### MB-002

- Trạng thái:
- Mức độ ưu tiên:
- Trang:
- Viewport:
- Orientation:
- Browser:
- Môi trường:
- Tiêu đề:
- Bước tái hiện:
  1.
  2.
  3.
- Kết quả thực tế:
- Kết quả mong đợi:
- Tần suất xảy ra:
- Ảnh chụp / Video:
- Ghi chú kỹ thuật:
- Người ghi nhận:
- Ngày ghi nhận:
- Ngày retest:
- Kết quả retest:

### MB-003

- Trạng thái:
- Mức độ ưu tiên:
- Trang:
- Viewport:
- Orientation:
- Browser:
- Môi trường:
- Tiêu đề:
- Bước tái hiện:
  1.
  2.
  3.
- Kết quả thực tế:
- Kết quả mong đợi:
- Tần suất xảy ra:
- Ảnh chụp / Video:
- Ghi chú kỹ thuật:
- Người ghi nhận:
- Ngày ghi nhận:
- Ngày retest:
- Kết quả retest:

---

## Gợi ý phân loại bug theo khu vực

- Điều hướng mobile
- Topbar / header
- Form nhập liệu
- Roll table / bảng dữ liệu
- Preview phiếu
- Modal / toast
- Tồn kho / lịch sử / báo cáo
- Bàn phím ảo và focus input
- Landscape layout

## Gợi ý quy trình làm việc

1. Test theo file `mobile-qa-checklist.md`.
2. Khi gặp lỗi, ghi ngay vào file này.
3. Sau khi sửa, đổi trạng thái sang `Fixed`.
4. Retest trên đúng viewport đã lỗi.
5. Nếu ổn, đổi sang `Retest Passed`.
