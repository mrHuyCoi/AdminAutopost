// src/pages/BrandManagementPage.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit, faTrash, faPlus, faMobileAlt,
  faSearch, faTimes, faSync, faSpinner, faMicrochip
} from '@fortawesome/free-solid-svg-icons';

import { deviceBrandService, DeviceBrand, DeviceBrandPayload } from '../services/deviceBrandService';
import { brandService, BrandPayload } from '../services/brandService';
import { serviceService } from '../services/serviceService';
import { Brand } from '../types/brand';
import { Service } from '../types/service';

const initialDeviceBrandState: DeviceBrandPayload = { name: '' };
const initialComponentBrandState: BrandPayload = {
  service_id: '',
  name: '',
  service_code: '',
  note: null,
  warranty: '',           // đổi từ null → '' (chuỗi rỗng)
  device_brand_id: null,
  price: null,
  wholesale_price: null,
  device_type: null,
  color: null,
};

const normalizeList = (res: any) => {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  // Support responses: { data: [...] } , { data: { items: [...] } } , { items: [...] } , axios-res.data (already)
  if (res.data) {
    if (Array.isArray(res.data)) return res.data;
    if (res.data.items && Array.isArray(res.data.items)) return res.data.items;
    if (Array.isArray(res.data.data)) return res.data.data;
  }
  if (res.items && Array.isArray(res.items)) return res.items;
  return [];
};

const BrandManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'device' | 'component'>('device');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const modalRootRef = useRef<HTMLElement | null>(typeof document !== 'undefined' ? document.getElementById('modal-root') : null);
  const [isSaving, setIsSaving] = useState(false);

  const [deviceBrands, setDeviceBrands] = useState<DeviceBrand[]>([]);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [currentDeviceBrand, setCurrentDeviceBrand] = useState<DeviceBrandPayload>(initialDeviceBrandState);
  const [isEditDevice, setIsEditDevice] = useState(false);
  const [editDeviceBrandId, setEditDeviceBrandId] = useState<string | null>(null);

  const [componentBrands, setComponentBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showComponentModal, setShowComponentModal] = useState(false);
  const [currentComponentBrand, setCurrentComponentBrand] = useState<BrandPayload>(initialComponentBrandState);
  const [isEditComponent, setIsEditComponent] = useState(false);
  const [editComponentBrandId, setEditComponentBrandId] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // device brands (GET /device-brands)
      // component brands (GET /brands) - paginated
      // services (GET /services) - used to pick service_id when creating brand
      const [devRes, brandsRes, servicesRes] = await Promise.all([
        deviceBrandService.getAllDeviceBrands(),
        brandService.getAllBrands(0, 100, searchQuery),
        serviceService.getAllServices(0, 100, ''),
      ]);

      setDeviceBrands(normalizeList(devRes));
      // brandService.getAllBrands returns PaginatedResponse { items, total, ... }
      const brandItems = Array.isArray((brandsRes as any).items) ? (brandsRes as any).items : normalizeList(brandsRes);
      setComponentBrands(brandItems);

      // servicesRes may be { data: [...] } or array
      const svcList = normalizeList(servicesRes);
      setServices(svcList);
    } catch (err: any) {
      console.error('Error loading data:', err);
      const msg = err?.response?.data?.detail || err?.message || 'Lỗi khi tải dữ liệu';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    modalRootRef.current = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;
    loadData();
  }, [loadData]);

  const filteredDeviceBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return deviceBrands;
    const searchLower = searchQuery.toLowerCase();
    return deviceBrands.filter(b => (b.name || '').toLowerCase().includes(searchLower));
  }, [deviceBrands, searchQuery]);

  const filteredComponentBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return componentBrands;
    const searchLower = searchQuery.toLowerCase();
    return componentBrands.filter(b => (b.name || '').toLowerCase().includes(searchLower));
  }, [componentBrands, searchQuery]);

  const handleAddNew = () => {
    if (activeTab === 'device') {
      setCurrentDeviceBrand(initialDeviceBrandState);
      setIsEditDevice(false);
      setEditDeviceBrandId(null);
      setShowDeviceModal(true);
    } else {
      setCurrentComponentBrand({
        ...initialComponentBrandState,
        service_id: services[0]?.id || ''
      });
      setIsEditComponent(false);
      setEditComponentBrandId(null);
      setShowComponentModal(true);
    }
  };

  const handleEditClick = (brand: DeviceBrand | Brand) => {
    if (activeTab === 'device') {
      const dev = brand as DeviceBrand;
      setEditDeviceBrandId(dev.id);
      setCurrentDeviceBrand({ name: dev.name || '' });
      setIsEditDevice(true);
      setShowDeviceModal(true);
    } else {
      const comp = brand as Brand;
      setEditComponentBrandId(String(comp.id));
      setCurrentComponentBrand(prev => ({
        ...prev,
        name: comp.name || '',
        service_id: (comp.service_id as string) || services[0]?.id || '',
      }));
      setIsEditComponent(true);
      setShowComponentModal(true);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    if (isSaving || isDeleting) return;
    setShowDeviceModal(false);
    setShowComponentModal(false);
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleDeviceBrandChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentDeviceBrand(prev => ({ ...prev, [name]: value }));
  };

  const handleComponentBrandChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentComponentBrand(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (activeTab === 'device') {
        // === DEVICE BRAND ===
        if (!currentDeviceBrand.name?.trim()) {
          toast.error('Vui lòng nhập tên thương hiệu!');
          setIsSaving(false);
          return;
        }

        if (isEditDevice && editDeviceBrandId) {
          await deviceBrandService.updateDeviceBrand(editDeviceBrandId, {
            name: currentDeviceBrand.name.trim(),
          });
        } else {
          await deviceBrandService.createDeviceBrand({
            name: currentDeviceBrand.name.trim(),
          });
        }
      } else {
        // === COMPONENT BRAND ===
        if (!currentComponentBrand.name?.trim()) {
          toast.error('Vui lòng nhập tên thương hiệu!');
          setIsSaving(false);
          return;
        }
        if (!currentComponentBrand.service_id) {
          toast.error('Vui lòng chọn Dịch vụ liên quan!');
          setIsSaving(false);
          return;
        }

        // TỰ ĐỘNG SINH service_code DUY NHẤT nếu chưa có hoặc bị trùng
        const generateUniqueServiceCode = (): string => {
          const existing = componentBrands
            .filter(b => b.service_id === currentComponentBrand.service_id)
            .map(b => b.service_code || '')
            .filter(code => /^DV\d+$/.test(code))
            .map(code => parseInt(code.replace('DV', ''), 10))
            .sort((a, b) => a - b);

          let next = 1;
          while (existing.includes(next)) next++;
          return `DV${String(next).padStart(6, '0')}`; // DV000001, DV000002,...
        };

        const finalServiceCode =
          currentComponentBrand.service_code?.trim() || generateUniqueServiceCode();

        const payload: BrandPayload = {
          service_id: currentComponentBrand.service_id as string,
          name: currentComponentBrand.name.trim(),
          service_code: finalServiceCode,                    // ĐẢM BẢO DUY NHẤT
          warranty: currentComponentBrand.warranty?.trim() || '6 tháng',
          note: currentComponentBrand.note?.trim() || null,
          device_brand_id: currentComponentBrand.device_brand_id || null,
          price: currentComponentBrand.price || null,
          wholesale_price: currentComponentBrand.wholesale_price || null,
          device_type: currentComponentBrand.device_type || null,
          color: currentComponentBrand.color || null,
        };

        if (isEditComponent && editComponentBrandId) {
          await brandService.updateBrand(editComponentBrandId, payload);
        } else {
          await brandService.createBrand(payload);
        }
      }

      toast.success('Lưu thành công!');
      handleCloseModals();
      await loadData();
    } catch (err: any) {
      console.error('Error saving brand:', err);
      let errorMessage = 'Lưu thất bại!';

      if (err?.response?.data?.detail) {
        const d = err.response.data.detail;
        if (Array.isArray(d)) {
          errorMessage = d.map((x: any) => x.msg || JSON.stringify(x)).join('; ');
        } else if (typeof d === 'string') {
          errorMessage = d;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      if (activeTab === 'device') {
        await deviceBrandService.deleteDeviceBrand(deleteId);
        toast.success('Xóa thành công!');
      } else {
        // try delete brand; if API doesn't support delete it will return error handled below
        await brandService.deleteBrand(deleteId);
        toast.success('Xóa thành công!');
      }
      handleCloseModals();
      await loadData();
    } catch (err: any) {
      console.error('Error deleting brand:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.detail || 'Xóa thất bại!';
      toast.error(Array.isArray(msg) ? JSON.stringify(msg) : msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderDeviceBrandTable = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={2} className="py-4">
            <div className="placeholder-glow">
              <div className="placeholder col-8 h-5 rounded"></div>
              <div className="placeholder col-6 h-3 rounded mt-2"></div>
            </div>
          </td>
        </tr>
      ));
    }

    if (error) return <tr><td colSpan={2} className="text-center py-5 text-danger">{error}</td></tr>;

    if (filteredDeviceBrands.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-0 fw-medium">Không tìm thấy thương hiệu thiết bị</p>
          </td>
        </tr>
      );
    }

    return filteredDeviceBrands.map(brand => (
      <tr key={brand.id} className="transition-all hover-bg-light">
        <td className="ps-4 py-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-sm"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                fontSize: '0.9rem',
              }}
            >
              {(brand.name || '').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong className="d-block text-dark">{brand.name}</strong>
              <small className="text-muted">{brand.id}</small>
            </div>
          </div>
        </td>
        <td className="text-center py-3">
          <div className="btn-group btn-group-sm" role="group">
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => handleEditClick(brand)}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleDeleteClick(String(brand.id))}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderComponentBrandTable = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={2} className="py-4">
            <div className="placeholder-glow">
              <div className="placeholder col-8 h-5 rounded"></div>
              <div className="placeholder col-6 h-3 rounded mt-2"></div>
            </div>
          </td>
        </tr>
      ));
    }

    if (error) return <tr><td colSpan={2} className="text-center py-5 text-danger">{error}</td></tr>;

    if (filteredComponentBrands.length === 0) {
      return (
        <tr>
          <td colSpan={2} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-0 fw-medium">Không tìm thấy thương hiệu linh kiện</p>
          </td>
        </tr>
      );
    }

    return filteredComponentBrands.map(brand => (
      <tr key={brand.id} className="transition-all hover-bg-light">
        <td className="ps-4 py-3">
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold shadow-sm"
              style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                fontSize: '0.9rem',
              }}
            >
              {(brand.name || '').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <strong className="d-block text-dark">{brand.name}</strong>
              <small className="text-muted">{brand.id}</small>
            </div>
          </div>
        </td>
        <td className="text-center py-3">
          <div className="btn-group btn-group-sm" role="group">
            <button className="btn btn-outline-primary btn-sm rounded-pill px-3" onClick={() => handleEditClick(brand)}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleDeleteClick(String(brand.id))}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRootRef.current) return null;

    return createPortal(
      <>
        {(showDeviceModal || showComponentModal || showDeleteModal) && (
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
        )}

        {/* Device Brand Modal */}
        {showDeviceModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={isEditDevice ? faEdit : faPlus} className="me-2" />
                    {isEditDevice ? 'Cập nhật thương hiệu thiết bị' : 'Thêm thương hiệu thiết bị'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={isSaving} />
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body p-4">
                    <label className="form-label fw-semibold text-primary">Tên thương hiệu *</label>
                    <input
                      type="text"
                      className="form-control rounded-3"
                      name="name"
                      value={currentDeviceBrand.name}
                      onChange={handleDeviceBrandChange}
                      required
                      disabled={isSaving}
                      placeholder="Apple, Samsung, Oppo..."
                    />
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={isSaving}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang lưu...</> : <>{isEditDevice ? 'Cập nhật' : 'Thêm mới'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Component Brand Modal */}
        {showComponentModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={isEditComponent ? faEdit : faPlus} className="me-2" />
                    {isEditComponent ? 'Cập nhật thương hiệu linh kiện' : 'Thêm thương hiệu linh kiện'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={isSaving} />
                </div>
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-body p-4">
                    <div className="row g-4">

                      <div className="col-12">
                        <label className="form-label fw-semibold text-danger">Mã linh kiện * (duy nhất trong dịch vụ)</label>
                        <input
                          type="text"
                          className="form-control rounded-3 border-danger"
                          name="service_code"
                          value={currentComponentBrand.service_code || ''}
                          onChange={handleComponentBrandChange}
                          required
                          disabled={isSaving}
                          placeholder="DV000001, DV000002, PIN001, MH001..."
                        />
                        <small className="text-danger">
                          Bắt buộc nhập và phải duy nhất trong dịch vụ đã chọn!
                        </small>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary">Tên thương hiệu *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="name"
                          value={currentComponentBrand.name || ''}
                          onChange={handleComponentBrandChange}
                          required
                          disabled={isSaving}
                          placeholder="Pisen, Zin, KOR..."
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary">Bảo hành *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="warranty"
                          value={currentComponentBrand.warranty || ''}
                          onChange={handleComponentBrandChange}
                          required
                          disabled={isSaving}
                          placeholder="6 tháng, 12 tháng, Không bảo hành..."
                        />
                        <small className="text-danger">Trường này bắt buộc (DB không cho null)</small>
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold text-primary">Thuộc Dịch vụ *</label>
                        <select
                          className="form-select rounded-3"
                          name="service_id"
                          value={currentComponentBrand.service_id || ''}
                          onChange={handleComponentBrandChange}
                          required
                          disabled={isSaving || services.length === 0}
                        >
                          <option value="">-- Chọn dịch vụ --</option>
                          {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <small className="text-muted d-block mt-1">API yêu cầu <code>service_id</code> khi tạo Brand.</small>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={isSaving}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button type="submit" className="btn btn-success rounded-pill px-4" disabled={isSaving}>
                      {isSaving ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang lưu...</> : <>{isEditComponent ? 'Cập nhật' : 'Thêm mới'}</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faTrash} className="me-2" /> Xác nhận xóa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={isDeleting} />
                </div>
                <div className="modal-body text-center py-5">
                  <FontAwesomeIcon icon={faTrash} size="3x" className="text-danger mb-3" />
                  <h6>Bạn có chắc muốn xóa thương hiệu này?</h6>
                  <p className="text-muted">Hành động này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={isDeleting}>Hủy</button>
                  <button className="btn btn-danger rounded-pill px-4" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang xóa...</> : 'Xóa'}
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

  return (
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faMobileAlt} className="me-2 text-primary" />
            Quản lý Thương hiệu
          </h1>
          <p className="text-muted mb-0 small">Thiết bị & Linh kiện</p>
        </div>
        <button onClick={handleAddNew} className="btn btn-success rounded-pill shadow-sm px-4 d-flex align-items-center" disabled={loading}>
          <FontAwesomeIcon icon={faPlus} className="me-2" />
          Thêm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-0">
          <ul className="nav nav-pills p-3 gap-2">
            <li className="nav-item flex-fill">
              <button
                className={`nav-link w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 ${activeTab === 'device' ? 'active bg-primary text-white' : 'bg-light text-dark'}`}
                onClick={() => setActiveTab('device')}
              >
                <FontAwesomeIcon icon={faMobileAlt} />
                Thiết bị <span className="badge bg-white text-primary ms-2">{filteredDeviceBrands.length}</span>
              </button>
            </li>
            <li className="nav-item flex-fill">
              <button
                className={`nav-link w-100 rounded-pill d-flex align-items-center justify-content-center gap-2 ${activeTab === 'component' ? 'active bg-success text-white' : 'bg-light text-dark'}`}
                onClick={() => setActiveTab('component')}
              >
                <FontAwesomeIcon icon={faMicrochip} />
                Linh kiện <span className="badge bg-white text-success ms-2">{filteredComponentBrands.length}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Search & Refresh */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="d-flex gap-3 align-items-center">
            <div className="flex-fill">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 rounded-end-pill"
                  placeholder="Tìm kiếm theo tên..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="btn btn-outline-secondary rounded-pill" onClick={() => setSearchQuery('')}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                )}
              </div>
            </div>
            <button className="btn btn-outline-primary rounded-pill px-4 d-flex align-items-center" onClick={loadData} disabled={loading}>
              <FontAwesomeIcon icon={faSync} spin={loading} className="me-2" />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div
          className="card-header text-white"
          style={{
            background: activeTab === 'device'
              ? 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(90deg, #11998e 0%, #38ef7d 100%)'
          }}
        >
          <h5 className="mb-0 d-flex align-items-center justify-content-between">
            <span>
              {activeTab === 'device' ? 'Thương hiệu Thiết bị' : 'Thương hiệu Linh kiện'}
            </span>
            <span className="badge bg-white text-dark rounded-pill">
              {activeTab === 'device' ? filteredDeviceBrands.length : filteredComponentBrands.length}
            </span>
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">Thương hiệu</th>
                  <th className="text-center" style={{ width: '140px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {activeTab === 'device' ? renderDeviceBrandTable() : renderComponentBrandTable()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {renderModals()}

      <style>{`
        .nav-pills .nav-link {
          transition: all 0.2s ease;
        }
        .nav-pills .nav-link:hover {
          transform: translateY(-1px);
        }
        .table tbody tr:hover {
          background-color: rgba(0,0,0,0.025) !important;
        }
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default BrandManagementPage;
