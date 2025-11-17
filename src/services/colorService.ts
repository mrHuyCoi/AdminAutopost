// src/services/colorService.ts
import http from '../lib/axios';
import { Color } from '../types/deviceTypes';

const API_COLORS = '/colors';

export interface ColorResponse {
  data: Color[];           // ← data ở đây
  total: number;
  totalPages: number;
  message?: string;
  status_code?: number;
  pagination?: any;
}

// src/services/colorService.ts
export const colorService = {
  getAllColors: async (): Promise<ColorResponse> => {
    const response = await http.get<any>(API_COLORS);
    const apiData = response.data;

    // BỔ SUNG: Nếu data là object → bọc thành array
    const items = Array.isArray(apiData.data) 
      ? apiData.data 
      : apiData.data 
        ? [apiData.data] 
        : [];

    return {
      data: items,
      total: apiData.total ?? items.length,
      totalPages: apiData.totalPages ?? 1,
    };
  },

  createColor: async (data: { name: string; hex_code?: string }): Promise<Color> => {
    const response = await http.post<any>(API_COLORS, data);
    return response.data.data; // ← object
  },

  updateColor: async (id: string, data: { name: string; hex_code?: string }): Promise<Color> => {
    const response = await http.put<any>(`${API_COLORS}/${id}/`, data);
    return response.data.data;
  },

  deleteColor: async (id: string): Promise<void> => {
    await http.delete(`${API_COLORS}/${id}/`);
  },
};