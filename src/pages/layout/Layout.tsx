import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
// Đã xóa ServiceTypeSidemenu khỏi layout

const Layout: React.FC = () => {
  return (
    <div className="admin-container">
      {/* 1. Sidebar chính (bên trái) */}
      <Sidebar />

      {/* 2. Main Content (bên phải) */}
      <div className="main-content d-flex flex-column">
        <Header />

        <main className="content-area d-flex flex-grow-1 p-3">
          {/* Outlet sẽ render trang con (ví dụ: ServiceManagementPage) */}
          <Outlet /> 
        </main>
      </div>

      {/* Menu offcanvas "Loại Dịch Vụ" đã được xóa khỏi đây 
        vì nó sẽ được đặt BÊN TRONG trang quản lý dịch vụ.
      */}
    </div>
  );
};

export default Layout;