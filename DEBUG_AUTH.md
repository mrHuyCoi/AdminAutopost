# Debug Authentication Issues

## Vấn đề hiện tại
- API calls trả về 401 Unauthorized
- Lỗi: "Không thể xác thực thông tin đăng nhập"

## Các bước debug

### 1. Kiểm tra token trong localStorage
```javascript
// Mở DevTools Console và chạy:
console.log('auth_token:', localStorage.getItem('auth_token'));
console.log('user_data:', localStorage.getItem('user_data'));
```

### 2. Kiểm tra token format
Token phải có format: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Kiểm tra user role
```javascript
const userData = JSON.parse(localStorage.getItem('user_data'));
console.log('User role:', userData.role);
```

User phải có `role: 'admin'` để truy cập admin endpoints.

### 4. Test API với Postman/curl
```bash
# Lấy token từ localStorage
TOKEN="your_token_here"

# Test admin endpoint
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Kiểm tra backend logs
Trong terminal backend, xem có lỗi gì khi xác thực không.

### 6. Kiểm tra database
```sql
-- Kiểm tra user có role admin không
SELECT id, email, role, is_active FROM users WHERE email = 'your_email';
```

### 7. Sửa lỗi thường gặp

#### Lỗi 1: Token không đúng format
- Đảm bảo token bắt đầu với "Bearer "
- Token không bị cắt ngắn

#### Lỗi 2: User không có role admin
- Cập nhật database: `UPDATE users SET role = 'admin' WHERE email = 'your_email';`

#### Lỗi 3: User bị vô hiệu hóa
- Kiểm tra `is_active = true` trong database

#### Lỗi 4: Token hết hạn
- Đăng nhập lại để lấy token mới

### 8. Test từng bước

1. **Đăng nhập lại**:
   - Logout và login lại
   - Kiểm tra token mới

2. **Kiểm tra role**:
   - Đảm bảo user có role 'admin'

3. **Test API đơn giản trước**:
   ```bash
   # Test endpoint không cần admin
   curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/plans" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Test admin endpoint**:
   ```bash
   # Test admin endpoint
   curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
     -H "Authorization: Bearer $TOKEN"
   ```

### 9. Cấu trúc token JWT
Token JWT có 3 phần:
- Header: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- Payload: `eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ`
- Signature: `SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

### 10. Kiểm tra middleware
Đảm bảo `get_current_active_superuser` hoạt động đúng:

```python
# Trong auth_middleware.py
async def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    print(f"Checking user role: {current_user.role}")  # Debug log
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền truy cập chức năng này",
        )
    return current_user
```

### 11. Kết quả mong đợi
Sau khi debug thành công:
- API calls trả về 200 OK
- Dữ liệu được trả về đúng format
- Không còn lỗi 401 Unauthorized 