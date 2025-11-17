// src/services/materialService.ts
import axios from 'axios';

export const materialService = {
  // === DÙNG ĐÚNG ENDPOINT ===
  getDeviceInfos: (params?: any) => 
    axios.get('/api/v1/materials/materials', { params }), // ← ĐÚNG

  createDeviceInfo: (data: any) => 
    axios.post('/api/v1/materials/materials', data),

  updateDeviceInfo: (id: string, data: any) => 
    axios.put(`/api/v1/materials/materials/${id}`, data),

  deleteDeviceInfo: (id: string) => 
    axios.delete(`/api/v1/materials/materials/${id}`),
};