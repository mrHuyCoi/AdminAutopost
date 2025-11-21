// src/pages/ColorManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faDownload,
  faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight,
  faSearch, faSync, faPalette
} from '@fortawesome/free-solid-svg-icons';

import { colorService } from '../services/colorService';
import { Color } from '../types/color';

const modalRoot = document.getElementById('modal-root');
const ITEMS_PER_PAGE = 10;

interface ColorFormData {
  name: string;
  hex_code: string | null;
}

const initialFormState: ColorFormData = {
  name: '',
  hex_code: null,
};

const ColorManagementPage: React.FC = () => {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ColorFormData>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const loadColors = async (page: number = 1, search: string = '') => {
    setLoading(true);
    setError(null);

    const validPage = isNaN(page) || page < 1 ? 1 : page;
    const skip = (validPage - 1) * ITEMS_PER_PAGE;

    try {
      const params: any = { skip, limit: ITEMS_PER_PAGE };
      if (search.trim()) params.search = search.trim();

      const response = await colorService.getAllColors(params);
      setColors(response.data || []);
      setPagination({
        total: response.total || 0,
        page: response.page || validPage,
        pages: response.totalPages || 1 // Đảm bảo ít nhất là 1 trang
      });
      setCurrentPage(validPage);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải dữ liệu');
      console.error('API Error:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const page = isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
    loadColors(page, searchTerm);
  }, [currentPage, searchTerm]);

  const handlePageChange = (page: number) => {
    // Cho phép chuyển trang nếu page hợp lệ (>=1 và <= tổng số trang thực tế hoặc 1 nếu chưa có data)
    const maxPage = Math.max(1, pagination.pages);
    if (isNaN(page) || page < 1 || page > maxPage) return;
    setCurrentPage(page);
  };

  const handleAddNew = () => {
    setCurrentData(initialFormState);
    setIsEditMode(false);
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (color: Color) => {
    setCurrentData({
      name: color.name,
      hex_code: color.hex_code || null,
    });
    setIsEditMode(true);
    setEditId(color.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      if (isEditMode && editId) {
        await colorService.updateColor(editId, currentData);
        toast.success('Cập nhật thành công');
      } else {
        await colorService.createColor(currentData);
        toast.success('Thêm thành công');
      }
      setShowModal(false);
      loadColors(currentPage, searchTerm);
      setSelectedColors([]);
      setSelectAll(false);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await colorService.deleteColor(deleteId);
      toast.success('Xóa thành công');
      setShowDeleteModal(false);
      loadColors(currentPage, searchTerm);
      setSelectedColors([]);
      setSelectAll(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedColors([]);
    } else {
      setSelectedColors(colors.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectColor = (id: string) => {
    setSelectedColors(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedColors.length === 0) return;
    if (!window.confirm(`Xóa ${selectedColors.length} màu?`)) return;

    setLoading(true);
    try {
      for (const id of selectedColors) {
        await colorService.deleteColor(id);
      }
      toast.success('Xóa hàng loạt thành công');
      loadColors(currentPage, searchTerm);
      setSelectedColors([]);
      setSelectAll(false);
    } catch (err) {
      toast.error('Lỗi xóa hàng loạt');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const data = colors.map(c => ({
      ID: c.id,
      'Tên màu': c.name,
      'Mã HEX': c.hex_code || 'N/A',
      'Người tạo': c.user_id || 'N/A',
      'Ngày tạo': new Date(c.created_at).toLocaleDateString('vi-VN'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Màu sắc');
    XLSX.writeFile(wb, 'colors.xlsx');
  };

  const renderTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={5} className="py-4">
            <div className="d-flex align-items-center p-3">
              <div className="placeholder-glow w-100">
                <div className="placeholder col-6 h-4 rounded"></div>
                <div className="placeholder col-4 h-3 rounded mt-2"></div>
              </div>
            </div>
          </td>
        </tr>
      ));
    }

    if (error) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-5">
            <div className="alert alert-danger d-inline-block p-4 rounded-3 shadow-sm">
              <FontAwesomeIcon icon={faPalette} className="me-2" />
              {error}
            </div>
          </td>
        </tr>
      );
    }

    if (colors.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-1 fw-medium">Không có màu nào</p>
            <small>Nhấn <strong>"Thêm màu"</strong> để bắt đầu</small>
          </td>
        </tr>
      );
    }

    return colors.map(color => (
      <tr key={color.id} className="align-middle transition-all hover-bg-light">
        <td className="ps-4 py-3">
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={selectedColors.includes(color.id)}
              onChange={() => handleSelectColor(color.id)}
            />
            <label className="form-check-label fw-medium text-dark ms-2">
              {color.name}
            </label>
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center">
            <div
              className="me-3 rounded-3 shadow-sm"
              style={{
                width: 40,
                height: 40,
                backgroundColor: color.hex_code || '#ccc',
                border: '2px solid #fff',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            />
            <span className="font-monospace small fw-medium">{color.hex_code || 'N/A'}</span>
          </div>
        </td>
        <td className="text-muted small">{color.user_id || 'N/A'}</td>
        <td className="text-muted small">
          {new Date(color.created_at).toLocaleDateString('vi-VN')}
        </td>
        <td className="text-center">
          <div className="btn-group btn-group-sm">
            <button
              className="btn btn-outline-primary rounded-pill px-3"
              onClick={() => handleEdit(color)}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              className="btn btn-outline-danger rounded-pill px-3"
              onClick={() => handleDelete(color.id)}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderPagination = () => {
    // BỎ ĐIỀU KIỆN ẨN NẾU CHỈ CÓ 1 TRANG
    // if (pagination.pages <= 1) return null; 

    // Đảm bảo luôn có ít nhất 1 trang để hiển thị số 1
    const totalPages = Math.max(1, pagination.pages);
    
    const delta = 1;
    const pages = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      pages.push(i);
    }
    
    if (pages[0] > 1) {
        if (pages[0] > 2) {
            pages.unshift('...');
        }
        pages.unshift(1);
    }
    
    if (pages[pages.length - 1] < totalPages) {
        if (pages[pages.length - 1] < totalPages - 1) {
            pages.push('...');
        }
        pages.push(totalPages);
    }

    return (
      <div className="d-flex justify-content-center align-items-center gap-1 mt-3">
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
          <FontAwesomeIcon icon={faAnglesLeft} />
        </button>
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        {pages.map((p, i) => (
          <React.Fragment key={i}>
            {p === '...' ? (
              <span className="px-2 text-muted">...</span>
            ) : (
              <button
                className={`btn btn-sm rounded-pill ${p === currentPage ? 'btn-primary text-white' : 'btn-outline-secondary'} px-3`}
                onClick={() => handlePageChange(p as number)}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}

        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}>
          <FontAwesomeIcon icon={faAnglesRight} />
        </button>
      </div>
    );
  };

  const renderModal = () => {
    if (!modalRoot || !showModal) return null;

    return createPortal(
      <div className="modal fade show d-block" style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg rounded-3 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div
                className="modal-header text-white"
                style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}
              >
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  <FontAwesomeIcon icon={faPalette} className="me-2" />
                  {isEditMode ? 'Cập nhật màu' : 'Thêm màu mới'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                />
              </div>

              <div className="modal-body p-4">
                {modalError && (
                  <div className="alert alert-danger rounded-3 shadow-sm mb-4">
                    {modalError}
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-semibold text-primary">Tên màu <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={currentData.name}
                    onChange={(e) => setCurrentData({ ...currentData, name: e.target.value })}
                    required
                    placeholder="Vàng, Đen, Trắng..."
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Mã HEX</label>
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={currentData.hex_code || ''}
                    onChange={(e) => setCurrentData({ ...currentData, hex_code: e.target.value || null })}
                    placeholder="#FF0000"
                  />
                  {currentData.hex_code && (
                    <div
                      className="mt-3 p-4 rounded-3 shadow-sm text-white fw-bold text-center"
                      style={{
                        backgroundColor: currentData.hex_code,
                        minHeight: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                      }}
                    >
                      {currentData.hex_code.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer bg-light rounded-bottom">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setShowModal(false)}
                  disabled={isSaving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-pill px-4"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <FontAwesomeIcon icon={faSync} spin className="me-2" />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>,
      modalRoot
    );
  };

  const renderDeleteModal = () => {
    if (!modalRoot || !showDeleteModal) return null;

    return createPortal(
      <div className="modal fade show d-block" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg rounded-3">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title fw-bold">
                <FontAwesomeIcon icon={faTrash} className="me-2" />
                Xác nhận xóa
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              />
            </div>
            <div className="modal-body p-4">
              <p className="mb-0 fw-medium">
                Bạn có chắc chắn muốn <span className="text-danger">xóa màu này</span>?
              </p>
            </div>
            <div className="modal-footer bg-light rounded-bottom">
              <button
                type="button"
                className="btn btn-secondary rounded-pill px-4"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-pill px-4"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <FontAwesomeIcon icon={faSync} spin className="me-2" />
                    Đang xóa...
                  </>
                ) : (
                  'Xóa'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>,
      modalRoot
    );
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faPalette} className="me-2 text-primary" />
            Quản lý Màu sắc
          </h1>
          <p className="text-muted mb-0 small">Thêm, sửa, xóa và xuất danh sách màu</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button
            className="btn btn-success rounded-pill shadow-sm px-4 d-flex align-items-center"
            onClick={handleAddNew}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Thêm màu
          </button>
          <button
            className="btn btn-outline-success rounded-pill px-4 d-flex align-items-center"
            onClick={handleExportExcel}
            disabled={colors.length === 0}
          >
            <FontAwesomeIcon icon={faDownload} className="me-2" />
            Xuất Excel
          </button>
          {selectedColors.length > 0 && (
            <button
              className="btn btn-danger rounded-pill px-4 d-flex align-items-center"
              onClick={handleBulkDelete}
            >
              <FontAwesomeIcon icon={faTrash} className="me-2" />
              Xóa ({selectedColors.length})
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-center">
            <div className="col-lg-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 rounded-end-pill"
                  placeholder="Tìm tên màu, mã HEX..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-3">
              <button
                className="btn btn-outline-primary rounded-pill w-100 d-flex align-items-center justify-content-center"
                onClick={() => loadColors(currentPage, searchTerm)}
                disabled={loading}
              >
                <FontAwesomeIcon icon={loading ? faSync : faSync} spin={loading} className="me-2" />
                {loading ? '...' : 'Tải lại'}
              </button>
            </div>
            <div className="col-lg-3 text-lg-end">
              <small className="text-muted">
                Tổng: <strong className="text-primary fw-bold">{pagination.total}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div
          className="card-header text-white d-flex justify-content-between align-items-center"
          style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}
        >
          <h5 className="mb-0 fw-bold">Danh sách màu</h5>
          <small className="opacity-90">
            Hiển thị <strong>{colors.length}</strong> / <strong>{pagination.total}</strong>
          </small>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                      <label className="form-check-label ms-2 fw-semibold">Tên màu</label>
                    </div>
                  </th>
                  <th className="fw-semibold">Mã HEX</th>
                  <th className="fw-semibold">Người tạo</th>
                  <th className="fw-semibold">Ngày tạo</th>
                  <th className="text-center fw-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {renderTable()}
              </tbody>
            </table>
          </div>
        </div>
        {/* LUÔN HIỂN THỊ PHẦN NÀY - Đã xóa điều kiện check pagination.total > 0 */}
        <div className="card-footer bg-light d-flex justify-content-between align-items-center flex-wrap gap-3 p-3">
            <small className="text-muted">
              Trang <strong>{currentPage}</strong> / <strong>{Math.max(1, pagination.pages)}</strong>
            </small>
            {renderPagination()}
        </div>
      </div>

      {renderModal()}
      {renderDeleteModal()}
    </div>
  );
};

export default ColorManagementPage;