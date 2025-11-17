// src/pages/DeviceInfoManagementPage.tsx
import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faTrash, faSearch, faSync, faPlus, faMobileAlt,
  faEye, faMicrochip, faCamera, faBatteryHalf,
  faPalette, faWeightHanging, faShieldAlt, faCertificate,
  faCalendar, faChevronLeft, faChevronRight, faFileExcel
} from '@fortawesome/free-solid-svg-icons';
import { faAndroid, faApple } from '@fortawesome/free-brands-svg-icons';

import { deviceBrandService, DeviceBrand } from '../services/deviceBrandService';

// Excel
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// === INTERFACE ===
interface DeviceStorage {
  id: string;
  capacity: number;
  device_info_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DeviceColor {
  id: string;
  name: string;
  color_code: string;
  device_info_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DeviceMaterial {
  id: string;
  name: string;
  device_info_id: string;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface DeviceInfo {
  id: string;
  model: string;
  brand: string;
  release_date: string | null;
  screen: string | null;
  chip_ram: string | null;
  camera: string | null;
  battery: string | null;
  connectivity_os: string | null;
  color_english: string | null;
  dimensions_weight: string | null;
  sensors_health_features: string | null;
  warranty: string | null;
  user_id: string | null;
  materials: DeviceMaterial[];
  device_storages: DeviceStorage[];
  device_colors: DeviceColor[];
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  data: DeviceInfo[];
  total: number;
  totalPages: number;
  message: string;
  status_code: number;
}

interface DeviceInfoCreateData {
  model?: string;
  brand?: string;
  release_date?: string;
  screen?: string;
  chip_ram?: string;
  camera?: string;
  battery?: string;
  connectivity_os?: string;
  color_english?: string;
  dimensions_weight?: string;
  sensors_health_features?: string;
  warranty?: string;
}

const DeviceInfoManagementPage: React.FC = () => {
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeviceInfos, setSelectedDeviceInfos] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceInfo | null>(null);
  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);

  // Import Excel states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const itemsPerPage = 8;

  // === LOAD DATA ===
  const loadDeviceInfos = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = { page, limit: itemsPerPage, include_details: true };
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const response = await api.get('/device-infos', { params });
      const data: ApiResponse = response.data;

      setDeviceInfos(data.data || []);
      setTotalItems(data.total || 0);
      setTotalPages(data.totalPages || 1);
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
  };

  const loadAllDeviceBrands = async () => {
    try {
      const response = await deviceBrandService.getAllDeviceBrands();
      setDeviceBrands(response || []);
    } catch (err) {
      toast.error('Không thể tải danh sách thương hiệu');
    }
  };

  // === EXPORT EXCEL ===
  const exportToExcel = () => {
    if (deviceInfos.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel');
      return;
    }

    const exportData = deviceInfos.map((item) => ({
      'Thương hiệu': item.brand,
      'Model': item.model,
      'Ngày ra mắt': item.release_date ? new Date(item.release_date).toLocaleDateString('vi-VN') : '-',
      'Màn hình': item.screen || '-',
      'Chip & RAM': item.chip_ram || '-',
      'Camera': item.camera || '-',
      'Pin': item.battery || '-',
      'Kết nối & HĐH': item.connectivity_os || '-',
      'Màu sắc': getAllColors(item).join(', ') || '-',
      'Kích thước & Trọng lượng': item.dimensions_weight || '-',
      'Cảm biến & Sức khỏe': item.sensors_health_features || '-',
      'Bảo hành': item.warranty || '-',
      'Dung lượng': item.device_storages.map(s => `${s.capacity}GB`).join(', ') || '-',
      'Ngày tạo': new Date(item.created_at).toLocaleDateString('vi-VN'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Thiết bị');
    worksheet['!cols'] = Object.keys(exportData[0] || {}).map(() => ({ wch: 30 }));

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const fileName = `Thong_tin_thiet_bi_${new Date().toISOString().slice(0,10)}.xlsx`;
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, fileName);

    toast.success(`Đã xuất ${deviceInfos.length} thiết bị ra Excel!`);
  };

  // === IMPORT EXCEL ===
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length < 2) {
          toast.error('File Excel trống hoặc không có dữ liệu');
          return;
        }

        const headers = data[0] as string[];
        const rows = data.slice(1);

        const parsed = rows.map((row: any, index) => {
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = row[i];
          });
          return { ...obj, _row: index + 2 };
        });

        const errors: string[] = [];
        const validData = parsed.filter((item) => {
          if (!item['Model']) {
            errors.push(`Dòng ${item._row}: Thiếu Model`);
            return false;
          }
          if (!item['Thương hiệu']) {
            errors.push(`Dòng ${item._row}: Thiếu Thương hiệu`);
            return false;
          }
          return true;
        });

