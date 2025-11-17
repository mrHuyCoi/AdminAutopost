// src/services/userConfigService.ts
import api from '../lib/axios';
import toast from 'react-hot-toast';

// Interface cho System Prompt / Persona
export interface ConfigPayload {
  value: string;
}

// Interface cho API Keys (Hệ thống)
export interface SystemApiKeys {
  gemini_api_key?: string;
  openai_api_key?: string;
}

// Interface cho API Key (Cá nhân)
export interface UserApiKey {
  api_key: string;
}

// Hàm trợ giúp để bóc tách dữ liệu
const unwrapData = (response: any): any => {
  if (response.data && response.data.data) {
    return response.data.data;
  }
  if (response.data) {
    return response.data;
  }
  return response;
};

export const userConfigService = {
  // === Persona ===
  getPersona: async (): Promise<string> => {
    const res = await api.get<any>('/user-config/persona');
    const data = unwrapData(res);
    return data.value || '';
  },
  setPersona: (value: string) => {
    return api.put('/user-config/persona', { value });
  },

  // === Prompt ===
  getPrompt: async (): Promise<string> => {
    const res = await api.get<any>('/user-config/prompt');
    const data = unwrapData(res);
    return data.value || '';
  },
  setPrompt: (value: string) => {
    return api.put('/user-config/prompt', { value });
  },
  
  // === System API Keys (Gemini/OpenAI) ===
  // SỬA: Thêm các hàm bị thiếu
  getApiKeys: async (): Promise<SystemApiKeys> => {
    const res = await api.get<any>('/users/me/api-key');
    const data = unwrapData(res);
    return {
      gemini_api_key: data.gemini_api_key || '',
      openai_api_key: data.openai_api_key || ''
    };
  },
  setApiKeys: (keys: SystemApiKeys) => {
    return api.put('/users/me/api-key', keys);
  },

  // === User API Key (Cá nhân) ===
  // (Hàm này dùng cho file SettingsPage cũ, nhưng vẫn giữ lại)
  getApiKey: async (): Promise<string> => {
    const res = await api.get<any>('/users/me/api-key');
    const data = unwrapData(res);
    return data.api_key || ''; // Trả về chuỗi
  },
  regenerateApiKey: async (): Promise<string> => {
    const res = await api.put<any>('/users/me/api-key', {}); 
    const data = unwrapData(res);
    return data.api_key || '';
  },
};