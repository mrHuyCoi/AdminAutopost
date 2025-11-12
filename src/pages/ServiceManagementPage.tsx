// src/pages/ServiceManagementPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import StatCard from '../components/StatCard';
import ServiceTypeSidemenu from '../components/ServiceTypeSidemenu';
import { Service, ServiceCreate, ServiceUpdate } from '../types/service';
import { serviceService } from '../services/serviceService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useBrands } from '../contexts/BrandContext';
import {
  faEdit, faTrash, faPlus, faEye, faCopy,
  faUpload, faDownload, faChevronLeft, faChevronRight,
  faAnglesLeft, faAnglesRight, faList, faMobileAlt,
  faMicrochip, faBatteryFull, faCheck, faFilter,
  faSearch, faTimes
} from '@fortawesome/free-solid-svg-icons';

const ITEMS_PER_PAGE = 10;
const SERVICE_TYPES = ['Thay pin', 'Ép kính', 'Thay main', 'Sửa chữa', 'Khác'];

const initialFormState: ServiceCreate = {
  loai: '', thuonghieu: '', loaimay: '', mausac: '',
  gia: '0', baohanh: '6 tháng', ghichu: ''
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
  const { brands, loading: brandsLoading } = useBrands();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 1 });
  const [selectedLoai, setSelectedLoai] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [stats, setStats] = useState<ServiceStats>({ total: 0, thayPin: 0, epKinh: 0, thayMain: 0 });

  // NEW: Selected rows state
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);

  // MODAL STATES
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentData, setCurrentData] = useState<ServiceCreate | ServiceUpdate>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewService, setViewService] = useState<Service | null>(null);
  const brandOptions = brands.map(brand => brand.name).filter(name => name.trim() !== '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRootRef = useRef<HTMLElement | null>(null);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);

  useEffect(() => {
    console.log('🔄 ServiceTypes updated:', serviceTypes);
  }, [serviceTypes]);

  const handleServiceTypesChange = useCallback((types: string[]) => {
    console.log('📥 Received service types from sidemenu:', types);
    setServiceTypes(types);
  }, []);

  // Cập nhật hàm handleAddNewClick để sử dụng serviceTypes
  const handleAddNewClick = () => {
    const defaultLoai = selectedLoai || (serviceTypes.length > 0 ? serviceTypes[0] : 'Khác');
    const defaultBrand = brandOptions.length > 0 ? brandOptions[0] : '';
    setCurrentData({ ...initialFormState, loai: defaultLoai, thuonghieu: defaultBrand });
    setIsEditMode(false);
    setEditId(null);
    setShowModal(true);
  };

  // NEW: Row selection handlers
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

  // NEW: Bulk actions
  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast.error('Vui lòng chọn ít nhất một dịch vụ để xóa');
      return;
    }
    setDeleteId(Array.from(selectedRows).join(',')); // Multiple IDs
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
        'Loại': s.loai,
        'Thương hiệu': s.thuonghieu || '-',
        'Máy': s.loaimay,
        'Màu sắc': s.mausac || '-',
        'Giá': parseFloat(s.gia || '0').toLocaleString('vi-VN') + ' ₫',
        'Bảo hành': s.baohanh || '-',
        'Ghi chú': s.ghichu || '-',
        'Ngày tạo': new Date(s.createdAt || '').toLocaleDateString('vi-VN')
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

  // Reset selection when services change
  useEffect(() => {
    clearSelection();
  }, [services, currentPage, searchQuery, selectedLoai]);

  // Update select all state
  useEffect(() => {
    if (services.length > 0) {
      setIsAllSelected(selectedRows.size === services.length && services.length > 0);
    } else {
      setIsAllSelected(false);
    }
  }, [selectedRows, services]);

  const calculateStatsFromServices = useCallback((servicesList: Service[]): ServiceStats => {
    const counts = servicesList.reduce((acc, s) => {
      if (s.loai === 'Thay pin') acc.thayPin++;
      if (s.loai === 'Ép kính') acc.epKinh++;
      if (s.loai === 'Thay main') acc.thayMain++;
      return acc;
    }, { thayPin: 0, epKinh: 0, thayMain: 0 });

    if (selectedLoai) {
      const filteredCount = servicesList.length;
      return {
        total: pagination.total,
        thayPin: selectedLoai === 'Thay pin' ? filteredCount : counts.thayPin,
        epKinh: selectedLoai === 'Ép kính' ? filteredCount : counts.epKinh,
        thayMain: selectedLoai === 'Thay main' ? filteredCount : counts.thayMain
      };
    }

    return {
      total: pagination.total,
      thayPin: counts.thayPin,
      epKinh: counts.epKinh,
      thayMain: counts.thayMain
    };
  }, [pagination.total, selectedLoai]);

  const loadStats = useCallback(async () => {
    try {
      if (selectedLoai) {
        setStats(calculateStatsFromServices(services));
        return;
      }

      const response = await serviceService.getServiceStats();
      if (response && typeof response.total === 'number') {
        setStats({
          total: response.total || 0,
          thayPin: response.thayPin || 0,
          epKinh: response.epKinh || 0,
          thayMain: response.thayMain || 0
        });
      } else {
        setStats(calculateStatsFromServices(services));
      }
    } catch {
      setStats(calculateStatsFromServices(services));
    }
  }, [services, calculateStatsFromServices, selectedLoai]);

  useEffect(() => {
    modalRootRef.current = document.getElementById('modal-root');

    const titleEl = document.getElementById('pageTitle');
    const subtitleEl = document.getElementById('pageSubtitle');
    if (titleEl) titleEl.textContent = 'Quản lý Dịch vụ';
    if (subtitleEl) subtitleEl.textContent = 'Quản lý các dịch vụ sửa chữa thiết bị';

    loadServices(1);
  }, []);

  useEffect(() => {
    if (services.length > 0 || selectedLoai) {
      setStats(calculateStatsFromServices(services));
    }
  }, [services, calculateStatsFromServices, selectedLoai]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadServices(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedLoai]);

  useEffect(() => {
    loadServices(currentPage);
  }, [currentPage]);

  const loadServices = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await serviceService.getAllServices(
        page,
        ITEMS_PER_PAGE,
        searchQuery || undefined,
        selectedLoai || undefined
      );

      const servicesData = response.data || [];
      setServices(servicesData);

      let total = response.total ?? response.metadata?.total ?? response.pagination?.total;

      if (!total || total <= 0) {
        if (servicesData.length === ITEMS_PER_PAGE) {
          total = page * ITEMS_PER_PAGE + 10;
        } else {
          total = (page - 1) * ITEMS_PER_PAGE + servicesData.length;
        }
      }

      const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
      const serverPage = response.metadata?.page || response.pagination?.page || page;

      setPagination({
        total: total,
        page: serverPage,
        pages: totalPages
      });

      loadStats();

    } catch (err: any) {
      const msg = err.response?.data?.message || 'Lỗi tải dữ liệu';
      setError(msg);
      toast.error(msg);
      setServices([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (category: string | null) => {
    setSelectedLoai(category);
    setCurrentPage(1);
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
      loai: service.loai,
      thuonghieu: service.thuonghieu || '',
      loaimay: service.loaimay || '',
      mausac: service.mausac || '',
      gia: service.gia || '0',
      baohanh: service.baohanh || '',
      ghichu: service.ghichu || ''
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
        'Loại': s.loai,
        'Thương hiệu': s.thuonghieu || '-',
        'Máy': s.loaimay,
        'Màu sắc': s.mausac || '-',
        'Giá': parseFloat(s.gia || '0').toLocaleString('vi-VN') + ' ₫',
        'Bảo hành': s.baohanh || '-',
        'Ghi chú': s.ghichu || '-',
        'Ngày tạo': new Date(s.createdAt || '').toLocaleDateString('vi-VN')
      }));

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [
        { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 20 }, { wch: 12 }, { wch: 15 },
        { wch: 12 }, { wch: 25 }, { wch: 12 }
      ];
      XLSX.utils.book_append_sheet(wb, ws, 'DichVu');
      XLSX.writeFile(wb, `DichVu_${selectedLoai || 'TatCa'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          const serviceData: ServiceCreate = {
            loai: row['Loại dịch vụ'] || row['Loại'] || 'Khác',
            thuonghieu: row['Thương hiệu'] || '',
            loaimay: row['Tên máy'] || row['Loại máy'] || '',
            mausac: row['Màu sắc'] || '',
            gia: String(row['Giá (VND)'] || row['Giá'] || 0).replace(/\D/g, ''),
            baohanh: row['Bảo hành'] || '6 tháng',
            ghichu: row['Ghi chú'] || ''
          };

          try {
            await serviceService.createService(serviceData);
            success++;
          } catch (err) {
            console.error('Import lỗi:', err);
            errors++;
          }
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        if (errors > 0) {
          toast.success(`Import thành công ${success} dịch vụ, ${errors} lỗi!`);
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
    if (!currentData.loai) {
      toast.error('Vui lòng chọn loại dịch vụ!');
      return;
    }

    if (!currentData.loaimay.trim()) {
      toast.error('Vui lòng nhập tên máy!');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && editId) {
        await serviceService.updateService(editId, currentData as ServiceUpdate);
        toast.success('Cập nhật thành công!');
      } else {
        await serviceService.createService(currentData as ServiceCreate);
        toast.success('Thêm dịch vụ thành công!');
      }
      setShowModal(false);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu thất bại!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      // NEW: Handle bulk delete
      if (deleteId.includes(',')) {
        const ids = deleteId.split(',');
        for (const id of ids) {
          await serviceService.deleteService(id);
        }
        toast.success(`Đã xóa ${ids.length} dịch vụ thành công!`);
      } else {
        await serviceService.deleteService(deleteId);
        toast.success('Xóa thành công!');
      }
      setShowDeleteModal(false);
      setDeleteId(null);
      clearSelection();
      refreshAll();
    } catch {
      toast.error('Xóa thất bại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeAllModals = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setDeleteId(null);
    setViewService(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setSelectedLoai(null);
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
            onClick={() => handlePageChange(i)}
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
              onClick={() => handlePageChange(1)}
              aria-label="Trang đầu"
            >
              <FontAwesomeIcon icon={faAnglesLeft} />
            </button>
          </li>
          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Trang trước"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </li>
          {pages}
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Trang sau"
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </li>
          <li className={`page-item ${currentPage === pagination.pages ? 'disabled' : ''}`}>
            <button
              className="page-link"
              onClick={() => handlePageChange(pagination.pages)}
              aria-label="Trang cuối"
            >
              <FontAwesomeIcon icon={faAnglesRight} />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  const renderServiceTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={8} className="text-center py-5">
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
          <td colSpan={8} className="text-center text-danger py-5">
            <FontAwesomeIcon icon={faTimes} size="2x" className="mb-3" />
            <div>{error}</div>
            <button className="btn btn-primary mt-3" onClick={refreshAll}>
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
            <FontAwesomeIcon icon={faSearch} size="2x" className="mb-3 opacity-50" />
            <div>Không tìm thấy dịch vụ nào</div>
            {(searchQuery || selectedLoai) && (
              <button className="btn btn-outline-primary mt-3" onClick={() => { clearSearch(); clearFilter(); }}>
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
        className={`
          ${selectedRows.has(service.id) ? 'table-active selected-row' : ''}
          transition-all
        `}
        style={{ cursor: 'pointer' }}
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
              className="btn btn-sm btn-outline-secondary p-1"
              onClick={(e) => {
                e.stopPropagation();
                handleCopyId(service.id);
              }}
              aria-label="Copy mã dịch vụ"
            >
              <FontAwesomeIcon icon={faCopy} size="xs" />
            </button>
          </div>
        </td>
        <td>
          <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-3 py-2 rounded-pill">
            {service.loai}
          </span>
        </td>
        <td className="fw-medium text-dark">{service.thuonghieu || '-'}</td>
        <td className="fw-semibold">{service.loaimay}</td>
        <td className="text-success fw-bold fs-6">
          {parseFloat(service.gia || '0').toLocaleString('vi-VN')} ₫
        </td>
        <td>
          <span className="badge bg-warning bg-opacity-15 text-warning-emphasis border border-warning border-opacity-25 px-3 py-2">
            {service.baohanh}
          </span>
        </td>
        <td className="text-center">
          <div className="btn-group btn-group-sm" role="group" aria-label="Hành động">
            <button
              className="btn btn-outline-info"
              onClick={(e) => {
                e.stopPropagation();
                handleViewClick(service);
              }}
              aria-label="Xem chi tiết"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(service);
              }}
              aria-label="Sửa dịch vụ"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              className="btn btn-outline-danger"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(service.id);
                setShowDeleteModal(true);
              }}
              aria-label="Xóa dịch vụ"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderStatsCards = () => (
    <div className="row g-3">
      <div className="col-6 col-md-3">
        <StatCard
          title="Tổng dịch vụ"
          value={stats.total}
          colorType="primary"
          iconComponent={<FontAwesomeIcon icon={faList} size="lg" />}
          gradient={true}
        />
      </div>
      <div className="col-6 col-md-3">
        <StatCard
          title="Thay pin"
          value={stats.thayPin}
          colorType="success"
          iconComponent={<FontAwesomeIcon icon={faBatteryFull} size="lg" />}
          gradient={true}
        />
      </div>
      <div className="col-6 col-md-3">
        <StatCard
          title="Ép kính"
          value={stats.epKinh}
          colorType="info"
          iconComponent={<FontAwesomeIcon icon={faMobileAlt} size="lg" />}
          gradient={true}
        />
      </div>
      <div className="col-6 col-md-3">
        <StatCard
          title="Thay main"
          value={stats.thayMain}
          colorType="warning"
          iconComponent={<FontAwesomeIcon icon={faMicrochip} size="lg" />}
          gradient={true}
        />
      </div>
    </div>
  );

  // NEW: Selected rows actions bar
  const renderSelectionActions = () => {
    if (selectedRows.size === 0) return null;

    return (
      <div className="alert alert-info d-flex align-items-center justify-content-between mb-4 py-3">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon icon={faCheck} className="text-info me-2" />
          <span className="fw-semibold">Đã chọn {selectedRows.size} dịch vụ</span>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-outline-success btn-sm"
            onClick={handleBulkExport}
          >
            <FontAwesomeIcon icon={faDownload} className="me-1" />
            Xuất Excel
          </button>
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={handleBulkDelete}
          >
            <FontAwesomeIcon icon={faTrash} className="me-1" />
            Xóa
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={clearSelection}
          >
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Bỏ chọn
          </button>
        </div>
      </div>
    );
  };

  const hasActiveModal = showModal || showDeleteModal || showViewModal;

  const renderModals = () => {
    if (!modalRootRef.current) return null;

    return createPortal(
      <>
        {hasActiveModal && (
          <div
            className="modal-backdrop fade show"
            onClick={closeAllModals}
            style={{ zIndex: 1040 }}
          />
        )}

        {showModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg">
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-header bg-gradient-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                      {isEditMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ mới'}
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
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="loai" className="form-label fw-semibold text-primary">
                          Loại dịch vụ *
                        </label>
                        <select
                          id="loai"
                          className="form-select border-primary border-opacity-25"
                          value={currentData.loai || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, loai: e.target.value }))}
                          required
                          disabled={isSaving}
                        >
                          <option value="">-- Chọn loại dịch vụ --</option>
                          {serviceTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                          {serviceTypes.length === 0 && SERVICE_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <div className="form-text text-muted small">
                          Dữ liệu được đồng bộ từ danh sách loại dịch vụ ({serviceTypes.length} loại)
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="loaimay" className="form-label fw-semibold">
                          Tên máy *
                        </label>
                        <input
                          id="loaimay"
                          className="form-control"
                          value={currentData.loaimay || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, loaimay: e.target.value }))}
                          required
                          disabled={isSaving}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="thuonghieu" className="form-label fw-semibold">
                          Thương hiệu
                        </label>
                        <select
                          id="thuonghieu"
                          className="form-select"
                          value={currentData.thuonghieu || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, thuonghieu: e.target.value }))}
                          disabled={isSaving || brandsLoading}
                        >
                          <option value="">-- Chọn thương hiệu --</option>
                          {brandOptions.map(brandName => (
                            <option key={brandName} value={brandName}>{brandName}</option>
                          ))}
                        </select>
                        <div className="form-text text-muted small">
                          {brandsLoading ? 'Đang tải thương hiệu...' : `${brandOptions.length} thương hiệu có sẵn`}
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="gia" className="form-label fw-semibold">
                          Giá (VND) *
                        </label>
                        <input
                          id="gia"
                          type="number"
                          min="0"
                          className="form-control"
                          value={currentData.gia || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, gia: e.target.value }))}
                          required
                          disabled={isSaving}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="mausac" className="form-label fw-semibold">
                          Màu sắc
                        </label>
                        <input
                          id="mausac"
                          className="form-control"
                          value={currentData.mausac || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, mausac: e.target.value }))}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="baohanh" className="form-label fw-semibold">
                          Bảo hành
                        </label>
                        <input
                          id="baohanh"
                          className="form-control"
                          value={currentData.baohanh || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, baohanh: e.target.value }))}
                          disabled={isSaving}
                        />
                      </div>
                      <div className="col-12">
                        <label htmlFor="ghichu" className="form-label fw-semibold">
                          Ghi chú
                        </label>
                        <textarea
                          id="ghichu"
                          className="form-control"
                          rows={3}
                          value={currentData.ghichu || ''}
                          onChange={e => setCurrentData(prev => ({ ...prev, ghichu: e.target.value }))}
                          disabled={isSaving}
                        ></textarea>
                      </div>
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
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                  ></button>
                </div>
                <div className="modal-body text-center py-4">
                  <FontAwesomeIcon icon={faTrash} size="3x" className="text-danger mb-3 opacity-75" />
                  <h6 className="fw-bold">
                    {deleteId && deleteId.includes(',')
                      ? `Bạn có chắc muốn xóa ${deleteId.split(',').length} dịch vụ đã chọn?`
                      : 'Bạn có chắc muốn xóa dịch vụ này?'}
                  </h6>
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
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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

  const renderViewModal = () => {
    if (!modalRootRef.current || !viewService || !showViewModal) return null;

    return createPortal(
      <div
        className="modal fade show"
        style={{ display: 'block', zIndex: 1050 }}
        aria-modal="true"
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-gradient-primary text-white">
              <h5 className="modal-title">
                <FontAwesomeIcon icon={faEye} className="me-2" />
                Chi tiết dịch vụ
              </h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowViewModal(false)}
                aria-label="Đóng"
              ></button>
            </div>
            <div className="modal-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                    <tr><th className="w-25 bg-light">Mã DV</th><td><code>{viewService.id}</code></td></tr>
                    <tr><th className="bg-light">Loại</th><td><span className="badge bg-primary">{viewService.loai}</span></td></tr>
                    <tr><th className="bg-light">Thương hiệu</th><td>{viewService.thuonghieu || '-'}</td></tr>
                    <tr><th className="bg-light">Tên máy</th><td>{viewService.loaimay}</td></tr>
                    <tr><th className="bg-light">Màu sắc</th><td>{viewService.mausac || '-'}</td></tr>
                    <tr><th className="bg-light">Giá</th><td className="text-success fw-bold">{parseFloat(viewService.gia || '0').toLocaleString('vi-VN')} ₫</td></tr>
                    <tr><th className="bg-light">Bảo hành</th><td><span className="badge bg-warning text-dark">{viewService.baohanh}</span></td></tr>
                    <tr><th className="bg-light">Ghi chú</th><td className="text-break">{viewService.ghichu || '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowViewModal(false)}>
                Đóng
              </button>
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
        selectedCategory={selectedLoai}
        onServiceTypesChange={handleServiceTypesChange}
      />
      <div className="col-12 col-lg-9 main-content-right d-flex flex-column gap-4">
        <DebugInfo />

        {/* Statistics Cards */}
        {renderStatsCards()}

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
                    placeholder="Tìm kiếm theo tên máy, thương hiệu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control border-start-0"
                    aria-label="Tìm kiếm dịch vụ"
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
                  {(searchQuery || selectedLoai) && (
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => { clearSearch(); clearFilter(); }}
                    >
                      <FontAwesomeIcon icon={faTimes} className="me-1" />
                      Xóa bộ lọc
                    </button>
                  )}
                  <button
                    className="btn btn-outline-success"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FontAwesomeIcon icon={faUpload} className="me-2" />
                    Import Excel
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                      className="d-none"
                    />
                  </button>
                  <button
                    onClick={handleExportExcel}
                    className="btn btn-success"
                    disabled={services.length === 0}
                  >
                    <FontAwesomeIcon icon={faDownload} className="me-2" />
                    Export Excel
                  </button>
                  <button
                    onClick={handleAddNewClick}
                    className="btn btn-primary"
                  >
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm mới
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Rows Actions */}
        {renderSelectionActions()}

        {/* Services Table */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-gradient-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faList} className="me-2" />
              Danh sách dịch vụ
              {selectedLoai && <span className="ms-2">→ {selectedLoai}</span>}
            </h5>
            <div className="d-flex align-items-center gap-3">
              {selectedLoai && (
                <span className="badge bg-light text-primary">
                  <FontAwesomeIcon icon={faFilter} className="me-1" />
                  Đang lọc
                </span>
              )}
              <span className="badge bg-light text-primary">
                {services.length} / {pagination.total}
              </span>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" className="ps-3" style={{ width: '40px' }}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleSelectAll}
                          disabled={services.length === 0}
                        />
                      </div>
                    </th>
                    <th scope="col" style={{ width: '120px' }}>Mã</th>
                    <th scope="col" style={{ width: '130px' }}>Loại</th>
                    <th scope="col" style={{ width: '120px' }}>Thương hiệu</th>
                    <th scope="col">Máy</th>
                    <th scope="col" style={{ width: '150px' }}>Giá</th>
                    <th scope="col" style={{ width: '120px' }}>Bảo hành</th>
                    <th scope="col" className="text-center" style={{ width: '140px' }}>Hành động</th>
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
                  Hiển thị {services.length} trên tổng số {pagination.total} dịch vụ
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

      {/* Custom CSS for better styling */}
      <style jsx>{`
        .selected-row {
          background-color: var(--bs-primary-bg-subtle) !important;
          border-left: 4px solid var(--bs-primary) !important;
        }
        .table-hover tbody tr:hover {
          background-color: var(--bs-light) !important;
          transform: translateY(-1px);
          transition: all 0.2s ease;
        }
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

export default ServiceManagementPage;