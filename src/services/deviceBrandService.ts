// src/services/deviceBrandService.ts
import api from '../lib/axios';
import toast from 'react-hot-toast';

// Interface cho Brand của Device (Apple, Samsung)
export interface DeviceBrand {
  id: string;
  name: string;
}

// DTO cho việc tạo/sửa
export interface DeviceBrandPayload {
  name: string;
}

// Hàm trợ giúp để bóc tách data
const unwrapData = (response: any): any => {
  if (response.data && response.data.data) {
    return response.data.data; // Trường hợp { data: { ... } }
  }
  if (response.data && Array.isArray(response.data.items)) {
    return response.data.items; // Trường hợp { items: [...] }
  }
  if (Array.isArray(response.data)) {
    return response.data; // Trường hợp [...]
  }
  if (response.data) {
    return response.data; // Trường hợp { ... }
  }
  return response;
};

export const deviceBrandService = {
  /**
   * Lấy tất cả thương hiệu THIẾT BỊ (Apple, Samsung,...)
   */
  getAllDeviceBrands: async (): Promise<DeviceBrand[]> => {
    try {
      // API này không cần params
      const response = await api.get<any>('/device-brands'); 
      return unwrapData(response);
    } catch (error) {
      console.error("Lỗi khi tải DeviceBrands:", error);
      toast.error('Không thể tải danh sách thương hiệu thiết bị');
      return [];
    }
  },
  
  /**
   * Tạo thương hiệu THIẾT BỊ mới
   */
  createDeviceBrand: (data: DeviceBrandPayload) => {
    return api.post<DeviceBrand>('/device-brands', data);
  },
  
  /**
   * Cập nhật thương hiệu THIẾT BỊ
   */
  updateDeviceBrand: (id: string, data: DeviceBrandPayload) => {
    return api.put<DeviceBrand>(`/device-brands/${id}`, data);
  },
  
  /**
   * Xóa thương hiệu THIẾT BỊ
   */
  deleteDeviceBrand: (id: string) => {
    return api.delete(`/device-brands/${id}`);
  }
};