// src/services/deviceService.ts
import http from '../lib/axios';
import {
  UserDeviceDetailRead,
  UserDeviceCreate,
  UserDeviceUpdate,
} from '../types/userDevice';
import { Color, DeviceInfo, StorageOption } from '../types/deviceTypes';
import { ResponseModel, PaginatedResponse } from '../types/response';

// ──────────────────────────────────────────────────────────────
// 1. USER DEVICES
// ──────────────────────────────────────────────────────────────
const API_USER_DEVICES = '/user-devices';

export const userDeviceService = {
  getMyDevices: (
    page = 1,
    limit = 10,
    search: string = '',
    device_type: string = 'all'
  ): Promise<PaginatedResponse<UserDeviceDetailRead>> => {
    const skip = (page - 1) * limit; 
    
    const params: any = { skip, limit };
    if (search) {
      params.search = search;
    }
    if (device_type !== 'all') {
      params.device_type = device_type;
    }

    return http
      .get<any>(
        `${API_USER_DEVICES}/my-devices`,
        { params }
      )
      .then((res) => {
        const responseData = res.data;

        // Trường hợp 1: API trả về { data: { items: [...], total: ... } }
        if (responseData && responseData.data && Array.isArray(responseData.data.items)) {
          return responseData.data;
        }

        // Trường hợp 2: API trả về { items: [...], total: ... } (nằm trong 'data' của axios)
        if (responseData && Array.isArray(responseData.items)) {
          return responseData;
        }
        
        // Trường hợp 3: API trả về { data: [...] } (mảng nằm trong data)
        if (responseData && Array.isArray(responseData.data)) {
           return {
             items: responseData.data,
             total: responseData.total ?? responseData.data.length,
             page: page,
             totalPages: responseData.totalPages ?? 1
           };
        }

        // Fallback: Nếu không tìm thấy gì
        return { items: [], total: 0, page: 1, totalPages: 1 };
      });
  },

  createUserDevice: (data: UserDeviceCreate): Promise<UserDeviceDetailRead> => {
    return http
      .post<ResponseModel<UserDeviceDetailRead>>(API_USER_DEVICES, data)
      .then((res) => res.data);
  },

  updateUserDevice: (
    id: string,
    data: UserDeviceUpdate
  ): Promise<UserDeviceDetailRead> => {
    return http
      .put<ResponseModel<UserDeviceDetailRead>>(`${API_USER_DEVICES}/${id}`, data)
      .then((res) => res.data);
  },

  deleteUserDevice: (id: string): Promise<void> => {
    return http.delete<void>(`${API_USER_DEVICES}/${id}`);
  },

  // Xuất Excel
  exportToExcel: async (search?: string, type?: string): Promise<void> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (type && type !== 'all') params.append('type', type);
    
    const response = await http.get(`/user-devices/export/excel?${params.toString()}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `devices_${new Date().toISOString().split('T')[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Nhập Excel
  importFromExcel: async (file: File): Promise<{ successCount: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await http.post('/user-devices/import/excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  // Tải template
  downloadTemplate: async (): Promise<void> => {
    const response = await http.get('/user-devices/export/template', {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'device_import_template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// ──────────────────────────────────────────────────────────────
// 2. DEVICE INFOS
// ──────────────────────────────────────────────────────────────
const API_DEVICE_INFO = '/device-infos';

export const deviceInfoService = {
  getAllDeviceInfos: (): Promise<DeviceInfo[]> => {
    return http
      .get<any>(API_DEVICE_INFO, {
        params: { page: 1, limit: 100 }
      })
      .then((res) => {
        if (res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return Array.isArray(res.data) ? res.data : [];
      });
  },
};

// ──────────────────────────────────────────────────────────────
// 3. COLORS
// ──────────────────────────────────────────────────────────────
const API_COLORS = '/colors';

export const colorService = {
  getAllColors: (): Promise<Color[]> => {
    return http
      .get<any>(API_COLORS, {
        params: { page: 1, limit: 100 },
      })
      .then((res) => {
         if (res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        return Array.isArray(res.data) ? res.data : [];
      });
  },
};

// ──────────────────────────────────────────────────────────────
// 4. STORAGES (phụ thuộc device_info_id)
// ──────────────────────────────────────────────────────────────
export const storageService = {
  getStoragesForDevice: (deviceInfoId: string): Promise<StorageOption[]> => {
    return http
      .get<any>(`${API_DEVICE_INFO}/${deviceInfoId}/storages`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
        if (Array.isArray(res.data)) {
          return res.data;
        }
        return [];
      });
  },
};