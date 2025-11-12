// src/pages/SupportPage.tsx
import React from 'react';
// Trang này không dùng StatCard

const SupportPage: React.FC = () => {

  // === 1. JSX RETURN ===
  return (
    <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
      
      {/* Trang này không có StatCards */}

      {/* Layout 2 cột: 1 cho FAQ, 1 cho Form liên hệ */}
      <div className="row g-3 g-lg-4">
        
        {/* Cột 1: Câu hỏi thường gặp (FAQ) */}
        <div className="col-lg-7 col-12">
          <div className="table-card">
            <div className="card-header">
              <h3>Câu hỏi thường gặp (FAQ)</h3>
            </div>
            <div className="card-body">
              {/* Dùng Accordion của Bootstrap */}
              <div className="accordion" id="faqAccordion">
                
                {/* Câu hỏi 1 */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                      Làm thế nào để thêm một người dùng mới?
                    </button>
                  </h2>
                  <div id="collapseOne" className="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Để thêm người dùng mới, bạn vào mục "Quản lý Người dùng", nhấp vào nút "Thêm người dùng" ở góc trên bên phải và điền đầy đủ thông tin.
                    </div>
                  </div>
                </div>

                {/* Câu hỏi 2 */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                      Tôi có thể xuất dữ liệu ra file Excel không?
                    </button>
                  </h2>
                  <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Có. Hầu hết các trang quản lý (như Người dùng, Gói cước, Thiết bị...) đều có nút "Xuất file" hoặc "Excel" ở phía trên bảng dữ liệu.
                    </div>
                  </div>
                </div>

                {/* Câu hỏi 3 */}
                <div className="accordion-item">
                  <h2 className="accordion-header" id="headingThree">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                      Làm thế nào để đặt lại mật khẩu?
                    </button>
                  </h2>
                  <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#faqAccordion">
                    <div className="accordion-body">
                      Bạn có thể vào trang "Cài đặt" & "Bảo mật & Mật khẩu" để cập nhật mật khẩu mới cho tài khoản quản trị của mình.
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Cột 2: Gửi yêu cầu hỗ trợ */}
        <div className="col-lg-5 col-12">
          <div className="table-card">
            <div className="card-header">
              <h3>Gửi yêu cầu hỗ trợ</h3>
            </div>
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="supportEmail" className="form-label">Email của bạn</label>
                  <input type="email" className="form-control" id="supportEmail" defaultValue="admin@autopost.com" readOnly />
                </div>
                <div className="mb-3">
                  <label htmlFor="supportSubject" className="form-label">Chủ đề</label>
                  <input type="text" className="form-control" id="supportSubject" placeholder="Ví dụ: Lỗi không thể thêm gói cước" />
                </div>
                <div className="mb-3">
                  <label htmlFor="supportPriority" className="form-label">Mức độ ưu tiên</label>
                  <select id="supportPriority" className="form-select">
                    <option value="low">Thấp</option>
                    <option value="medium" selected>Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="supportMessage" className="form-label">Nội dung</label>
                  <textarea className="form-control" id="supportMessage" rows={5} placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."></textarea>
                </div>
                <div className="text-end">
                  <button type="submit" className="btn btn-primary">
                    <i className="fa-solid fa-paper-plane me-2"></i>Gửi yêu cầu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SupportPage;