// src/services/deviceService.ts
import http from '../lib/axios';
import { UserDeviceDetailRead, UserDeviceCreate, UserDeviceUpdate } from '../types/userDevice';
import { Color, DeviceInfoRead, StorageOption } from '../types/deviceTypes';
import { ResponseModel, PaginatedResponse } from '../types/response'; // Giả sử bạn có các type này

// === 1. User Devices (Từ userDeviceService.ts) ===
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

// === 2. Device Info (Phần còn thiếu) ===
const API_DEVICE_INFO = '/device-infos';
export const deviceInfoService = {
  getAllDeviceInfos: (): Promise<ResponseModel<DeviceInfoRead[]>> => { // (Đoán API)
    return http.get<ResponseModel<DeviceInfoRead[]>>(API_DEVICE_INFO);
  },
};

// === 3. Colors (Từ colorService.ts) ===
const API_COLORS = '/colors';
export const colorService = {
  getAllColors: (): Promise<ResponseModel<Color[]>> => {
    return http.get<ResponseModel<Color[]>>(`${API_COLORS}/?skip=0&limit=1000`);
  },
  createColor: (data: { name: string, hex_code?: string }): Promise<ResponseModel<Color>> => {
    return http.post<ResponseModel<Color>>(API_COLORS, data);
  },
  updateColor: (id: string, data: { name: string, hex_code?: string }): Promise<ResponseModel<Color>> => {
    return http.put<ResponseModel<Color>>(`${API_COLORS}/${id}/`, data); // API của bạn có dấu / ở cuối
  },
  deleteColor: (id: string): Promise<ResponseModel<boolean>> => {
    return http.delete<ResponseModel<boolean>>(`${API_COLORS}/${id}/`);
  },
};

// === 4. Storage (Phần còn thiếu) ===
const API_STORAGE = '/storage-options';
const API_DEVICE_STORAGES = '/device-storages'; // (Đoán)
export const storageService = {
  getAllStorageOptions: (): Promise<ResponseModel<StorageOption[]>> => {
    return http.get<ResponseModel<StorageOption[]>>(API_STORAGE);
  },
  createStorageOption: (data: { name: string, description?: string }): Promise<StorageOption> => {
    return http.post<StorageOption>(API_STORAGE, data);
  },
  updateStorageOption: (id: string, data: { name: string, description?: string }): Promise<StorageOption> => {
    return http.put<StorageOption>(`${API_STORAGE}/${id}`, data);
  },
  deleteStorageOption: (id: string): Promise<void> => {
    return http.delete<void>(`${API_STORAGE}/${id}`);
  },
  // (Hàm này cho dropdown phụ thuộc của DeviceManagementPage)
  getStoragesForDevice: (deviceInfoId: string): Promise<StorageOption[]> => {
    return http.get<StorageOption[]>(`${API_DEVICE_INFO}/${deviceInfoId}/storages`); // (Đoán API)
  },
};