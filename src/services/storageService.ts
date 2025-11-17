// src/services/storageService.ts
import apiClient from '../lib/axios';

// =============================
// CẤU TRÚC DỮ LIỆU
// =============================
export interface StorageItem {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  uploaded_at: string;
  user_id: string;
  url?: string; // URL tải file (nếu backend trả về)
}

// =============================
// SERVICE: QUẢN LÝ FILE TRONG STORAGE
// =============================
export const storageService = {
  /**
   * LẤY TẤT CẢ FILE CỦA USER
   */
  getAll: async (): Promise<StorageItem[]> => {
    const response = await apiClient.get('/storage');
    return response.data;
  },

  /**
   * XÓA FILE THEO ID
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/storage/${id}`);
  },

  /**
   * UPLOAD FILE MỚI
   */
  upload: async (file: File): Promise<StorageItem> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * LẤY FILE THEO ID (TÙY CHỌN)
   */
  getById: async (id: string): Promise<StorageItem> => {
    const response = await apiClient.get(`/storage/${id}`);
    return response.data;
  },

  /**
   * TẢI FILE (TRẢ VỀ BLOB URL)
   */
  download: async (id: string): Promise<string> => {
    const response = await apiClient.get(`/storage/${id}/download`, {
      responseType: 'blob',
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    return url;
  },
};

// CHỈ EXPORT 1 LẦN → KHÔNG LỖI "Multiple exports"
// → Không cần: export { storageService };