// src/services/userService.ts
import apiClient from '../lib/axios';

// ========== USER ADMIN TYPES & SERVICES ==========
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export const userService = {
  // -------- USER (ADMIN) --------
  getUsers: async (): Promise<User[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },

  updateUser: async (id: string, data: { is_active: boolean }): Promise<User> => {
    const response = await apiClient.put(`/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/users/${id}`);
  },

  // ========== CHATBOT SETTINGS & CHAT ==========
  // --- API KEY ---
  getApiKeys: async (): Promise<ApiKeyData> => {
    const response = await apiClient.get('/chatbot/api-keys');
    return response.data;
  },

  updateApiKeys: async (data: ApiKeyData): Promise<void> => {
    await apiClient.put('/chatbot/api-keys', data);
  },

  // --- SYSTEM PROMPT ---
  getSystemPrompt: async (): Promise<SystemPromptData> => {
    const response = await apiClient.get('/chatbot/system-prompt');
    return response.data;
  },

  updateSystemPrompt: async (data: SystemPromptData): Promise<void> => {
    await apiClient.put('/chatbot/system-prompt', data);
  },

  // --- CHAT ---
  sendChatMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    const response = await apiClient.post('/chatbot/chat', data);
    return response.data;
  },
};

// ========== TYPES ==========
export interface ApiKeyData {
  gemini_api_key?: string | null;
  openai_api_key?: string | null;
}

export interface SystemPromptData {
  custom_system_prompt?: string | null;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string | null;
}

export interface ChatResponse {
  reply: string;
  conversation_id?: string | null;
}
