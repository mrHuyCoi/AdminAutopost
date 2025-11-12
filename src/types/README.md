# Types Structure

Thư mục này chứa tất cả các TypeScript interfaces và types được sử dụng trong ứng dụng.

## Files

### `admin.ts`
Chứa các types cho admin panel:
- `AdminUser` - Thông tin user trong admin
- `AdminStats` - Thống kê dashboard
- `AdminNotification` - Thông báo admin
- `AdminLog` - Log hoạt động
- `SystemSettings` - Cài đặt hệ thống
- `AdminFilter` - Bộ lọc
- `AdminPagination` - Phân trang

### `platform.ts`
Chứa các types cho platform management:
- `Platform` - Thông tin nền tảng MXH
- `Account` - Tài khoản MXH
- `SupportedFormats` - Định dạng hỗ trợ

### `pricing.ts`
Chứa các types cho pricing và subscription management:
- `PricingFeature` - Tính năng của gói
- `PricingPlan` - Gói dịch vụ (database model)
- `PricingPlanUI` - Gói dịch vụ với UI styling
- `UserSubscription` - Đăng ký gói của user
- `SubscriptionUsage` - Theo dõi sử dụng
- `PaymentHistory` - Lịch sử thanh toán
- `UserWithSubscription` - User với thông tin subscription

## Database Relationships

### Pricing System Architecture
```
User (1) ←→ (1) UserSubscription (1) ←→ (1) PricingPlan
    ↓              ↓                        ↓
    ↓              ↓                        ↓
SubscriptionUsage  PaymentHistory         Features
```

### PricingPlan (Database Model)
```typescript
interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  popular: boolean;
  discount?: string;
  bonus?: string;
  features: PricingFeature[];
  maxUsers?: number;        // Số user tối đa
  maxPostsPerDay?: number;  // Số bài đăng tối đa/ngày
  maxStorageGB?: number;    // Dung lượng lưu trữ tối đa
  createdAt?: Date;
  updatedAt?: Date;
}
```

### UserSubscription (User-Plan Relationship)
```typescript
interface UserSubscription {
  id: string;
  userId: string;           // FK → User.id
  planId: string;           // FK → PricingPlan.id
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  totalPaid: number;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### SubscriptionUsage (Usage Tracking)
```typescript
interface SubscriptionUsage {
  id: string;
  subscriptionId: string;   // FK → UserSubscription.id
  userId: string;           // FK → User.id
  planId: string;           // FK → PricingPlan.id
  date: Date;
  postsUsed: number;        // Số bài đã đăng hôm nay
  storageUsedGB: number;    // Dung lượng đã sử dụng
  featuresUsed: string[];   // Các tính năng đã sử dụng
  createdAt?: Date;
}
```

### PaymentHistory (Payment Tracking)
```typescript
interface PaymentHistory {
  id: string;
  subscriptionId: string;   // FK → UserSubscription.id
  userId: string;           // FK → User.id
  planId: string;           // FK → PricingPlan.id
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  transactionId?: string;
  paymentDate: Date;
  description?: string;
  createdAt?: Date;
}
```

## Business Logic Examples

### Kiểm tra quyền đăng bài
```typescript
const canUserPost = (user: UserWithSubscription): boolean => {
  if (!user.subscription || user.subscription.status !== 'active') {
    return false;
  }
  
  const plan = user.currentPlan;
  const usage = user.usage;
  
  if (!plan || !usage) return false;
  
  return usage.postsUsed < (plan.maxPostsPerDay || 0);
};
```

### Tính toán dung lượng còn lại
```typescript
const getRemainingStorage = (user: UserWithSubscription): number => {
  const plan = user.currentPlan;
  const usage = user.usage;
  
  if (!plan || !usage) return 0;
  
  return (plan.maxStorageGB || 0) - usage.storageUsedGB;
};
```

## Database Schema (SQL Example)

```sql
-- Pricing Plans
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions
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

-- Subscription Usage
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

## Best Practices

1. **Tách biệt concerns**: Database models không chứa UI styling
2. **Extend interfaces**: UI models extend từ database models
3. **Optional fields**: Sử dụng `?` cho fields không bắt buộc
4. **Consistent naming**: Sử dụng PascalCase cho interfaces
5. **Documentation**: Comment cho complex types
6. **Foreign Keys**: Luôn định nghĩa relationships rõ ràng
7. **Usage Tracking**: Theo dõi sử dụng để enforce limits
8. **Payment History**: Lưu trữ lịch sử thanh toán đầy đủ

## Usage Example

```typescript
import { PricingPlan, PricingPlanUI } from '../types/pricing';

// Database operations
const plan: PricingPlan = {
  id: '1',
  name: 'Basic',
  price: 199000,
  // ... other fields
};

// UI rendering
const planUI: PricingPlanUI = {
  ...plan,
  color: 'border-blue-200',
  bgColor: 'bg-blue-50',
  // ... UI styling
};
``` 