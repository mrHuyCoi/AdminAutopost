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

// Cải thiện unwrapData để xử lý mọi format
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

  // SỬA LỖI 422: Thêm adminId và gửi approved_by_id
  approveSubscription: async (
    id: string, 
    adminId: string, // <-- THÊM ĐỐI SỐ adminId
    notes?: string | null
  ): Promise<UserChatbotSubscription> => {
    // Gửi Admin ID và Ghi chú đi trong Request Body
    const payload = { 
        approved_by_id: adminId, 
        ...(notes && { admin_notes: notes }) // Giả định Backend dùng trường 'admin_notes'
    };
    const res = await http.post(`/chatbot-subscriptions/admin/subscriptions/${id}/approve`, payload);
    return unwrapData(res);
  },

  // SỬA LỖI 422: Thêm adminId và gửi rejected_by_id
  rejectSubscription: async (
    id: string, 
    adminId: string, // <-- THÊM ĐỐI SỐ adminId
    notes: string
  ): Promise<UserChatbotSubscription> => {
    // Gửi Admin ID và Ghi chú từ chối
    const payload = {
        rejected_by_id: adminId, 
        admin_notes: notes // Ghi chú từ chối là bắt buộc trong Frontend
    };
    const res = await http.post(`/chatbot-subscriptions/admin/subscriptions/${id}/reject`, payload);
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
