// src/types/userSubscription.ts
import { SubscriptionPlan } from './subscriptionPlan'; // Tái sử dụng

// Hình dáng User cơ bản (từ DTO)
interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

// Hình dáng "Lượt đăng ký" (từ DTO: SubscriptionRead)
export interface UserSubscription {
  id: string; // ID của chính lượt đăng ký
  user_id: string;
  subscription_id: string; // ID của gói cước
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Thông tin lồng nhau
  user?: UserBasicInfo | null;
  subscription_plan?: SubscriptionPlan | null;
}