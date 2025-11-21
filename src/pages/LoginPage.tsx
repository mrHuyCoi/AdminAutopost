// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

// Import file CSS
import './LoginPage.css'; 

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Đăng nhập thành công!');
      navigate('/users'); // Điều hướng đến trang users sau khi thành công
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        {/* Phần Logo */}
        <div className="login-logo">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 17.5C9.51 17.5 7.5 15.49 7.5 13C7.5 10.51 9.51 8.5 12 8.5C14.49 8.5 16.5 10.51 16.5 13C16.5 15.49 14.49 17.5 12 17.5ZM12 7C11.17 7 10.5 6.33 10.5 5.5C10.5 4.67 11.17 4 12 4C12.83 4 13.5 4.67 13.5 5.5C13.5 6.33 12.83 7 12 7Z" fill="#667eea"/>
          </svg>
        </div>
        
        <h2>Đăng nhập Admin</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="example@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              placeholder="••••••••"
            />
          </div>
          
          
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Đã xóa phần Divider và Link Đăng ký */}
        
      </div>
    </div>
  );
};

export default LoginPage;