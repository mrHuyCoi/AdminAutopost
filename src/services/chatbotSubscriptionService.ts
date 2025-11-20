// src/services/chatbotSubscriptionService.ts
import http from '../lib/axios';

export interface ChatbotPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
}

export interface UserChatbotSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date: string;
  total_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: { id: string; email: string; full_name: string };
  plan?: ChatbotPlan;
  admin_notes?: string;
}

const unwrapData = (response: any): any => {
  const data = response?.data;
  if (data?.data) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  if (data) return data;
  return response;
};

export const chatbotSubscriptionService = {
  getAllSubscriptions: async (): Promise<UserChatbotSubscription[]> => {
    const res = await http.get('/chatbot-subscriptions/admin/subscriptions');
    return unwrapData(res);
  },

  // --- FIX LỖI 422 QUAN TRỌNG ---
  // Chuyển admin_id sang Query Params (trên URL) thay vì Body
  approveSubscription: async (
    id: string, 
    adminId: string, 
    notes?: string | null
  ): Promise<UserChatbotSubscription> => {
    // Body chỉ chứa notes (nếu cần)
    const bodyData = { 
        notes: notes,
        // Thêm status phòng khi backend cần trong body
        status: 'approved' 
    };
    
    // QUAN TRỌNG: params sẽ tạo ra url dạng .../approve?admin_id=...
    const res = await http.post(
        `/chatbot-subscriptions/admin/subscriptions/${id}/approve`, 
        bodyData, 
        { 
            params: { admin_id: adminId } // <-- Gửi admin_id ở đây
        }
    );
    return unwrapData(res);
  },

  rejectSubscription: async (
    id: string, 
    adminId: string, 
    notes: string
  ): Promise<UserChatbotSubscription> => {
    const bodyData = {
        notes: notes,
        status: 'rejected'
    };
    
    const res = await http.post(
        `/chatbot-subscriptions/admin/subscriptions/${id}/reject`, 
        bodyData,
        { 
            params: { admin_id: adminId } // <-- Gửi admin_id ở đây
        }
    );
    return unwrapData(res);
  },

  deleteSubscription: async (id: string): Promise<void> => {
    await http.delete(`/chatbot-subscriptions/admin/subscriptions/${id}`);
  },

  getAllChatbotPlans: async (): Promise<ChatbotPlan[]> => {
    const res = await http.get('/chatbot-subscriptions/plans');
    return unwrapData(res);
  }
};
