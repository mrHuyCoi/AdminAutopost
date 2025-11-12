# Services Architecture

Tài liệu này mô tả cách sử dụng các service trong ứng dụng và cách chuyển đổi từ mock data sang API thật.

## Services Overview

### 1. `pricingService.ts`
Service quản lý tất cả các hoạt động liên quan đến pricing và subscriptions.

#### Các chức năng chính:
- **Pricing Plans Management**: CRUD operations cho các gói dịch vụ
- **User Subscriptions**: Quản lý đăng ký gói của người dùng
- **Usage Tracking**: Theo dõi sử dụng dịch vụ
- **Payment History**: Lịch sử thanh toán
- **Statistics**: Thống kê tổng quan

#### Cách sử dụng:
```typescript
import { pricingService } from '../services/pricingService';

// Lấy danh sách gói
const plans = await pricingService.getPlans();

// Tạo gói mới
const newPlan = await pricingService.createPlan({
  name: 'Premium',
  price: 299000,
  period: '/ tháng',
  description: 'Gói cao cấp',
  popular: false,
  features: [...]
});

// Lấy subscription của user
const subscription = await pricingService.getCurrentSubscription('user_id');

// Cập nhật usage
await pricingService.updateUsage({
  userId: 'user_id',
  postsUsed: 5,
  storageUsedGB: 2.5
});
```

### 2. `adminApiService.ts`
Service cho admin panel, kết nối với backend API.

#### Các chức năng chính:
- **User Management**: Quản lý người dùng
- **Statistics**: Thống kê dashboard
- **Platform Management**: Quản lý nền tảng MXH
- **Settings**: Cài đặt hệ thống

## Chuyển đổi từ Mock Data sang API thật

### Bước 1: Cập nhật Base URL
```typescript
// Trong pricingService.ts
private baseUrl = 'https://your-api-domain.com/api/v1/pricing';
```

### Bước 2: Thay thế Mock Data
```typescript
// Thay vì:
return new Promise((resolve) => {
  setTimeout(() => resolve([...mockPlans]), 500);
});

// Sử dụng:
const response = await fetch(`${this.baseUrl}/plans`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
return response.json();
```

### Bước 3: Error Handling
```typescript
async getPlans(): Promise<PricingPlan[]> {
  try {
    const response = await fetch(`${this.baseUrl}/plans`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }
}
```

## API Endpoints Structure

### Pricing Plans
```
GET    /api/v1/pricing/plans              # Lấy danh sách gói
GET    /api/v1/pricing/plans/{id}         # Lấy gói theo ID
POST   /api/v1/pricing/plans              # Tạo gói mới
PUT    /api/v1/pricing/plans/{id}         # Cập nhật gói
DELETE /api/v1/pricing/plans/{id}         # Xóa gói
```

### User Subscriptions
```
GET    /api/v1/pricing/users/{id}/subscriptions     # Lấy subscriptions của user
GET    /api/v1/pricing/users/{id}/subscriptions/current  # Lấy subscription hiện tại
POST   /api/v1/pricing/subscriptions               # Tạo subscription mới
PUT    /api/v1/pricing/subscriptions/{id}          # Cập nhật subscription
DELETE /api/v1/pricing/subscriptions/{id}          # Xóa subscription
```

### Usage Tracking
```
GET    /api/v1/pricing/users/{id}/usage            # Lấy usage data
PUT    /api/v1/pricing/usage                       # Cập nhật usage
```

### Payment History
```
GET    /api/v1/pricing/users/{id}/payments         # Lấy lịch sử thanh toán
POST   /api/v1/pricing/payments                    # Tạo payment record
```

### Statistics
```
GET    /api/v1/pricing/stats                       # Thống kê tổng quan
```

## Database Schema (Tham khảo)

### Pricing Plans Table
```sql
CREATE TABLE pricing_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  period VARCHAR(20) NOT NULL,
  description TEXT,
  popular BOOLEAN DEFAULT FALSE,
  discount VARCHAR(50),
  bonus VARCHAR(100),
  max_users INT,
  max_posts_per_day INT,
  max_storage_gb DECIMAL(5,2),
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### User Subscriptions Table
```sql
CREATE TABLE user_subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  status ENUM('active', 'expired', 'cancelled', 'pending') DEFAULT 'pending',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  last_payment_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  total_paid DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);
```

### Subscription Usage Table
```sql
CREATE TABLE subscription_usage (
  id VARCHAR(36) PRIMARY KEY,
  subscription_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  posts_used INT DEFAULT 0,
  storage_used_gb DECIMAL(5,2) DEFAULT 0,
  features_used JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (plan_id) REFERENCES pricing_plans(id)
);
```

## Testing với Mock Data

### Tạo Mock Data
```typescript
// Trong pricingService.ts
const mockPlans: PricingPlan[] = [
  {
    id: '1',
    name: 'Basic',
    price: 199000,
    period: '/ tháng',
    description: 'Gói cơ bản',
    popular: false,
    features: [...]
  }
];
```

### Simulate API Delay
```typescript
return new Promise((resolve) => {
  setTimeout(() => resolve([...mockPlans]), 500); // 500ms delay
});
```

## Best Practices

### 1. Error Handling
```typescript
try {
  const data = await service.getData();
  return data;
} catch (error) {
  console.error('Service error:', error);
  throw new Error('Failed to fetch data');
}
```

### 2. Loading States
```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await service.getData();
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);
```

### 3. Type Safety
```typescript
// Luôn định nghĩa types rõ ràng
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Sử dụng trong service
async getPlans(): Promise<ApiResponse<PricingPlan[]>> {
  const response = await fetch(`${this.baseUrl}/plans`);
  return response.json();
}
```

### 4. Authentication
```typescript
private async makeRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${this.baseUrl}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
```

## Migration Checklist

- [ ] Cập nhật base URL trong tất cả services
- [ ] Thay thế mock data bằng API calls
- [ ] Thêm error handling
- [ ] Thêm loading states
- [ ] Test tất cả CRUD operations
- [ ] Kiểm tra authentication
- [ ] Validate response formats
- [ ] Test error scenarios
- [ ] Update documentation

## Troubleshooting

### Common Issues

1. **CORS Error**: Đảm bảo backend cho phép CORS từ frontend domain
2. **Authentication Error**: Kiểm tra token format và expiration
3. **Data Format Mismatch**: Đảm bảo API response format khớp với TypeScript interfaces
4. **Network Error**: Kiểm tra network connectivity và API availability

### Debug Tips

```typescript
// Log API requests
console.log('API Request:', `${this.baseUrl}${endpoint}`, options);

// Log API responses
console.log('API Response:', response);

// Log errors
console.error('Service Error:', error);
``` 