        setImportData(validData);
        setImportErrors(errors);
        setShowImportModal(true);
      } catch (err) {
        toast.error('File Excel không hợp lệ');
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = async () => {
    if (importData.length === 0) return;

    try {
      setActionLoading('import');
      const payload = importData.map(item => ({
        model: item['Model'],
        brand: item['Thương hiệu'],
        release_date: item['Ngày ra mắt'] || null,
        screen: item['Màn hình'] || null,
        chip_ram: item['Chip & RAM'] || null,
        camera: item['Camera'] || null,
        battery: item['Pin'] || null,
        connectivity_os: item['Kết nối & HĐH'] || null,
        color_english: item['Màu sắc'] || null,
        dimensions_weight: item['Kích thước & Trọng lượng'] || null,
        sensors_health_features: item['Cảm biến & Sức khỏe'] || null,
        warranty: item['Bảo hành'] || null,
      }));

      await api.post('/device-infos/bulk', payload);
      toast.success(`Nhập thành công ${payload.length} thiết bị!`);
      setShowImportModal(false);
      setImportData([]);
      setImportErrors([]);
      loadDeviceInfos(1);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Lỗi nhập dữ liệu');
    } finally {
      setActionLoading(null);
    }
  };

  // === CÁC HÀM KHÁC ===
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
      setDeviceInfos(prev => prev.filter(item => item.id !== deviceId));
      setSelectedDeviceInfos(prev => prev.filter(id => id !== deviceId));
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

  const handleBulkAction = async (action: 'delete') => {
    if (selectedDeviceInfos.length === 0) {
      toast.error('Chọn ít nhất một item');
      return;
    }
    if (!window.confirm(`Xác nhận xóa ${selectedDeviceInfos.length} item?`)) return;
    try {
      setActionLoading('bulk');
      const results = await Promise.allSettled(
        selectedDeviceInfos.map(id => api.delete(`/device-infos/${id}`))
      );
      const successful = results.filter(r => r.status === 'fulfilled').length;
      toast.success(`Xóa thành công ${successful}/${selectedDeviceInfos.length} item`);
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
    const page = Math.max(1, Math.min(totalPages, pageNumber));
    setCurrentPage(page);
    loadDeviceInfos(page);
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

  return (
    <div className="container-fluid px-3 py-3">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-2">
        <div>
          <h1 className="h4 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faMobileAlt} className="me-2 text-primary" />
            Quản lý Thiết Bị
          </h1>
          <p className="text-muted mb-0 small">Quản lý thông tin kỹ thuật thiết bị</p>
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
            onClick={() => document.getElementById('import-excel-input')?.click()}
            title="Nhập từ Excel"
          >
            <FontAwesomeIcon icon={faFileExcel} className="me-1" />
            Import Excel
          </button>
          <input
            id="import-excel-input"
            type="file"
            accept=".xlsx,.xls"
            className="d-none"
            onChange={handleImportExcel}
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
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary btn-sm dropdown-toggle w-100 rounded-pill"
                  type="button"
                  data-bs-toggle="dropdown"
                  disabled={selectedDeviceInfos.length === 0 || actionLoading === 'bulk'}
                >
                  <span className="me-1">Hành động</span>
                  <span className="badge bg-primary rounded-pill">{selectedDeviceInfos.length}</span>
                </button>
                <ul className="dropdown-menu shadow-sm">
                  <li>
                    <button
                      className="dropdown-item text-danger d-flex align-items-center small"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <FontAwesomeIcon icon={faTrash} className="me-2" />
                      Xóa đã chọn
                    </button>
                  </li>
                </ul>
              </div>
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
                  <th width="80" className="fw-semibold px-2">Thương hiệu</th>
                  <th width="90" className="fw-semibold px-2">Model</th>
                  <th width="80" className="fw-semibold px-2">Ngày ra mắt</th>
                  <th width="80" className="fw-semibold px-2">Màn hình</th>
                  <th width="80" className="fw-semibold px-2">Chip/RAM</th>
                  <th width="90" className="fw-semibold px-2">Camera</th>
                  <th width="70" className="fw-semibold px-2">Pin</th>
                  <th width="90" className="fw-semibold px-2">Kết nối/HĐH</th>
                  <th width="80" className="fw-semibold px-2">Màu sắc</th>
                  <th width="100" className="fw-semibold px-2">K.thước/T.lượng</th>
                  <th width="100" className="fw-semibold px-2">Cảm biến</th>
                  <th width="80" className="fw-semibold px-2">Bảo hành</th>
                  <th width="80" className="fw-semibold px-2">Ngày tạo</th>
                  <th width="70" className="fw-semibold text-center px-2">Thao tác</th>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="card-footer bg-light d-flex justify-content-between align-items-center p-2">
              <small className="text-muted">
                Hiển thị <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> -{' '}
                <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> / <strong>{totalItems}</strong>
              </small>
              <div className="d-flex align-items-center gap-1">
                <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || loading}><FontAwesomeIcon icon={faChevronLeft} className="small" /></button>
                <div className="d-flex gap-1">
                  {getPageRange().map((page) => (
                    <button key={page} className={`btn btn-sm rounded-pill px-3 ${currentPage === page ? 'btn-primary text-white' : 'btn-outline-primary'}`} onClick={() => paginate(page)} disabled={loading} style={{ minWidth: '2rem' }}>{page}</button>
                  ))}
                </div>
                <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || loading}><FontAwesomeIcon icon={faChevronRight} className="small" /></button>
              </div>
            </div>
          )}
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
                    {actionLoading ? (<><span className="spinner-border spinner-border-sm me-2" />Đang tạo...</>) : ('Tạo mới')}
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
                  disabled={actionLoading === 'import' || importData.length === 0}
                >
                  {actionLoading === 'import' ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Đang nhập...</>
                  ) : (
                    `Nhập ${importData.length} thiết bị`
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