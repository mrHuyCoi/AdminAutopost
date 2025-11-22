// src/pages/DeviceInfoManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash, faSearch, faSync, faPlus, faMobileAlt,
  faEye, faMicrochip, faCamera, faBatteryHalf,
  faPalette, faWeightHanging, faShieldAlt, faCertificate,
  faChevronLeft, faChevronRight, faFileExcel, faSpinner, faDownload, faFileImport
} from '@fortawesome/free-solid-svg-icons';
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons';

import { deviceBrandService, DeviceBrand } from '../services/deviceBrandService';

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// === INTERFACE ===
interface DeviceStorage { id: string; capacity: number; device_info_id: string; user_id: string | null; created_at: string; updated_at: string; }
interface DeviceColor { id: string; name: string; color_code: string; device_info_id: string; user_id: string | null; created_at: string; updated_at: string; }
interface DeviceMaterial { id: string; name: string; device_info_id: string; user_id: string | null; created_at: string; updated_at: string; }
interface DeviceInfo { id: string; model: string; brand: string; release_date: string | null; screen: string | null; chip_ram: string | null; camera: string | null; battery: string | null; connectivity_os: string | null; color_english: string | null; dimensions_weight: string | null; sensors_health_features: string | null; warranty: string | null; user_id: string | null; materials: DeviceMaterial[]; device_storages: DeviceStorage[]; device_colors: DeviceColor[]; created_at: string; updated_at: string; }
interface DeviceInfoCreateData { model?: string; brand?: string; release_date?: string; screen?: string; chip_ram?: string; camera?: string; battery?: string; connectivity_os?: string; color_english?: string; dimensions_weight?: string; sensors_health_features?: string; warranty?: string; }

