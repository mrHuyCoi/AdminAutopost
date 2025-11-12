import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Giả sử bạn có hook này
import { authService } from '../services/authService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Lấy thông tin user thật

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Lấy 2 chữ cái đầu của tên
  const userInitials = user?.full_name 
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('') 
    : 'AD';

  return (
    <>
      {/* === MOBILE HEADER === */}
      <div className="mobile-header-bar d-lg-none d-flex justify-content-between align-items-center px-3 py-2 bg-white shadow-sm">
        <div className="d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas" role="button">
          <button className="mobile-logo-toggle btn p-0 me-2 border-0 bg-transparent">
            <i className="fas fa-bars text-dark"></i>
          </button>
          <div>
            {/* Tiêu đề trang sẽ được cập nhật bởi các trang con (ví dụ: DeviceManagementPage) */}
            <div id="pageTitle" className="page-title mb-0 fw-bold">Dashboard</div>
          </div>
        </div>
        <div className="d-flex align-items-center user-menu-mobile">
          {/* (Dropdown cho mobile có thể thêm ở đây nếu cần) */}
          <div className="user-avatar d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" 
               style={{ width: '32px', height: '32px', fontSize: '14px' }}>
            {userInitials}
          </div>
        </div>
      </div>

      {/* === DESKTOP HEADER === */}
      <div className="admin-header desktop-header d-none d-lg-flex align-items-center justify-content-between px-4 bg-white shadow-sm" style={{ height: '70px' }}>
        <div className="page-info d-flex flex-column me-auto">
          {/* 2 ID này sẽ được các trang con (ví dụ: BrandManagementPage) cập nhật */}
          <h1 id="pageTitle" className="page-title mb-0 fw-bold">Dashboard</h1>
          <p id="pageSubtitle" className="page-subtitle mb-0 text-muted">Tổng quan hệ thống</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="search-box position-relative">
            <i className="fas fa-search search-icon position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
            <input 
              type="text" 
              className="form-control ps-5" 
              placeholder="Tìm kiếm..." 
              style={{ width: '300px' }}
            />
          </div>
          
          {/* User Menu Dropdown */}
          <div className="dropdown">
            <button className="user-menu d-flex align-items-center gap-2 btn btn-link text-decoration-none"
                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <div className="user-avatar d-flex align-items-center justify-content-center bg-primary text-white rounded-circle" 
                   style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                {userInitials}
              </div>
              <div className="user-info d-flex flex-column align-items-start d-none d-sm-flex">
                <div className="fw-medium text-dark">{user?.full_name || 'Admin User'}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>{user?.role || 'Quản trị viên'}</div>
              </div>
              <i className="fas fa-chevron-down text-muted" style={{ fontSize: '12px' }}></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <Link className="dropdown-item" to="/admin/profile">
                  <i className="fas fa-user-edit me-2"></i>
                  Hồ sơ
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-2"></i>
                  Đăng xuất
                </button>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </>
  );
};

export default Header;