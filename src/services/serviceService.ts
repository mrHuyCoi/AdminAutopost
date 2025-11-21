import http from '../lib/axios';
import { Service } from '../types/service';

const API_SERVICES = '/services';

export const serviceService = {
  
  /**
   * Lấy danh sách services (đã sửa để khớp với BE)
   * BE yêu cầu: page, limit, search
   */
  getAllServices: async (
    skip: number, 
    limit: number = 100,
    search: string = ''
  ): Promise<any> => {
    try {
      // ⭐ FIX PHÂN TRANG: Convert skip → page
      const page = Math.floor(skip / limit) + 1;

      const params: any = {
        page: page,   // BE nhận đúng param này
        limit: limit,
        search: search
      };
      
      console.log('🚀 [serviceService] Gọi API Get All Services với params:', params);

      const response = await http.get(API_SERVICES, { params });
      console.log("🚀 SERVICE API RESPONSE:", response.data);

      return response.data;

    } catch (error: any) {
      console.error('❌ [serviceService] Lỗi khi gọi getAllServices:', error);
      throw error;
    }
  },

  // Lấy service theo ID
  getServiceById: async (id: string): Promise<Service> => {
    const response = await http.get(`${API_SERVICES}/${id}`);
    return response.data.data || response.data;
  },

  // Tạo service mới
  createService: async (data: any): Promise<Service> => {
    const response = await http.post(API_SERVICES, data);
    return response.data.data || response.data;
  },

  // Cập nhật service
  updateService: async (id: string, data: any): Promise<Service> => {
    const response = await http.put(`${API_SERVICES}/${id}`, data);
    return response.data.data || response.data;
  },

  // Xóa service
  deleteService: async (id: string): Promise<void> => {
    await http.delete(`${API_SERVICES}/${id}`);
  },

  // Lấy services đã xóa hôm nay
  getDeletedServicesToday: async (): Promise<Service[]> => {
    const response = await http.get(`${API_SERVICES}/deleted-today`);
    return response.data.data || response.data || [];
  },

  // Khôi phục service
  restoreService: async (id: string): Promise<void> => {
    await http.post(`${API_SERVICES}/${id}/restore`, {});
  },

  // Khôi phục tất cả services đã xóa hôm nay
  restoreAllDeletedServicesToday: async (): Promise<void> => {
    await http.post(`${API_SERVICES}/restore-all-today`, {});
  },

  /**
   * Xóa nhiều services
   */
  bulkDeleteServices: async (ids: string[]): Promise<void> => {
    await http.delete(`${API_SERVICES}/bulk`, { 
      data: ids
    });
  }
};
