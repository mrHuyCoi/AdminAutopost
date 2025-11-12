// src/lib/axios.ts
import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL từ tài liệu của bạn
const API_BASE_URL = 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor (bộ chặn) để tự động thêm token vào header
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (bạn cần lưu token ở đây sau khi đăng nhập)
    const token = localStorage.getItem('auth_token'); // Dùng 'auth_token' như trong auth.service.ts
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý lỗi chung và hiển thị toast
api.interceptors.response.use(
  (response) => response, // Trả về data nguyên gốc để service xử lý
  (error) => {
    let message = 'Một lỗi không xác định đã xảy ra.';
    if (error.response) {
      // Lỗi từ server (4xx, 5xx)
      message = error.response.data?.detail || error.response.data?.message || error.message;
    } else if (error.request) {
      // Lỗi không kết nối được server
      message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại.';
    } else {
      // Lỗi khác
      message = error.message;
    }

    toast.error(message);
    
    // Trả về một rejected promise với message lỗi đã được chuẩn hóa
    return Promise.reject(new Error(message));
  }
);

// Trả về response.data để các service không cần gõ .data
api.defaults.transformResponse = [(data, headers) => {
    try {
        // Chỉ parse JSON nếu header là application/json
        if (headers && headers['content-type']?.includes('application/json')) {
            const jsonData = JSON.parse(data);
            return jsonData;
        }
    } catch (e) {
        // Bỏ qua lỗi parse, trả về data gốc (có thể là string hoặc blob)
    }
    return data;
}];

// Thêm một hàm helper để chỉ lấy data
// Thay vì gọi api.get(...).then(res => res.data), ta chỉ cần gọi api.get(...)
const http = {
  get: <T>(url: string, config?: any): Promise<T> => api.get<T>(url, config).then(res => res.data),
  post: <T>(url: string, data?: any, config?: any): Promise<T> => api.post<T>(url, data, config).then(res => res.data),
  put: <T>(url: string, data?: any, config?: any): Promise<T> => api.put<T>(url, data, config).then(res => res.data),
  patch: <T>(url: string, data?: any, config?: any): Promise<T> => api.patch<T>(url, data, config).then(res => res.data),
  delete: <T>(url: string, config?: any): Promise<T> => api.delete<T>(url, config).then(res => res.data),
};

export default http;