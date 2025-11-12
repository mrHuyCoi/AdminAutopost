// src/pages/BrandManagementPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import StatCard from '../components/StatCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, faTrash, faPlus, faDownload, faUpload, faEye, faCopy, 
  faChevronLeft, faChevronRight, faAnglesLeft, faAnglesRight,
  faCopyright, faMobileAlt, faBuilding, faSearch, faTimes
} from '@fortawesome/free-solid-svg-icons';
import { Brand, BrandCreate } from '../types/brand';
import { brandService } from '../services/brandService';
import { serviceService } from '../services/serviceService';
import { useBrands } from '../contexts/BrandContext';

const ITEMS_PER_PAGE = 10;

interface BrandFormData {
  name: string;
  description: string | null;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

const initialFormState: BrandFormData = {
  name: '',
  description: null
};

interface ServiceStats {
  total: number;
  apple: number;
  samsung: number;
  xiaomi: number;
}

const BrandManagementPage: React.FC = () => {
  // SỬA: Sử dụng brands từ context thay vì local state
  const { brands, loading, error, refreshBrands, addBrand, updateBrand, deleteBrand } = useBrands();
  
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<ServiceStats>({ total: 0, apple: 0, samsung: 0, xiaomi: 0 });

  // MODAL
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentData, setCurrentData] = useState<BrandFormData>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const modalRootRef = useRef<HTMLElement | null>(null);

  // FIX: Load brand stats từ services thực tế
  const loadBrandStats = useCallback(async () => {
    try {
      const response = await serviceService.getAllServices(1, 1000);
      const services = response.data || [];
      
      const brandCounts = services.reduce((acc, service) => {
        const brand = service.thuonghieu?.toLowerCase() || '';
        if (brand.includes('apple')) acc.apple++;
        if (brand.includes('samsung')) acc.samsung++;
        if (brand.includes('xiaomi')) acc.xiaomi++;
        return acc;
      }, { apple: 0, samsung: 0, xiaomi: 0 });

      setStats({
        total: services.length,
        apple: brandCounts.apple,
        samsung: brandCounts.samsung,
        xiaomi: brandCounts.xiaomi
      });
    } catch (error) {
      console.error('Error loading brand stats:', error);
    }
  }, []);

