// src/services/userDeviceService.ts
import http from '../lib/axios';
import { UserDeviceDetailRead, UserDeviceCreate, UserDeviceUpdate } from '../types/userDevice';
import { PaginatedResponse } from '../types/response';

const API_USER_DEVICES = '/user-devices';

export const userDeviceService = {
  getMyDevices: (page = 1, limit = 10): Promise<PaginatedResponse<UserDeviceDetailRead>> => {
    return http.get<PaginatedResponse<UserDeviceDetailRead>>(`${API_USER_DEVICES}/my-devices`, {
      params: { skip: (page - 1) * limit, limit: limit }
    });
  },
  createUserDevice: (data: UserDeviceCreate): Promise<UserDeviceDetailRead> => {
    return http.post<UserDeviceDetailRead>(API_USER_DEVICES, data);
  },
  updateUserDevice: (id: string, data: UserDeviceUpdate): Promise<UserDeviceDetailRead> => {
    return http.put<UserDeviceDetailRead>(`${API_USER_DEVICES}/${id}`, data);
  },
  deleteUserDevice: (id: string): Promise<void> => {
    return http.delete<void>(`${API_USER_DEVICES}/${id}`);
  },
};
