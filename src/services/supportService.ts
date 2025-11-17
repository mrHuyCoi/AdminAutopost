// src/services/supportService.ts
import http from '../lib/axios';

/**
 * Kiểu dữ liệu cho payload khi gửi yêu cầu hỗ trợ.
 */
export interface SupportRequestPayload {
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  // Backend có thể tự lấy email từ token xác thực của người dùng
}

const API_SUPPORT = '/support-requests'; // Giả định endpoint API

export const supportService = {
  /**
   * Gửi một yêu cầu hỗ trợ mới đến server.
   */
  sendSupportRequest: (data: SupportRequestPayload): Promise<{ message: string }> => {
    return http.post<{ message: string }>(API_SUPPORT, data);
  },
};
