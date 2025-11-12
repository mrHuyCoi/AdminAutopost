// src/pages/DeviceManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import StatCard from '../components/StatCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { PaginationMetadata } from '../types/response';

// Import 4 Services
import { userDeviceService } from '../services/userDeviceService';
import { deviceInfoService } from '../services/deviceInfoService';
import { colorService } from '../services/colorService';
import { storageService } from '../services/storageService';

// Import 4 Types
import { UserDeviceDetailRead, UserDeviceCreate, UserDeviceUpdate } from '../types/userDevice';
import { DeviceInfoRead } from '../types/device';
import { ColorRead } from '../types/device';
import { DeviceStorageResponse } from '../types/storage'; // Dùng kiểu trả về của API

// Lấy element root của modal
const modalRoot = document.getElementById('modal-root');

// === Trạng thái form ban đầu ===
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
  notes: ''
};

const DeviceManagementPage: React.FC = () => {

  // === STATE DỮ LIỆU (Bảng chính) ===
  const [devices, setDevices] = useState<UserDeviceDetailRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);

  // === STATE CHO DROPDOWNS (Modal) ===
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfoRead[]>([]);
  const [colors, setColors] = useState<ColorRead[]>([]);
  const [storages, setStorages] = useState<DeviceStorageResponse[]>([]); // Dropdown phụ thuộc
  const [loadingStorages, setLoadingStorages] = useState(false);

  // === STATE CHO MODAL & FORM ===
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  const [currentData, setCurrentData] = useState<UserDeviceCreate | UserDeviceUpdate>(initialFormState);
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
    if (titleElement) titleElement.innerText = 'Quản lý Thiết bị';
    if (subtitleElement) subtitleElement.innerText = 'Quản lý kho hàng thiết bị';
    
    loadPageData(1);
  }, []);

  const loadPageData = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Tải song song Bảng chính + 2 Dropdowns
      const [devicesResponse, deviceInfosResponse, colorsResponse] = await Promise.all([
        userDeviceService.getMyDevices(page, 10),
        deviceInfoService.getAllDeviceInfos(),
        colorService.getAllColors()
      ]);
      
      setDevices(devicesResponse.data);
      if (devicesResponse.metadata) {
        setPagination(devicesResponse.metadata);
      }
      
      setDeviceInfos(deviceInfosResponse.data);
      setColors(colorsResponse.data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };
  
  // === LOGIC DROPDOWN PHỤ THUỘC ===
  const loadStoragesForDevice = async (deviceId: string) => {
    if (!deviceId) {
      setStorages([]);
      return;
    }
    try {
      setLoadingStorages(true);
      const storagesArray = await storageService.getStoragesForDevice(deviceId);
      setStorages(storagesArray);
    } catch (err) {
      console.error("Lỗi tải dung lượng:", err);
      setStorages([]); // Xóa sạch nếu lỗi
    } finally {
      setLoadingStorages(false);
    }
  };

  // === CÁC HÀM XỬ LÝ SỰ KIỆN ===
  const handleAddNewClick = () => {
    setCurrentData(initialFormState);
    setStorages([]); // Xóa dropdown dung lượng
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleEditClick = (device: UserDeviceDetailRead) => {
    setIsEditMode(true);
    setEditId(device.id);
    
    // Tải trước dropdown dung lượng cho thiết bị này
    if (device.device_info?.id) {
      loadStoragesForDevice(device.device_info.id);
    }

    setCurrentData({
      device_info_id: device.device_info?.id || '',
      color_id: device.color?.id || null,
      device_storage_id: device.device_storage_id || null, // Dùng ID từ bảng chính
      product_code: device.product_code,
      warranty: device.warranty,
      device_condition: device.device_condition,
      device_type: device.device_type,
      battery_condition: device.battery_condition,
      price: device.price,
      wholesale_price: device.wholesale_price,
      inventory: device.inventory,
      notes: device.notes
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => { if (isSaving) return; setShowModal(false); };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // --- XỬ LÝ DROPDOWN PHỤ THUỘC ---
    if (name === 'device_info_id') {
      // Nếu chọn "Thông tin máy", tải lại "Dung lượng"
      loadStoragesForDevice(value);
      // Xóa dung lượng đã chọn
      setCurrentData(prev => ({
        ...prev,
        [name]: value,
        device_storage_id: null // Reset
      }));
      return;
    }
    
    // Xử lý các trường là SỐ
    const isNumber = ['price', 'wholesale_price', 'inventory'].includes(name);

    setCurrentData(prev => ({
      ...prev,
      [name]: value === "" ? null : (isNumber ? parseFloat(value) || 0 : value)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);

    try {
      if (isEditMode && editId) {
        await userDeviceService.updateUserDevice(editId, currentData as UserDeviceUpdate);
      } else {
        await userDeviceService.createUserDevice(currentData as UserDeviceCreate);
      }
      handleCloseModal();
      loadPageData(pagination?.page || 1); // Tải lại
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSaving(false);
    }
  };

  // --- Xử lý Xóa ---
  const handleDeleteClick = (id: string) => { setDeleteId(id); setDeleteError(null); setShowDeleteModal(true); };
  const handleCloseDeleteModal = () => { if (isDeleting) return; setShowDeleteModal(false); setDeleteId(null); };
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await userDeviceService.deleteUserDevice(deleteId); 
      setDevices(prev => prev.filter(d => d.id !== deleteId));
      handleCloseDeleteModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // --- Xử lý Phân trang ---
  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.total_pages) {
      loadPageData(newPage); 
    }
  };

  // === HÀM RENDER BẢNG (cho Cột Phải) ===
  const renderDeviceTable = () => {
    if (loading) return <tr><td colSpan={10} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={10} className="text-center text-danger py-4">{error}</td></tr>;
    if (devices.length === 0) return <tr><td colSpan={10} className="text-center py-5 text-muted">Chưa có thiết bị nào.</td></tr>;

    return devices.map((device) => (
      <tr key={device.id}>
        <td data-label="Tên Thiết bị" className="align-middle" style={{ paddingLeft: '1.5rem' }}>
          <strong>{device.device_info?.model || 'N/A'}</strong>
          <br />
          <small className="text-muted">{device.product_code || device.id.substring(0,8)}</small>
        </td>
        <td data-label="Loại" className="align-middle">{device.device_type}</td>
        <td data-label="Tình trạng" className="align-middle">{device.device_condition}</td>
        <td data-label="Pin" className="align-middle">{device.battery_condition || '-'}</td>
        <td data-label="Màu" className="align-middle">{device.color?.name || '-'}</td>
        <td data-label="Dung lượng" className="align-middle">{device.device_storage ? `${device.device_storage.capacity}GB` : '-'}</td>
        <td data-label="Tồn kho" className="align-middle fw-bold">{device.inventory}</td>
        <td data-label="Giá" className="align-middle">
          <strong>{(device.price || 0).toLocaleString('vi-VN')} ₫</strong>
        </td>
        <td data-label="Thao tác" className="align-middle">
          <button className="btn btn-sm btn-outline-primary me-1 py-0 px-1" onClick={() => handleEditClick(device)} title="Sửa">
            <FontAwesomeIcon icon={faEdit} />
          </button>
          <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteClick(device.id)} title="Xóa">
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </td>
      </tr>
    ));
  };

  // === HÀM RENDER MODALS (cho Cột Phải) ===
  const renderModals = () => {
    if (!modalRoot) return null; 

    return createPortal(
      <>
        {(showModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <form id="deviceForm" onSubmit={handleFormSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Thiết bị' : 'Thêm Thiết bị mới'}</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    
                    {/* Hàng 1: Thông tin cơ bản */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-6">
                        <label htmlFor="device_info_id" className="form-label">Thông tin máy *</label>
                        <select className="form-select" id="device_info_id" name="device_info_id" value={currentData.device_info_id || ''} onChange={handleFormChange} required>
                          <option value="">-- Chọn loại máy --</option>
                          {deviceInfos.map(info => (
                            <option key={info.id} value={info.id}>{info.model} ({info.brand})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="color_id" className="form-label">Màu sắc</label>
                        <select className="form-select" id="color_id" name="color_id" value={currentData.color_id || ''} onChange={handleFormChange}>
                          <option value="">-- Chọn màu --</option>
                          {colors.map(color => (
                            <option key={color.id} value={color.id}>{color.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="device_storage_id" className="form-label">Dung lượng</label>
                        <select 
                          className="form-select" 
                          id="device_storage_id" 
                          name="device_storage_id" 
                          value={currentData.device_storage_id || ''} 
                          onChange={handleFormChange}
                          disabled={loadingStorages || !currentData.device_info_id}
                        >
                          <option value="">-- Chọn dung lượng --</option>
                          {loadingStorages && <option>Đang tải...</option>}
                          {storages.map(storage => (
                            <option key={storage.id} value={storage.id}>{storage.capacity}GB</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12 col-md-6">
                        <label htmlFor="product_code" className="form-label">Mã sản phẩm (SKU)</label>
                        <input type="text" className="form-control" id="product_code" name="product_code" value={currentData.product_code || ''} onChange={handleFormChange} />
                      </div>
                    </div>
                    
                    <hr />
                    
                    {/* Hàng 2: Tình trạng */}
                    <div className="row g-3 mb-3">
                      <div className="col-12 col-md-4">
                        <label htmlFor="device_type" className="form-label">Loại máy *</label>
                        <select className="form-select" id="device_type" name="device_type" value={currentData.device_type} onChange={handleFormChange} required>
                          <option value="Điện thoại">Điện thoại</option>
                          <option value="Laptop">Laptop</option>
                          <option value="Tablet">Tablet</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="col-12 col-md-4">
                        <label htmlFor="device_condition" className="form-label">Tình trạng máy *</label>
                        <input type="text" className="form-control" id="device_condition" name="device_condition" value={currentData.device_condition} onChange={handleFormChange} required />
                      </div>
                      <div className="col-12 col-md-4">
                        <label htmlFor="battery_condition" className="form-label">Tình trạng pin</label>
                        <input type="text" className="form-control" id="battery_condition" name="battery_condition" value={currentData.battery_condition || ''} onChange={handleFormChange} />
                      </div>
                    </div>
                    
                    <hr />

                    {/* Hàng 3: Giá & Kho */}
                    <div className="row g-3">
                      <div className="col-12 col-md-4">
                        <label htmlFor="price" className="form-label">Giá bán lẻ *</label>
                        <input type="number" className="form-control" id="price" name="price" value={currentData.price} onChange={handleFormChange} required />
                      </div>
                      <div className="col-12 col-md-4">
                        <label htmlFor="wholesale_price" className="form-label">Giá sỉ</label>
                        <input type="number" className="form-control" id="wholesale_price" name="wholesale_price" value={currentData.wholesale_price || ''} onChange={handleFormChange} />
                      </div>
                       <div className="col-12 col-md-4">
                        <label htmlFor="inventory" className="form-label">Tồn kho *</label>
                        <input type="number" className="form-control" id="inventory" name="inventory" value={currentData.inventory} onChange={handleFormChange} required />
                      </div>
                    </div>

                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button>
                    <button type="submit" form="deviceForm" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
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
                <div className="modal-header"><h5 className="modal-title">Xác nhận xóa</h5><button type="button" className="btn-close" onClick={handleCloseDeleteModal} disabled={isDeleting}></button></div>
                <div className="modal-body">
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <p>Bạn có chắc chắn muốn xóa thiết bị này không?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Hủy</button>
                  <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      modalRoot
    );
  };

  // === JSX RETURN (TRANG CHA) ===
  return (
    <>
      {/* Trang này không có cột trái, chỉ có cột phải 12-col */}
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        
        {/* Stats Row */}
        <div className="row g-3 g-lg-4">
          <div className="col-6 col-md-3"><StatCard title="Tổng thiết bị (Kho)" value={loading ? '...' : pagination?.total || 0} colorType="primary" icon="fas fa-mobile-alt" /></div>
          <div className="col-6 col-md-3"><StatCard title="Tổng tồn kho" value={loading ? '...' : devices.reduce((sum, d) => sum + d.inventory, 0)} colorType="success" icon="fas fa-boxes-stacked" /></div>
          <div className="col-6 col-md-3"><StatCard title="Tổng loại máy" value={loading ? '...' : deviceInfos.length} colorType="info" icon="fas fa-microchip" /></div>
          <div className="col-6 col-md-3"><StatCard title="Tổng màu sắc" value={loading ? '...' : colors.length} colorType="warning" icon="fas fa-palette" /></div>
        </div>
        
        {/* Bộ lọc (Tạm thời vô hiệu hóa) */}
        {/* <div className="card shadow-sm"> ... </div> */}

        {/* Bảng Dịch vụ */}
        <div className="table-card">
          <div className="card-header d-flex flex-wrap justify-content-between align-items-center p-3">
            <h5 className="mb-0">Kho thiết bị của tôi</h5>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-sm btn-outline-secondary">Import Excel</button>
              <button className="btn btn-sm btn-primary" onClick={handleAddNewClick}>
                <FontAwesomeIcon icon={faPlus} className="me-1" /> Thêm thiết bị
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Tên Thiết bị</th>
                    <th>Loại</th>
                    <th>Tình trạng</th>
                    <th>Pin</th>
                    <th>Màu</th>
                    <th>Dung lượng</th>
                    <th>Tồn kho</th>
                    <th>Giá</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderDeviceTable()}
                </tbody>
              </table>
            </div>
          </div>
          {/* Phân trang */}
          {pagination && pagination.total > 0 && (
            <div className="card-footer p-3 d-flex justify-content-between align-items-center">
              <span className="text-muted small">
                Hiển thị {devices.length} của {pagination.total} kết quả
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>Trước</button>
                  </li>
                  <li className="page-item active" aria-current="page">
                    <span className="page-link">{pagination.page} / {pagination.total_pages}</span>
                  </li>
                  <li className={`page-item ${pagination.page >= pagination.total_pages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>Sau</button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>
      
      {/* Gọi hàm renderModals để "dịch chuyển" chúng ra #modal-root */}
      {renderModals()}
    </>
  );
};

export default DeviceManagementPage;