// src/services/productService.ts
import http from '../lib/axios';
import { 
  ProductComponent, 
  ProductComponentCreate, 
  ProductComponentUpdate,
  Category,
  CategoryCreate,
  Property,
  PropertyCreate,
  ImportResult
} from '../types/productComponentTypes';
import { PaginatedResponse } from '../types/response';

const API_COMPONENTS = '/product-components';
const API_CATEGORIES = '/categories';
const API_PROPERTIES = '/properties';

export const productService = {
  
  // --- Product Components (Linh Kiện) ---
  getAllProductComponents: (
    page: number = 1, 
    limit: number = 10,
    searchTerm?: string
  ): Promise<PaginatedResponse<ProductComponent>> => {
    const params = {
      skip: (page - 1) * limit,
      limit: limit,
      search: searchTerm || undefined,
    };
    return http.get<PaginatedResponse<ProductComponent>>(API_COMPONENTS, { params });
  },

  createProductComponent: (data: ProductComponentCreate): Promise<ProductComponent> => {
    return http.post<ProductComponent>(API_COMPONENTS, data);
  },

  updateProductComponent: (id: string, data: ProductComponentUpdate): Promise<ProductComponent> => {
    return http.put<ProductComponent>(`${API_COMPONENTS}/${id}`, data);
  },

  deleteProductComponent: (id: string): Promise<void> => {
    return http.delete<void>(`${API_COMPONENTS}/${id}`);
  },
  
  importFromExcel: (file: File): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    return http.post<ImportResult>(`${API_COMPONENTS}/import`, formData);
  },
  
  // === HÀM XUẤT EXCEL CẦN XỬ LÝ BLOB ===
  // (Chúng ta dùng 'api' gốc thay vì 'http' helper)
  exportToExcel: (): Promise<Blob> => {
    const api = (await import('../lib/axios')).default; // Import api gốc
    return api.get<Blob>(`${API_COMPONENTS}/export`, { responseType: 'blob' }).then(res => res.data);
  },

  // --- Categories (Danh mục) ---
  getAllCategories: (): Promise<Category[]> => {
    return http.get<Category[]>(`${API_CATEGORIES}/?skip=0&limit=1000`);
  },
  createCategory: (data: CategoryCreate): Promise<Category> => {
    return http.post<Category>(`${API_CATEGORIES}/`, data);
  },
  updateCategory: (id: string, data: CategoryCreate): Promise<Category> => {
    return http.put<Category>(`${API_CATEGORIES}/${id}/`, data);
  },
  deleteCategory: (id: string): Promise<void> => {
    return http.delete<void>(`${API_CATEGORIES}/${id}/`);
  },

  // --- Properties (Thuộc tính) ---
  getAllProperties: (): Promise<Property[]> => {
    return http.get<Property[]>(`${API_PROPERTIES}/?skip=0&limit=1000`);
  },
  createProperty: (data: PropertyCreate): Promise<Property> => {
    return http.post<Property>(API_PROPERTIES, data);
  },
};