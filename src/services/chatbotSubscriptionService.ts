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

  approveSubscription: async (
    id: string, 
    adminId: string, 
    notes?: string | null
  ): Promise<UserChatbotSubscription> => {
    const payload = { 
        notes: notes,
        status: 'approved' // Thêm trường này cho chắc chắn
    };
    
    const res = await http.post(
        `/chatbot-subscriptions/admin/subscriptions/${id}/approve`, 
        payload, 
        { params: { admin_id: adminId } } 
    );
    return unwrapData(res);
  },

  rejectSubscription: async (
    id: string, 
    adminId: string, 
    notes: string
  ): Promise<UserChatbotSubscription> => {
    const payload = {
        notes: notes,
        status: 'rejected'
    };
    
    const res = await http.post(
        `/chatbot-subscriptions/admin/subscriptions/${id}/reject`, 
        payload,
        { params: { admin_id: adminId } }
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
