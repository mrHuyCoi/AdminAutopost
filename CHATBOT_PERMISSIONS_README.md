# Chatbot Permissions Admin Page

## Tổng quan
Trang admin quản lý phân quyền chatbot cho phép quản trị viên quản lý:
- **Dịch vụ chatbot**: Tạo, sửa, xóa các dịch vụ chatbot
- **Gói cước**: Quản lý các gói cước với các dịch vụ được bao gồm
- **Đăng ký người dùng**: Xem danh sách đăng ký của người dùng
- **Phân quyền**: Quản lý quyền truy cập các dịch vụ chatbot

## Tính năng chính

### 1. Quản lý Dịch vụ Chatbot
- **Thêm dịch vụ mới**: Tạo dịch vụ chatbot với tên, mô tả và giá cơ bản
- **Chỉnh sửa dịch vụ**: Cập nhật thông tin dịch vụ hiện có
- **Xóa dịch vụ**: Xóa dịch vụ không còn sử dụng
- **Xem danh sách**: Hiển thị tất cả dịch vụ với thông tin chi tiết

### 2. Quản lý Gói cước
- **Tạo gói cước**: Tạo gói cước mới với giá hàng tháng và danh sách dịch vụ
- **Chọn dịch vụ**: Mỗi gói cước có thể bao gồm nhiều dịch vụ khác nhau
- **Chỉnh sửa gói**: Cập nhật thông tin gói cước và dịch vụ được bao gồm
- **Xóa gói**: Xóa gói cước không còn cung cấp

### 3. Quản lý Đăng ký
- **Xem đăng ký**: Danh sách tất cả đăng ký chatbot của người dùng
- **Thông tin chi tiết**: Người dùng, gói cước, thời gian, trạng thái
- **Theo dõi sử dụng**: Xem thời gian đăng ký và trạng thái hoạt động

### 4. Quản lý Phân quyền
- **Xem quyền**: Danh sách phân quyền truy cập dịch vụ chatbot
- **Trạng thái quyền**: Kiểm tra quyền đang hoạt động hay không
- **Thời gian quyền**: Theo dõi thời gian cấp quyền và hết hạn

## Cách sử dụng

### Truy cập trang
1. Đăng nhập vào admin panel
2. Chọn "Chatbot Permissions" từ menu bên trái
3. Sử dụng các tab để chuyển đổi giữa các chức năng

### Thêm dịch vụ mới
1. Chọn tab "Dịch vụ"
2. Click nút "Thêm dịch vụ"
3. Điền thông tin:
   - Tên dịch vụ (bắt buộc)
   - Mô tả (tùy chọn)
   - Giá cơ bản (VNĐ)
4. Click "Lưu"

### Tạo gói cước
1. Chọn tab "Gói cước"
2. Click nút "Thêm gói cước"
3. Điền thông tin:
   - Tên gói cước
   - Mô tả
   - Giá hàng tháng
   - Chọn các dịch vụ được bao gồm
4. Click "Lưu"

### Quản lý đăng ký
1. Chọn tab "Đăng ký"
2. Xem danh sách tất cả đăng ký
3. Kiểm tra trạng thái và thông tin chi tiết

## API Endpoints

### Dịch vụ Chatbot
- `GET /api/v1/chatbot-subscriptions/admin/services` - Lấy danh sách dịch vụ
- `POST /api/v1/chatbot-subscriptions/admin/services` - Tạo dịch vụ mới
- `PUT /api/v1/chatbot-subscriptions/admin/services/{id}` - Cập nhật dịch vụ
- `DELETE /api/v1/chatbot-subscriptions/admin/services/{id}` - Xóa dịch vụ

### Gói cước
- `GET /api/v1/chatbot-subscriptions/admin/plans` - Lấy danh sách gói cước
- `POST /api/v1/chatbot-subscriptions/admin/plans` - Tạo gói cước mới
- `PUT /api/v1/chatbot-subscriptions/admin/plans/{id}` - Cập nhật gói cước
- `DELETE /api/v1/chatbot-subscriptions/admin/plans/{id}` - Xóa gói cước

### Đăng ký người dùng
- `GET /api/v1/chatbot-subscriptions/admin/subscriptions` - Lấy danh sách đăng ký
- `POST /api/v1/chatbot-subscriptions/admin/subscriptions` - Tạo đăng ký mới
- `PUT /api/v1/chatbot-subscriptions/admin/subscriptions/{id}` - Cập nhật đăng ký
- `DELETE /api/v1/chatbot-subscriptions/admin/subscriptions/{id}` - Xóa đăng ký

## Cấu trúc dữ liệu

### ChatbotService
```typescript
interface ChatbotService {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  created_at?: Date;
  updated_at?: Date;
}
```

### ChatbotPlan
```typescript
interface ChatbotPlan {
  id: string;
  name: string;
  description?: string;
  monthly_price: number;
  services: ChatbotService[];
  created_at?: Date;
  updated_at?: Date;
}
```

### UserChatbotSubscription
```typescript
interface UserChatbotSubscription {
  id: string;
  user_id: string;
  plan: ChatbotPlan;
  start_date: Date;
  end_date: Date;
  months_subscribed: number;
  total_price: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}
```

## Lưu ý quan trọng

1. **Quyền truy cập**: Chỉ admin mới có thể truy cập trang này
2. **Xóa dịch vụ**: Khi xóa dịch vụ, cần đảm bảo không có gói cước nào đang sử dụng
3. **Xóa gói cước**: Khi xóa gói cước, cần kiểm tra không có người dùng nào đang đăng ký
4. **Backup dữ liệu**: Nên backup dữ liệu trước khi thực hiện các thao tác quan trọng

## Xử lý lỗi

- **Validation**: Form sẽ kiểm tra dữ liệu trước khi gửi
- **API Errors**: Hiển thị thông báo lỗi từ server
- **Network Issues**: Thông báo khi không thể kết nối server
- **Permission Denied**: Thông báo khi không có quyền thực hiện thao tác

## Tương lai

Các tính năng có thể phát triển thêm:
- **Bulk Operations**: Thao tác hàng loạt với nhiều item
- **Advanced Filtering**: Lọc và tìm kiếm nâng cao
- **Export/Import**: Xuất nhập dữ liệu từ Excel/CSV
- **Audit Log**: Ghi log các thay đổi
- **Real-time Updates**: Cập nhật real-time khi có thay đổi
- **Advanced Permissions**: Phân quyền chi tiết hơn cho từng dịch vụ 