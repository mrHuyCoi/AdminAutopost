import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import api from '../lib/axios'; // Đảm bảo đường dẫn đúng tới axios config của bạn

// QUAN TRỌNG: Thống nhất tên key là 'accessToken'
const TOKEN_KEY = 'accessToken';

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    // Nếu không có token, dừng ngay, không gọi API
    if (!token) {
        setUser(null);
        setLoading(false);
        return;
    }

    try {
      const response = await api.get('/users/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
      // Nếu token lỗi, có thể xóa luôn để bắt đăng nhập lại
      // localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // Lưu ý: API của bạn dùng 'username' hay 'email'? Sửa lại dòng dưới nếu cần.
      const response = await api.post('/auth/login', {
        username: email, 
        password
      });
      
      // Lấy token từ response (kiểm tra kỹ cấu trúc trả về của API)
      const token = response.data.access_token || response.data.token;
      
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        await fetchUser();
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    window.location.href = '/login';
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      fetchUser,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};