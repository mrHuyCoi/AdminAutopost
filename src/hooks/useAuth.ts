import { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios'; // Sử dụng instance đã cấu hình

// QUAN TRỌNG: Thống nhất tên key là 'accessToken' cho toàn bộ dự án
const TOKEN_KEY = 'accessToken';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin user
  // Dùng useCallback để tránh tạo lại hàm không cần thiết gây loop
  const fetchUser = useCallback(async () => {
    // --- BƯỚC QUAN TRỌNG: Kiểm tra token trước khi gọi API ---
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Nếu không có token, dừng ngay lập tức, KHÔNG gọi API
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    // ---------------------------------------------------------

    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      // Nếu token không hợp lệ (hết hạn), có thể xóa luôn để tránh lỗi lặp lại
      // localStorage.removeItem(TOKEN_KEY); 
    } finally {
      setLoading(false);
    }
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', {
        username: email,
        password
      });
      
      // Lấy token từ response (kiểm tra kỹ API trả về 'access_token' hay 'token')
      const token = response.data.access_token;
      
      // Lưu với key thống nhất là 'accessToken'
      localStorage.setItem(TOKEN_KEY, token);
      
      await fetchUser(); // Lấy thông tin user sau khi login
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY); // Xóa đúng key
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  return { 
    user, 
    loading, 
    login, 
    logout, 
    fetchUser,
    isAuthenticated: !!user // Thêm biến tiện ích để check nhanh trạng thái
  };
};