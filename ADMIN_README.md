# Admin Panel - Hướng dẫn sử dụng

## Tổng quan

Admin Panel được xây dựng để quản lý hệ thống Social Media Dashboard với các tính năng chính:

- **Dashboard**: Tổng quan thống kê hệ thống
- **User Management**: Quản lý người dùng
- **Analytics**: Thống kê và báo cáo chi tiết
- **Platform Management**: Quản lý các nền tảng mạng xã hội
- **Settings**: Cài đặt hệ thống

## Bảo mật và Phân quyền

### AdminRoute Protection

Tất cả các trang admin được bảo vệ bởi `AdminRoute` component:

```typescript
// Chỉ user có role 'admin' mới có thể truy cập
<Route path="/admin" element={
  <AdminRoute>
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  </AdminRoute>
} />
```

### Role-based Access Control

Hệ thống hỗ trợ 2 role chính:
- **admin**: Có quyền truy cập tất cả trang admin
- **user**: Không có quyền truy cập admin

### Testing Admin Access

Trong development mode, có Debug Panel ở góc trái dưới để test:

1. **Switch to Admin**: Chuyển sang user admin
2. **Switch to User**: Chuyển sang user thường
3. **Logout**: Đăng xuất

### User Interface

Khi user không có quyền admin truy cập `/admin`:
- Hiển thị trang "Không có quyền truy cập"
- Hiển thị role hiện tại
- Nút "Quay lại" và "Về trang chủ"

## Tích hợp Backend

### API Endpoints

Admin panel đã được tích hợp với backend thật qua các endpoints:

#### Statistics
- `GET /api/v1/admin/stats` - Lấy thống kê tổng quan

#### User Management
- `GET /api/v1/admin/users` - Lấy danh sách users (có phân trang và filter)
- `GET /api/v1/admin/users/{user_id}` - Lấy chi tiết user
- `PUT /api/v1/admin/users/{user_id}` - Cập nhật user
- `DELETE /api/v1/admin/users/{user_id}` - Xóa user

#### Posts Management
- `GET /api/v1/admin/posts` - Lấy danh sách posts (có phân trang và filter)

### Authentication

Tất cả API calls sử dụng JWT token từ localStorage:
```typescript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### Error Handling

- **401 Unauthorized**: Tự động redirect về trang login
- **404 Not Found**: Hiển thị thông báo lỗi
- **500 Server Error**: Hiển thị thông báo lỗi server

### Data Transformation

Backend data được transform để phù hợp với frontend format:

```typescript
// Backend format
{
  id: "uuid",
  email: "user@example.com",
  full_name: "User Name",
  role: "admin",
  is_active: true,
  created_at: "2024-01-01T00:00:00Z"
}

// Frontend format
{
  id: "uuid",
  email: "user@example.com",
  username: "user",
  fullName: "User Name",
  role: "admin",
  status: "active",
  createdAt: Date
}
```

## Cấu trúc thư mục

```
src/
├── components/
│   ├── AdminLayout.tsx          # Layout chính cho admin
│   ├── AdminRoute.tsx           # Bảo vệ admin routes
│   └── DebugPanel.tsx           # Panel test trong development
├── pages/
│   ├── AdminDashboard.tsx       # Trang tổng quan
│   ├── AdminUsers.tsx          # Quản lý người dùng
│   ├── AdminAnalytics.tsx      # Thống kê và báo cáo
│   ├── AdminSettings.tsx       # Cài đặt hệ thống
│   └── AdminPlatforms.tsx      # Quản lý nền tảng
├── services/
│   └── adminApiService.ts      # API service cho admin (backend integration)
├── utils/
│   └── adminUtils.ts           # Utility functions cho admin
└── types/
    └── admin.ts                # TypeScript interfaces
```

## Backend API Structure

### Admin Controller (`/app/controllers/admin_controller.py`)

```python
@router.get("/stats")
async def get_admin_stats():
    # Thống kê tổng quan: users, posts, accounts, platform stats

@router.get("/users")
async def get_admin_users():
    # Danh sách users với filter và pagination

@router.get("/users/{user_id}")
async def get_admin_user_detail():
    # Chi tiết user với stats

@router.put("/users/{user_id}")
async def update_admin_user():
    # Cập nhật thông tin user

@router.delete("/users/{user_id}")
async def delete_admin_user():
    # Xóa user

@router.get("/posts")
async def get_admin_posts():
    # Danh sách posts với filter và pagination
```

### Database Models

- **User**: Thông tin người dùng với role
- **Post**: Bài đăng chính
- **PlatformPost**: Bài đăng trên từng nền tảng
- **SocialAccount**: Tài khoản mạng xã hội

## Cách sử dụng

### 1. Truy cập Admin Panel
- Đăng nhập với tài khoản có role 'admin'
- Truy cập `/admin` để vào dashboard

### 2. Testing với Debug Panel
- Trong development mode, sử dụng Debug Panel để chuyển đổi role
- Test các quyền truy cập khác nhau

### 3. Backend Integration
- Đảm bảo backend server đang chạy trên `http://192.168.1.161:8000'`
- Kiểm tra API endpoints trong Swagger UI: `http://192.168.1.161:8000/docs`

### 4. Error Handling
- Kiểm tra console để debug API errors
- Sử dụng Network tab để xem API calls

## Performance & Security

### Performance
- Lazy loading cho components lớn
- Pagination cho danh sách dài
- Debounced search
- Optimized re-renders

### Security
- JWT token authentication
- Role-based access control
- Protected admin routes
- Input validation
- XSS protection

## Deployment

1. **Backend**: Deploy FastAPI server
2. **Frontend**: Build và deploy static files
3. **Environment**: Cấu hình API URL cho production

## Troubleshooting

### Lỗi thường gặp:
1. **401 Unauthorized**: Kiểm tra JWT token
2. **CORS errors**: Cấu hình CORS trong backend
3. **API not found**: Kiểm tra API endpoints
4. **Role access denied**: Kiểm tra user role

### Debug:
- Sử dụng Debug Panel để test roles
- Kiểm tra Network tab cho API calls
- Console logs trong adminApiService
- Backend logs trong terminal 