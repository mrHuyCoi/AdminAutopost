// src/pages/SettingsPage.tsx
import React from 'react';
// Trang này không dùng StatCard

const SettingsPage: React.FC = () => {

  // === 1. JSX RETURN ===
  return (
    <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
      
      {/* Trang này không có StatCards hoặc Tabs */}

      {/* Card 1: Thông tin chung */}
      <div className="table-card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h3>Thông tin chung</h3>
          <button className="btn btn-primary">
            <i className="fa-solid fa-save me-2"></i>Lưu thay đổi
          </button>
        </div>
        
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="settingSiteName" className="form-label">Tên trang web</label>
              <input type="text" className="form-control" id="settingSiteName" defaultValue="Auto Post Admin" />
            </div>
            <div className="col-md-6">
              <label htmlFor="settingAdminEmail" className="form-label">Email quản trị</label>
              <input type="email" className="form-control" id="settingAdminEmail" defaultValue="admin@autopost.com" />
            </div>
            <div className="col-md-6">
              <label htmlFor="settingTimezone" className="form-label">Múi giờ</label>
              <select id="settingTimezone" className="form-select">
                <option value="gmt7" selected>(GMT+07:00) Bangkok, Hanoi, Jakarta</option>
                <option value="gmt8">(GMT+08:00) Beijing, Perth, Singapore</option>
              </select>
            </div>
            <div className="col-md-6">
              <label htmlFor="settingLang" className="form-label">Ngôn ngữ</label>
              <select id="settingLang" className="form-select">
                <option value="vi" selected>Tiếng Việt</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: Bảo mật */}
      <div className="table-card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h3>Bảo mật & Mật khẩu</h3>
        </div>
        
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="settingNewPass" className="form-label">Mật khẩu mới</label>
              <input type="password" placeholder="••••••••" className="form-control" id="settingNewPass" />
            </div>
            <div className="col-md-6">
              <label htmlFor="settingConfirmPass" className="form-label">Xác nhận mật khẩu mới</label>
              <input type="password" placeholder="••••••••" className="form-control" id="settingConfirmPass" />
            </div>
            <div className="col-12">
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" id="setting2FA" />
                <label className="form-check-label" htmlFor="setting2FA">Kích hoạt xác thực hai yếu tố (2FA)</label>
              </div>
            </div>
            <div className="col-12 text-end">
              <button className="btn btn-primary">Cập nhật mật khẩu</button>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Cài đặt thông báo */}
      <div className="table-card">
        <div className="card-header">
          <h3>Thông báo</h3>
        </div>
        <div className="card-body">
          <div className="d-flex flex-column gap-3">
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" role="switch" id="notifyNewUser" defaultChecked />
              <label className="form-check-label" htmlFor="notifyNewUser">Gửi email khi có người dùng mới đăng ký</label>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" role="switch" id="notifyNewSub" defaultChecked />
              <label className="form-check-label" htmlFor="notifyNewSub">Gửi email khi có đăng ký gói mới</label>
            </div>
            <div className="form-check form-switch">
              <input className="form-check-input" type="checkbox" role="switch" id="notifyWeeklyReport" />
              <label className="form-check-label" htmlFor="notifyWeeklyReport">Gửi báo cáo thống kê hàng tuần</label>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default SettingsPage;