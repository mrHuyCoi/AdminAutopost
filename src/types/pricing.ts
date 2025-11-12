
// --- 1. Định nghĩa Tính năng ---
export interface PricingFeature {
  id: string;
  name: string;
  value: string;
  note?: string;
}

// --- 2. Định nghĩa Gói cước (Plan) ---
export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string; // Hiển thị (VD: "/ tháng")
  duration_days?: number; // Logic (VD: 30)
  description: string;
  popular: boolean;
  discount?: string;
  bonus?: string;
  features: PricingFeature[];
  maxUsers?: number;
  maxPostsPerDay?: number;
  maxStorageGB?: number;
  
  // Các trường từ subscriptionPlan.ts
  max_videos_per_day?: number;
  max_scheduled_days?: number;
  max_stored_videos?: number;
  storage_limit_gb?: number;
  max_social_accounts?: number;
  ai_content_generation?: boolean;
  is_active?: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

// Kiểu GỬI ĐI (từ subscriptionPlan.ts)
export interface SubscriptionPlanCreate {
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_videos_per_day: number;
  max_scheduled_days: number;
  max_stored_videos: number;
  storage_limit_gb: number;
  max_social_accounts: number;
  ai_content_generation: boolean;
  is_active: boolean;
}
export type SubscriptionPlanUpdate = Partial<SubscriptionPlanCreate>;


// --- 3. Định nghĩa Lượt đăng ký (User Subscription) ---

// Hình dáng User cơ bản
interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string; // (từ pricing.ts)
  user_id?: string; // (từ userSubscription.ts)
  planId: string; // (từ pricing.ts)
  subscription_id?: string; // (từ userSubscription.ts)
  
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date | string; // (Hỗ trợ cả hai)
  endDate: Date | string | null; // (Hỗ trợ cả hai)
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date | string;
  nextPaymentDate?: Date | string | null;
  totalPaid: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Thông tin lồng nhau
  user?: UserBasicInfo | null;
  subscription_plan?: PricingPlan | null; // (Dùng PricingPlan)

  // Trường hiển thị (từ pricing.ts)
  userName?: string;
  userEmail?: string;
  planName?: string;
  planPrice?: number;
  planPeriod?: string;
}

// --- 4. Định nghĩa Sử dụng (Usage) ---
export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;
  userId: string;
  planId: string;
  date: Date;
  postsUsed: number;
  storageUsedGB: number;
  featuresUsed: string[];
  createdAt?: Date;
}

// --- 5. Định nghĩa Lịch sử Thanh toán ---
export interface PaymentHistory {
  id: string;
  subscriptionId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  transactionId?: string;
  paymentDate: Date;
  description?: string;
  createdAt?: Date;
}

// --- 6. Kiểu Giao diện (UI) ---
export interface PricingPlanUI extends PricingPlan {
  color: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  gradient: string;
  icon: string;
}

// --- 7. Kiểu Hợp nhất (Combined) ---
export interface UserWithSubscription {
  id: string;
  email: string;
  fullName: string;
  subscription?: UserSubscription;
  currentPlan?: PricingPlan;
  usage?: SubscriptionUsage;
  isActive: boolean;
  canPost: boolean;
  remainingPosts: number;
  remainingStorage: number;
}