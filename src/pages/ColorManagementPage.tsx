// src/pages/ColorManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StatCard from '../components/StatCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { PaginationMetadata } from '../types/response';

// Import Types và Service
import { ColorRead, ColorCreate, ColorUpdate } from '../types/device';
import { colorService } from '../services/colorService';

// Lấy element root của modal (cho Portal)
const modalRoot = document.getElementById('modal-root');

// === Trạng thái form ban đầu ===
const initialFormState: ColorCreate = {
  name: '',
  hex_code: '#ffffff' // Mặc định là màu trắng
};

const ColorManagementPage: React.FC = () => {

  // === STATE DỮ LIỆU ===
  const [colors, setColors] = useState<ColorRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  // === STATE CHO MODAL & FORM ===
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ColorCreate | ColorUpdate>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // === STATE CHO MODAL XÓA ===
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // === TẢI DỮ LIỆU KHI MỞ TRANG ===
  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    if (titleElement) titleElement.innerText = 'Quản lý Màu sắc';
    if (subtitleElement) subtitleElement.innerText = 'Thêm, sửa, xóa các tùy chọn màu sắc';
    
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await colorService.getAllColors();
      
      setColors(response.data);
      if (response.metadata) {
        setPagination(response.metadata);
      } else {
        setPagination({ page: 1, limit: 100, total: response.data.length, total_pages: 1 });
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải màu sắc');
      setColors([]);
    } finally {
      setLoading(false);
    }
  };
  
  // === CÁC HÀM XỬ LÝ SỰ KIỆN ===
  const handleAddNewClick = () => {
    setCurrentData(initialFormState);
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleEditClick = (color: ColorRead) => {
    setIsEditMode(true);
    setEditId(color.id);
    
    setCurrentData({
      name: color.name,
      hex_code: color.hex_code
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => { if (isSaving) return; setShowModal(false); };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      // Chuẩn bị dữ liệu đúng định dạng
      const requestData = {
        name: currentData.name?.trim() || '',
        hex_code: currentData.hex_code?.trim() || null
      };

      // Validate dữ liệu
      if (!requestData.name) {
        setModalError('Tên màu là bắt buộc');
        setIsSaving(false);
        return;
      }

      if (isEditMode && editId) {
        // Cập nhật
        const response = await colorService.updateColor(editId, requestData);
        setColors(prev => prev.map(c => (c.id === editId ? response.data : c)));
      } else {
        // Thêm mới
        const response = await colorService.createColor(requestData);
        setColors(prev => [response.data, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Xử lý Xóa ---
  const handleDeleteClick = (color: ColorRead) => { 
    setDeleteId(color.id); 
    setDeleteError(null); 
    setShowDeleteModal(true); 
  };

  const handleCloseDeleteModal = () => { 
    if (isDeleting) return; 
    setShowDeleteModal(false); 
    setDeleteId(null); 
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await colorService.deleteColor(deleteId); 
      setColors(prev => prev.filter(c => c.id !== deleteId));
      handleCloseDeleteModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  // === HÀM RENDER BẢNG ===
  const renderColorTable = () => {
    if (loading) return <tr><td colSpan={4} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={4} className="text-center text-danger py-4">{error}</td></tr>;
    if (colors.length === 0) return <tr><td colSpan={4} className="text-center py-5 text-muted">Chưa có màu sắc nào.</td></tr>;

    return colors.map((color) => (
      <tr key={color.id}>
        <td data-label="Tên màu" className="align-middle" style={{ paddingLeft: '1.5rem' }}>
          <strong>{color.name}</strong>
        </td>
        <td data-label="Mã HEX" className="align-middle">
          <div className="d-flex align-items-center gap-2">
            <span 
              className="color-preview rounded border"
              style={{ 
                backgroundColor: color.hex_code || '#ffffff', 
                width: '20px', 
                height: '20px',
                border: color.hex_code === '#ffffff' || !color.hex_code ? '1px solid #ccc' : 'none'
              }}
            ></span>
            {color.hex_code || 'N/A'}
          </div>
        </td>
        <td data-label="Ngày tạo" className="align-middle">
          {new Date(color.created_at).toLocaleDateString('vi-VN')}
        </td>
        <td data-label="Thao tác" className="align-middle">
          <button className="btn btn-sm btn-outline-primary me-1 py-0 px-1" onClick={() => handleEditClick(color)} title="Sửa">
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteClick(color)} title="Xóa">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </td>
      </tr>
    ));
  };

  // === HÀM RENDER MODALS (VỚI PORTAL + Z-INDEX) ===
  const renderModals = () => {
    if (!modalRoot) return null; 

    const deleteColor = colors.find(c => c.id === deleteId);

    return createPortal(
      <>
        {(showModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}
        
        {showModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form id="colorForm" onSubmit={handleFormSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Màu sắc' : 'Thêm Màu sắc mới'}</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Tên màu *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="name" 
                        name="name" 
                        value={currentData.name || ''} 
                        onChange={handleFormChange} 
                        required 
                        disabled={isSaving}
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="hex_code" className="form-label">Mã màu HEX (ví dụ: #FF0000)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="hex_code" 
                        name="hex_code" 
                        value={currentData.hex_code || ''} 
                        onChange={handleFormChange} 
                        placeholder="#FFFFFF" 
                        disabled={isSaving}
                      />
                      <div className="mt-2" style={{ display: 'flex', alignItems: 'center' }}>
                         <span style={{ marginRight: '10px' }}>Xem trước:</span>
                         <div 
                           className="color-preview rounded border" 
                           style={{ 
                              backgroundColor: currentData.hex_code || '#ffffff', 
                              width: '50px', 
                              height: '25px',
                              border: currentData.hex_code === '#ffffff' || !currentData.hex_code ? '1px solid #ccc' : 'none'
                           }}
                         ></div>
                      </div>
                    </div>

                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button>
                    <button type="submit" form="colorForm" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button type="button" className="btn-close" onClick={handleCloseDeleteModal} disabled={isDeleting}></button>
                </div>
                <div className="modal-body">
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <p>Bạn có chắc chắn muốn xóa màu sắc <strong>"{deleteColor?.name || 'này'}"</strong> không?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Hủy</button>
                  <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang xóa...
                      </>
                    ) : (
                      'Xác nhận xóa'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      modalRoot
    );
  };

  // === JSX RETURN (TRANG CHÍNH) ===
  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        
        {/* Stats Row */}
        <div className="row g-3 g-lg-4">
          <div className="col-6 col-md-3">
            <StatCard 
              title="Tổng màu sắc" 
              value={loading ? '...' : colors.length.toString()} 
              colorType="primary" 
              icon="fas fa-palette" 
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Màu hệ thống" 
              value="N/A" 
              colorType="info" 
              icon="fas fa-cog" 
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Màu tùy chỉnh" 
              value="N/A" 
              colorType="warning" 
              icon="fas fa-paint-brush" 
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Đang sử dụng" 
              value="N/A" 
              colorType="success" 
              icon="fas fa-check" 
            />
          </div>
        </div>
        
        {/* Bảng Màu sắc */}
        <div className="table-card">
          <div className="card-header d-flex flex-wrap justify-content-between align-items-center p-3">
            <h5 className="mb-0">Danh sách Màu sắc</h5>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-sm btn-primary" onClick={handleAddNewClick} disabled={loading}>
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Thêm màu
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Tên màu</th>
                    <th>Mã HEX</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderColorTable()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gọi hàm renderModals để "dịch chuyển" chúng ra #modal-root */}
      {renderModals()}
    </>
  );
};

export default ColorManagementPage;