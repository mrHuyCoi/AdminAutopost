// src/services/adminService.ts
import http from '../lib/axios';
import { AdminStats, UserSubscriptionResponse, User } from '../types/adminTypes'; // Nên tạo file types

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminService = {
  // Users Management (Dùng cho UserManagementPage)
  getUsers: (page: number = 1, limit: number = 10, search: string = ''): Promise<Paginated<User>> => {
    return http.get<Paginated<User>>('/admin/users', {
      params: { page, limit, search }
    });
  },

  getStats: (): Promise<AdminStats> => {
    return http.get<AdminStats>('/admin/stats');
  },

  createUser: (userData: any): Promise<User> => {
    return http.post<User>('/admin/users', userData);
  },

  updateUser: (userId: string, userData: any): Promise<User> => {
    return http.put<User>(`/admin/users/${userId}`, userData);
  },

  deleteUser: (userId: string): Promise<void> => {
    return http.delete<void>(`/admin/users/${userId}`);
  },

  // User Subscriptions Management (Dùng cho NewRegistrationsPage)
  getUserSubscriptions: (page: number = 1, limit: number = 10, status?: string): Promise<Paginated<UserSubscriptionResponse>> => {
    return http.get<Paginated<UserSubscriptionResponse>>('/admin/user-subscriptions', {
      params: { page, limit, status }
    });
  },

  approveUserSubscription: (subscriptionId: string): Promise<UserSubscriptionResponse> => {
    return http.post<UserSubscriptionResponse>(`/admin/user-subscriptions/${subscriptionId}/approve`);
  },

  rejectUserSubscription: (subscriptionId: string): Promise<UserSubscriptionResponse> => {
    return http.post<UserSubscriptionResponse>(`/admin/user-subscriptions/${subscriptionId}/reject`);
  },

  deleteUserSubscription: (subscriptionId: string): Promise<void> => {
    return http.delete<void>(`/admin/user-subscriptions/${subscriptionId}`);
  }
};