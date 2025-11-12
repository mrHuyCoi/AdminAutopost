// src/services/serviceService.ts
import http from '../lib/axios';
import { PaginatedResponse } from '../types/response';

// (Type này chỉ là phỏng đoán)
interface Service {
  id: string;
  thuonghieu: string;
}

const API_SERVICES = '/services';

export const serviceService = {
  // (Lấy tất cả dịch vụ để đếm)
  getAllServices: (page: number = 1, limit: number = 1000): Promise<PaginatedResponse<Service>> => {
    return http.get<PaginatedResponse<Service>>(API_SERVICES, {
      params: { skip: (page - 1) * limit, limit: limit }
    });
  }
};