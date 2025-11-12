// src/services/authService.ts
import api from '../lib/axios'; // Dùng axios instance gốc để lấy cả data
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '../types/authTypes'; // Nên tạo file types

export const authService = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    
    // Lưu token sau khi đăng nhập thành công
    if (response.data.access_token) {
        localStorage.setItem('auth_token', response.data.access_token);
    }
    return response.data;
  },

  // Register
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const response = await api.post('/registration/register', userData);
    return response.data;
  },

  // Logout
  logout: (): void => {
    localStorage.removeItem('auth_token');
  },

  // (Các hàm forgot/reset password từ file của bạn)
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword
    });
    return response.data;
  },
};