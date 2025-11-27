// src/services/chatbotSubscriptionPlanService.ts
import apiClient from '../lib/axios';

export const chatbotSubscriptionPlanService = {
  getAllPlans: () => apiClient.get('/chatbot-subscriptions/admin/plans'),
  createPlan: (data: any) => apiClient.post('/chatbot-subscriptions/admin/plans', data),
  updatePlan: (id: string, data: any) =>
    apiClient.put(`/chatbot-subscriptions/admin/plans/${id}`, data),
  deletePlan: (id: string) =>
    apiClient.delete(`/chatbot-subscriptions/admin/plans/${id}`),
};
