// src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBars,
  faSearch,
  faChevronDown,
  faUserEdit,
  faSignOutAlt,
  faBell,
  faCog,
  faMoon,
  faSun
} from '@fortawesome/free-solid-svg-icons';

// =========================
// MAP TIÊU ĐỀ THEO ROUTE
// =========================
const pageTitles: Record<string, string> = {
  '/users': 'Người dùng',
  '/packages': 'Gói đăng bài',
  '/registrations': 'Đăng ký mới',
  '/chatbot': 'Chatbot',
  '/chatbot-permissions': 'Phân quyền chatbot',
  '/devices': 'Thiết bị',
  '/device-infos': 'Thông tin thiết bị',
  '/colors': 'Màu sắc',
  '/storage': 'Dung lượng',
  '/components': 'Linh kiện',
  '/brands': 'Thương hiệu',
  '/services': 'Dịch vụ',
  '/settings': 'Cài đặt',
  '/statistics': 'Thống kê',
  '/support': 'Hỗ trợ'
};

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = pageTitles[location.pathname] || "Dashboard";
  const pageSubtitle = pageTitle !== "Dashboard" ? `Trang / ${pageTitle}` : "Tổng quan hệ thống";

  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  const userInitials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="mobile-header-bar d-lg-none d-flex justify-content-between align-items-center px-3 py-2 bg-white shadow-sm border-bottom"
           style={{ height: '60px', position: 'sticky', top: 0, zIndex: 1020 }}>
        <div className="d-flex align-items-center" data-bs-toggle="offcanvas" data-bs-target="#sidebarOffcanvas" role="button">
          <button className="btn p-0 me-2 border-0 bg-transparent fs-4">
            <FontAwesomeIcon icon={faBars} className="text-dark" />
          </button>
          <div>
            <div className="page-title mb-0 fw-bold text-dark fs-6">{pageTitle}</div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-light btn-sm position-relative">
            <FontAwesomeIcon icon={faBell} className="text-muted" />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>3</span>
          </button>

          <div className="dropdown" ref={dropdownRef}>
            <div 
              className="user-avatar d-flex align-items-center justify-content-center bg-gradient-primary text-white rounded-circle cursor-pointer"
              style={{ width: '36px', height: '36px', fontSize: '14px' }}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {userInitials}
            </div>

            {showDropdown && (
              <div className="dropdown-menu dropdown-menu-end shadow-lg rounded-3 border-0 mt-2 show"
                   style={{ width: '260px', zIndex: 1050, right: 0, left: 'auto' }}>
                <div className="p-3 border-bottom">
                  <div className="fw-semibold">{user?.full_name || 'Admin'}</div>
                  <div className="text-muted small">{user?.role || 'Administrator'}</div>
                </div>
                <div className="p-2">
                  <Link className="dropdown-item px-3 py-2" to="/admin/profile" onClick={() => setShowDropdown(false)}>
                    <FontAwesomeIcon icon={faUserEdit} className="me-2 text-primary" /> Hồ sơ cá nhân
                  </Link>
                  <button className="dropdown-item px-3 py-2 w-100 border-0 bg-transparent" onClick={toggleDarkMode}>
                    <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="me-2 text-warning" />
                    {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                  </button>
                  <hr />
                  <button className="dropdown-item px-3 py-2 text-danger w-100 border-0 bg-transparent" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP HEADER */}
      <div className="admin-header desktop-header d-none d-lg-flex align-items-center justify-content-between px-4 bg-white shadow-sm border-bottom"
           style={{ height: '70px' }}>
        <div className="page-info d-flex flex-column me-auto">
          <h1 className="page-title mb-0 fw-bold text-dark fs-4">{pageTitle}</h1>
          <p className="page-subtitle mb-0 text-muted fs-6">{pageSubtitle}</p>
        </div>

        <div className="d-flex align-items-center gap-4">
          <button className="btn btn-light rounded-circle p-2" onClick={toggleDarkMode}>
            <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className={darkMode ? 'text-warning' : 'text-muted'} />
          </button>

          <button className="btn btn-light position-relative rounded-circle p-2">
            <FontAwesomeIcon icon={faBell} className="text-muted" />
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>3</span>
          </button>

          <button className="btn btn-light rounded-circle p-2">
            <FontAwesomeIcon icon={faCog} className="text-muted" />
          </button>

          <div className="dropdown" ref={dropdownRef}>
            <button 
              className="user-menu d-flex align-items-center gap-3 btn btn-link text-decoration-none p-2 rounded-3"
              type="button" 
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <div className="user-avatar d-flex align-items-center justify-content-center bg-gradient-primary text-white rounded-circle shadow-sm"
                   style={{ width: '42px', height: '42px' }}>
                {userInitials}
              </div>
              <div className="user-info d-flex flex-column align-items-start">
                <div className="fw-semibold">{user?.full_name || 'Admin'}</div>
                <div className="text-muted" style={{ fontSize: '12px' }}>{user?.role || 'Administrator'}</div>
              </div>
              <FontAwesomeIcon 
                icon={faChevronDown} 
                className="text-muted"
                style={{ fontSize: '12px', transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {showDropdown && (
              <div className="dropdown-menu show shadow-lg border-0 rounded-3"
                   style={{ width: '280px', marginTop: '8px', right: 0, left: 'auto', position: 'absolute' }}>
                <div className="p-3 border-bottom">
                  <div className="fw-bold">{user?.full_name || 'Admin'}</div>
                  <div className="text-muted small">{user?.email || 'admin@example.com'}</div>
                </div>
                <div className="p-2">
                  <Link className="dropdown-item px-3 py-2" to="/admin/profile" onClick={() => setShowDropdown(false)}>
                    <FontAwesomeIcon icon={faUserEdit} className="me-2 text-primary" /> Hồ sơ cá nhân
                  </Link>
                  <button className="dropdown-item px-3 py-2 w-100 border-0 bg-transparent" onClick={toggleDarkMode}>
                    <FontAwesomeIcon icon={darkMode ? faSun : faMoon} className="me-2 text-warning" />
                    {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                  </button>
                  <hr />
                  <button className="dropdown-item px-3 py-2 text-danger w-100 border-0 bg-transparent" onClick={handleLogout}>
                    <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FIX: Dùng jsx global */}
      <style jsx global>{`
        .user-menu:hover {
          background-color: #f8f9fa !important;
        }
        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea, #764ba2) !important;
        }
      `}</style>
    </>
  );
};

export default Header;