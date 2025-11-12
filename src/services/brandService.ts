// src/services/brandService.ts
import http from '../lib/axios';
import { Brand } from '../types/brand'; // (Bạn cần tạo file type này)
import { PaginatedResponse } from '../types/response';

const API_BRANDS = '/brands';

export const brandService = {
  getAllBrands: (page: number = 1, limit: number = 100): Promise<PaginatedResponse<Brand>> => {
    return http.get<PaginatedResponse<Brand>>(API_BRANDS, {
      params: { skip: (page - 1) * limit, limit: limit }
    });
  },
  createBrand: (data: { name: string, description?: string }): Promise<Brand> => {
    return http.post<Brand>(API_BRANDS, data);
  },
  updateBrand: (id: string, data: { name: string, description?: string }): Promise<Brand> => {
    return http.put<Brand>(`${API_BRANDS}/${id}`, data);
  },
  deleteBrand: (id: string): Promise<void> => {
    return http.delete<void>(`${API_BRANDS}/${id}`);
  }
};