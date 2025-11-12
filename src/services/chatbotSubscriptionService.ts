// src/services/chatbotSubscriptionService.ts
import http from '../lib/axios';
import { UserChatbotSubscription, ChatbotPlan } from '../types/chatbotTypes'; // Nên tạo file types

export const chatbotSubscriptionService = {
  // (Dùng cho ChatbotPermissionsPage)
  getAllSubscriptions: (): Promise<UserChatbotSubscription[]> => {
    return http.get<UserChatbotSubscription[]>('/admin/chatbot-subscriptions');
  },

  approveSubscription: (id: string, notes: string | null = null): Promise<UserChatbotSubscription> => {
    return http.post<UserChatbotSubscription>(`/admin/chatbot-subscriptions/${id}/approve`, { notes });
  },

  rejectSubscription: (id: string, notes: string | null = null): Promise<UserChatbotSubscription> => {
    return http.post<UserChatbotSubscription>(`/admin/chatbot-subscriptions/${id}/reject`, { notes });
  },

  deleteSubscription: (id: string): Promise<void> => {
    return http.delete<void>(`/admin/chatbot-subscriptions/${id}`);
  },

  // (Dùng cho trang quản lý Gói cước - SubscriptionPlanPage)
  getAllChatbotPlans: (): Promise<ChatbotPlan[]> => {
    return http.get<ChatbotPlan[]>('/chatbot/plans');
  }
};
