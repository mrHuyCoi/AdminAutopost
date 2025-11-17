// src/pages/ComponentManagementPage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSpinner,
  faEye, faSearch, faFilter, faSync,
  faMicrochip, faBoxesStacked, faTags, faList,
  faDownload, faUpload, faSave, faTimes,
  faTag, // SỬA: Thêm icon
  faMoneyBillWave // SỬA: Thêm icon
} from '@fortawesome/free-solid-svg-icons';

import { brandService, BrandPayload } from '../services/brandService';
import { Brand } from '../types/brand';
import { serviceService } from '../services/serviceService';
import { Service } from '../types/service';

interface ProductComponent {
  id: string;
  product_code: string;
  product_name: string;
  amount: number;
  wholesale_price?: number;
  trademark?: string;
  guarantee?: string;
  stock: number;
  description?: string;
  product_photo?: string;
  product_link?: string;
  user_id: string;
  category?: string;
  properties?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductComponentCreate {
  product_code?: string | null;
  product_name: string;
  amount: number;
  wholesale_price?: number | null;
  trademark?: string | null;
  guarantee?: string | null;
  stock: number;
  description?: string | null;
  product_photo?: string | null;
  product_link?: string | null;
  category?: string | null;
  properties?: string | null;
}

interface ProductComponentUpdate {
  product_code?: string | null;
  product_name?: string;
  amount?: number;
  wholesale_price?: number | null;
  trademark?: string | null;
  guarantee?: string | null;
  stock?: number;
  description?: string | null;
  product_photo?: string | null;
  product_link?: string | null;
  category?: string | null;
  properties?: string | null;
}

const modalRoot = document.getElementById('modal-root');

const initialFormState: ProductComponentCreate = {
  product_code: 'SP-Mẫu',
  product_name: '',
  amount: 0,
  wholesale_price: 0,
  trademark: '',
  guarantee: '6 tháng',
  stock: 0,
  description: '',
  product_photo: '',
  product_link: '',
  category: '',
  properties: ''
};

const ComponentManagementPage: React.FC = () => {
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    totalStock: 0,
    brands: 0,
    categories: 0
  });

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentComponent, setCurrentComponent] = useState<ProductComponentCreate | ProductComponent>(initialFormState);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingComponent, setViewingComponent] = useState<ProductComponent | null>(null);

  const loadComponents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/product-components/', { params: { page: 1, limit: 1000 } });
      let data = response.data;
      if (data.items && Array.isArray(data.items)) data = data.items;
      else if (data.data && Array.isArray(data.data)) data = data.data;
      const componentsData = Array.isArray(data) ? data : [];
      setComponents(componentsData);
      calculateStats(componentsData);
    } catch (err: any) {
      console.error('Error loading components:', err);
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || 'Không thể tải danh sách linh kiện';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAllBrands = async () => {
    setLoadingBrands(true);
    try {
      const response = await brandService.getAllBrands(0, 1000, '');
      setBrands(response.items || []);
    } catch (err) {
      console.error("Lỗi tải brands (linh kiện):", err);
      toast.error('Không thể tải danh sách thương hiệu linh kiện');
    } finally {
      setLoadingBrands(false);
    }
  };

  const loadAllServices = async () => {
    setLoadingServices(true);
    try {
      const response = await serviceService.getAllServices(0, 1000, '');
      setServices(response.data || []);
    } catch (err) {
      console.error("Lỗi tải services:", err);
      toast.error('Không thể tải danh sách dịch vụ');
    } finally {
      setLoadingServices(false);
    }
  };

  const calculateStats = (componentsData: ProductComponent[]) => {
    const total = componentsData.length;
    const totalStock = componentsData.reduce((sum, comp) => sum + (comp.stock || 0), 0);
    const brands = new Set(componentsData.map(comp => comp.trademark)).size;
    const categories = new Set(componentsData.map(comp => comp.category)).size;
    setStats({ total, totalStock, brands, categories });
  };

  useEffect(() => {
    loadComponents();
    loadAllBrands();
    loadAllServices();
  }, []);

  const filteredComponents = React.useMemo(() => {
    if (!searchTerm.trim()) return components;
    const searchLower = searchTerm.toLowerCase();
    return components.filter(component =>
      component.product_code.toLowerCase().includes(searchLower) ||
      component.product_name.toLowerCase().includes(searchLower) ||
      (component.trademark && component.trademark.toLowerCase().includes(searchLower)) ||
      (component.category && component.category.toLowerCase().includes(searchLower)) ||
      (component.properties && component.properties.toLowerCase().includes(searchLower))
    );
  }, [components, searchTerm]);

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentComponent(initialFormState);
    setShowModal(true);
  };

  const handleEdit = (component: ProductComponent) => {
    setIsEditMode(true);
    setCurrentComponent(component);
    setShowModal(true);
  };

  const handleView = (component: ProductComponent) => {
    setViewingComponent(component);
    setShowViewModal(true);
  };

  const handleDelete = (id: string) => {
    setComponentToDelete(id);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    if (actionLoading) return;
    setShowModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setComponentToDelete(null);
    setViewingComponent(null);
    setCurrentComponent(initialFormState);
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!currentComponent.product_name.trim()) {
    toast.error('Tên sản phẩm không được để trống');
    return;
  }
  setActionLoading('save');
  try {
    const dataToSend = {
      ...currentComponent,
      properties: currentComponent.properties
        ? JSON.stringify(currentComponent.properties)
        : "{}", // mặc định object rỗng
    };

    if (isEditMode && 'id' in currentComponent) {
      const updateData: ProductComponentUpdate = dataToSend;
      const response = await api.put(`/product-components/${currentComponent.id}`, updateData);
      toast.success('Cập nhật linh kiện thành công');
      setComponents(prev => prev.map(c => c.id === currentComponent.id ? { ...c, ...response.data } : c));
    } else {
      const createData: ProductComponentCreate = dataToSend;
      const response = await api.post('/product-components/', createData);
      toast.success('Thêm linh kiện thành công');
      setComponents(prev => [response.data, ...prev]);
    }

    handleCloseModals();
    loadComponents();
  } catch (err: any) {
    const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || `Lỗi khi ${isEditMode ? 'cập nhật' : 'thêm'} linh kiện`;
    toast.error(errorMessage);
  } finally {
    setActionLoading(null);
  }
};


  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    setActionLoading(`delete-${componentToDelete}`);
    try {
      await api.delete(`/product-components/${componentToDelete}`);
      toast.success('Xóa linh kiện thành công');
      setComponents(prev => prev.filter(c => c.id !== componentToDelete));
      handleCloseModals();
      loadComponents();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || 'Lỗi khi xóa linh kiện';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const isNumeric = ['stock', 'amount', 'wholesale_price'].includes(name);
    setCurrentComponent(prev => ({
      ...prev,
      [name]: isNumeric ? parseFloat(value) || 0 : value,
    }));
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/product-components/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'linh-kien.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Xuất file Excel thành công');
    } catch (err: any) {
      toast.error('Lỗi khi xuất file Excel');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionLoading('import');
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/product-components/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Import linh kiện thành công');
      loadComponents();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || 'Lỗi khi import linh kiện';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  // SỬA: Thay đổi nội dung bảng
  const renderComponentTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {/* SỬA: colSpan = 7 */}
          <td colSpan={7} className="py-4"> 
            <div className="placeholder-glow">
              <div className="placeholder col-12 h-5 rounded"></div>
              <div className="placeholder col-8 h-3 rounded mt-2"></div>
            </div>
          </td>
        </tr>
      ));
    }
    if (error) {
      return (
        <tr>
          {/* SỬA: colSpan = 7 */}
          <td colSpan={7} className="text-center py-5">
            <div className="alert alert-danger mb-0 d-inline-block">
              {error}
              <button className="btn btn-sm btn-outline-danger ms-3" onClick={loadComponents}>Thử lại</button>
            </div>
          </td>
        </tr>
      );
    }
    if (filteredComponents.length === 0) {
      return (
        <tr>
          {/* SỬA: colSpan = 7 */}
          <td colSpan={7} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
            <p className="mb-0 fw-medium">{searchTerm ? 'Không tìm thấy linh kiện' : 'Chưa có linh kiện nào'}</p>
          </td>
        </tr>
      );
    }
    return filteredComponents.map((component) => (
      <tr key={component.id} className="transition-all hover-bg-light">
        <td className="py-3"><code className="small">{component.product_code}</code></td>
        <td className="py-3"><strong>{component.product_name}</strong></td>
        
        {/* SỬA: Thay Tồn kho & Thương hiệu BẰNG Giá lẻ & Giá buôn */}
        <td className="py-3 fw-medium text-success">
          <FontAwesomeIcon icon={faTag} className="me-2 opacity-50" />
          {component.amount.toLocaleString('vi-VN')} ₫
        </td>
        <td className="py-3 fw-medium text-info">
          <FontAwesomeIcon icon={faMoneyBillWave} className="me-2 opacity-50" />
          {(component.wholesale_price || 0).toLocaleString('vi-VN')} ₫
        </td>

        <td className="py-3">
          <span className={`badge rounded-pill px-3 py-2 ${
            component.category === 'Cáp nối' ? 'bg-danger' : 
            component.category === 'Cáp test' ? 'bg-warning' : 'bg-info'
          }`}>
            {component.category}
          </span>
        </td>
        <td className="py-3"><small className="text-muted">{component.properties || '—'}</small></td>
        <td className="py-3 text-center">
          <div className="btn-group btn-group-sm" role="group">
            <button className="btn btn-outline-info btn-sm rounded-pill px-3" title="Xem" onClick={() => handleView(component)}>
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button className="btn btn-outline-warning btn-sm rounded-pill px-3" title="Sửa" onClick={() => handleEdit(component)} disabled={!!actionLoading}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button className="btn btn-outline-danger btn-sm rounded-pill px-3" title="Xóa" onClick={() => handleDelete(component.id)} disabled={!!actionLoading}>
              {actionLoading === `delete-${component.id}` ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRoot) return null;
    const formState: ProductComponentCreate = { ...currentComponent } as ProductComponentCreate;

    return createPortal(
      <>
        {(showModal || showDeleteModal || showViewModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}
        
        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow-lg rounded-3 overflow-hidden">
                <div className="modal-header text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                    {isEditMode ? 'Chỉnh sửa Linh kiện' : 'Thêm Linh kiện mới'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading}></button>
                </div>
                <form onSubmit={handleSaveComponent}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-md-4">
                        <label className="form-label fw-semibold text-primary">Mã SP</label>
                        <input type="text" className="form-control rounded-3" name="product_code" value={formState.product_code || ''} onChange={handleInputChange} disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-8">
                        <label className="form-label fw-semibold text-primary">Tên Sản Phẩm <span className="text-danger">*</span></label>
                        <input type="text" className="form-control rounded-3" name="product_name" value={formState.product_name} onChange={handleInputChange} required disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Tồn kho *</label>
                        <input type="number" className="form-control rounded-3" name="stock" value={formState.stock} onChange={handleInputChange} min="0" required disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Giá (Amount) *</label>
                        <input type="number" className="form-control rounded-3" name="amount" value={formState.amount} onChange={handleInputChange} min="0" required disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Giá sỉ</label>
                        <input type="number" className="form-control rounded-3" name="wholesale_price" value={formState.wholesale_price || 0} onChange={handleInputChange} min="0" disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Bảo hành</label>
                        <input type="text" className="form-control rounded-3" name="guarantee" value={formState.guarantee || '6 tháng'} onChange={handleInputChange} disabled={!!actionLoading} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Thương hiệu (Linh kiện)</label>
                        <select className="form-select rounded-3" name="trademark" value={formState.trademark || ''} onChange={handleInputChange} disabled={!!actionLoading || loadingBrands}>
                          <option value="">-- Chọn thương hiệu LK --</option>
                          {brands.map(brand => (
                            <option key={brand.id} value={brand.name}>
                              {brand.name} (DV: {brand.service?.name || 'N/A'})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Danh mục (Dịch vụ)</label>
                        <select className="form-select rounded-3" name="category" value={formState.category || ''} onChange={handleInputChange} disabled={!!actionLoading || loadingServices}>
                          <option value="">-- Chọn danh mục (dịch vụ) --</option>
                          {services.map(service => (
                            <option key={service.id} value={service.name}>{service.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Thuộc tính</label>
                        <input type="text" className="form-control rounded-3" name="properties" value={formState.properties || ''} onChange={handleInputChange} placeholder="Mô tả thuộc tính..." disabled={!!actionLoading} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={!!actionLoading}>
                      <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={!!actionLoading}>
                      {actionLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang lưu...</> : <><FontAwesomeIcon icon={faSave} className="me-2" /> {isEditMode ? 'Cập nhật' : 'Thêm mới'}</>}
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
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading}></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning mb-3">Hành động này không thể hoàn tác.</div>
                  <p>Bạn có chắc chắn muốn xóa linh kiện này?</p>
                  {componentToDelete && (
                    <div className="p-3 bg-light rounded">
                      <strong>{components.find(c => c.id === componentToDelete)?.product_name}</strong>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={!!actionLoading}>Hủy</button>
                  <button type="button" className="btn btn-danger rounded-pill px-4" onClick={handleConfirmDelete} disabled={!!actionLoading}>
                    {actionLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang xóa...</> : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SỬA: Cập nhật View Modal */}
        {showViewModal && viewingComponent && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={faEye} className="me-2" /> Chi tiết Linh kiện</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals}></button>
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6"><strong>Mã SP:</strong> <code>{viewingComponent.product_code}</code></div>
                    <div className="col-md-6"><strong>Tồn kho:</strong> <span className={`badge ${viewingComponent.stock > 0 ? 'bg-success' : 'bg-danger'}`}>{viewingComponent.stock}</span></div>
                    <div className="col-12"><strong>Tên:</strong> {viewingComponent.product_name}</div>
                    
                    {/* SỬA: Thêm giá */}
                    <div className="col-md-6"><strong>Giá lẻ:</strong> <span className="text-success fw-bold">{viewingComponent.amount.toLocaleString('vi-VN')} ₫</span></div>
                    <div className="col-md-6"><strong>Giá sỉ:</strong> <span className="text-info fw-bold">{(viewingComponent.wholesale_price || 0).toLocaleString('vi-VN')} ₫</span></div>
                    
                    <div className="col-md-6"><strong>Thương hiệu:</strong> {viewingComponent.trademark || '—'}</div>
                    <div className="col-md-6"><strong>Danh mục:</strong> <span className={`badge ${viewingComponent.category === 'Cáp nối' ? 'bg-danger' : viewingComponent.category === 'Cáp test' ? 'bg-warning' : 'bg-info'}`}>{viewingComponent.category}</span></div>
                    <div className="col-12"><strong>Thuộc tính:</strong> <small className="text-muted">{viewingComponent.properties || 'Không có'}</small></div>
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
    <div className="container-fluid px-4 py-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
            <FontAwesomeIcon icon={faMicrochip} className="me-2 text-primary" />
            Quản lý Linh kiện
          </h1>
          <p className="text-muted mb-0 small">Thêm, sửa, xóa và quản lý linh kiện</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-pill shadow-sm px-4 d-flex align-items-center" onClick={loadComponents} disabled={loading}>
            <FontAwesomeIcon icon={faSync} spin={loading} className="me-2" />
            Làm mới
          </button>
          <button className="btn btn-success rounded-pill shadow-sm px-4 d-flex align-items-center" onClick={handleAddNew} disabled={loading}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Thêm linh kiện
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { icon: faMicrochip, label: 'Tổng linh kiện', value: stats.total, color: 'primary' },
          { icon: faBoxesStacked, label: 'Tổng tồn kho', value: stats.totalStock, color: 'success' },
          { icon: faTags, label: 'Thương hiệu', value: stats.brands, color: 'info' },
          { icon: faList, label: 'Danh mục', value: stats.categories, color: 'warning' },
        ].map((stat, i) => (
          <div key={i} className="col-md-3">
            <div className={`card border-0 shadow-sm text-white rounded-3 overflow-hidden`} style={{ background: `linear-gradient(135deg, var(--bs-${stat.color}) 0%, var(--bs-${stat.color}-dark) 100%)` }}>
              <div className="card-body p-4">
                <div className="d-flex align-items-center">
                  <div className="flex-shrink-0">
                    <div className="bg-white bg-opacity-20 rounded-circle p-3">
                      <FontAwesomeIcon icon={stat.icon} size="2x" />
                    </div>
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <h5 className="card-title mb-1 opacity-90">{stat.label}</h5>
                    <h2 className="mb-0 fw-bold">{stat.value.toLocaleString()}</h2>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label small text-muted fw-medium">Tìm kiếm</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 rounded-start-pill">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 rounded-end-pill"
                  placeholder="Mã SP, tên, thương hiệu, danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-4">
              <label className="form-label small text-muted fw-medium">Hành động</label>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-success rounded-pill flex-fill" onClick={handleExport} disabled={loading || components.length === 0}>
                  <FontAwesomeIcon icon={faDownload} className="me-2" />
                  Xuất Excel
                </button>
                <label className="btn btn-outline-info rounded-pill flex-fill m-0" style={{ cursor: 'pointer' }}>
                  <FontAwesomeIcon icon={faUpload} className="me-2" />
                  Import
                  <input type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: 'none' }} disabled={!!actionLoading} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white border-bottom">
          <h5 className="mb-0 d-flex align-items-center">
            <FontAwesomeIcon icon={faList} className="me-2 text-success" />
            Danh sách Linh kiện
          </h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                {/* SỬA: Thay đổi tiêu đề bảng */}
                <tr>
                  <th className="ps-3" style={{width: '10%'}}>Mã SP</th>
                  <th style={{width: '20%'}}>Tên Sản Phẩm</th>
                  <th style={{width: '15%'}}>Giá lẻ</th>
                  <th style={{width: '15%'}}>Giá buôn</th>
                  <th style={{width: '15%'}}>Danh mục</th>
                  <th style={{width: '15%'}}>Thuộc tính</th>
                  <th className="text-center" style={{width: '10%'}}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {renderComponentTable()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {renderModals()}
    </div>
  );
};

export default ComponentManagementPage;