// src/services/chatbotService.ts
import api from '../lib/axios';

// Interface cho tin nhắn chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

// Interface cho API chat
interface ChatRequest {
  message: string;
  thread_id?: string | null;
}

interface ChatResponse {
  reply: string;
  thread_id: string;
  // (API của bạn có thể trả về thêm)
}

// Interface cho API lịch sử
interface HistoryResponse {
  messages: ChatMessage[];
}

export const chatbotService = {
  /**
   * Gửi tin nhắn đến chatbot
   */
  sendMessage: (message: string, thread_id: string | null) => {
    const payload: ChatRequest = {
      message: message,
      thread_id: thread_id || undefined,
    };
    return api.post<ChatResponse>('/chatbot/chat', payload);
  },

  /**
   * Lấy lịch sử của 1 thread
   */
  getChatHistory: (thread_id: string) => {
    return api.get<HistoryResponse>(`/chatbot/chat-history/${thread_id}`);
  },

  /**
   * Xóa lịch sử (API của bạn có vẻ xóa tất cả?)
   */
  clearHistory: () => {
    return api.post('/chatbot/clear-history-chat');
  },
};