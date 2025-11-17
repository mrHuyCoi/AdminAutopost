// src/services/subscriptionPlanService.ts
import apiClient from '../lib/axios';
import { SubscriptionPlan, SubscriptionPlanCreate, SubscriptionPlanUpdate } from '../types/subscriptionPlan';

export const subscriptionPlanService = {
  // Lấy tất cả gói
  getAllPlans: async (): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get('/subscriptions/plans');
    return response.data;
  },

  // Tạo gói mới
  createPlan: async (data: SubscriptionPlanCreate): Promise<SubscriptionPlan> => {
    const response = await apiClient.post('/subscriptions/plans', data);
    return response.data;
  },

  // Cập nhật gói
  updatePlan: async (id: string, data: SubscriptionPlanUpdate): Promise<SubscriptionPlan> => {
    const response = await apiClient.put(`/subscriptions/plans/${id}`, data);
    return response.data;
  },

  // Xóa gói
  deletePlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/subscriptions/plans/${id}`);
  },
};