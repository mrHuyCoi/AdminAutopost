import http from '../lib/axios'; // Dùng http helper đã chuẩn hóa
import { Category, CategoryCreate, CategoryUpdate } from '../types/category'; // Giả sử bạn có file type này
import { ResponseModel } from '../types/response';

// API này dựa trên file 'productService.ts' mà tôi đã cung cấp,
// để đảm bảo không bị xung đột endpoint.
const API_CATEGORIES = '/categories';

export const categoryService = {
  
  // Lấy tất cả danh mục
  getAllCategories: (): Promise<Category[]> => {
    // ServiceTypeSidemenu cần 1 mảng Category[], không phải object ResponseModel
    // Chúng ta sẽ lấy data từ response
    return http.get<ResponseModel<Category[]>>(`${API_CATEGORIES}/?skip=0&limit=1000`)
      .then(response => response.data || []); // Trả về mảng data
  },

  // Tạo danh mục mới
  createCategory: (data: CategoryCreate): Promise<Category> => {
    // Trả về 1 object Category
    return http.post<ResponseModel<Category>>(API_CATEGORIES, data)
      .then(response => response.data);
  },

  // Cập nhật danh mục
  updateCategory: (id: string, data: CategoryUpdate): Promise<Category> => {
    // API của bạn có thể có dấu / ở cuối
    return http.put<ResponseModel<Category>>(`${API_CATEGORIES}/${id}/`, data)
      .then(response => response.data);
  },

  // Xóa danh mục
  deleteCategory: (id: string): Promise<void> => {
    return http.delete<void>(`${API_CATEGORIES}/${id}/`);
  },
};