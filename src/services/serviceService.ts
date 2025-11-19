import http from '../lib/axios';
import { Service } from '../types/service';

const API_SERVICES = '/services';

export const serviceService = {
  
  /**
   * Lấy danh sách services (đã sửa để khớp với BE)
   * @param skip - Số mục bỏ qua (page - 1) * limit
   * @param limit - Số lượng mục mỗi trang
   * @param search - Chuỗi tìm kiếm (đã gộp)
   */
  getAllServices: async (
    skip: number, 
    limit: number = 10,
    search: string = ''
  ): Promise<any> => {
    try {
      const params: any = {
        skip: skip,
        limit: limit,
        search: search
      };
      
      console.log('🚀 [serviceService] Đang gọi API Get All Services với params:', params);

      const response = await http.get(API_SERVICES, { params: params });
      
      // Trả về toàn bộ response.data (chứa data và metadata)
      return response.data;

    } catch (error: any) {
      console.error('❌ [serviceService] Lỗi khi gọi getAllServices:', error);
      throw error;
    }
  },

  console.log("🚀 SERVICE API RESPONSE:", response.data);
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
   * Xóa nhiều services (đã sửa để khớp với BE)
   * BE mong đợi một mảng [id1, id2] trong body
   */
  bulkDeleteServices: async (ids: string[]): Promise<void> => {
    await http.delete(`${API_SERVICES}/bulk`, { 
      data: ids // Gửi mảng trực tiếp
    });
  }
};
