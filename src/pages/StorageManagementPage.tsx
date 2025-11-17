// src/pages/StorageManagementPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { faAndroid } from '@fortawesome/free-brands-svg-icons';
import { createPortal } from 'react-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSpinner,
  faDatabase, faSave, faTimes, faSearch,
  faHdd, faFilter, faMicrochip, faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons';

interface DeviceInfo {
  id: string;
  model: string;
  brand?: string;
}

interface Storage {
  storage_id: string;
  device_id: string;
  device_model: string;
  capacity: number;
  name?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  device_info_id?: string;
}

interface StorageCreate {
  name: string;
  capacity: number;
  device_info_id: string;
  description?: string;
}

const modalRoot = document.getElementById('modal-root');

const initialFormState: StorageCreate = {
  name: '',
  capacity: 0,
  device_info_id: '',
  description: ''
};

const StorageManagementPage: React.FC = () => {
  const [storages, setStorages] = useState<Storage[]>([]);
  const [deviceInfos, setDeviceInfos] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); 
  const [currentStorage, setCurrentStorage] = useState<StorageCreate | Storage>(initialFormState);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingStorage, setViewingStorage] = useState<Storage | null>(null);

  const loadStorages = async () => {
    try {
      setError(null);
      const response = await api.get('/device-storages/all'); 
      
      let data = response.data;
      
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (data && Array.isArray(data.items)) {
        data = data.items;
      } else if (Array.isArray(data)) {
        data = data;
      }
      
      const storagesData = Array.isArray(data) ? data : [];
      
      const transformedStorages = storagesData.map((item: any) => ({
        id: item.storage_id,
        storage_id: item.storage_id,
        device_id: item.device_id,
        device_model: item.device_model,
        capacity: item.capacity,
        name: `${item.capacity}GB`,
        device_info_id: item.device_id,
        description: `Dung lượng ${item.capacity}GB cho ${item.device_model}`
      }));
      
      setStorages(transformedStorages);
      
    } catch (err: any) {
      console.error('Error loading storages:', err);
      const errorMessage = err?.response?.data?.detail 
        || err?.response?.data?.message 
        || 'Không thể tải danh sách dung lượng';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const loadDeviceInfos = async () => {
    try {
      const response = await api.get('/device-infos', {
        params: { page: 1, limit: 100 }
      }); 
      
      let data = response.data;
      
      if (data && data.data && Array.isArray(data.data)) {
        data = data.data;
      }
      
      setDeviceInfos(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error loading device infos:', err);
      toast.error('Không thể tải danh sách thiết bị');
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadStorages(),
      loadDeviceInfos()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  const processedStorages = useMemo(() => {
    return storages.map(storage => {
      return storage;
    });
  }, [storages]);

  const filteredStorages = useMemo(() => {
    if (!searchTerm.trim()) return processedStorages;

    const searchLower = searchTerm.toLowerCase();
    return processedStorages.filter(storage =>
      storage.name?.toLowerCase().includes(searchLower) ||
      (storage.description && storage.description.toLowerCase().includes(searchLower)) ||
      (storage.device_model && storage.device_model.toLowerCase().includes(searchLower)) ||
      storage.capacity.toString().includes(searchTerm)
    );
  }, [processedStorages, searchTerm]);

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentStorage({
      ...initialFormState,
      device_info_id: deviceInfos[0]?.id || '',
    });
    setShowModal(true);
  };

  const handleEdit = (storage: Storage) => {
    toast.error('Chức năng Sửa (PUT) chưa được định nghĩa trong API backend.');
  };
  
  const handleView = (storage: Storage) => {
    setViewingStorage(storage);
    setShowViewModal(true);
  };

  const handleCloseModals = () => {
    if (actionLoading) return;
    setShowModal(false);
    setShowViewModal(false);
    setViewingStorage(null);
    setCurrentStorage(initialFormState);
    setIsEditMode(false);
  };

  const handleSaveStorage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) {
      toast.error('API Sửa (PUT) không tồn tại.');
      return;
    }

    if (!currentStorage.name.trim()) {
      toast.error('Tên dung lượng không được để trống');
      return;
    }
    if (!(currentStorage as StorageCreate).device_info_id) {
      toast.error('Vui lòng chọn thiết bị');
      return;
    }
    if (!currentStorage.capacity || currentStorage.capacity <= 0) {
      toast.error('Dung lượng phải lớn hơn 0');
      return;
    }

    setActionLoading('save');

    try {
      const createData = {
        name: currentStorage.name.trim(),
        capacity: Number(currentStorage.capacity),
        device_info_id: (currentStorage as StorageCreate).device_info_id,
        description: currentStorage.description?.trim() || null
      };
      
      const response = await api.post('/device-storages', createData, { 
        headers: { 'Content-Type': 'application/json' }
      });
      
      const deviceInfo = deviceInfos.find(d => d.id === createData.device_info_id);
      
      const newStorage: Storage = {
        storage_id: response.data.id || Math.random().toString(36).substr(2, 9),
        device_id: createData.device_info_id,
        device_model: deviceInfo?.model || 'Unknown Device',
        capacity: createData.capacity,
        name: createData.name,
        description: createData.description || undefined,
        device_info_id: createData.device_info_id,
        created_at: new Date().toISOString() 
      };
      
      toast.success('Thêm dung lượng thành công');
      setStorages(prev => [newStorage, ...prev]);
      handleCloseModals();
      
    } catch (err: any) {
      console.error('Error saving storage:', err);
      const errorData = err?.response?.data;
      let errorMessage = 'Lỗi không xác định khi lưu dung lượng';
      if (errorData?.detail) {
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((error: any) => `${error.loc[error.loc.length - 1]}: ${error.msg}`).join('; ');
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData?.message) { errorMessage = errorData.message; }
      
      toast.error(`Lỗi khi thêm dung lượng: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentStorage(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  // Badge theo dung lượng
  const getCapacityBadge = (capacity: number) => {
    if (capacity >= 512) return 'bg-danger text-white';
    if (capacity >= 256) return 'bg-warning text-dark';
    if (capacity >= 128) return 'bg-success text-white';
    return 'bg-info text-white';
  };

  const renderStorageTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={5} className="py-4">
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
          <td colSpan={5} className="text-center py-5 text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" className="mb-3 opacity-50" />
            <div className="fw-medium">{error}</div>
            <button className="btn btn-primary rounded-pill mt-3 px-4" onClick={loadStorages}>
              Thử lại
            </button>
          </td>
        </tr>
      );
    }
    if (filteredStorages.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-0 fw-medium">{searchTerm ? 'Không tìm thấy dung lượng phù hợp' : 'Chưa có dung lượng nào'}</p>
          </td>
        </tr>
      );
    }
    
    return filteredStorages.map((storage) => (
      <tr key={storage.storage_id} className="hover-lift">
        <td className="align-middle">
          <div className="d-flex align-items-center gap-3">
            <div className="avatar bg-gradient-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
              <FontAwesomeIcon icon={faHdd} />
            </div>
            <div>
              <strong className="text-dark">{storage.name || `${storage.capacity}GB`}</strong>
              {storage.description && (
                <div className="text-muted small mt-1">{storage.description}</div>
              )}
            </div>
          </div>
        </td>
        <td className="align-middle">
          <span className={`badge ${getCapacityBadge(storage.capacity)} rounded-pill px-3 py-2 fw-semibold`}>
            {storage.capacity} GB
          </span>
        </td>
        <td className="align-middle">
          <div className="d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faMicrochip} className="text-warning" />
            <span className="fw-medium">{storage.device_model || 'N/A'}</span>
          </div>
        </td>
        <td className="align-middle">
          <div className="small text-muted">
            {storage.created_at && new Date(storage.created_at).toLocaleDateString('vi-VN')}
          </div>
        </td>
        <td className="align-middle">
          <button
            className="btn btn-outline-info btn-sm rounded-pill px-3"
            title="Xem chi tiết"
            onClick={() => handleView(storage)}
            disabled={!!actionLoading}
          >
            <FontAwesomeIcon icon={faEye} />
          </button>
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showModal || showViewModal) && (
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        )}

        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={faPlus} className="me-2" />
                    Thêm Dung lượng mới
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading} />
                </div>
                <form onSubmit={handleSaveStorage}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary">Tên dung lượng *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="name"
                          value={(currentStorage as StorageCreate).name}
                          onChange={handleInputChange}
                          placeholder="VD: 64GB, 128GB, 256GB..."
                          required
                          disabled={!!actionLoading}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold text-primary">Dung lượng (GB) *</label>
                        <input
                          type="number"
                          className="form-control rounded-3"
                          name="capacity"
                          value={(currentStorage as StorageCreate).capacity}
                          onChange={handleInputChange}
                          min="1"
                          required
                          disabled={!!actionLoading}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary">Thiết bị *</label>
                        <select
                          className="form-select rounded-3"
                          name="device_info_id"
                          value={(currentStorage as StorageCreate).device_info_id}
                          onChange={handleInputChange}
                          required
                          disabled={!!actionLoading || deviceInfos.length === 0}
                        >
                          <option value="">Chọn thiết bị</option>
                          {deviceInfos.map(device => (
                            <option key={device.id} value={device.id}>
                              {device.model} {device.brand && `(${device.brand})`}
                            </option>
                          ))}
                        </select>
                        {deviceInfos.length === 0 && (
                          <small className="text-warning">Không có thiết bị nào.</small>
                        )}
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary">Mô tả</label>
                        <textarea
                          className="form-control rounded-3"
                          name="description"
                          rows={3}
                          value={currentStorage.description || ''}
                          onChange={handleInputChange}
                          placeholder="Mô tả chi tiết..."
                          disabled={!!actionLoading}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={!!actionLoading}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button 
                      type="submit" 
                      className="btn btn-primary rounded-pill px-4"
                      disabled={!!actionLoading}
                    >
                      {actionLoading ? (
                        <><div className="spinner-border spinner-border-sm me-2" role="status"></div> Đang lưu...</>
                      ) : (
                        <><FontAwesomeIcon icon={faSave} className="me-2" /> Thêm mới</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showViewModal && viewingStorage && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faEye} className="me-2" /> Chi tiết Dung lượng</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} />
                </div>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-6">
                      <strong className="text-primary">Tên:</strong>
                      <p className="mb-0">{viewingStorage.name || `${viewingStorage.capacity}GB`}</p>
                    </div>
                    <div className="col-6">
                      <strong className="text-primary">Dung lượng:</strong>
                      <p className="mb-0">
                        <span className={`badge ${getCapacityBadge(viewingStorage.capacity)} rounded-pill px-3 py-1`}>
                          {viewingStorage.capacity} GB
                        </span>
                      </p>
                    </div>
                    <div className="col-6">
                      <strong className="text-primary">Thiết bị:</strong>
                      <p className="mb-0">{viewingStorage.device_model || 'N/A'}</p>
                    </div>
                    <div className="col-6">
                      <strong className="text-primary">Ngày tạo:</strong>
                      <p className="mb-0">
                        {viewingStorage.created_at ? new Date(viewingStorage.created_at).toLocaleDateString('vi-VN') : '-'}
                      </p>
                    </div>
                    <div className="col-12">
                      <strong className="text-primary">Mô tả:</strong>
                      <p className="mb-0 text-muted">{viewingStorage.description || 'Không có'}</p>
                    </div>
                    <div className="col-12 border-top pt-3 mt-2">
                      <div className="row">
                        <div className="col-6">
                          <small className="text-muted">Storage ID:</small>
                          <code className="d-block small">{viewingStorage.storage_id}</code>
                        </div>
                        <div className="col-6">
                          <small className="text-muted">Device ID:</small>
                          <code className="d-block small">{viewingStorage.device_id}</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals}>Đóng</button>
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
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h3 mb-0 text-dark d-flex align-items-center gap-2">
              <div className="avatar bg-gradient-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: 50, height: 50 }}>
                <FontAwesomeIcon icon={faDatabase} size="lg" />
              </div>
              <span>Quản lý Dung lượng</span>
            </h1>
            <button 
              className="btn btn-primary rounded-pill px-4 shadow-sm"
              onClick={handleAddNew}
              disabled={loading || deviceInfos.length === 0}
            >
              <FontAwesomeIcon icon={faPlus} className="me-2" />
              Thêm dung lượng
            </button>
          </div>

          {deviceInfos.length === 0 && !loading && !error && (
            <div className="alert alert-warning rounded-3 shadow-sm d-flex align-items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} />
              <div>
                <strong>Chưa có thiết bị nào.</strong> Vui lòng thêm thiết bị (Info) trước khi quản lý dung lượng.
              </div>
            </div>
          )}

          <div className="row g-4 mb-4">
            <div className="col-md-8">
              <div className="card border-0 shadow-sm rounded-3">
                <div className="card-body p-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white rounded-start-pill border-end-0">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 rounded-end-pill"
                      placeholder="Tìm kiếm dung lượng, thiết bị..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button className="btn btn-outline-secondary rounded-pill" onClick={() => setSearchTerm('')}>
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-white shadow-sm rounded-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-center p-4">
                  <FontAwesomeIcon icon={faHdd} size="2x" className="mb-2" />
                  <h5 className="card-title mb-1">Tổng dung lượng</h5>
                  <h3 className="mb-0 fw-bold">{processedStorages.length}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="card-header text-white" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <FontAwesomeIcon icon={faHdd} />
                Danh sách Dung lượng
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="ps-4" style={{ width: '30%' }}>Thông tin dung lượng</th>
                      <th style={{ width: '15%' }}>Dung lượng</th>
                      <th style={{ width: '25%' }}>Thiết bị</th>
                      <th style={{ width: '15%' }}>Ngày tạo</th>
                      <th style={{ width: '15%' }} className="text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renderStorageTable()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {renderModals()}

      <style jsx>{`
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.1) !important;
          background-color: #f8f9fa !important;
        }
        .avatar {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .card:hover {
          box-shadow: 0 .5rem 1.5rem rgba(0,0,0,.1) !important;
        }
      `}</style>
    </div>
  );
};

export default StorageManagementPage;