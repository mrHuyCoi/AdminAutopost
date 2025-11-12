// --- Từ chatbot_service_dto.py ---
export interface ChatbotService {
  id: string; // uuid
  name: string;
  description: string | null;
  base_price: number;
  created_at: string | null;
  updated_at: string | null;
}

// --- Từ chatbot_plan_dto.py ---
export interface ChatbotPlan {
  id: string; // uuid
  name: string;
  description: string | null;
  monthly_price: number;
  services: ChatbotService[]; // Dữ liệu lồng nhau
  created_at: string | null;
  updated_at: string | null;
}

// --- Từ user_chatbot_subscription_dto.py ---
// Hình dáng User cơ bản
interface UserBasicInfo {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

// Hình dáng "Lượt đăng ký" (để hiển thị trong bảng)
export interface UserChatbotSubscription {
  id: string; // uuid
  user_id: string;
  user: UserBasicInfo | null;
  plan: ChatbotPlan; // Dữ liệu lồng nhau
  start_date: string;
  end_date: string;
  months_subscribed: number;
  total_price: number;
  is_active: boolean;
  status: 'pending' | 'approved' | 'rejected'; // Trạng thái
  created_at: string | null;
  updated_at: string | null;
}

// Hình dáng JSON GỬI ĐI khi Phê duyệt/Từ chối
export interface SubscriptionApproval {
  status: 'approved' | 'rejected';
  notes: string | null;
}