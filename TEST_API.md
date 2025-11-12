# Test API Chatbot Subscriptions

## Các bước test

### 1. Khởi động backend
```bash
cd dangbaitudong
python main.py
```

### 2. Lấy token admin
```bash
# Đăng nhập để lấy token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@example.com&password=password"
```

### 3. Test các endpoints

#### Test Services
```bash
# Lấy danh sách services
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tạo service mới
curl -X POST "http://localhost:8000/api/v1/chatbot-subscriptions/admin/services" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tư vấn sản phẩm",
    "description": "Hỗ trợ tư vấn về sản phẩm điện tử",
    "base_price": 50000
  }'
```

#### Test Plans
```bash
# Lấy danh sách plans
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/plans" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tạo plan mới
curl -X POST "http://localhost:8000/api/v1/chatbot-subscriptions/admin/plans" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gói Cơ bản",
    "description": "Gói cước cơ bản cho người mới bắt đầu",
    "monthly_price": 100000,
    "service_ids": ["SERVICE_ID_1"]
  }'
```

#### Test Subscriptions
```bash
# Lấy danh sách subscriptions
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/subscriptions" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Tạo subscription mới
curl -X POST "http://localhost:8000/api/v1/chatbot-subscriptions/admin/subscriptions" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "PLAN_ID_1",
    "months_subscribed": 3
  }'
```

#### Test Permissions
```bash
# Lấy danh sách permissions
curl -X GET "http://localhost:8000/api/v1/chatbot-subscriptions/admin/permissions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Kết quả mong đợi

### Services
- `GET /admin/services` → 200 OK với danh sách services
- `POST /admin/services` → 201 Created với service mới

### Plans
- `GET /admin/plans` → 200 OK với danh sách plans
- `POST /admin/plans` → 201 Created với plan mới

### Subscriptions
- `GET /admin/subscriptions` → 200 OK với danh sách subscriptions
- `POST /admin/subscriptions` → 201 Created với subscription mới

### Permissions
- `GET /admin/permissions` → 200 OK với empty list (tạm thời)

## Troubleshooting

### Lỗi 401 Unauthorized
- Kiểm tra token có đúng format không
- Kiểm tra user có role admin không
- Kiểm tra token có hết hạn không

### Lỗi 500 Internal Server Error
- Kiểm tra logs backend
- Kiểm tra database connection
- Kiểm tra models và relationships

### Lỗi 404 Not Found
- Kiểm tra URL endpoint
- Kiểm tra router đã được đăng ký chưa 