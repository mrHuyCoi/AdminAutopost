// src/pages/ComponentManagementPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faEdit, faTrash, faSpinner,
  faEye, faSearch, faSync, faImage,
  faMicrochip, faDownload, faUpload,
  faChevronLeft, faChevronRight, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import { brandService } from '../services/brandService';
import { Brand } from '../types/brand';
import { serviceService } from '../services/serviceService';
import { Service } from '../types/service';

// === INTERFACES ===
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

const modalRoot = document.getElementById('modal-root');

const initialFormState: ProductComponentCreate = {
  product_code: '',
  product_name: '',
  amount: 0,
  wholesale_price: 0,
  trademark: '',
  guarantee: '12 tháng',
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentComponent, setCurrentComponent] = useState<ProductComponentCreate>(initialFormState);

  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingComponent, setViewingComponent] = useState<ProductComponent | null>(null);

  const loadComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/product-components/', { params: { page: 1, limit: 2000 } });
      let data = response.data;
      if (data.items && Array.isArray(data.items)) data = data.items;
      else if (data.data && Array.isArray(data.data)) data = data.data;
      const list = Array.isArray(data) ? data : [];
      setComponents(list);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Lỗi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuxData = async () => {
    try {
      const [brandRes, serviceRes] = await Promise.all([
        brandService.getAllBrands(0, 1000, ''),
        serviceService.getAllServices(0, 1000, '')
      ]);
      setBrands(brandRes.items || []);
      setServices(serviceRes.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadComponents();
    loadAuxData();
  }, [loadComponents]);

  const filteredComponents = useMemo(() => {
    if (!searchTerm.trim()) return components;
    const lower = searchTerm.toLowerCase();
    return components.filter(c =>
      (c.product_code && c.product_code.toLowerCase().includes(lower)) ||
      (c.product_name && c.product_name.toLowerCase().includes(lower)) ||
      (c.trademark && c.trademark.toLowerCase().includes(lower))
    );
  }, [components, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalItems = filteredComponents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = filteredComponents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setCurrentComponent(initialFormState);
    setSelectedImageFile(null);
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleEdit = (component: ProductComponent) => {
    setIsEditMode(true);
    setCurrentId(component.id);
    setCurrentComponent({
      product_code: component.product_code,
      product_name: component.product_name,
      amount: component.amount,
      wholesale_price: component.wholesale_price,
      trademark: component.trademark,
      guarantee: component.guarantee,
      stock: component.stock,
      description: component.description,
      product_photo: component.product_photo,
      product_link: component.product_link,
      category: component.category,
      properties: component.properties
    });
    setSelectedImageFile(null);
    setPreviewImage(component.product_photo || null);
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
    setSelectedImageFile(null);
    setPreviewImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentComponent(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentComponent.product_name?.trim()) {
      toast.error('Tên linh kiện không được để trống');
      return;
    }

    setActionLoading('save');

    try {
      let photoUrl = currentComponent.product_photo || null;

      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);

        try {
          const uploadRes = await api.post('/files/upload-file?type=image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000,
          });

          const uploadedUrl = uploadRes.data?.url || uploadRes.data;
          if (!uploadedUrl || !uploadedUrl.includes('http')) throw new Error('URL không hợp lệ');
          photoUrl = uploadedUrl;
          toast.success('Upload ảnh thành công!');
          setPreviewImage(uploadedUrl);
        } catch (err: any) {
          console.error('Upload failed:', err.response?.data || err.message);
          toast.error('Upload ảnh thất bại – vẫn có thể lưu không ảnh');
        }
      }

      const payload: any = {
        ...currentComponent,
        amount: Number(currentComponent.amount) || 0,
        wholesale_price: currentComponent.wholesale_price ? Number(currentComponent.wholesale_price) : null,
        stock: Number(currentComponent.stock) || 0,
        product_photo: photoUrl,
        properties: currentComponent.properties?.trim() || null,
        category: currentComponent.category?.trim() || null,
        trademark: currentComponent.trademark?.trim() || null,
      };

      ['product_code', 'description', 'product_link', 'guarantee'].forEach(field => {
        if (!payload[field]) delete payload[field];
      });

      let response;
      if (isEditMode && currentId) {
        response = await api.put(`/product-components/${currentId}`, payload);
        toast.success('Cập nhật linh kiện thành công');
      } else {
        response = await api.post('/product-components/', payload);
        toast.success('Thêm linh kiện thành công');
      }

      if (response.data) {
        const newItem = response.data;
        setComponents(prev =>
          isEditMode
            ? prev.map(c => c.id === currentId ? { ...c, ...newItem } : c)
            : [newItem, ...prev]
        );
      }

      handleCloseModals();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Lỗi server');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    setActionLoading(`delete-${componentToDelete}`);
    try {
      await api.delete(`/product-components/${componentToDelete}`);
      toast.success('Đã xóa thành công');
      loadComponents();
      handleCloseModals();
    } catch (err: any) {
      toast.error('Lỗi khi xóa');
    } finally {
      setActionLoading(null);
    }
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
      toast.success('Xuất Excel thành công');
    } catch (err) { toast.error('Lỗi xuất file'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionLoading('import');
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/product-components/import', formData);
      toast.success('Nhập dữ liệu thành công');
      loadComponents();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Lỗi nhập file');
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  const renderTable = () => {
    if (loading) return <tr><td colSpan={9} className="text-center py-5"><FontAwesomeIcon icon={faSpinner} spin /> Đang tải...</td></tr>;
    if (error) return <tr><td colSpan={9} className="text-center py-5 text-danger"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />{error}</td></tr>;
    if (currentItems.length === 0) return <tr><td colSpan={9} className="text-center py-5 text-muted">Không có dữ liệu</td></tr>;

    return currentItems.map((item) => (
      <tr key={item.id} className="align-middle hover-bg-light">
        <td className="ps-3">
          <div className="border rounded bg-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm" style={{ width: 50, height: 50 }}>
            {item.product_photo ? (
              <img src={item.product_photo} alt={item.product_name} className="rounded shadow-sm" style={{ width: 50, height: 50, objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = 'https:// via.placeholder.com/60?text=404'; }} />
            ) : <FontAwesomeIcon icon={faImage} className="text-muted opacity-50" />}
          </div>
        </td>
        <td><code className="fw-bold text-dark">{item.product_code}</code></td>
        <td className="fw-semibold text-primary" style={{ maxWidth: 200 }}>{item.product_name}</td>
        <td className="text-success fw-bold">{item.amount.toLocaleString()} ₫</td>
        <td className="text-info fw-bold">{(item.wholesale_price || 0).toLocaleString()} ₫</td>
        <td><span className="badge bg-light text-dark border">{item.category || 'Khác'}</span></td>
        <td><span className={`badge ${item.stock > 0 ? 'bg-success' : 'bg-danger'}`}>{item.stock}</span></td>
        <td className="text-muted small text-truncate" style={{ maxWidth: 100 }}>{item.trademark}</td>
        <td className="text-center">
          <div className="btn-group btn-group-sm shadow-sm">
            <button className="btn btn-outline-info" onClick={() => handleView(item)}><FontAwesomeIcon icon={faEye} /></button>
            <button className="btn btn-outline-warning" onClick={() => handleEdit(item)}><FontAwesomeIcon icon={faEdit} /></button>
            <button className="btn btn-outline-danger" onClick={() => handleDelete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderPagination = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }

    return (
      <div className="d-flex align-items-center gap-1">
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={i}>
            {p === '...' ? <span className="px-2 text-muted">...</span> : (
              <button className={`btn btn-sm rounded-pill px-3 ${currentPage === p ? 'btn-primary text-white' : 'btn-outline-secondary'}`} onClick={() => handlePageChange(p as number)}>
                {p}
              </button>
            )}
          </React.Fragment>
        ))}
        <button className="btn btn-sm btn-outline-secondary rounded-pill px-3" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showModal || showDeleteModal || showViewModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}

        {/* Modal Thêm / Sửa */}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold">
                    <FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />
                    {isEditMode ? 'Cập nhật linh kiện' : 'Thêm linh kiện mới'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading}></button>
                </div>
                <form onSubmit={handleSaveComponent}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      <div className="col-md-3 text-center">
                        <label className="form-label fw-bold d-block">Hình ảnh</label>
                        <div className="border rounded d-flex align-items-center justify-content-center bg-light mx-auto mb-3 overflow-hidden" style={{ width: 160, height: 160 }}>
                          {previewImage ? <img src={previewImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <FontAwesomeIcon icon={faImage} size="3x" className="text-muted opacity-25" />}
                        </div>
                        <label className="btn btn-outline-primary btn-sm w-100">
                          <FontAwesomeIcon icon={faUpload} className="me-2" /> Chọn ảnh
                          <input type="file" hidden accept="image/*" onChange={handleImageSelect} />
                        </label>
                      </div>

                      <div className="col-md-9">
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Mã SP</label>
                            <input className="form-control" name="product_code" value={currentComponent.product_code || ''} onChange={handleInputChange} placeholder="Tự động (để trống)" />
                          </div>
                          <div className="col-md-8">
                            <label className="form-label fw-bold small">Tên linh kiện *</label>
                            <input className="form-control" name="product_name" value={currentComponent.product_name} onChange={handleInputChange} required />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Giá bán lẻ *</label>
                            <input type="number" className="form-control" name="amount" value={currentComponent.amount} onChange={handleInputChange} min="0" required />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Giá bán buôn</label>
                            <input type="number" className="form-control" name="wholesale_price" value={currentComponent.wholesale_price || ''} onChange={handleInputChange} min="0" />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Tồn kho *</label>
                            <input type="number" className="form-control" name="stock" value={currentComponent.stock} onChange={handleInputChange} min="0" required />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Thương hiệu</label>
                            <select className="form-select" name="trademark" value={currentComponent.trademark || ''} onChange={handleInputChange}>
                              <option value="">-- Chọn thương hiệu --</option>
                              {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Danh mục</label>
                            <select className="form-select" name="category" value={currentComponent.category || ''} onChange={handleInputChange}>
                              <option value="">-- Chọn danh mục --</option>
                              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </div>
                          <div className="col-12">
                            <label className="form-label fw-bold small">Thuộc tính (JSON)</label>
                            <textarea className="form-control" name="properties" rows={3} value={currentComponent.properties || ''} onChange={handleInputChange}
                              placeholder='Ví dụ: [{"key": "Dung lượng", "values": ["4000mAh"]}]' />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModals} disabled={!!actionLoading}>Hủy</button>
                    <button type="submit" className="btn btn-primary" disabled={!!actionLoading}>
                      {actionLoading === 'save' ? <><FontAwesomeIcon icon={faSpinner} spin /> Đang lưu...</> : 'Lưu lại'}
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
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals}></button>
                </div>
                <div className="modal-body">Bạn có chắc chắn muốn xóa linh kiện này không?</div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleCloseModals}>Hủy</button>
                  <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={!!actionLoading}>
                    {actionLoading ? 'Đang xóa...' : 'Xóa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xem chi tiết */}
        {showViewModal && viewingComponent && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title">Chi tiết linh kiện</h5>
                  <button className="btn-close btn-close-white" onClick={handleCloseModals}></button>
                </div>
                <div className="modal-body">
                  <div className="text-center mb-3">
                    <img src={viewingComponent.product_photo || 'https://via.placeholder.com/150'} alt="img" style={{ maxHeight: 200 }} className="rounded shadow-sm border" />
                  </div>
                  <div className="row g-3">
                    <div className="col-6"><strong>Mã:</strong> {viewingComponent.product_code}</div>
                    <div className="col-6"><strong>Tên:</strong> {viewingComponent.product_name}</div>
                    <div className="col-6"><strong>Giá lẻ:</strong> {viewingComponent.amount.toLocaleString()} ₫</div>
                    <div className="col-6"><strong>Giá sỉ:</strong> {viewingComponent.wholesale_price?.toLocaleString() || 0} ₫</div>
                    <div className="col-6"><strong>Thương hiệu:</strong> {viewingComponent.trademark}</div>
                    <div className="col-6"><strong>Danh mục:</strong> {viewingComponent.category}</div>
                    <div className="col-12"><strong>Thuộc tính:</strong> <pre className="bg-light p-2 mt-1 rounded small">{viewingComponent.properties || 'Không có'}</pre></div>
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
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold"><FontAwesomeIcon icon={faMicrochip} className="me-2 text-primary" />Quản lý Linh kiện</h1>
          <p className="text-muted mb-0 small">Thêm, sửa, xóa và quản lý linh kiện</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-pill shadow-sm px-4" onClick={loadComponents} disabled={loading}>
            <FontAwesomeIcon icon={faSync} spin={loading} className="me-2" />Làm mới
          </button>
          <button className="btn btn-success rounded-pill shadow-sm px-4" onClick={handleAddNew} disabled={loading}>
            <FontAwesomeIcon icon={faPlus} className="me-2" />Thêm linh kiện
          </button>
        </div>
      </div>

      {/* ĐÃ XÓA 4 CARD THỐNG KÊ NHƯ YÊU CẦU */}

      {/* Search & Action */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label small text-muted fw-medium">Tìm kiếm</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0"><FontAwesomeIcon icon={faSearch} /></span>
                <input type="text" className="form-control border-start-0" placeholder="Tìm theo mã, tên, thương hiệu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="d-flex gap-2">
                <button className="btn btn-outline-success w-100 rounded-pill" onClick={handleExport}><FontAwesomeIcon icon={faDownload} className="me-2" />Xuất Excel</button>
                <label className="btn btn-outline-info w-100 rounded-pill m-0 cursor-pointer">
                  <FontAwesomeIcon icon={faUpload} className="me-2" />Import
                  <input type="file" hidden accept=".xlsx" onChange={handleImport} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3">
          <h5 className="mb-0 fw-bold text-primary"><FontAwesomeIcon icon={faMicrochip} className="me-2" />Danh sách Linh kiện</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="text-white" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
                <tr>
                  <th className="ps-3">Ảnh</th>
                  <th>Mã SP</th>
                  <th>Tên Sản Phẩm</th>
                  <th>Giá lẻ</th>
                  <th>Giá sỉ</th>
                  <th>Danh mục</th>
                  <th>Tồn kho</th>
                  <th>Hãng</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>{renderTable()}</tbody>
            </table>
          </div>
        </div>

        <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center p-3">
          <small className="text-muted">
            Hiển thị <strong>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> - <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> trên <strong>{totalItems}</strong> linh kiện
          </small>
          {renderPagination()}
        </div>
      </div>

      {renderModals()}
    </div>
  );
};

export default ComponentManagementPage;