const DeviceInfoManagementPage: React.FC = () => {
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceInfos, setSelectedDeviceInfos] = useState<string[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);

  // Import Excel states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // === LOAD DATA ===
  const loadDeviceInfos = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: itemsPerPage, include_details: true };
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get('/device-infos', { params });
      const data = response.data;

      let items: DeviceInfo[] = [];
      let total = 0;
      let pages = 1;

      if (Array.isArray(data)) {
        items = data;
        total = data.length;
        pages = Math.ceil(total / itemsPerPage);
      } else {
        // Handle different response structures
        items = data.data || data.items || [];
        total = data.total || data.total_items || items.length;
        pages = data.totalPages || data.pages || Math.ceil(total / itemsPerPage);
      }

      setDeviceInfos(items);
      setTotalItems(total);
      setTotalPages(Math.max(1, pages));
      setCurrentPage(page);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || 'Không thể tải dữ liệu';
      toast.error(errorMessage);
      setDeviceInfos([]);
      setTotalItems(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadAllDeviceBrands = async () => {
    try {
      const response = await deviceBrandService.getAllDeviceBrands();
      setDeviceBrands(response || []);
    } catch (err) {
      console.error(err);
    }
  };

  // === EXPORT EXCEL ===
  const exportToExcel = async () => {
    try {
      const response = await api.get('/device-infos/export', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Thong_tin_thiet_bi_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Đã xuất file Excel thành công!');
    } catch (error) {
      toast.error('Lỗi xuất Excel từ server');
    }
  };

  // === IMPORT EXCEL ===
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };

  const confirmImport = async () => {
    if (!importFile) {
      setImportError("Vui lòng chọn file Excel");
      return;
    }

    try {
      setActionLoading('import');
      const formData = new FormData();
      formData.append('file', importFile);

      // Fix: Gọi đúng endpoint POST /import thay vì /bulk
      await api.post('/device-infos/import', formData);

      toast.success(`Nhập dữ liệu thành công!`);
      setShowImportModal(false);
      setImportFile(null);
      loadDeviceInfos(1);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || 'Lỗi nhập dữ liệu';
      setImportError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // === DOWNLOAD TEMPLATE ===
  const downloadTemplate = async () => {
    try {
      const response = await api.get('/device-infos/export-template', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'Mau_nhap_thong_tin_thiet_bi.xlsx');
    } catch (error) {
      toast.error('Không thể tải file mẫu');
    }
  };

  // === ACTIONS ===
  const handleCreateDeviceInfo = async (data: DeviceInfoCreateData) => {
    try {
      setActionLoading('create');
      await api.post('/device-infos', data);
      toast.success('Tạo thành công');
      setShowCreateModal(false);
      setSearchTerm('');
      loadDeviceInfos(1);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Lỗi tạo';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetails = (device: DeviceInfo) => {
    setSelectedDevice(device);
    setShowDetailModal(true);
  };

  const handleDeleteDeviceInfo = async (deviceId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
    try {
      setActionLoading(`delete-${deviceId}`);
      await api.delete(`/device-infos/${deviceId}`);
      toast.success('Xóa thành công');

      if (deviceInfos.length === 1 && currentPage > 1) {
        loadDeviceInfos(currentPage - 1);
      } else {
        loadDeviceInfos(currentPage);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Lỗi xóa';
      if (errorMessage.includes('foreign key')) {
        toast.error('Không thể xóa vì có dữ liệu liên quan.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async () => {
    if (selectedDeviceInfos.length === 0) {
      toast.error('Chọn ít nhất một item');
      return;
    }
    if (!window.confirm(`Xác nhận xóa ${selectedDeviceInfos.length} item?`)) return;
    try {
      setActionLoading('bulk');
      // Thử gọi endpoint xóa nhiều (nếu có) hoặc loop
      // Giả sử backend hỗ trợ POST /device-infos/delete-multiple hoặc loop client
      try {
        await api.post('/device-infos/delete-multiple', selectedDeviceInfos);
      } catch (e) {
        // Fallback loop
        await Promise.all(selectedDeviceInfos.map(id => api.delete(`/device-infos/${id}`)));
      }

      toast.success(`Đã xử lý xóa ${selectedDeviceInfos.length} item`);
      setSelectedDeviceInfos([]);
      loadDeviceInfos(currentPage);
    } catch (error) {
      toast.error('Lỗi bulk action');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelection = (deviceId: string) => {
    setSelectedDeviceInfos(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  const toggleSelectAll = () => {
    if (deviceInfos.length === 0) return;
    const allSelected = deviceInfos.every(item => selectedDeviceInfos.includes(item.id));
    setSelectedDeviceInfos(allSelected ? [] : deviceInfos.map(item => item.id));
  };

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      loadDeviceInfos(pageNumber);
    }
  };

  const getPageRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const getBrandIcon = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes('apple') || b.includes('iphone')) return faApple;
    if (b.includes('samsung') || b.includes('galaxy')) return faAndroid;
    return faMobileAlt;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderCompactValue = (value: string | null, maxLength: number = 25) => {
    if (!value) return '-';
    if (value.length > maxLength) {
      return <span title={value}>{value.substring(0, maxLength)}...</span>;
    }
    return value;
  };

  const getAllColors = (device: DeviceInfo) => {
    const colors = new Set<string>();
    device.device_colors.forEach(color => color.name && colors.add(color.name));
    if (device.color_english) {
      device.color_english.split(',').forEach(c => {
        const trimmed = c.trim();
        if (trimmed) colors.add(trimmed);
      });
    }
    return Array.from(colors);
  };

  useEffect(() => {
    loadDeviceInfos(1);
    loadAllDeviceBrands();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadDeviceInfos(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Render Pagination Component
  const renderPagination = () => {
    const pages = [];
    // Luôn hiển thị pagination
    const total = Math.max(1, totalPages);

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="d-flex align-items-center gap-1">
        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || loading}>
          <FontAwesomeIcon icon={faChevronLeft} className="small me-1" /> Trước
        </button>
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-muted">...</span>
            ) : (
              <button
                className={`btn btn-sm rounded-pill px-3 ${currentPage === page ? 'btn-primary text-white' : 'btn-outline-primary'}`}
                onClick={() => paginate(page as number)}
                disabled={loading}
                style={{ minWidth: '32px' }}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => paginate(currentPage + 1)} disabled={currentPage === total || loading}>
          Sau <FontAwesomeIcon icon={faChevronRight} className="small ms-1" />
        </button>
      </div>
    );
  };

  return (
    <div className="container-fluid px-3 py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h1 className="h4 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faMobileAlt} className="me-2 text-primary" />
            Quản lý Thông Tin Thiết Bị
          </h1>
          <p className="text-muted mb-0 small">Quản lý dữ liệu gốc (Model, Cấu hình) của thiết bị</p>
        </div>
        <div className="d-flex gap-2">
          <button
            className="btn btn-success btn-sm rounded-pill shadow-sm px-3 d-flex align-items-center"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-1" />
            Thêm mới
          </button>

          {/* IMPORT EXCEL */}
          <button
            className="btn btn-outline-info btn-sm rounded-pill px-3 d-flex align-items-center"
            onClick={() => document.getElementById('import-excel-input-info')?.click()}
            title="Nhập từ Excel"
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-1" />
            Import Excel
          </button>
          <input
            id="import-excel-input-info"
            type="file"
            accept=".xlsx,.xls"
            className="d-none"
            onChange={handleFileChange}
          />

          {/* EXPORT EXCEL */}
          <button
            className="btn btn-outline-success btn-sm rounded-pill px-3 d-flex align-items-center"
            onClick={exportToExcel}
            disabled={loading || deviceInfos.length === 0}
            title="Xuất Excel"
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-1" />
            Export Excel
          </button>

          <button
            className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center"
            onClick={() => loadDeviceInfos(currentPage)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSync} spin={loading} className="me-1" />
            Làm mới
          </button>
        </div>
      </div>

      {/* Search & Action */}
      <div className="card border-0 shadow-sm rounded-2 mb-3">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-lg-9">
              <label className="form-label small text-muted fw-medium">Tìm kiếm</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <FontAwesomeIcon icon={faSearch} className="text-muted small" />
                </span>
                <input
                  type="text"
                  className="form-control form-control-sm border-start-0 rounded-end-pill"
                  placeholder="Tìm kiếm model, thương hiệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-3">
              <label className="form-label small text-muted fw-medium">Hành động</label>
              <button
                className="btn btn-outline-danger btn-sm w-100 rounded-pill"
                onClick={handleBulkAction}
                disabled={selectedDeviceInfos.length === 0 || actionLoading === 'bulk'}
              >
                {actionLoading === 'bulk' ? <FontAwesomeIcon icon={faSpinner} spin /> : <><FontAwesomeIcon icon={faTrash} className="me-1" />Xóa ({selectedDeviceInfos.length})</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-2 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle mb-0">
              <thead className="text-white small" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
                <tr>
                  <th width="30" className="text-center px-2">
                    <input type="checkbox" className="form-check-input" checked={deviceInfos.length > 0 && deviceInfos.every(item => selectedDeviceInfos.includes(item.id))} onChange={toggleSelectAll} />
                  </th>
                  <th className="fw-semibold px-2">Thương hiệu</th>
                  <th className="fw-semibold px-2">Model</th>
                  <th className="fw-semibold px-2">Ngày ra mắt</th>
                  <th className="fw-semibold px-2">Màn hình</th>
                  <th className="fw-semibold px-2">Chip/RAM</th>
                  <th className="fw-semibold px-2">Camera</th>
                  <th className="fw-semibold px-2">Pin</th>
                  <th className="fw-semibold px-2">Kết nối/HĐH</th>
                  <th className="fw-semibold px-2">Màu sắc</th>
                  <th className="fw-semibold px-2">K.thước/T.lượng</th>
                  <th className="fw-semibold px-2">Cảm biến</th>
                  <th className="fw-semibold px-2">Bảo hành</th>
                  <th className="fw-semibold px-2">Ngày tạo</th>
                  <th className="fw-semibold text-center px-2">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, i) => (
                    <tr key={i}><td colSpan={15} className="px-2 py-3"><div className="placeholder-glow w-100"><div className="placeholder col-7 h-2 rounded"></div><div className="placeholder col-4 h-1 rounded mt-1"></div></div></td></tr>
                  ))
                ) : deviceInfos.length === 0 ? (
                  <tr><td colSpan={15} className="text-center py-4 text-muted"><FontAwesomeIcon icon={faSearch} size="lg" className="mb-2 opacity-25" /><p className="mb-1 small fw-medium">Không có dữ liệu</p><small className="text-muted">Thử thay đổi từ khóa tìm kiếm</small></td></tr>
                ) : (
                  deviceInfos.map((item) => (
                    <tr key={item.id} className="small transition-all">
                      <td className="text-center px-2"><input type="checkbox" className="form-check-input" checked={selectedDeviceInfos.includes(item.id)} onChange={() => toggleSelection(item.id)} disabled={actionLoading !== null} /></td>
                      <td className="px-2"><div className="d-flex align-items-center"><div className="flex-shrink-0 d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-2" style={{ width: '24px', height: '24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', fontSize: '0.7rem' }}><FontAwesomeIcon icon={getBrandIcon(item.brand)} /></div><span className="fw-medium text-truncate" style={{ maxWidth: '60px' }} title={item.brand}>{item.brand}</span></div></td>
                      <td className="px-2"><div className="fw-semibold text-dark text-truncate" style={{ maxWidth: '85px' }} title={item.model}>{item.model}</div></td>
                      <td className="px-2"><div className="text-muted text-truncate" style={{ maxWidth: '75px' }} title={item.release_date || ''}>{formatDate(item.release_date)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '75px' }} title={item.screen || ''}>{renderCompactValue(item.screen, 15)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '75px' }} title={item.chip_ram || ''}>{renderCompactValue(item.chip_ram, 15)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '85px' }} title={item.camera || ''}>{renderCompactValue(item.camera, 20)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '65px' }} title={item.battery || ''}>{renderCompactValue(item.battery, 12)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '85px' }} title={item.connectivity_os || ''}>{renderCompactValue(item.connectivity_os, 18)}</div></td>
                      <td className="px-2"><div>{getAllColors(item).length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {getAllColors(item).slice(0, 1).map((color, index) => (
                            <span key={index} className="badge bg-light text-dark border text-truncate" style={{ maxWidth: '40px', fontSize: '0.65rem' }} title={color}>{color}</span>
                          ))}
                          {getAllColors(item).length > 1 && <span className="badge bg-secondary" style={{ fontSize: '0.65rem' }} title={getAllColors(item).slice(1).join(', ')}>+{getAllColors(item).length - 1}</span>}
                        </div>
                      ) : <span className="text-muted">-</span>}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '95px' }} title={item.dimensions_weight || ''}>{renderCompactValue(item.dimensions_weight, 20)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '95px' }} title={item.sensors_health_features || ''}>{renderCompactValue(item.sensors_health_features, 22)}</div></td>
                      <td className="px-2"><div className="text-truncate" style={{ maxWidth: '75px' }} title={item.warranty || ''}>{renderCompactValue(item.warranty, 15)}</div></td>
                      <td className="px-2"><div className="text-muted text-truncate" style={{ maxWidth: '75px' }}>{formatDate(item.created_at)}</div></td>
                      <td className="text-center px-2">
                        <div className="d-flex justify-content-center gap-1">
                          <button className="btn btn-outline-primary btn-xs rounded-pill px-2 py-1" onClick={() => handleViewDetails(item)} title="Xem chi tiết" style={{ fontSize: '0.7rem' }}><FontAwesomeIcon icon={faEye} /></button>
                          <button className="btn btn-outline-danger btn-xs rounded-pill px-2 py-1" onClick={() => handleDeleteDeviceInfo(item.id)} disabled={actionLoading !== null} title="Xóa" style={{ fontSize: '0.7rem' }}><FontAwesomeIcon icon={faTrash} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination (Luôn hiển thị) */}
          <div className="card-footer bg-light d-flex flex-column flex-sm-row justify-content-between align-items-center p-3 gap-2">
            <small className="text-muted">
              Hiển thị <strong>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{' '}
              <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> / <strong>{totalItems}</strong> bản ghi
            </small>
            {renderPagination()}
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg rounded-2 overflow-hidden">
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <h5 className="modal-title fw-bold">Tạo Thiết Bị Mới</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateModal(false)} disabled={actionLoading !== null} />
              </div>
              <form onSubmit={(e) => { e.preventDefault(); const formData = new FormData(e.currentTarget); const createData: DeviceInfoCreateData = { model: formData.get('model') as string, brand: formData.get('brand') as string, release_date: formData.get('release_date') as string, screen: formData.get('screen') as string, chip_ram: formData.get('chip_ram') as string, camera: formData.get('camera') as string, battery: formData.get('battery') as string, connectivity_os: formData.get('connectivity_os') as string, color_english: formData.get('color_english') as string, dimensions_weight: formData.get('dimensions_weight') as string, sensors_health_features: formData.get('sensors_health_features') as string, warranty: formData.get('warranty') as string }; handleCreateDeviceInfo(createData); }}>
                <div className="modal-body p-3">
                  <div className="row g-2">
                    <div className="col-md-6"><label className="form-label fw-semibold small text-primary">Model *</label><input type="text" className="form-control form-control-sm rounded-2" name="model" required placeholder="iPhone 15 Pro Max" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Thương hiệu *</label><select className="form-select form-select-sm rounded-2" name="brand" required><option value="">-- Chọn thương hiệu --</option>{deviceBrands.map((brand) => (<option key={brand.id} value={brand.name}>{brand.name}</option>))}</select></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Ngày ra mắt</label><input type="date" className="form-control form-control-sm rounded-2" name="release_date" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Màn hình</label><input type="text" className="form-control form-control-sm rounded-2" name="screen" placeholder="6.7 inch, Super Retina XDR" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Chip & RAM</label><input type="text" className="form-control form-control-sm rounded-2" name="chip_ram" placeholder="A17 Pro, 8GB RAM" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Camera</label><input type="text" className="form-control form-control-sm rounded-2" name="camera" placeholder="48MP + 12MP + 12MP" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Pin</label><input type="text" className="form-control form-control-sm rounded-2" name="battery" placeholder="4441 mAh" /></div>
                    <div className="col-md-6"><label className="form-label fw-semibold small">Kết nối & HĐH</label><input type="text" className="form-control form-control-sm rounded-2" name="connectivity_os" placeholder="5G, WiFi 6, iOS 17" /></div>
                    <div className="col-12"><label className="form-label fw-semibold small">Màu sắc (English)</label><input type="text" className="form-control form-control-sm rounded-2" name="color_english" placeholder="Black, White, Blue, Purple" /></div>
                    <div className="col-12"><label className="form-label fw-semibold small">Kích thước & Trọng lượng</label><input type="text" className="form-control form-control-sm rounded-2" name="dimensions_weight" placeholder="160.7 x 77.6 x 7.8 mm, 221g" /></div>
                    <div className="col-12"><label className="form-label fw-semibold small">Cảm biến & Tính năng sức khỏe</label><textarea className="form-control form-control-sm rounded-2" name="sensors_health_features" rows={2} placeholder="Face ID, GPS, NFC..." /></div>
                    <div className="col-12"><label className="form-label fw-semibold small">Bảo hành</label><input type="text" className="form-control form-control-sm rounded-2" name="warranty" placeholder="12 tháng chính hãng" /></div>
                  </div>
                </div>
                <div className="modal-footer bg-light rounded-bottom p-2">
                  <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setShowCreateModal(false)} disabled={actionLoading !== null}>Hủy</button>
                  <button type="submit" className="btn btn-primary btn-sm rounded-pill px-3" disabled={actionLoading !== null}>
                    {actionLoading ? (<><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Đang tạo...</>) : ('Tạo mới')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content shadow-lg rounded-2">
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <h5 className="modal-title fw-bold">Xác nhận nhập Excel</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowImportModal(false)} />
              </div>
              <div className="modal-body p-3">
                <div className="d-flex justify-content-end mb-3">
                  <button className="btn btn-outline-primary btn-sm" onClick={downloadTemplate}>
                    <FontAwesomeIcon icon={faFileExcel} className="me-2" />Tải file mẫu chuẩn
                  </button>
                </div>
                {importErrors.length > 0 && (
                  <div className="alert alert-warning small">
                    <strong>Lỗi dữ liệu ({importErrors.length}):</strong>
                    <ul className="mb-0 mt-1">
                      {importErrors.slice(0, 5).map((e, i) => <li key={i}>{e}</li>)}
                      {importErrors.length > 5 && <li>Và {importErrors.length - 5} lỗi khác...</li>}
                    </ul>
                  </div>
                )}
                <p className="mb-2">Sẽ nhập <strong>{importData.length}</strong> thiết bị hợp lệ.</p>
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <table className="table table-sm table-bordered">
                    <thead className="table-light">
                      <tr><th>Model</th><th>Thương hiệu</th><th>Màn hình</th><th>Chip & RAM</th><th>Camera</th><th>Pin</th></tr>
                    </thead>
                    <tbody>
                      {importData.slice(0, 10).map((item, i) => (
                        <tr key={i}>
                          <td>{item['Model']}</td>
                          <td>{item['Thương hiệu']}</td>
                          <td>{item['Màn hình'] || '-'}</td>
                          <td>{item['Chip & RAM'] || '-'}</td>
                          <td>{item['Camera'] || '-'}</td>
                          <td>{item['Pin'] || '-'}</td>
                        </tr>
                      ))}
                      {importData.length > 10 && (
                        <tr><td colSpan={6} className="text-center text-muted">... và {importData.length - 10} dòng khác</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer bg-light p-2">
                <button className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setShowImportModal(false)}>Hủy</button>
                <button
                  className="btn btn-success btn-sm rounded-pill px-3"
                  onClick={confirmImport}
                  disabled={actionLoading === 'import' || !importFile}
                >
                  {actionLoading === 'import' ? (
                    <><FontAwesomeIcon icon={faSpinner} spin className="me-2" />Đang nhập...</>
                  ) : (
                    `Xác nhận Nhập`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDevice && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content shadow-lg rounded-2 overflow-hidden">
              <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <h5 className="modal-title fw-bold">Chi tiết thiết bị</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)} />
              </div>
              <div className="modal-body p-3">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-2 small">Thông tin cơ bản</h6>
                    <div className="row g-2">
                      <div className="col-12"><label className="form-label fw-semibold small">Model</label><div className="form-control form-control-sm bg-light">{selectedDevice.model}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small">Thương hiệu</label><div className="form-control form-control-sm bg-light">{selectedDevice.brand}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small">Ngày ra mắt</label><div className="form-control form-control-sm bg-light">{selectedDevice.release_date || '-'}</div></div>
                    </div>
                    <h6 className="fw-bold text-primary mt-3 mb-2 small">Thông số kỹ thuật</h6>
                    <div className="row g-2">
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faMobileAlt} className="me-2 text-primary" /> Màn hình</label><div className="form-control form-control-sm bg-light">{selectedDevice.screen || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faMicrochip} className="me-2 text-info" /> Chip & RAM</label><div className="form-control form-control-sm bg-light">{selectedDevice.chip_ram || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faCamera} className="me-2 text-success" /> Camera</label><div className="form-control form-control-sm bg-light">{selectedDevice.camera || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faBatteryHalf} className="me-2 text-warning" /> Pin</label><div className="form-control form-control-sm bg-light">{selectedDevice.battery || '-'}</div></div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-2 small">Thông tin bổ sung</h6>
                    <div className="row g-2">
                      <div className="col-12"><label className="form-label fw-semibold small">Kết nối & Hệ điều hành</label><div className="form-control form-control-sm bg-light">{selectedDevice.connectivity_os || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faWeightHanging} className="me-2 text-secondary" /> Kích thước & Trọng lượng</label><div className="form-control form-control-sm bg-light">{selectedDevice.dimensions_weight || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faShieldAlt} className="me-2 text-danger" /> Cảm biến & Tính năng sức khỏe</label><div className="form-control form-control-sm bg-light">{selectedDevice.sensors_health_features || '-'}</div></div>
                      <div className="col-12"><label className="form-label fw-semibold small"><FontAwesomeIcon icon={faCertificate} className="me-2 text-warning" /> Bảo hành</label><div className="form-control form-control-sm bg-light">{selectedDevice.warranty || '-'}</div></div>
                    </div>
                    <h6 className="fw-bold text-primary mt-3 mb-2 small">Bộ nhớ & Màu sắc</h6>
                    <div className="row g-2">
                      <div className="col-12">
                        <label className="form-label fw-semibold small">Dung lượng bộ nhớ</label>
                        <div className="form-control form-control-sm bg-light">
                          {selectedDevice.device_storages.length > 0 ? selectedDevice.device_storages.map(storage => (<span key={storage.id} className="badge bg-primary me-1 small">{storage.capacity}GB</span>)) : '-'}
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold small"><FontAwesomeIcon icon={faPalette} className="me-2 text-success" /> Màu sắc</label>
                        <div className="form-control form-control-sm bg-light">
                          {getAllColors(selectedDevice).length > 0 ? getAllColors(selectedDevice).map(color => (<span key={color} className="badge bg-light text-dark border me-1 mb-1 small">{color}</span>)) : '-'}
                        </div>
                      </div>
                    </div>
                    <h6 className="fw-bold text-primary mt-3 mb-2 small">Thông tin hệ thống</h6>
                    <div className="row g-2">
                      <div className="col-6"><label className="form-label fw-semibold small">Ngày tạo</label><div className="form-control form-control-sm bg-light small">{formatDate(selectedDevice.created_at)}</div></div>
                      <div className="col-6"><label className="form-label fw-semibold small">Cập nhật</label><div className="form-control form-control-sm bg-light small">{formatDate(selectedDevice.updated_at)}</div></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light rounded-bottom p-2">
                <button type="button" className="btn btn-secondary btn-sm rounded-pill px-3" onClick={() => setShowDetailModal(false)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceInfoManagementPage;