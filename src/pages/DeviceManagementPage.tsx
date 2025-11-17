// src/pages/DeviceManagementPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit, faTrash, faPlus, faSpinner, faSearch, faFilter, faSync,
  faMobileAlt, faTabletAlt, faLaptop, faCopy, faExclamationTriangle,
  faFileExcel, faFileImport, faFileExport, faDownload, faUpload
} from '@fortawesome/free-solid-svg-icons';

import { 
  userDeviceService, deviceInfoService, colorService, storageService 
} from '../services/deviceService';

import {
  UserDeviceDetailRead, UserDeviceCreate, UserDeviceUpdate,
} from '../types/userDevice';
import { DeviceInfoRead } from '../types/deviceTypes';
import { Color } from '../types/deviceTypes';
import { StorageOption } from '../types/deviceTypes';

const modalRoot = document.getElementById('modal-root');

const initialFormState: UserDeviceCreate = {
  device_info_id: '',
  color_id: null,
  device_storage_id: null,
  product_code: null,
  warranty: '12 Tháng',
  device_condition: 'Mới',
  device_type: 'Điện thoại',
  battery_condition: '100%',
  price: 0,
  wholesale_price: 0,
  inventory: 1,
  notes: '',
};

function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const DeviceManagementPage: React.FC = () => {
  const [devices, setDevices] = useState<UserDeviceDetailRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const [deviceInfos, setDeviceInfos] = useState<DeviceInfoRead[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [storages, setStorages] = useState<StorageOption[]>([]);
  const [loadingStorages, setLoadingStorages] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [currentData, setCurrentData] = useState<UserDeviceCreate | UserDeviceUpdate>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Excel import/export states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadStaticData = async () => {
    try {
      const [infoRes, colRes] = await Promise.all([
        deviceInfoService.getAllDeviceInfos(),
        colorService.getAllColors(),
      ]);
      setDeviceInfos(infoRes);
      setColors(colRes);
    } catch (err) {
      console.error('Lỗi tải dữ liệu tĩnh:', err);
    }
  };

  const loadPageData = useCallback(async (page: number, search: string = '', type: string = 'all') => {
    try {
      setLoading(true);
      setError(null);
      const res = await userDeviceService.getMyDevices(page, 10, search, type);
      setDevices(res.items ?? []);
      setPagination({
        page: res.page,
        total_pages: res.totalPages,
        total: res.total,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    loadPageData(1, debouncedSearchTerm, filterType);
  }, [debouncedSearchTerm, filterType, loadPageData]);

  const loadStoragesForDevice = async (deviceInfoId: string) => {
    if (!deviceInfoId) {
      setStorages([]);
      return;
    }
    try {
      setLoadingStorages(true);
      const data = await storageService.getStoragesForDevice(deviceInfoId);
      setStorages(data);
    } catch (err) {
      console.error("Lỗi tải storages:", err);
      setStorages([]);
    } finally {
      setLoadingStorages(false);
    }
  };

  // Excel Export Function
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      await userDeviceService.exportToExcel(debouncedSearchTerm, filterType);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi xuất file Excel');
    } finally {
      setIsExporting(false);
    }
  };

  // Excel Import Functions
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is Excel format
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.oasis.opendocument.spreadsheet'
      ];
      
      if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|ods)$/)) {
        setImportError('Vui lòng chọn file Excel (xlsx, xls, ods)');
        setImportFile(null);
        return;
      }
      
      setImportFile(file);
      setImportError(null);
    }
  };

  const handleImportExcel = async () => {
    if (!importFile) {
      setImportError('Vui lòng chọn file Excel để nhập');
      return;
    }

    try {
      setIsImporting(true);
      setImportError(null);
      setImportSuccess(null);

      const result = await userDeviceService.importFromExcel(importFile);
      
      setImportSuccess(`Nhập thành công ${result.successCount} thiết bị. ${result.errors.length > 0 ? `Lỗi: ${result.errors.length}` : ''}`);
      
      if (result.errors.length > 0) {
        console.error('Lỗi nhập liệu:', result.errors);
      }

      // Reload data
      loadPageData(pagination?.page ?? 1, debouncedSearchTerm, filterType);
      
      // Close modal after 2 seconds if successful
      setTimeout(() => {
        if (result.errors.length === 0) {
          setShowImportModal(false);
          setImportFile(null);
        }
      }, 2000);

    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Lỗi nhập file Excel');
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      await userDeviceService.downloadTemplate();
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Lỗi tải template');
    }
  };

  const openAddModal = () => {
    setCurrentData(initialFormState);
    setStorages([]);
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (device: UserDeviceDetailRead) => {
    setIsEditMode(true);
    setEditId(device.id);
    loadStoragesForDevice(device.device_info?.id ?? '');
    setCurrentData({
      device_info_id: device.device_info?.id ?? '',
      color_id: device.color?.id ?? null,
      device_storage_id: device.device_storage_id ?? null,
      product_code: device.product_code ?? null,
      warranty: device.warranty ?? '12 Tháng',
      device_condition: device.device_condition ?? 'Mới',
      device_type: device.device_type ?? 'Điện thoại',
      battery_condition: device.battery_condition ?? '100%',
      price: device.price ?? 0,
      wholesale_price: device.wholesale_price ?? 0,
      inventory: device.inventory ?? 1,
      notes: device.notes ?? '',
    });
    setModalError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setShowModal(false);
    setModalError(null);
  };

  const closeImportModal = () => {
    if (isImporting) return;
    setShowImportModal(false);
    setImportFile(null);
    setImportError(null);
    setImportSuccess(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'device_info_id') {
      loadStoragesForDevice(value);
      setCurrentData((prev) => ({
        ...prev,
        [name]: value,
        device_storage_id: null,
      }));
      return;
    }

    const numericFields = ['price', 'wholesale_price', 'inventory'];
    if (numericFields.includes(name)) {
      if (value === '') {
        setCurrentData((prev) => ({ ...prev, [name]: null }));
      } else {
        const num = parseInt(value, 10);
        if (!isNaN(num)) {
          setCurrentData((prev) => ({ ...prev, [name]: num }));
        }
      }
      return;
    }

    setCurrentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      if (isEditMode && editId) {
        await userDeviceService.updateUserDevice(editId, currentData as UserDeviceUpdate);
      } else {
        await userDeviceService.createUserDevice(currentData as UserDeviceCreate);
      }
      closeModal();
      loadPageData(pagination?.page ?? 1, debouncedSearchTerm, filterType);
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Lỗi lưu thiết bị');
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteModal = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await userDeviceService.deleteUserDevice(deleteId);
      closeDeleteModal();
      if (devices.length === 1 && pagination?.page > 1) {
        loadPageData(pagination.page - 1, debouncedSearchTerm, filterType);
      } else {
        loadPageData(pagination?.page ?? 1, debouncedSearchTerm, filterType);
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Lỗi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  const changePage = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.total_pages) {
      loadPageData(newPage, debouncedSearchTerm, filterType);
    }
  };

  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;

    const current = pagination.page;
    const total = pagination.total_pages;
    const delta = 1;
    const pages = [];

    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    if (pages[0] > 1) pages.unshift(1);
    if (pages[pages.length - 1] < total) pages.push(total);

    return (
      <div className="d-flex justify-content-center align-items-center gap-1 mt-3">
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => changePage(current - 1)} disabled={current === 1}>
          Trước
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={p}>
            {pages[i - 1] && pages[i - 1] + 1 < p && (
              <span className="px-2 text-muted">...</span>
            )}
            <button
              className={`btn btn-sm rounded-pill ${p === current ? 'btn-primary text-white' : 'btn-outline-secondary'} px-3`}
              onClick={() => changePage(p)}
            >
              {p}
            </button>
          </React.Fragment>
        ))}
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => changePage(current + 1)} disabled={current === total}>
          Sau
        </button>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={12} className="py-4">
            <div className="d-flex align-items-center p-3">
              <div className="placeholder-glow w-100">
                <div className="placeholder col-7 h-4 rounded"></div>
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
          <td colSpan={12} className="text-center py-5">
            <div className="alert alert-danger d-inline-block p-4 rounded-3 shadow-sm">
              <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
              {error}
            </div>
          </td>
        </tr>
      );
    }

    if (devices.length === 0) {
      return (
        <tr>
          <td colSpan={12} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faFilter} size="3x" className="mb-3 opacity-25" />
            <p className="mb-1 fw-medium">Không có thiết bị</p>
            <small>Nhấn nút <strong>"Thêm mới"</strong> để bắt đầu</small>
          </td>
        </tr>
      );
    }

    return devices.map((d) => (
      <tr key={d.id} className="align-middle transition-all hover-bg-light">
        <td className="ps-4 py-3">
          <div className="d-flex align-items-center">
            <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3 shadow-sm"
              style={{
                width: '42px',
                height: '42px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                fontSize: '0.95rem',
              }}
            >
              {d.device_info?.model?.charAt(0) || 'D'}
            </div>
            <div>
              <div className="fw-semibold text-dark">{d.device_info?.model ?? 'N/A'}</div>
              <div className="small text-muted d-flex align-items-center">
                {d.product_code || d.id.slice(0, 8)}
                <button className="btn btn-sm p-0 ms-1 text-muted" title="Sao chép">
                  <FontAwesomeIcon icon={faCopy} size="xs" />
                </button>
              </div>
            </div>
          </div>
        </td>
        <td>
          <FontAwesomeIcon
            icon={d.device_type === 'Điện thoại' ? faMobileAlt : d.device_type === 'Tablet' ? faTabletAlt : faLaptop}
            className="me-2 text-primary"
          />
          <span className="small fw-medium">{d.device_type}</span>
        </td>
        <td>
          <span className={`badge rounded-pill px-3 py-1 fw-medium ${
            d.device_condition === 'Mới' ? 'bg-success' : 
            d.device_condition === 'Likenew' ? 'bg-info text-dark' : 'bg-warning text-dark'
          }`}>
            {d.device_condition}
          </span>
        </td>
        <td className="text-muted small">{d.warranty ?? '-'}</td>
        <td className="text-muted small">{d.battery_condition ?? '-'}</td>
        <td>
          {d.color?.name ? (
            <div className="d-flex align-items-center">
              <span
                className="d-inline-block rounded-circle me-2 shadow-sm"
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: d.color.hex || '#ccc',
                }}
              ></span>
              <span className="small">{d.color.name}</span>
            </div>
          ) : (
            <span className="text-muted small">-</span>
          )}
        </td>
        <td className="small">{d.device_storage ? `${d.device_storage.capacity}GB` : '-'}</td>
        <td className="fw-bold text-success">{d.inventory}</td>
        <td className="fw-bold text-primary">
          {(d.price ?? 0).toLocaleString('vi-VN')} ₫
        </td>
        <td className="fw-bold text-info">
          {(d.wholesale_price ?? 0).toLocaleString('vi-VN')} ₫
        </td>
        <td>
          <span
            className="d-inline-block text-truncate small text-muted"
            style={{ maxWidth: '130px' }}
            title={d.notes ?? ''}
          >
            {d.notes || '-'}
          </span>
        </td>
        <td>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-primary rounded-pill px-3" onClick={() => openEditModal(d)} title="Chỉnh sửa">
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button className="btn btn-outline-danger rounded-pill px-3" onClick={() => openDeleteModal(d.id)} title="Xóa">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showModal || showDeleteModal || showImportModal) && (
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        )}

        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                    <h5 className="modal-title fw-bold">
                      {isEditMode ? 'Cập nhật Thiết bị' : 'Thêm Thiết bị mới'}
                    </h5>
                    <button type="button" className="btn-close btn-close-white" onClick={closeModal} disabled={isSaving} />
                  </div>

                  <div className="modal-body p-4">
                    {modalError && (
                      <div className="alert alert-danger rounded-3 shadow-sm">
                        {modalError}
                      </div>
                    )}

                    <div className="row g-4">
                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label fw-semibold text-primary">Thông tin máy *</label>
                          <select className="form-select rounded-3" name="device_info_id" value={currentData.device_info_id ?? ''} onChange={handleInputChange} required disabled={isSaving}>
                            <option value="">-- Chọn loại máy --</option>
                            {deviceInfos.map((info) => (
                              <option key={info.id} value={info.id}>
                                {info.brand} {info.model}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Màu sắc</label>
                          <select className="form-select rounded-3" name="color_id" value={currentData.color_id ?? ''} onChange={handleInputChange} disabled={isSaving}>
                            <option value="">-- Chọn màu --</option>
                            {colors.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Dung lượng</label>
                          <select className="form-select rounded-3" name="device_storage_id" value={currentData.device_storage_id ?? ''} onChange={handleInputChange} disabled={loadingStorages || isSaving || !currentData.device_info_id}>
                            <option value="">{loadingStorages ? 'Đang tải...' : '-- Chọn dung lượng --'}</option>
                            {storages.map((s) => (
                              <option key={s.id} value={s.id}>{s.capacity}GB</option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Mã sản phẩm</label>
                          <input type="text" className="form-control rounded-3" name="product_code" value={currentData.product_code ?? ''} onChange={handleInputChange} disabled={isSaving} placeholder="VD: IP15PM128" />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Bảo hành</label>
                          <select className="form-select rounded-3" name="warranty" value={currentData.warranty ?? ''} onChange={handleInputChange} disabled={isSaving}>
                            <option value="12 Tháng">12 Tháng</option>
                            <option value="6 Tháng">6 Tháng</option>
                            <option value="Không bảo hành">Không bảo hành</option>
                          </select>
                        </div>
                      </div>

                      <div className="col-lg-6">
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Tình trạng</label>
                          <select className="form-select rounded-3" name="device_condition" value={currentData.device_condition ?? ''} onChange={handleInputChange} disabled={isSaving}>
                            <option value="Mới">Mới</option>
                            <option value="Likenew">Likenew</option>
                            <option value="Cũ">Cũ</option>
                          </select>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Pin (%)</label>
                          <input type="text" className="form-control rounded-3" name="battery_condition" value={currentData.battery_condition ?? ''} onChange={handleInputChange} disabled={isSaving} placeholder="VD: 98%" />
                        </div>

                        <div className="row g-3">
                          <div className="col-6">
                            <label className="form-label fw-semibold">Giá bán (₫)</label>
                            <input type="number" className="form-control rounded-3" name="price" value={currentData.price ?? ''} onChange={handleInputChange} min="0" disabled={isSaving} />
                          </div>
                          <div className="col-6">
                            <label className="form-label fw-semibold">Giá sỉ (₫)</label>
                            <input type="number" className="form-control rounded-3" name="wholesale_price" value={currentData.wholesale_price ?? ''} onChange={handleInputChange} min="0" disabled={isSaving} />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Số lượng tồn</label>
                          <input type="number" className="form-control rounded-3" name="inventory" value={currentData.inventory ?? ''} onChange={handleInputChange} min="0" disabled={isSaving} />
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Ghi chú</label>
                          <textarea className="form-control rounded-3" name="notes" rows={3} value={currentData.notes ?? ''} onChange={handleInputChange} disabled={isSaving} placeholder="Ghi chú thêm..." />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer bg-light rounded-bottom">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={closeModal} disabled={isSaving}>Hủy</button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
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
          </div>
        )}

        {showDeleteModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1060 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                    Xác nhận xóa
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeDeleteModal} disabled={isDeleting} />
                </div>
                <div className="modal-body p-4">
                  {deleteError && <div className="alert alert-danger rounded-3">{deleteError}</div>}
                  <p className="mb-0 fw-medium">Bạn có chắc chắn muốn <span className="text-danger">xóa thiết bị này</span>?</p>
                </div>
                <div className="modal-footer bg-light rounded-bottom">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={closeDeleteModal} disabled={isDeleting}>Hủy</button>
                  <button type="button" className="btn btn-danger rounded-pill px-4" onClick={confirmDelete} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
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

        {/* Import Excel Modal */}
        {showImportModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={faFileImport} className="me-2" />
                    Nhập dữ liệu từ Excel
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeImportModal} disabled={isImporting} />
                </div>

                <div className="modal-body p-4">
                  {importError && (
                    <div className="alert alert-danger rounded-3 shadow-sm">
                      {importError}
                    </div>
                  )}

                  {importSuccess && (
                    <div className="alert alert-success rounded-3 shadow-sm">
                      {importSuccess}
                    </div>
                  )}

                  <div className="mb-4">
                    <h6 className="fw-semibold text-primary mb-3">Hướng dẫn nhập liệu:</h6>
                    <ul className="list-unstyled small text-muted">
                      <li className="mb-1">• Tải file template mẫu để đảm bảo định dạng đúng</li>
                      <li className="mb-1">• File phải có định dạng Excel (.xlsx, .xls, .ods)</li>
                      <li className="mb-1">• Các trường bắt buộc: Model, Loại thiết bị, Tình trạng, Giá bán</li>
                      <li className="mb-1">• Đảm bảo mã sản phẩm là duy nhất</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Chọn file Excel:</label>
                    <input
                      type="file"
                      className="form-control rounded-3"
                      accept=".xlsx,.xls,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleImportFileChange}
                      disabled={isImporting}
                    />
                    <div className="form-text">
                      {importFile ? `Đã chọn: ${importFile.name}` : 'Chưa chọn file nào'}
                    </div>
                  </div>

                  <div className="d-flex gap-2 flex-wrap">
                    <button 
                      className="btn btn-outline-success rounded-pill px-4 d-flex align-items-center"
                      onClick={downloadTemplate}
                      disabled={isImporting}
                    >
                      <FontAwesomeIcon icon={faDownload} className="me-2" />
                      Tải Template
                    </button>
                    
                    <button 
                      className="btn btn-success rounded-pill px-4 d-flex align-items-center ms-auto"
                      onClick={handleImportExcel}
                      disabled={!importFile || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} spin className="me-2" />
                          Đang nhập...
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faFileImport} className="me-2" />
                          Nhập dữ liệu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      modalRoot
    );
  };

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faMobileAlt} className="me-2 text-primary" />
            Quản lý Thiết bị
          </h1>
          <p className="text-muted mb-0 small">Thêm, sửa, xóa và quản lý kho thiết bị</p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button 
            className="btn btn-outline-success rounded-pill shadow-sm px-4 d-flex align-items-center"
            onClick={() => setShowImportModal(true)}
          >
            <FontAwesomeIcon icon={faFileImport} className="me-2" />
            Nhập Excel
          </button>
          <button 
            className="btn btn-success rounded-pill shadow-sm px-4 d-flex align-items-center"
            onClick={handleExportExcel}
            disabled={isExporting || devices.length === 0}
          >
            <FontAwesomeIcon icon={isExporting ? faSpinner : faFileExport} spin={isExporting} className="me-2" />
            Xuất Excel
          </button>
          <button className="btn btn-primary rounded-pill shadow-sm px-4 d-flex align-items-center" onClick={openAddModal}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-center">
            <div className="col-lg-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 rounded-end-pill"
                  placeholder="Tìm model, mã, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-3">
              <select className="form-select rounded-pill" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tất cả loại</option>
                <option value="Điện thoại">Điện thoại</option>
                <option value="Tablet">Tablet</option>
                <option value="Laptop">Laptop</option>
              </select>
            </div>
            <div className="col-lg-2">
              <button className="btn btn-outline-primary rounded-pill w-100 d-flex align-items-center justify-content-center" onClick={() => loadPageData(1, debouncedSearchTerm, filterType)} disabled={loading}>
                <FontAwesomeIcon icon={loading ? faSpinner : faSync} spin={loading} className="me-2" />
                {loading ? '...' : 'Tải lại'}
              </button>
            </div>
            <div className="col-lg-2 text-lg-end">
              <small className="text-muted">
                Tổng: <strong className="text-primary fw-bold">{pagination?.total || 0}</strong>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="text-white" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}>
                <tr>
                  <th className="ps-4 fw-semibold">Máy / Mã</th>
                  <th className="fw-semibold">Loại</th>
                  <th className="fw-semibold">Tình trạng</th>
                  <th className="fw-semibold">Bảo hành</th>
                  <th className="fw-semibold">Pin</th>
                  <th className="fw-semibold">Màu</th>
                  <th className="fw-semibold">Dung lượng</th>
                  <th className="fw-semibold">Tồn</th>
                  <th className="fw-semibold">Giá bán</th>
                  <th className="fw-semibold">Giá sỉ</th>
                  <th className="fw-semibold">Ghi chú</th>
                  <th className="text-center fw-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {renderTable()}
              </tbody>
            </table>
          </div>
        </div>
        {pagination && pagination.total > 0 && (
          <div className="card-footer bg-light d-flex justify-content-between align-items-center flex-wrap gap-3 p-3">
            <small className="text-muted">
              Hiển thị <strong>{devices.length}</strong> trên <strong>{pagination.total}</strong>
            </small>
            {renderPagination()}
          </div>
        )}
      </div>

      {renderModals()}
    </div>
  );
};

export default DeviceManagementPage;