// src/pages/ServiceManagementPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import StatCard from '../components/StatCard';
import ServiceTypeSidemenu from '../components/ServiceTypeSidemenu';
import { Service } from '../types/service';
import { serviceService } from '../services/serviceService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { brandService } from '../services/brandService';
import { Brand } from '../types/brand';

import {
  faEdit, faTrash, faPlus, faEye, faCopy,
  faUpload, faDownload, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faList, faMobileAlt,
  faMicrochip, faBatteryFull, faCheck, faFilter,
  faSearch, faTimes, faUndo
} from '@fortawesome/free-solid-svg-icons';

const ITEMS_PER_PAGE = 10;

const initialFormState = {
  name: '',
  thuonghieu: '',
  description: '',
  price: '0',
  warranty: '6 tháng',
  note: '',
  mausac: ''
};

interface ServiceStats {
  total: number;
  thayPin: number;
  epKinh: number;
  thayMain: number;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

const DebugInfo: React.FC = () => {
  return (
    <div className="debug-info small text-muted mb-2" style={{ display: 'none' }}>
      Debug: ServiceManagementPage loaded
    </div>
  );
};

const ServiceManagementPage: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 1 });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<ServiceStats>({ total: 0, thayPin: 0, epKinh: 0, thayMain: 0 });

  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
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
      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 25 }, { wch: 12 }
      ];
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
  }, [services, currentPage, searchQuery, selectedCategory]);

  useEffect(() => {
    if (services.length > 0) {
      setIsAllSelected(selectedRows.size === services.length && services.length > 0);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedRows, services]);

  const calculateStatsFromServices = useCallback((servicesList: Service[], totalServices: number): ServiceStats => {
    const counts = servicesList.reduce((acc, s) => {
      if (s.name === 'Thay pin') acc.thayPin++;
      if (s.name === 'Ép kính') acc.epKinh++;
      if (s.name === 'Thay main') acc.thayMain++;
      return acc;
    }, { thayPin: 0, epKinh: 0, thayMain: 0 });

    return {
      total: totalServices,
      thayPin: counts.thayPin,
      epKinh: counts.epKinh,
      thayMain: counts.thayMain
    };
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setStats(calculateStatsFromServices(services, pagination.total));
    } catch {
      setStats(calculateStatsFromServices(services, pagination.total));
    }
  }, [services, calculateStatsFromServices, pagination.total]);

  const loadServices = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      const skip = (page - 1) * ITEMS_PER_PAGE;
      const combinedSearch = [selectedCategory, searchQuery]
        .filter(Boolean)
        .join(' ');

      const response = await serviceService.getAllServices(
        skip,
        ITEMS_PER_PAGE,
        combinedSearch
      );

      const servicesData: Service[] = response.data || [];
      const total = response.total ?? 0;
      const totalPages = response.totalPages ?? 1;


      setServices(servicesData);
      setPagination({
        total: total,
        page: page,
        pages: totalPages
      });

      setStats(calculateStatsFromServices(servicesData, total));

    } catch (err: any) {
      console.error('Error loading services:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Lỗi tải dữ liệu';
      setError(msg);
      toast.error(msg);
      setServices([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, calculateStatsFromServices]);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        loadServices(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, loadServices]);

  useEffect(() => {
    loadServices(currentPage);
  }, [currentPage, loadServices]);

  useEffect(() => {
    if (services.length > 0 || pagination.total > 0) {
      loadStats();
    }
  }, [pagination.total, loadStats, services]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.pages && page !== currentPage) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const refreshAll = () => loadServices(currentPage);

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
      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 25 }, { wch: 12 }
      ];
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

        let success = 0;
        let errors = 0;

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
          } catch (err) {
            console.error("Lỗi khi import dòng:", row, err);
            errors++;
          }
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        if (errors > 0) {
          toast.error(`Import ${success} thành công, ${errors} lỗi!`, { duration: 5000 });
        } else {
          toast.success(`Import thành công ${success} dịch vụ!`);
        }

        refreshAll();
      } catch {
        toast.error('File Excel không đúng định dạng!');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentData.name) {
      toast.error('Vui lòng chọn loại dịch vụ!');
      return;
    }

    if (!currentData.description?.trim()) {
      toast.error('Vui lòng nhập Mô tả/Tên máy!');
      return;
    }

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

  const closeAllModals = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setShowRestoreModal(false);
    setDeleteId(null);
    setViewService(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilter = () => {
    setSelectedCategory(null);
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
          <button className="page-link rounded-pill" onClick={() => handlePageChange(i)}>{i}</button>
        </li>
      );
    }
    return (
      <nav className="d-flex justify-content-center mt-3">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(1)} disabled={currentPage === 1}>
              <FontAwesomeIcon icon={faAnglesLeft} />
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === pagination.pages}>
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </li>
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button className="page-link rounded-pill" onClick={() => handlePageChange(pagination.pages)} disabled={currentPage === pagination.pages}>
              <FontAwesomeIcon icon={faAnglesRight} />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const renderServiceTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={8} className="py-4">
            <div className="placeholder-glow">
              <div className="placeholder col-12 h-4 rounded mb-2"></div>
              <div className="placeholder col-8 h-3 rounded"></div>
            </div>
          </td>
        </tr>
      ));
    }
    if (error) {
      return (
        <tr>
          <td colSpan={8} className="text-center py-5 text-danger">
            <FontAwesomeIcon icon={faTimes} size="3x" className="mb-3 opacity-50" />
            <div className="fw-medium">{error}</div>
            <button className="btn btn-primary rounded-pill mt-3 px-4" onClick={refreshAll}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (services.length === 0) {
      return (
        <tr>
          <td colSpan={8} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-0 fw-medium">Không tìm thấy dịch vụ nào</p>
            {(searchQuery || selectedCategory) && (
              <button className="btn btn-outline-primary rounded-pill mt-3 px-4" onClick={() => { clearSearch(); clearFilter(); }}>
                Xóa bộ lọc
              </button>
            )}
          </td>
        </tr>
      );
    }
    return services.map(service => (
      <tr
        key={service.id}
        className={`${selectedRows.has(service.id) ? 'table-primary border-start border-4 border-primary' : ''} hover-lift`}
        onClick={() => handleRowSelect(service.id)}
      >
        <td className="ps-3">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              checked={selectedRows.has(service.id)}
              onChange={() => handleRowSelect(service.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </td>
        <td>
          <div className="d-flex align-items-center gap-2">
            <code className="text-primary small font-monospace">{service.id.substring(0, 8)}...</code>
            <button
              className="btn btn-sm btn-outline-secondary p-1 rounded-pill"
              onClick={(e) => { e.stopPropagation(); handleCopyId(service.id); }}
            >
              <FontAwesomeIcon icon={faCopy} size="xs" />
            </button>
          </div>
        </td>
        <td>
          <span className="badge rounded-pill px-3 py-2 bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25">
            {service.name}
          </span>
        </td>
        <td className="fw-medium text-dark">{service.thuonghieu || '-'}</td>
        <td className="fw-semibold">{service.description || '-'}</td>
        <td className="text-success fw-bold fs-6">
          {parseFloat(service.price || '0').toLocaleString('vi-VN')} ₫
        </td>
        <td>
          <span className="badge bg-warning text-dark border border-warning px-3 py-2 rounded-pill shadow-sm fw-semibold">
            {service.warranty || '6 tháng'}
          </span>
        </td>
        <td className="text-center">
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-info btn-sm rounded-pill px-3" onClick={(e) => { e.stopPropagation(); handleViewClick(service); }}>
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={(e) => { e.stopPropagation(); handleEditClick(service); }}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={(e) => { e.stopPropagation(); setDeleteId(service.id); setShowDeleteModal(true); }}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderStatsCards = () => (
    <div className="row g-4">
      <div className="col-6 col-md-3">
        <StatCard title="Tổng dịch vụ" value={stats.total} colorType="primary" iconComponent={<FontAwesomeIcon icon={faList} size="2x" />} gradient={true} />
      </div>
      <div className="col-6 col-md-3">
        <StatCard title="Thay pin" value={stats.thayPin} colorType="success" iconComponent={<FontAwesomeIcon icon={faBatteryFull} size="2x" />} gradient={true} />
      </div>
      <div className="col-6 col-md-3">
        <StatCard title="Ép kính" value={stats.epKinh} colorType="info" iconComponent={<FontAwesomeIcon icon={faMobileAlt} size="2x" />} gradient={true} />
      </div>
      <div className="col-6 col-md-3">
        <StatCard title="Thay main" value={stats.thayMain} colorType="warning" iconComponent={<FontAwesomeIcon icon={faMicrochip} size="2x" />} gradient={true} />
      </div>
    </div>
  );

  const renderSelectionActions = () => {
    if (selectedRows.size === 0) return null;
    return (
      <div className="alert alert-info d-flex align-items-center justify-content-between p-3 rounded-3 shadow-sm mb-4">
        <div className="d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faCheck} className="text-info" />
          <span className="fw-semibold">Đã chọn {selectedRows.size} dịch vụ</span>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-success btn-sm rounded-pill px-3" onClick={handleBulkExport}>
            <FontAwesomeIcon icon={faDownload} className="me-1" /> Xuất Excel
          </button>
          <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={handleBulkDelete}>
            <FontAwesomeIcon icon={faTrash} className="me-1" /> Xóa
          </button>
          <button className="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={clearSelection}>
            <FontAwesomeIcon icon={faTimes} className="me-1" /> Bỏ chọn
          </button>
        </div>
      </div>
    );
  };

  const hasActiveModal = showModal || showDeleteModal || showViewModal || showRestoreModal;

  const renderModals = () => {
    if (!modalRootRef.current) return null;
    return createPortal(
      <>
        {hasActiveModal && (
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        )}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                    {isEditMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
                  </h5>
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
                        <small className="text-muted">Đồng bộ từ danh sách loại ({serviceTypes.length})</small>
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Mô tả/Máy *</label>
                        <input className="form-control rounded-3" value={currentData.description || ''} onChange={e => setCurrentData(prev => ({ ...prev, description: e.target.value }))} required disabled={isSaving} />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label fw-semibold">Thương hiệu (Linh kiện)</label>
                        {brandsLoading ? (
                          <div className="form-control rounded-3 d-flex align-items-center gap-2">
                            <div className="spinner-border spinner-border-sm text-primary" role="status">
                              <span className="visually-hidden">Đang tải...</span>
                            </div>
                            Đang tải...
                          </div>
                        ) : (
                          <select
                            className="form-select rounded-3"
                            value={currentData.thuonghieu || ''}
                            onChange={e => setCurrentData(prev => ({ ...prev, thuonghieu: e.target.value }))}
                            disabled={isSaving}
                          >
                            <option value="">-- Chọn thương hiệu --</option>
                            {brands.map((brand) => (
                              <option key={brand.id} value={brand.name}>
                                {brand.name} {brand.service?.name ? `(${brand.service.name})` : ''}
                              </option>
                            ))}
                          </select>
                        )}
                        <small className="text-muted">{brands.length} thương hiệu</small>
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
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setShowModal(false)} disabled={isSaving}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? <><div className="spinner-border spinner-border-sm me-2" role="status"></div> Đang lưu...</> : <>{isEditMode ? 'Cập nhật' : 'Thêm mới'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
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
                  <h6>{deleteId && deleteId.includes(',') ? `Xóa ${deleteId.split(',').length} dịch vụ?` : 'Xóa dịch vụ này?'}</h6>
                  <p className="text-muted">Không thể hoàn tác.</p>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Hủy</button>
                  <button className="btn btn-danger rounded-pill px-4" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? <><div className="spinner-border spinner-border-sm me-2" role="status"></div> Đang xóa...</> : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  <p className="text-muted">Sẽ khôi phục toàn bộ dữ liệu bị xóa trong ngày.</p>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={() => setShowRestoreModal(false)} disabled={isRestoring}>Hủy</button>
                  <button className="btn btn-warning rounded-pill px-4 text-white" onClick={handleRestoreToday} disabled={isRestoring}>
                    {isRestoring ? <><div className="spinner-border spinner-border-sm me-2" role="status"></div> Đang khôi phục...</> : <><FontAwesomeIcon icon={faUndo} className="me-2" /> Khôi phục</>}
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
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                    <tr><th className="bg-light w-25">Mã DV</th><td><code>{viewService.id}</code></td></tr>
                    <tr><th className="bg-light">Loại</th><td><span className="badge bg-primary rounded-pill px-3">{viewService.name}</span></td></tr>
                    <tr><th className="bg-light">Thương hiệu</th><td>{viewService.thuonghieu || '-'}</td></tr>
                    <tr><th className="bg-light">Mô tả/Máy</th><td>{viewService.description || '-'}</td></tr>
                    <tr><th className="bg-light">Giá</th><td className="text-success fw-bold">{parseFloat(viewService.price || '0').toLocaleString('vi-VN')} ₫</td></tr>
                    <tr><th className="bg-light">Bảo hành</th><td><span className="badge bg-warning rounded-pill px-3">{viewService.warranty || '6'}</span></td></tr>
                    <tr><th className="bg-light">Ghi chú</th><td>{viewService.note || '-'}</td></tr>
                    <tr><th className="bg-light">Ngày tạo</th><td>{viewService.created_at ? new Date(viewService.created_at).toLocaleDateString('vi-VN') : '-'}</td></tr>
                  </tbody>
                </table>
              </div>
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
      <ServiceTypeSidemenu
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
        onServiceTypesChange={handleServiceTypesChange}
      />
      <div className="col-12 col-lg-9 main-content-right d-flex flex-column gap-4">
        <DebugInfo />
        {renderStatsCards()}

        {/* Search & Actions */}
        <div className="card border-0 shadow-sm rounded-3">
          <div className="card-body p-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group">
                  <span className="input-group-text bg-white rounded-start-pill border-end-0">
                    <FontAwesomeIcon icon={faSearch} className="text-muted" />
                  </span>
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control border-start-0 rounded-end-pill"
                  />
                  {searchQuery && (
                    <button className="btn btn-outline-secondary rounded-pill" onClick={clearSearch}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-7">
                <div className="d-flex flex-wrap gap-2 justify-content-md-end">
                  {(searchQuery || selectedCategory) && (
                    <button className="btn btn-outline-secondary rounded-pill px-3" onClick={() => { clearSearch(); clearFilter(); }}>
                      <FontAwesomeIcon icon={faTimes} className="me-1" /> Xóa bộ lọc
                    </button>
                  )}
                  <button className="btn btn-outline-warning rounded-pill px-3" onClick={() => setShowRestoreModal(true)}>
                    <FontAwesomeIcon icon={faUndo} className="me-2" /> Khôi phục
                  </button>
                  <button className="btn btn-outline-success rounded-pill px-3" onClick={() => fileInputRef.current?.click()}>
                    <FontAwesomeIcon icon={faUpload} className="me-2" /> Import
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0]); } }} className="d-none" />
                  </button>
                  <button onClick={handleExportExcel} className="btn btn-success rounded-pill px-3" disabled={services.length === 0}>
                    <FontAwesomeIcon icon={faDownload} className="me-2" /> Export
                  </button>
                  <button onClick={handleAddNewClick} className="btn btn-primary rounded-pill px-3">
                    <FontAwesomeIcon icon={faPlus} className="me-2" /> Thêm mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {renderSelectionActions()}

        {/* Table */}
        <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
          <div className="card-header text-white" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
            <h5 className="mb-0 d-flex align-items-center justify-content-between">
              <span>
                <FontAwesomeIcon icon={faList} className="me-2" />
                Danh sách dịch vụ
                {selectedCategory && <span className="ms-2">→ {selectedCategory}</span>}
              </span>
              <span className="badge bg-white text-dark rounded-pill">
                {services.length} / {pagination.total}
              </span>
            </h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="ps-3" style={{ width: '40px' }}>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" checked={isAllSelected} onChange={handleSelectAll} disabled={services.length === 0} />
                      </div>
                    </th>
                    <th style={{ width: '130px' }}>Mã</th>
                    <th style={{ width: '140px' }}>Loại</th>
                    <th style={{ width: '130px' }}>Thương hiệu</th>
                    <th>Mô tả/Máy</th>
                    <th style={{ width: '150px' }}>Giá</th>
                    <th style={{ width: '130px' }}>Bảo hành</th>
                    <th className="text-center" style={{ width: '160px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {renderServiceTable()}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer bg-light">
            <div className="row align-items-center">
              <div className="col-md-6">
                <small className="text-muted">
                  Hiển thị {services.length} trên {pagination.total} dịch vụ
                  {selectedRows.size > 0 && ` • Đã chọn ${selectedRows.size}`}
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
      {showViewModal && renderViewModal()}

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
          background-color: #f8f9fa !important;
        }
        .card:hover {
          box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important;
        }
        .badge {
          font-size: 0.85rem;
        }
      `}</style>
    </>
  );
};

export default ServiceManagementPage;
