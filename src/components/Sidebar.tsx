// src/components/Sidebar.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const location = useLocation();

  const menuItems = {
    dashboard: [
      { to: '/users', icon: 'fas fa-users', text: 'Người dùng' },
      { to: '/packages', icon: 'fas fa-box', text: 'Gói đăng bài' },
      { to: '/registrations', icon: 'fas fa-user-plus', text: 'Đăng ký mới' },
      { to: '/chatbot', icon: 'fas fa-robot', text: 'Chatbot' },
      { to: '/chatbot-permissions', icon: 'fas fa-user-shield', text: 'Phân quyền chatbot' }
    ],
    management: [
      { to: '/devices', icon: 'fas fa-mobile-alt', text: 'Thiết bị' },
      { to: '/device-infos', icon: 'fas fa-mobile-alt', text: 'Thông tin thiết bị' },
      { to: '/colors', icon: 'fas fa-palette', text: 'Màu sắc' },
      { to: '/storage', icon: 'fas fa-hdd', text: 'Dung lượng' },
      { to: '/components', icon: 'fas fa-microchip', text: 'Linh kiện' },
      { to: '/brands', icon: 'fas fa-tags', text: 'Thương hiệu' },
      { to: '/services', icon: 'fas fa-concierge-bell', text: 'Dịch Vụ' }
    ],
    system: [
      { to: '/settings', icon: 'fas fa-cog', text: 'Cài đặt' }
      // Đã xóa Thống kê và Hỗ trợ ở đây
    ]
  };

  const renderNavItems = (items: typeof menuItems.dashboard) => (
    <ul className="nav flex-column">
      {items.map((item) => (
        <li key={item.to} className="nav-item">
          <NavLink
            to={item.to}
            className={({ isActive }) => 
              `nav-link d-flex align-items-center gap-2 py-2 ${isActive ? 'active' : ''}`
            }
          >
            <i className={item.icon} style={{ width: '20px' }}></i>
            <span className="nav-text">{item.text}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* === DESKTOP SIDEBAR === */}
      <div className="sidebar d-none d-lg-flex flex-column bg-white shadow" id="sidebarDesktop">
        <div className="logo d-flex align-items-center gap-2 p-3 border-bottom" style={{ height: '70px' }}>
          <div className="logo-icon d-flex align-items-center justify-content-center bg-primary text-white rounded" 
               style={{ width: '32px', height: '32px' }}>
            <i className="fas fa-cube"></i>
          </div>
          <div className="logo-text fw-bold fs-5">
            Auto Post <span className="text-primary">Admin</span>
          </div>
        </div>
        
        <div className="nav-container p-3 flex-grow-1">
          <div className="nav-section mb-4">
            <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Bảng điều khiển</div>
            {renderNavItems(menuItems.dashboard)}
          </div>
          
          <div className="nav-section mb-4">
            <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Quản lý</div>
            {renderNavItems(menuItems.management)}
          </div>
          
          <div className="nav-section mb-4">
            <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Hệ thống</div>
            {renderNavItems(menuItems.system)}
          </div>
        </div>
      </div>

      {/* === MOBILE SIDEBAR (OFFCANVAS) === */}
      <div className="offcanvas offcanvas-start bg-white d-lg-none" tabIndex={-1} id="sidebarOffcanvas">
        <div className="offcanvas-header border-bottom">
          <h5 className="offcanvas-title fw-bold">
            <div className="logo-icon d-inline-flex align-items-center justify-content-center bg-primary text-white rounded me-2" 
                 style={{ width: '28px', height: '28px' }}>
              <i className="fas fa-cube"></i>
            </div>
            Auto Post <span className="text-primary">Admin</span>
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        
        <div className="offcanvas-body p-0">
          <div className="nav-container p-3">
            <div className="nav-section mb-4">
              <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Bảng điều khiển</div>
              {renderNavItems(menuItems.dashboard)}
            </div>
            
            <div className="nav-section mb-4">
              <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Quản lý</div>
              {renderNavItems(menuItems.management)}
            </div>
            
            <div className="nav-section mb-4">
              <div className="nav-title px-3 mb-2 text-uppercase small fw-bold text-muted">Hệ thống</div>
              {renderNavItems(menuItems.system)}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;