  // FIX: Cập nhật pagination khi brands hoặc search query thay đổi
  const updatePagination = useCallback(() => {
    const filteredBrands = brands.filter(brand => 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const total = filteredBrands.length;
    const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
    
    setPagination({
      total: total,
      page: currentPage,
      pages: totalPages
    });
  }, [brands, searchQuery, currentPage]);

  useEffect(() => {
    modalRootRef.current = document.getElementById('modal-root');
    
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = 'Quản lý Thương hiệu';
    if (subtitleEl) subtitleEl.textContent = 'Quản lý các thương hiệu thiết bị';
    
    // Load stats khi component mount
    loadBrandStats();
  }, [loadBrandStats]);

  // FIX: Cập nhật pagination khi dependencies thay đổi
  useEffect(() => {
    updatePagination();
  }, [updatePagination]);

  // FIX: Debounce search với cleanup
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      updatePagination();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery, updatePagination]);

  const handleAddNewClick = () => {
    setCurrentData(initialFormState);
    setIsEditMode(false);
    setEditId(null);
    setShowModal(true);
  };

  const handleEditClick = (brand: Brand) => {
    setIsEditMode(true);
    setEditId(brand.id);
    setCurrentData({
      name: brand.name,
      description: brand.description || null
    });
    setShowModal(true);
  };

  // FIX: Sửa hàm handleFormSubmit để sử dụng context
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentData.name.trim()) {
      toast.error('Vui lòng nhập tên thương hiệu!');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && editId) {
        const updatedBrand = await brandService.updateBrand(editId, currentData);
        updateBrand(editId, updatedBrand);
        toast.success('Cập nhật thành công!');
      } else {
        const newBrand = await brandService.createBrand(currentData);
        addBrand(newBrand);
        toast.success('Thêm thương hiệu thành công!');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setIsSaving(false);
    }
  };

  // FIX: Sửa hàm handleConfirmDelete để sử dụng context
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      await brandService.deleteBrand(deleteId);
      deleteBrand(deleteId);
      toast.success('Xóa thành công!');
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Xóa thất bại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const filteredBrands = getCurrentPageBrands();
      const data = filteredBrands.map(brand => ({
        'Mã': brand.id,
        'Tên thương hiệu': brand.name,
        'Số sản phẩm': brand.product_count || 0,
        'Mô tả': brand.description || '-'
      }));
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      
      ws['!cols'] = [
        { wch: 10 }, // Mã
        { wch: 20 }, // Tên thương hiệu
        { wch: 15 }, // Số sản phẩm
        { wch: 30 }  // Mô tả
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, 'ThuongHieu');
      XLSX.writeFile(wb, `ThuongHieu_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success(`Xuất ${filteredBrands.length} thương hiệu thành công!`);
    } catch (err) {
      toast.error('Lỗi khi xuất file Excel!');
    }
  };

  // FIX: Hàm lấy brands cho trang hiện tại
  const getCurrentPageBrands = () => {
    const filteredBrands = brands.filter(brand => 
      brand.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    
    return filteredBrands.slice(startIndex, endIndex);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => setCurrentPage(i)}
            aria-label={`Trang ${i}`}
          >
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav className="d-flex justify-content-center mt-3" aria-label="Phân trang">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(1)}
              aria-label="Trang đầu"
            >
              <FontAwesomeIcon icon={faAnglesLeft} />
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(currentPage - 1)}
              aria-label="Trang trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(currentPage + 1)}
              aria-label="Trang sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </li>
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => setCurrentPage(pagination.pages)}
              aria-label="Trang cuối"
            >
              <FontAwesomeIcon icon={faAnglesRight} />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const renderTable = () => {
    const currentBrands = getCurrentPageBrands();
    
    if (loading) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
          </td>
        </tr>
      );
    }
    
    if (error) {
      return (
        <tr>
          <td colSpan={3} className="text-center text-danger py-5">
            <FontAwesomeIcon icon={faTimes} size="2x" className="mb-3" />
            <div>{error}</div>
            <button className="btn btn-primary mt-3" onClick={refreshBrands}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    
    if (currentBrands.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="2x" className="mb-3 opacity-50" />
            <div>Không tìm thấy thương hiệu nào</div>
            {searchQuery && (
              <button className="btn btn-outline-primary mt-3" onClick={clearSearch}>
                Xóa tìm kiếm
              </button>
            )}
          </td>
        </tr>
      );
    }

    return currentBrands.map(brand => (
      <tr key={brand.id}>
        <td className="ps-4">
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle border d-flex align-items-center justify-content-center"
              style={{ 
                width: '50px', 
                height: '50px', 
                background: '#f8f9fa',
                padding: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#007bff'
              }}
            >
              {brand.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong className="d-block">{brand.name}</strong>
              <small className="text-muted">ID: {brand.id}</small>
              {brand.description && (
                <small className="text-muted d-block mt-1">{brand.description}</small>
              )}
            </div>
          </div>
        </td>
        <td className="text-center">
          <span className="fw-bold text-primary fs-5">{brand.product_count?.toLocaleString() || 0}</span>
        </td>
        <td className="text-center">
          <div className="btn-group btn-group-sm" role="group" aria-label="Hành động">
            <button 
              className="btn btn-outline-primary" 
              onClick={() => handleEditClick(brand)}
              aria-label={`Sửa thương hiệu ${brand.name}`}
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button 
              className="btn btn-outline-danger" 
              onClick={() => { setDeleteId(brand.id); setShowDeleteModal(true); }}
              aria-label={`Xóa thương hiệu ${brand.name}`}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRootRef.current) return null;
    
    const hasActiveModal = showModal || showDeleteModal;
    
    return createPortal(
      <>
        {hasActiveModal && (
          <div 
            className="modal-backdrop fade show" 
            onClick={() => {
              setShowModal(false);
              setShowDeleteModal(false);
            }}
            style={{ zIndex: 1040 }}
          />
        )}

        {showModal && (
          <div 
            className="modal fade show" 
            style={{ display: 'block', zIndex: 1050 }}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-header bg-gradient-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                      {isEditMode ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu mới'}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close btn-close-white" 
                      onClick={() => setShowModal(false)}
                      disabled={isSaving}
                      aria-label="Đóng"
                    />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label htmlFor="brandName" className="form-label fw-semibold text-primary">
                        Tên thương hiệu *
                      </label>
                      <input 
                        id="brandName"
                        name="name" 
                        className="form-control" 
                        value={currentData.name} 
                        onChange={e => setCurrentData(prev => ({ ...prev, name: e.target.value }))} 
                        required 
                        disabled={isSaving}
                        placeholder="Nhập tên thương hiệu"
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="brandDescription" className="form-label fw-semibold">
                        Mô tả
                      </label>
                      <textarea 
                        id="brandDescription"
                        name="description" 
                        className="form-control" 
                        placeholder="Mô tả thương hiệu (tùy chọn)" 
                        value={currentData.description || ''} 
                        onChange={e => setCurrentData(prev => ({ ...prev, description: e.target.value || null }))}
                        disabled={isSaving}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowModal(false)} 
                      disabled={isSaving}
                    >
                      Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary px-4" 
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                          {isEditMode ? 'Cập nhật' : 'Thêm mới'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && (
          <div 
            className="modal fade show" 
            style={{ display: 'block', zIndex: 1050 }}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg">
                <div className="modal-header bg-gradient-danger text-white">
                  <h5 className="modal-title">
                    <FontAwesomeIcon icon={faTrash} className="me-2" />
                    Xác nhận xóa
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close btn-close-white" 
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    aria-label="Đóng"
                  />
                </div>
                <div className="modal-body text-center py-4">
                  <FontAwesomeIcon icon={faTrash} size="3x" className="text-danger mb-3 opacity-75" />
                  <h6 className="fw-bold">Bạn có chắc muốn xóa thương hiệu này?</h6>
                  <p className="text-muted mb-0">
                    Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn dữ liệu.
                  </p>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowDeleteModal(false)} 
                    disabled={isDeleting}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn btn-danger px-4" 
                    onClick={handleConfirmDelete} 
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Đang xóa...
                      </>
                    ) : (
                      'Xóa'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      modalRootRef.current
    );
  };

  const currentBrands = getCurrentPageBrands();

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-4">
        {/* Statistics Cards */}
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <StatCard 
              title="Tổng dịch vụ" 
              value={stats.total} 
              colorType="primary" 
              iconComponent={<FontAwesomeIcon icon={faCopyright} size="lg" />}
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Apple" 
              value={stats.apple} 
              colorType="success" 
              iconComponent={<FontAwesomeIcon icon={faMobileAlt} size="lg" />}
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Samsung" 
              value={stats.samsung} 
              colorType="info" 
              iconComponent={<FontAwesomeIcon icon={faBuilding} size="lg" />}
            />
          </div>
          <div className="col-6 col-md-3">
            <StatCard 
              title="Xiaomi" 
              value={stats.xiaomi} 
              colorType="warning" 
              iconComponent={<FontAwesomeIcon icon={faMobileAlt} size="lg" />}
            />
          </div>
        </div>

        {/* Search and Actions */}
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm thương hiệu..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="form-control border-start-0"
                    aria-label="Tìm kiếm thương hiệu"
                  />
                  {searchQuery && (
                    <button 
                      className="btn btn-outline-secondary border-start-0" 
                      type="button"
                      onClick={clearSearch}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-7">
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  {searchQuery && (
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={clearSearch}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-1" />
                      Xóa tìm kiếm
                    </button>
                  )}
                  <button 
                    onClick={handleExportExcel} 
                    className="btn btn-success"
                    disabled={currentBrands.length === 0}
                  >
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Export Excel
                  </button>
                  <button 
                    onClick={handleAddNewClick} 
                    className="btn btn-primary"
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm thương hiệu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faCopyright} className="me-2" />
              Danh sách thương hiệu
            </h5>
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-light text-primary">
                {currentBrands.length} / {pagination.total}
              </span>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-4">Thương hiệu</th>
                    <th scope="col" className="text-center">Số sản phẩm</th>
                    <th scope="col" className="text-center" style={{ width: '140px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {renderTable()}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-light">
            <div className="row align-items-center">
              <div className="col-md-6">
                <small className="text-muted">
                  Hiển thị {currentBrands.length} trên tổng số {pagination.total} thương hiệu
                </small>
              </div>
              <div className="col-md-6">
                {renderPagination()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderModals()}

      {/* Custom CSS */}
      <style jsx>{`
        .bg-gradient-primary {
          background: linear-gradient(135deg, var(--bs-primary), #0056b3) !important;
        }
        .bg-gradient-danger {
          background: linear-gradient(135deg, var(--bs-danger), #dc3545) !important;
        }
      `}</style>
    </>
  );
};

export default BrandManagementPage;