// src/services/brandService.ts
import http from '../lib/axios';
import { Brand } from '../types/brand'; // Đảm bảo bạn có file type này
import { PaginatedResponse, ResponseModel } from '../types/response';
import toast from 'react-hot-toast';

const API_URL = '/brands';

/**
 * SỬA: Interface này phải khớp với DTO 'BrandCreate'
 * (service_id là bắt buộc)
 */
export interface BrandPayload {
  service_id: string;
  name?: string | null;
  note?: string | null;
  warranty?: string | null;
  device_brand_id?: string | null;
  price?: string | null;
  wholesale_price?: string | null;
  device_type?: string | null;
  color?: string | null;
  // Sửa: Thêm service_code để fix lỗi 422
  service_code?: string | null;
}

// Hàm trợ giúp bóc tách
const unwrapData = (response: any): any => {
  if (response.data && response.data.data) {
    return response.data.data; 
  }
  if (response.data && Array.isArray(response.data.items)) {
     // API /brands trả về { data: [], metadata: {...} }
     return { 
       data: response.data.items, 
       metadata: response.data.metadata 
     };
  }
   if (response.data) {
    return response.data;
  }
  return response;
};

export const brandService = {
  
  /**
   * Lấy danh sách brands (khớp với server-side pagination)
   */
  getAllBrands: async (
    skip: number, 
    limit: number = 10,
    search: string = ''
  ): Promise<PaginatedResponse<Brand>> => { // Sửa: Trả về PaginatedResponse
    try {
      const params = { skip, limit, search };
      const response = await http.get<any>(API_URL, { params });
      
      // SỬA: Logic bóc tách metadata
      const data = response.data.data || [];
      const metadata = response.data.metadata || {};
      
      return {
        items: data,
        total: metadata.total || data.length,
        page: (skip / limit) + 1,
        totalPages: metadata.total_pages || 1
      };
    } catch (error: any) {
      console.error('❌ [brandService] Lỗi khi gọi getAllBrands:', error);
      toast.error('Không thể tải danh sách thương hiệu linh kiện');
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  },

  /**
   * Tạo brand mới
   */
  createBrand: async (data: BrandPayload): Promise<Brand> => {
    // SỬA: Thêm service_code ngẫu nhiên để tránh lỗi UniqueViolationError
    const payload = {
      ...data,
      service_code: `BR-${Date.now().toString().slice(-6)}`
    }
    const response = await http.post(API_URL, payload);
    return unwrapData(response);
  },

  /**
   * Cập nhật brand
   */
  updateBrand: async (id: string, data: Partial<BrandPayload>): Promise<Brand> => {
    const response = await http.put(`${API_URL}/${id}`, data);
    return unwrapData(response);
  },

  /**
   * Xóa brand
   */
  deleteBrand: async (id: string): Promise<void> => {
    await http.delete(`${API_URL}/${id}`);
  },

  // ... (Các hàm khác giữ nguyên) ...
  
  getBrandById: async (id: string): Promise<Brand> => {
    const response = await http.get(`${API_URL}/${id}`);
    return response.data.data;
  },

  importBrands: async (formData: FormData): Promise<{ imported_count: number }> => {
    const response = await http.post(`${API_URL}/import`, formData);
    return response.data;
  },

  exportBrands: async (): Promise<Blob> => {
    const response = await http.get(`${API_URL}/export`, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportBrandTemplate: async (): Promise<Blob> => {
    const response = await http.get(`${API_URL}/export-template`, {
      responseType: 'blob'
    });
    return response.data;
  },

  getDeletedBrandsToday: async (): Promise<Brand[]> => {
    const response = await http.get(`${API_URL}/deleted-today`);
    return response.data.data || [];
  },

  restoreBrand: async (id: string): Promise<void> => {
    await http.post(`${API_URL}/${id}/restore`);
  },

  restoreAllDeletedBrandsToday: async (): Promise<void> => {
    await http.post(`${API_URL}/restore-all-today`);
  },

  getUniqueBrandNamesForService: async (serviceId: string): Promise<string[]> => {
    const response = await http.get(`${API_URL}/unique-names/${serviceId}`);
    return response.data.data || [];
  }
};