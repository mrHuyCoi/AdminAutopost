// src/services/userService.ts
import http from '../lib/axios'; // Dùng http helper đã chuẩn hóa
import { ApiKeyData, SystemPromptData, User } from '../types/userTypes'; // Nên tạo file types

export const userService = {
  
  // === Chỉ giữ lại các hàm cho /users/me ===

  // Current User Profile
  getCurrentUser: (): Promise<User> => {
    return http.get<User>('/users/me');
  },

  // API Keys Management (Dùng cho ChatbotPage)
  getApiKeys: (): Promise<ApiKeyData> => {
    return http.get<ApiKeyData>('/users/me/api-keys');
  },

  updateApiKeys: (data: ApiKeyData): Promise<ApiKeyData> => {
    return http.put<ApiKeyData>('/users/me/api-keys', data);
  },

  // System Prompt Management (Dùng cho ChatbotPage)
  getSystemPrompt: (): Promise<SystemPromptData> => {
    return http.get<SystemPromptData>('/users/me/system-prompt');
  },

  updateSystemPrompt: (data: SystemPromptData): Promise<SystemPromptData> => {
    return http.put<SystemPromptData>('/users/me/system-prompt', data);
  }
};