# Demo: Trang Admin Chatbot Permissions

## Cách test trang admin chatbot permissions

### 1. Khởi động ứng dụng

```bash
# Terminal 1: Khởi động backend
cd dangbaitudong
python main.py

# Terminal 2: Khởi động frontend admin
cd admindangbai
npm run dev
```

### 2. Truy cập trang admin

1. Mở trình duyệt và truy cập: `http://localhost:5173`
2. Đăng nhập với tài khoản admin
3. Chọn "Chatbot Permissions" từ menu bên trái

### 3. Test các tính năng

#### Tab Dịch vụ
1. **Thêm dịch vụ mới**:
   - Click "Thêm dịch vụ"
   - Điền thông tin:
     - Tên: "Tư vấn sản phẩm"
     - Mô tả: "Hỗ trợ tư vấn về sản phẩm điện tử"
     - Giá cơ bản: 50000
   - Click "Lưu"

2. **Chỉnh sửa dịch vụ**:
   - Click icon Edit (✏️) bên cạnh dịch vụ
   - Thay đổi giá từ 50000 thành 60000
   - Click "Lưu"

3. **Xóa dịch vụ**:
   - Click icon Trash (🗑️) bên cạnh dịch vụ
   - Xác nhận xóa

#### Tab Gói cước
1. **Tạo gói cước mới**:
   - Click "Thêm gói cước"
   - Điền thông tin:
     - Tên: "Gói Cơ bản"
     - Mô tả: "Gói cước cơ bản cho người mới bắt đầu"
     - Giá hàng tháng: 100000
     - Chọn dịch vụ: "Tư vấn sản phẩm"
   - Click "Lưu"

2. **Chỉnh sửa gói cước**:
   - Click icon Edit (✏️) bên cạnh gói cước
   - Thay đổi giá từ 100000 thành 120000
   - Click "Lưu"

#### Tab Đăng ký
1. **Xem danh sách đăng ký**:
   - Kiểm tra hiển thị đúng thông tin người dùng
   - Kiểm tra hiển thị đúng gói cước
   - Kiểm tra trạng thái hoạt động

#### Tab Phân quyền
1. **Xem danh sách phân quyền**:
   - Kiểm tra hiển thị đúng người dùng và dịch vụ
   - Kiểm tra trạng thái quyền

### 4. Test API endpoints

#### Test với Postman hoặc curl

```bash
# Lấy danh sách dịch vụ
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Tạo dịch vụ mới
curl -X POST "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tư vấn kỹ thuật",
    "description": "Hỗ trợ kỹ thuật cho sản phẩm",
    "base_price": 75000
  }'

# Lấy danh sách gói cước
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/plans" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Tạo gói cước mới
curl -X POST "http://localhost:8000/api/v1/chatbot-subscriptions/admin/plans" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói Nâng cao",
    "description": "Gói cước nâng cao với nhiều dịch vụ",
    "monthly_price": 200000,
    "service_ids": ["SERVICE_ID_1", "SERVICE_ID_2"]
  }'
```

### 5. Test validation và error handling

#### Test validation form
1. **Thử submit form trống**:
   - Click "Thêm dịch vụ" mà không điền gì
   - Kiểm tra hiển thị lỗi validation

2. **Test giá âm**:
   - Điền giá -1000
   - Kiểm tra hiển thị lỗi "Giá cơ bản không được âm"

3. **Test tên rỗng**:
   - Điền tên "   " (chỉ có khoảng trắng)
   - Kiểm tra hiển thị lỗi "Tên dịch vụ là bắt buộc"

#### Test error handling
1. **Test network error**:
   - Tắt backend
   - Thử thao tác trên frontend
   - Kiểm tra hiển thị thông báo lỗi

2. **Test permission error**:
   - Sử dụng token không phải admin
   - Kiểm tra hiển thị thông báo "Không có quyền"

### 6. Test responsive design

1. **Test trên mobile**:
   - Resize browser window nhỏ
   - Kiểm tra layout hiển thị đúng
   - Kiểm tra modal hiển thị đúng

2. **Test trên tablet**:
   - Resize browser window vừa
   - Kiểm tra grid layout hiển thị đúng

### 7. Test performance

1. **Test với nhiều dữ liệu**:
   - Tạo 100+ dịch vụ
   - Tạo 50+ gói cước
   - Kiểm tra loading time
   - Kiểm tra pagination nếu có

2. **Test memory usage**:
   - Mở/đóng modal nhiều lần
   - Chuyển đổi tab nhiều lần
   - Kiểm tra không có memory leak

### 8. Checklist hoàn thành

- [ ] Frontend hiển thị đúng layout
- [ ] Modal thêm/sửa hoạt động đúng
- [ ] Validation form hoạt động đúng
- [ ] API calls thành công
- [ ] Error handling hiển thị đúng
- [ ] Responsive design hoạt động đúng
- [ ] Performance đáp ứng tốt
- [ ] Navigation giữa các tab hoạt động đúng
- [ ] CRUD operations hoạt động đúng
- [ ] Loading states hiển thị đúng

### 9. Troubleshooting

#### Lỗi thường gặp

1. **CORS error**:
   - Kiểm tra CORS settings trong backend
   - Đảm bảo frontend và backend cùng domain

2. **Authentication error**:
   - Kiểm tra token trong localStorage
   - Kiểm tra middleware auth trong backend

3. **API endpoint not found**:
   - Kiểm tra router đã được đăng ký trong main.py
   - Kiểm tra URL prefix trong controller

4. **Database error**:
   - Kiểm tra kết nối database
   - Kiểm tra migration đã chạy

#### Debug tips

1. **Frontend**:
   - Mở DevTools Console để xem lỗi
   - Kiểm tra Network tab để xem API calls
   - Sử dụng React DevTools để debug state

2. **Backend**:
   - Kiểm tra logs trong terminal
   - Sử dụng debugger hoặc print statements
   - Kiểm tra database trực tiếp

### 10. Kết luận

Sau khi hoàn thành tất cả test cases, trang admin chatbot permissions sẽ sẵn sàng để sử dụng trong production. Đảm bảo:

- Tất cả tính năng hoạt động đúng
- UI/UX thân thiện với người dùng
- Performance đáp ứng tốt
- Security được đảm bảo
- Error handling đầy đủ
- Documentation rõ ràng 