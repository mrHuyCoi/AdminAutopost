# Xử lý lỗi trong Chatbot Permissions

## Các lỗi thường gặp và cách xử lý

### 1. Lỗi Duplicate Name (Tên trùng lặp)

#### Lỗi: "Gói cước với tên 'combo a' đã tồn tại"
**Nguyên nhân**: Tên gói cước hoặc dịch vụ đã tồn tại trong database
**Cách xử lý**:
- Chọn tên khác cho gói cước/dịch vụ
- Sử dụng tên mô tả hơn: "Combo Cơ bản", "Combo Nâng cao"
- Thêm số thứ tự: "Combo A - 2024", "Combo A - Q1"

#### Ví dụ tên tốt:
- ✅ "Gói Cơ bản - Tư vấn sản phẩm"
- ✅ "Gói Nâng cao - Hỗ trợ kỹ thuật"
- ✅ "Combo Toàn diện - Q1 2024"
- ❌ "combo a" (quá ngắn, dễ trùng)

### 2. Lỗi Validation

#### Lỗi: "Tên dịch vụ là bắt buộc"
**Nguyên nhân**: Form validation
**Cách xử lý**:
- Điền đầy đủ thông tin bắt buộc
- Kiểm tra format dữ liệu

#### Lỗi: "Giá cơ bản không được âm"
**Nguyên nhân**: Giá trị âm
**Cách xử lý**:
- Nhập giá >= 0
- Sử dụng đơn vị VNĐ

### 3. Lỗi Database

#### Lỗi: "Không tìm thấy gói cước"
**Nguyên nhân**: ID không tồn tại hoặc đã bị xóa
**Cách xử lý**:
- Refresh trang để lấy danh sách mới
- Kiểm tra gói cước còn tồn tại không

#### Lỗi: "Lỗi kết nối database"
**Nguyên nhân**: Database offline hoặc lỗi kết nối
**Cách xử lý**:
- Kiểm tra backend có chạy không
- Kiểm tra kết nối database
- Thử lại sau vài phút

### 4. Lỗi Authentication

#### Lỗi: "Không thể xác thực thông tin đăng nhập"
**Nguyên nhân**: Token hết hạn hoặc không hợp lệ
**Cách xử lý**:
- Đăng nhập lại
- Kiểm tra quyền admin

#### Lỗi: "Bạn không có quyền truy cập chức năng này"
**Nguyên nhân**: User không có role admin
**Cách xử lý**:
- Liên hệ admin để cấp quyền
- Kiểm tra role trong database

## Cách phòng tránh lỗi

### 1. Đặt tên rõ ràng
- Sử dụng tên mô tả, dễ hiểu
- Thêm thông tin phân biệt (thời gian, phiên bản)
- Tránh tên quá ngắn hoặc chung chung

### 2. Kiểm tra dữ liệu trước khi submit
- Điền đầy đủ thông tin bắt buộc
- Kiểm tra format dữ liệu
- Xem preview trước khi lưu

### 3. Backup dữ liệu quan trọng
- Export dữ liệu trước khi thay đổi lớn
- Test trên môi trường dev trước
- Có plan rollback nếu cần

## Quy trình xử lý lỗi

### 1. Ghi nhận lỗi
- Copy thông báo lỗi
- Ghi lại các bước thực hiện
- Lưu thời gian xảy ra lỗi

### 2. Phân tích nguyên nhân
- Kiểm tra thông báo lỗi
- Xem logs backend
- Kiểm tra dữ liệu input

### 3. Thực hiện khắc phục
- Làm theo hướng dẫn xử lý
- Test lại sau khi sửa
- Ghi nhận kết quả

### 4. Báo cáo nếu cần
- Nếu lỗi không thể tự xử lý
- Cung cấp đầy đủ thông tin
- Mô tả các bước đã thử

## Liên hệ hỗ trợ

Nếu gặp lỗi không thể tự xử lý:
- **Email**: support@example.com
- **Hotline**: 1900-xxxx
- **Chat**: Trực tuyến trong admin panel

## Lưu ý quan trọng

1. **Không xóa dữ liệu** nếu không chắc chắn
2. **Test trên môi trường dev** trước khi áp dụng production
3. **Backup dữ liệu** trước khi thay đổi lớn
4. **Ghi nhận mọi thay đổi** để dễ dàng rollback
5. **Liên hệ admin** nếu gặp vấn đề về quyền truy cập 