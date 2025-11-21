// src/pages/ServiceManagementPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import ServiceTypeSidemenu from '../components/ServiceTypeSidemenu';
import { Service } from '../types/service';
import { serviceService } from '../services/serviceService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { brandService } from '../services/brandService';
import { Brand } from '../types/brand';

import {
  faEdit, faTrash, faPlus, faEye, faCopy,
  faUpload, faDownload, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faList,
  faCheck, faTimes, faUndo, faSpinner, faSearch
} from '@fortawesome/free-solid-svg-icons';

const API_LIMIT = 1000;  
const UI_PAGE_SIZE = 10;  

const initialFormState = {
  name: '',
  thuonghieu: '',
  description: '',
  price: '0',
  warranty: '6 tháng',
  note: '',
  mausac: ''
};

// Interface chỉ dùng cho việc hiển thị FE
interface PaginationInfo {
  totalItems: number; // Tổng số item đã tải về (ví dụ 1000)
  totalPages: number; // Tổng số trang hiển thị (ví dụ 1000/50 = 20 trang)
}

const ServiceManagementPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // Data chính
  const [services, setServices] = useState<Service[]>([]);
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phân trang Frontend
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({ totalItems: 0, totalPages: 1 });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  
  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentData, setCurrentData] = useState<any>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewService, setViewService] = useState<Service | null>(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const brandOptions = (Array.isArray(brands) ? brands : [])
    .map(brand => brand.name)
    .filter(name => name.trim() !== '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRootRef = useRef<HTMLElement | null>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  const handleServiceTypesChange = useCallback((types: string[]) => {
    setServiceTypes(types);
  }, []);

  const handleAddNewClick = () => {
    const defaultCategory = selectedCategory || (serviceTypes.length > 0 ? serviceTypes[0] : 'Khác');
    const defaultBrand = brandOptions.length > 0 ? brandOptions[0] : '';
    setCurrentData({
      ...initialFormState,
      name: defaultCategory,
      thuonghieu: defaultBrand
    });
    setIsEditMode(false);
    setEditId(null);
    setShowModal(true);
  };

  const handleRowSelect = (serviceId: string) => {
    setSelectedRows(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(serviceId)) {
        newSelected.delete(serviceId);
      } else {
        newSelected.add(serviceId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRows(new Set());
    } else {
      // Chỉ chọn những item đang hiển thị trên trang hiện tại hoặc chọn tất cả 1000 item tùy logic
      // Ở đây chọn tất cả các item đã tải về
      const allIds = new Set(services.map(service => service.id));
      setSelectedRows(allIds);
    }
    setIsAllSelected(!isAllSelected);
  };

  const clearSelection = () => {
    setSelectedRows(new Set());
    setIsAllSelected(false);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để xóa');
      return;
    }
    setDeleteId(Array.from(selectedRows).join(','));
    setShowDeleteModal(true);
  };

  const handleBulkExport = () => {
    if (selectedRows.size === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để xuất');
      return;
    }
    try {
      const selectedServices = services.filter(service => selectedRows.has(service.id));
      const data = selectedServices.map(s => ({
        'Mã DV': s.id,
        'Loại': s.name,
        'Thương hiệu': s.thuonghieu || '-',
        'Mô tả': s.description || '-',
        'Giá': parseFloat(s.price || '0').toLocaleString('vi-VN') + ' ₫',
        'Bảo hành': s.warranty || '-',
        'Ghi chú': s.note || '-',
        'Ngày tạo': new Date(s.created_at || '').toLocaleDateString('vi-VN')
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, 'DichVuDaChon');
      XLSX.writeFile(wb, `DichVu_DaChon_${selectedServices.length}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Đã xuất ${selectedServices.length} dịch vụ đã chọn!`);
    } catch (err) {
      toast.error('Lỗi khi xuất file Excel!');
    }
  };

  const handleRestoreToday = async () => {
    setIsRestoring(true);
    try {
      await serviceService.restoreAllDeletedServicesToday();
      toast.success('Đã khôi phục tất cả dịch vụ đã xóa hôm nay!');
      setShowRestoreModal(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Khôi phục thất bại!');
    } finally {
      setIsRestoring(false);
    }
  };

  useEffect(() => {
    clearSelection();
    // Khi search hoặc filter thay đổi, reset về trang 1
    setCurrentPage(1); 
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    setIsAllSelected(selectedRows.size === services.length && services.length > 0);
  }, [selectedRows, services]);

  // --- HÀM LOAD DATA (CHỈ GỌI API 1 LẦN LẤY 1000 ITEM) ---
  const loadServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Luôn gọi skip = 0 và limit = API_LIMIT (1000)
      const combinedSearch = [selectedCategory, searchQuery].filter(Boolean).join(' ');

      const response = await serviceService.getAllServices(0, API_LIMIT, combinedSearch);
      const servicesData: Service[] = response.data || response.items || response.services || [];
      
      setServices(servicesData);
      
      // Tính toán số trang hiển thị dựa trên UI_PAGE_SIZE
      const totalItems = servicesData.length;
      const totalPages = Math.ceil(totalItems / UI_PAGE_SIZE);
      
      setPaginationInfo({ totalItems, totalPages: totalPages > 0 ? totalPages : 1 });
      
    } catch (err: any) {
      console.error('Error loading services:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Lỗi tải dữ liệu';
      setError(msg);
      toast.error(msg);
      setServices([]);
      setPaginationInfo({ totalItems: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]); // Xóa currentPage khỏi dependency để tránh gọi API liên tục

  const loadAllComponentBrands = useCallback(async () => {
    setBrandsLoading(true);
    try {
      const response = await brandService.getAllBrands(0, 1000, '');
      setBrands(response.items || response.data || []);
    } catch (err) {
      console.error("Lỗi tải thương hiệu linh kiện:", err);
      toast.error('Không thể tải danh sách thương hiệu linh kiện');
      setBrands([]);
    } finally {
      setBrandsLoading(false);
    }
  }, []);

  useEffect(() => {
    modalRootRef.current = document.getElementById('modal-root');
    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = 'Quản lý Dịch vụ';
    if (subtitleEl) subtitleEl.textContent = 'Quản lý các dịch vụ sửa chữa thiết bị';
    loadAllComponentBrands();
  }, [loadAllComponentBrands]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadServices();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadServices]); // Bỏ currentPage ra khỏi đây

  const handleCategorySelect = (category: string | null) => setSelectedCategory(category);

  // --- XỬ LÝ CHUYỂN TRANG Ở FRONTEND ---
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= paginationInfo.totalPages && page !== currentPage) {
      setCurrentPage(page);
      // Scroll lên đầu bảng thay vì đầu trang web
      const tableElement = document.querySelector('.table-responsive');
      if (tableElement) tableElement.scrollTop = 0;
    }
  };

  const refreshAll = () => loadServices();

  const handleEditClick = (service: Service) => {
    setIsEditMode(true);
    setEditId(service.id);
    setCurrentData({
      name: service.name,
      thuonghieu: service.thuonghieu || '',
      description: service.description || '',
      price: service.price || '0',
      warranty: service.warranty || '',
      note: service.note || ''
    });
    setShowModal(true);
  };

  const handleViewClick = (service: Service) => {
    setViewService(service);
    setShowViewModal(true);
  };

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success('Đã copy mã dịch vụ!');
    } catch {
      toast.error('Không thể copy!');
    }
  };

  const handleExportExcel = () => {
    try {
      const data = services.map(s => ({
        'Mã DV': s.id,
        'Loại': s.name,
        'Thương hiệu': s.thuonghieu || '-',
        'Mô tả': s.description || '-',
        'Giá': parseFloat(s.price || '0').toLocaleString('vi-VN') + ' ₫',
        'Bảo hành': s.warranty || '-',
        'Ghi chú': s.note || '-',
        'Ngày tạo': new Date(s.created_at || '').toLocaleDateString('vi-VN')
      }));
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(wb, ws, 'DichVu');
      XLSX.writeFile(wb, `DichVu_${selectedCategory || 'TatCa'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`Đã xuất ${services.length} dịch vụ!`);
    } catch (err) {
      toast.error('Lỗi khi xuất file Excel!');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);
        let success = 0, errors = 0;
        for (const row of rows) {
          const serviceData = {
            name: row['Loại dịch vụ'] || row['Loại'] || 'Khác',
            thuonghieu: row['Thương hiệu'] || null,
            description: row['Mô tả'] || row['Máy'] || null,
            price: String(row['Giá (VND)'] || row['Giá'] || 0).replace(/\D/g, ''),
            warranty: row['Bảo hành'] || '6 tháng',
            note: row['Ghi chú'] || null,
            mausac: row['Màu sắc'] || null
          };
          try {
            await serviceService.createService(serviceData);
            success++;
          } catch (err) { errors++; }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
        toast[errors > 0 ? 'error' : 'success'](
          errors > 0
            ? `Import ${success} thành công, ${errors} lỗi!`
            : `Import thành công ${success} dịch vụ!`,
          { duration: errors > 0 ? 5000 : 3000 }
        );
        refreshAll();
      } catch {
        toast.error('File Excel không đúng định dạng!');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentData.name) return toast.error('Vui lòng chọn loại dịch vụ!');
    if (!currentData.description?.trim()) return toast.error('Vui lòng nhập Mô tả/Tên máy!');

    setIsSaving(true);
    try {
      if (isEditMode && editId) {
        await serviceService.updateService(editId, currentData);
        toast.success('Cập nhật thành công!');
      } else {
        await serviceService.createService(currentData);
        toast.success('Thêm dịch vụ thành công!');
      }
      setShowModal(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      if (deleteId.includes(',')) {
        const ids = deleteId.split(',');
        await serviceService.bulkDeleteServices(ids);
        toast.success(`Đã xóa ${ids.length} dịch vụ thành công!`);
      } else {
        await serviceService.deleteService(deleteId);
        toast.success('Xóa thành công!');
      }
      setShowDeleteModal(false);
      setDeleteId(null);
      clearSelection();
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Xóa thất bại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearSearch = () => setSearchQuery('');
  const clearFilter = () => setSelectedCategory(null);

  const renderPagination = () => {
    const { totalPages } = paginationInfo;
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button className="page-link rounded-pill" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }

    return (
      <nav className="d-flex justify-content-center">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><FontAwesomeIcon icon={faAnglesLeft} /></button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><FontAwesomeIcon icon={faChevronLeft} /></button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><FontAwesomeIcon icon={faChevronRight} /></button>
          </li>
          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><FontAwesomeIcon icon={faAnglesRight} /></button>
          </li>
        </ul>
      </nav>
    );
  };

  const renderServiceTable = () => {
    if (loading) return Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}><td colSpan={8} className="py-4"><div className="placeholder-glow"><div className="placeholder col-12 h-4 rounded mb-2"></div><div className="placeholder col-8 h-3 rounded"></div></div></td></tr>
    ));
    if (error) return (
      <tr><td colSpan={8} className="text-center py-5 text-danger">
        <FontAwesomeIcon icon={faTimes} size="3x" className="mb-3 opacity-50" />
        <div className="fw-medium">{error}</div>
        <button className="btn btn-primary rounded-pill mt-3 px-4" onClick={refreshAll}>Thử lại</button>
      </td></tr>
    );
    if (services.length === 0) return (
      <tr><td colSpan={8} className="text-center py-5 text-muted">
        <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
        <p className="mb-0 fw-medium">Không tìm thấy dịch vụ nào</p>
        {(searchQuery || selectedCategory) && (
          <button className="btn btn-outline-primary rounded-pill mt-3 px-4" onClick={() => { clearSearch(); clearFilter(); }}>Xóa bộ lọc</button>
        )}
      </td></tr>
    );

    // --- LOGIC CẮT DỮ LIỆU ĐỂ HIỂN THỊ (QUAN TRỌNG) ---
    const indexOfLastItem = currentPage * UI_PAGE_SIZE;
    const indexOfFirstItem = indexOfLastItem - UI_PAGE_SIZE;
    const currentTableData = services.slice(indexOfFirstItem, indexOfLastItem);

    return currentTableData.map(service => (
      <tr key={service.id} className={`${selectedRows.has(service.id) ? 'table-primary border-start border-4 border-primary' : ''} hover-lift`} onClick={() => handleRowSelect(service.id)}>
        <td className="ps-3"><div className="form-check"><input className="form-check-input" type="checkbox" checked={selectedRows.has(service.id)} onChange={() => handleRowSelect(service.id)} onClick={e => e.stopPropagation()} /></div></td>
        <td><div className="d-flex align-items-center gap-2"><code className="text-primary small font-monospace">{service.id.substring(0, 8)}...</code><button className="btn btn-sm btn-outline-secondary p-1 rounded-pill" onClick={e => { e.stopPropagation(); handleCopyId(service.id); }}><FontAwesomeIcon icon={faCopy} size="xs" /></button></div></td>
        <td><span className="badge rounded-pill px-3 py-2 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">{service.name}</span></td>
        <td className="fw-medium text-dark">{service.thuonghieu || '-'}</td>
        <td className="fw-semibold">{service.description || '-'}</td>
        <td className="text-success fw-bold fs-6">{parseFloat(service.price || '0').toLocaleString('vi-VN')} ₫</td>
        <td><span className="badge bg-warning text-dark border border-warning px-3 py-2 rounded-pill shadow-sm fw-semibold">{service.warranty || '6 tháng'}</span></td>
        <td className="text-center">
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-info btn-sm rounded-pill px-3" onClick={e => { e.stopPropagation(); handleViewClick(service); }}><FontAwesomeIcon icon={faEye} /></button>
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={e => { e.stopPropagation(); handleEditClick(service); }}><FontAwesomeIcon icon={faEdit} /></button>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={e => { e.stopPropagation(); setDeleteId(service.id); setShowDeleteModal(true); }}><FontAwesomeIcon icon={faTrash} /></button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderSelectionActions = () => selectedRows.size === 0 ? null : (
    <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm mb-4">
      <div className="d-flex align-items-center gap-2">
        <FontAwesomeIcon icon={faCheck} className="text-info" />
        <span className="fw-semibold">Đã chọn {selectedRows.size} dịch vụ</span>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-success btn-sm rounded-pill px-3" onClick={handleBulkExport}><FontAwesomeIcon icon={faDownload} className="me-1" /> Xuất Excel</button>
        <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleBulkDelete}><FontAwesomeIcon icon={faTrash} className="me-1" /> Xóa</button>
        <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={clearSelection}><FontAwesomeIcon icon={faTimes} className="me-1" /> Bỏ chọn</button>
      </div>
    </div>
  );

  const renderModals = () => {
    if (!modalRootRef.current) return null;
    return createPortal(
      <>
        {(showModal || showDeleteModal || showViewModal || showRestoreModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />}
        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />{isEditMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)} disabled={isSaving} />
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold text-primary">Loại dịch vụ *</label>
                        <select className="form-select rounded-3" value={currentData.name || ''} onChange={e => setCurrentData(prev => ({ ...prev, name: e.target.value }))} required disabled={isSaving}>
                          <option value="">-- Chọn loại dịch vụ --</option>
                          {serviceTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Mô tả/Máy *</label>
                        <input className="form-control rounded-3" value={currentData.description || ''} onChange={e => setCurrentData(prev => ({ ...prev, description: e.target.value }))} required disabled={isSaving} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Thương hiệu (Linh kiện)</label>
                        {brandsLoading ? (
                          <div className="form-control rounded-3 d-flex align-items-center gap-2">
                            <div className="spinner-border spinner-border-sm text-primary" role="status"><span className="visually-hidden">Đang tải...</span></div>Đang tải...
                          </div>
                        ) : (
                          <select className="form-select rounded-3" value={currentData.thuonghieu || ''} onChange={e => setCurrentData(prev => ({ ...prev, thuonghieu: e.target.value }))} disabled={isSaving}>
                            <option value="">-- Chọn thương hiệu --</option>
                            {brands.map(brand => (<option key={brand.id} value={brand.name}>{brand.name}</option>))}
                          </select>
                        )}
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Giá (VND) *</label>
                        <input type="number" min="0" className="form-control rounded-3" value={currentData.price || ''} onChange={e => setCurrentData(prev => ({ ...prev, price: e.target.value }))} required disabled={isSaving} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Bảo hành</label>
                        <input className="form-control rounded-3" value={currentData.warranty || ''} onChange={e => setCurrentData(prev => ({ ...prev, warranty: e.target.value }))} disabled={isSaving} />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Ghi chú</label>
                        <textarea className="form-control rounded-3" rows={2} value={currentData.note || ''} onChange={e => setCurrentData(prev => ({ ...prev, note: e.target.value }))} disabled={isSaving}></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowModal(false)} disabled={isSaving}><FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? <>Đang lưu...</> : <>{isEditMode ? 'Cập nhật' : 'Thêm mới'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xóa */}
        {showDeleteModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faTrash} className="me-2" /> Xác nhận xóa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} />
                </div>
                <div className="modal-body text-center py-5">
                  <FontAwesomeIcon icon={faTrash} size="3x" className="text-danger mb-3" />
                  <h6>{deleteId?.includes(',') ? `Xóa ${deleteId.split(',').length} dịch vụ?` : 'Xóa dịch vụ này?'}</h6>
                  <p className="text-muted">Không thể hoàn tác.</p>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Hủy</button>
                  <button className="btn btn-danger rounded-pill px-4" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? <>Đang xóa...</> : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Khôi phục */}
        {showRestoreModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-warning text-white">
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faUndo} className="me-2" /> Khôi phục</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setShowRestoreModal(false)} disabled={isRestoring} />
                </div>
                <div className="modal-body text-center py-5">
                  <FontAwesomeIcon icon={faUndo} size="3x" className="text-warning mb-3" />
                  <h6>Khôi phục tất cả dịch vụ đã xóa hôm nay?</h6>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowRestoreModal(false)} disabled={isRestoring}>Hủy</button>
                  <button className="btn btn-warning rounded-pill px-4 text-white" onClick={handleRestoreToday} disabled={isRestoring}>
                    {isRestoring ? <>Đang khôi phục...</> : <>Khôi phục</>}
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

  const renderViewModal = () => {
    if (!modalRootRef.current || !viewService || !showViewModal) return null;
    return createPortal(
      <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow-lg rounded-3">
            <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faEye} className="me-2" /> Chi tiết dịch vụ</h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)} />
            </div>
            <div className="modal-body p-4">
              <table className="table table-bordered">
                <tbody>
                  <tr><th className="bg-light w-25">Mã DV</th><td><code>{viewService.id}</code></td></tr>
                  <tr><th className="bg-light">Loại</th><td><span className="badge bg-primary rounded-pill px-3">{viewService.name}</span></td></tr>
                  <tr><th className="bg-light">Thương hiệu</th><td>{viewService.thuonghieu || '-'}</td></tr>
                  <tr><th className="bg-light">Mô tả/Máy</th><td>{viewService.description || '-'}</td></tr>
                  <tr><th className="bg-light">Giá</th><td className="text-success fw-bold">{parseFloat(viewService.price || '0').toLocaleString('vi-VN')} ₫</td></tr>
                  <tr><th className="bg-light">Bảo hành</th><td><span className="badge bg-warning rounded-pill px-3">{viewService.warranty || '6 tháng'}</span></td></tr>
                  <tr><th className="bg-light">Ghi chú</th><td>{viewService.note || '-'}</td></tr>
                  <tr><th className="bg-light">Ngày tạo</th><td>{viewService.created_at ? new Date(viewService.created_at).toLocaleDateString('vi-VN') : '-'}</td></tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer bg-light">
              <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowViewModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      </div>,
      modalRootRef.current
    );
  };

  return (
    <>
      <ServiceTypeSidemenu onCategorySelect={handleCategorySelect} selectedCategory={selectedCategory} onServiceTypesChange={handleServiceTypesChange} />
      <div className="col-12 col-lg-9 main-content-right d-flex flex-column gap-4">

        {/* Search & Actions */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white rounded-start-pill border-end-0"><FontAwesomeIcon icon={faSearch} className="text-muted" /></span>
                  <input type="text" placeholder="Tìm kiếm..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="form-control border-start-0 rounded-end-pill" />
                  {searchQuery && <button className="btn btn-outline-secondary rounded-pill" onClick={clearSearch}><FontAwesomeIcon icon={faTimes} /></button>}
                </div>
              </div>
              <div className="col-12 col-md-7">
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  {(searchQuery || selectedCategory) && <button className="btn btn-outline-secondary rounded-pill px-3" onClick={() => { clearSearch(); clearFilter(); }}><FontAwesomeIcon icon={faTimes} className="me-1" /> Xóa bộ lọc</button>}
                  <button className="btn btn-outline-warning rounded-pill px-3" onClick={() => setShowRestoreModal(true)}><FontAwesomeIcon icon={faUndo} className="me-2" /> Khôi phục</button>
                  <button className="btn btn-outline-success rounded-pill px-3" onClick={() => fileInputRef.current?.click()}><FontAwesomeIcon icon={faUpload} className="me-2" /> Import<input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="d-none" /></button>
                  <button onClick={handleExportExcel} className="btn btn-success rounded-pill px-3" disabled={services.length === 0}><FontAwesomeIcon icon={faDownload} className="me-2" /> Export</button>
                  <button onClick={handleAddNewClick} className="btn btn-primary rounded-pill px-3"><FontAwesomeIcon icon={faPlus} className="me-2" /> Thêm mới</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {renderSelectionActions()}

        {/* Table + Pagination luôn hiển thị */}
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div className="card-header text-white" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
            <h5 className="mb-0 d-flex align-items-center justify-content-between">
              <span><FontAwesomeIcon icon={faList} className="me-2" />Danh sách dịch vụ{selectedCategory && <span className="ms-2">→ {selectedCategory}</span>}</span>
              <span className="badge bg-white text-dark rounded-pill">{paginationInfo.totalItems.toLocaleString('vi-VN')} dịch vụ</span>
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive" style={{ maxHeight: '70vh' }}>
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light sticky-top" style={{ zIndex: 10 }}>
                  <tr>
                    <th className="ps-3" style={{ width: '40px' }}><div className="form-check"><input className="form-check-input" type="checkbox" checked={isAllSelected} onChange={handleSelectAll} disabled={services.length === 0} /></div></th>
                    <th style={{ width: '130px' }}>Mã</th>
                    <th style={{ width: '140px' }}>Loại</th>
                    <th style={{ width: '130px' }}>Thương hiệu</th>
                    <th>Mô tả/Máy</th>
                    <th style={{ width: '150px' }}>Giá</th>
                    <th style={{ width: '130px' }}>Bảo hành</th>
                    <th className="text-center" style={{ width: '160px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>{renderServiceTable()}</tbody>
              </table>
            </div>
          </div>

          {/* Phân trang luôn hiển thị */}
          <div className="card-footer bg-light border-top-0 pt-4">
            <div className="row align-items-center g-3">
              <div className="col-12 col-md-6">
                <div className="text-muted small fw-medium">
                  {loading ? (
                    <span className="text-primary"><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Đang tải dữ liệu...</span>
                  ) : error ? (
                    <span className="text-danger"><FontAwesomeIcon icon={faTimes} className="me-2" />Lỗi tải dữ liệu</span>
                  ) : paginationInfo.totalItems === 0 ? (
                    <span className="text-warning"><FontAwesomeIcon icon={faSearch} className="me-2" />Không tìm thấy dịch vụ nào</span>
                  ) : (
                    <>
                      Trang <strong>{currentPage}</strong> / <strong>{paginationInfo.totalPages}</strong> • Đang xem <strong>{Math.min(currentPage * UI_PAGE_SIZE, paginationInfo.totalItems) - Math.max(0, (currentPage - 1) * UI_PAGE_SIZE) + (currentPage === 1 && paginationInfo.totalItems === 0 ? 0 : 0)}</strong> / <strong>{paginationInfo.totalItems.toLocaleString('vi-VN')}</strong>
                      {selectedRows.size > 0 && <span className="text-primary ms-2">• Đã chọn <strong>{selectedRows.size}</strong></span>}
                    </>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="d-flex justify-content-md-end justify-content-center">
                  {renderPagination()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderModals()}
      {showViewModal && renderViewModal()}

      <style jsx>{`
        .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important; background-color: #f8f9fa !important; }
        .card:hover { box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important; }
        .badge { font-size: 0.85rem; }
      `}</style>
    </>
  );
};

export default ServiceManagementPage;