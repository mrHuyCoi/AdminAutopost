// src/contexts/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../lib/axios';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

 // src/contexts/AuthContext.tsx – HÀM LOGIN ĐÃ FIX
// src/contexts/AuthContext.tsx – HÀM LOGIN MỚI (KHÔNG DÙNG apiClient)
const login = async (email: string, password: string) => {
  try {
    // 1. Tạo form-urlencoded body
    const formData = new URLSearchParams();
    formData.append('username', email);     // backend yêu cầu "username"
    formData.append('password', password);

    console.log('Gửi login (form-urlencoded):', formData.toString());
    // → "username=admin@example.com&password=123456"

    // 2. Gửi bằng fetch
    const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    // 3. Xử lý response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Login thất bại:', errorData);
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('Đăng nhập thành công:', data);

    const { access_token, user: userData } = data;

    // 4. Lưu vào localStorage
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('user', JSON.stringify(userData));

    // 5. Cập nhật state
    setUser(userData);
    setIsAuthenticated(true);
  } catch (error: any) {
    console.error('Lỗi kết nối:', error);
    throw new Error(error.message || 'Không thể kết nối đến server');
  }
};

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, loading }}>
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