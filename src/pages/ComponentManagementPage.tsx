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
  faChevronLeft, faChevronRight, faExclamationTriangle,
  faLink, faMinusCircle, faSave, faTimes, faList
} from '@fortawesome/free-solid-svg-icons';

import { brandService } from '../services/brandService';
import { Brand } from '../types/brand';

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

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
  product_photo?: string | string[];
  product_link?: string;
  user_id: string;
  category?: string;
  properties?: string;
  created_at?: string;
  updated_at?: string;
}

interface ProductComponentCreate {
  product_code: string;
  product_name: string;
  amount: number | '';
  wholesale_price: number | '';
  trademark: string;
  guarantee: string;
  stock: number | '';
  description: string;
  product_photo: string;
  product_link: string;
  category: string;
  properties: string;
}

interface PropRow {
  key: string;
  value: string;
}

// Interface cho Danh mục Linh kiện (API riêng)
interface Category {
    id: string;
    name: string;
    description?: string;
}

// ==========================================
// 2. API SERVICES
// ==========================================

const componentCategoryService = {
    // GET /api/v1/categories/
    getAll: async () => {
        try {
            const res = await api.get('/categories/');
            const data = res.data;
            // Xử lý các dạng trả về khác nhau của API (phổ biến là mảng, hoặc object chứa data/results)
            if (Array.isArray(data)) return data;
            if (data.results && Array.isArray(data.results)) return data.results;
            if (data.data && Array.isArray(data.data)) return data.data;
            if (data.items && Array.isArray(data.items)) return data.items;
            return [];
        } catch (err) {
            console.error("Lỗi tải danh mục:", err);
            return [];
        }
    },
    // POST /api/v1/categories/
    create: async (name: string) => {
        const res = await api.post('/categories/', { name });
        return res.data;
    }
};

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

const modalRoot = document.getElementById('modal-root') || document.body;

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

const parseProductPhoto = (photo: string | string[] | undefined | null): string | null => {
  if (!photo) return null;
  if (Array.isArray(photo)) return photo[0] || null;
  if (typeof photo === 'string') {
    const trimmed = photo.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed[0] || null : parsed;
      } catch { return photo; }
    }
    return photo;
  }
  return null;
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================

const ComponentManagementPage: React.FC = () => {
  // --- State Data ---
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); // State lưu danh mục từ API riêng

  // --- State UI ---
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Modals ---
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false); // Modal thêm danh mục nhanh

  // --- Form Data ---
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentComponent, setCurrentComponent] = useState<ProductComponentCreate>(initialFormState);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [viewingComponent, setViewingComponent] = useState<ProductComponent | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- Image & Props ---
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [propList, setPropList] = useState<PropRow[]>([]);

  // ==========================================
  // 5. API CALLS
  // ==========================================

  const loadComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/product-components/', { params: { page: 1, limit: 2000 } });
      let data = response.data;
      
      if (data.items && Array.isArray(data.items)) data = data.items;
      else if (data.data && Array.isArray(data.data)) data = data.data;
      else if (!Array.isArray(data)) data = [];

      const processedList = data.map((item: any) => ({
        ...item,
        product_photo: parseProductPhoto(item.product_photo)
      }));

      setComponents(processedList);
    } catch (err: any) {
      console.error('Error loading components:', err);
      setError('Lỗi tải dữ liệu linh kiện');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuxData = async () => {
    try {
      // Load Brand và Category song song. Không load Service nữa.
      const [brandRes, catRes] = await Promise.all([
        brandService.getAllBrands(0, 100, ''),
        componentCategoryService.getAll()
      ]);
      
      setBrands(brandRes.items || brandRes.data || []);
      setCategories(catRes);
    } catch (e) {
      console.error('Error loading aux data:', e);
    }
  };

  useEffect(() => {
    loadComponents();
    loadAuxData();
  }, [loadComponents]);

  // ==========================================
  // 6. HANDLERS
  // ==========================================

  const filteredComponents = useMemo(() => {
    if (!searchTerm.trim()) return components;
    const lower = searchTerm.toLowerCase();
    return components.filter(c =>
      (c.product_code?.toLowerCase().includes(lower)) ||
      (c.product_name?.toLowerCase().includes(lower)) ||
      (c.trademark?.toLowerCase().includes(lower)) ||
      (c.category?.toLowerCase().includes(lower))
    );
  }, [components, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalItems = filteredComponents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = filteredComponents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Property Handlers
  const addPropertyRow = () => setPropList([...propList, { key: '', value: '' }]);
  const removePropertyRow = (index: number) => {
    const newList = [...propList];
    newList.splice(index, 1);
    setPropList(newList);
  };
  const updatePropertyRow = (index: number, field: 'key' | 'value', newValue: string) => {
    const newList = [...propList];
    newList[index][field] = newValue;
    setPropList(newList);
  };
  const parsePropertiesToUI = (jsonString: string | null | undefined) => {
    if (!jsonString) return [];
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => ({
          key: p.key || '',
          value: Array.isArray(p.values) ? (p.values[0] || '') : (p.values || '')
        }));
      }
      return [];
    } catch { return []; }
  };

  // Form Actions
  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setCurrentComponent(initialFormState);
    setPropList([]);
    setSelectedImageFile(null);
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleEdit = (component: ProductComponent) => {
    setIsEditMode(true);
    setCurrentId(component.id);
    const photoUrl = parseProductPhoto(component.product_photo);
    
    setCurrentComponent({
      product_code: component.product_code ?? '',
      product_name: component.product_name,
      amount: component.amount,
      wholesale_price: component.wholesale_price ?? 0,
      trademark: component.trademark ?? '',
      guarantee: component.guarantee ?? '12 tháng',
      stock: component.stock,
      description: component.description ?? '',
      product_photo: photoUrl || '',
      product_link: component.product_link ?? '',
      category: component.category ?? '',
      properties: component.properties ?? ''
    });
    
    setPropList(parsePropertiesToUI(component.properties));
    setSelectedImageFile(null);
    setPreviewImage(photoUrl);
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
    setShowCategoryModal(false);
    setComponentToDelete(null);
    setViewingComponent(null);
    
    setCurrentComponent(initialFormState);
    setPropList([]);
    setSelectedImageFile(null);
    setPreviewImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) return toast.error('Vui lòng chọn file ảnh!');
      if (file.size > 5 * 1024 * 1024) return toast.error('Ảnh tối đa 5MB!');
      
      setSelectedImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setCurrentComponent(prev => ({ ...prev, product_photo: '' }));
    }
  };

  const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCurrentComponent(prev => ({ ...prev, product_photo: url }));
    setPreviewImage(url);
    setSelectedImageFile(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
       setCurrentComponent(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
       setCurrentComponent(prev => ({ ...prev, [name]: value }));
    }
  };

  // --- Add New Category Logic ---
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return toast.error("Tên danh mục không được để trống");
    try {
        setActionLoading('add_category');
        const newCat = await componentCategoryService.create(newCategoryName);
        
        // Thêm vào danh sách local và chọn ngay
        setCategories(prev => [...prev, newCat]);
        setCurrentComponent(prev => ({...prev, category: newCat.name}));
        
        toast.success("Thêm danh mục thành công");
        setShowCategoryModal(false);
        setNewCategoryName('');
    } catch (err: any) {
        toast.error(err.response?.data?.detail || "Lỗi thêm danh mục");
    } finally {
        setActionLoading(null);
    }
  };

  // Save Component
  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentComponent.product_name?.trim()) return toast.error('Tên linh kiện không được để trống!');

    setActionLoading('save');

    // Props
    let validatedProperties = null;
    const validProps = propList.filter(p => p.key.trim() !== '');
    if (validProps.length > 0) {
       validatedProperties = JSON.stringify(validProps.map(p => ({ key: p.key.trim(), values: [p.value.trim()] })));
    }

    // Image
    let finalPhotoUrl: string | null = currentComponent.product_photo || null;
    try {
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);
        const uploadRes = await api.post('/files/upload-file?type=image', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 });
        finalPhotoUrl = uploadRes.data?.file_url || uploadRes.data?.url || null;
      }

      const payload: any = {
        product_name: currentComponent.product_name.trim(),
        amount: Number(currentComponent.amount) || 0,
        wholesale_price: currentComponent.wholesale_price ? Number(currentComponent.wholesale_price) : null,
        stock: Number(currentComponent.stock) || 0,
        product_photo: finalPhotoUrl, 
        product_code: currentComponent.product_code?.trim() || null,
        trademark: currentComponent.trademark?.trim() || null,
        guarantee: currentComponent.guarantee?.trim() || null,
        description: currentComponent.description?.trim() || null,
        product_link: currentComponent.product_link?.trim() || null,
        category: currentComponent.category?.trim() || null,
        properties: validatedProperties,
      };

      let response;
      if (isEditMode && currentId) {
        response = await api.put(`/product-components/${currentId}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        response = await api.post('/product-components/', payload);
        toast.success('Thêm mới thành công!');
      }

      const newItem = response.data;
      setComponents(prev => isEditMode 
        ? prev.map(c => c.id === currentId ? { ...newItem, product_photo: parseProductPhoto(newItem.product_photo) } : c)
        : [{ ...newItem, product_photo: parseProductPhoto(newItem.product_photo) }, ...prev]
      );

      handleCloseModals();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(`Lưu thất bại: ${err.response?.data?.detail || err.message}`);
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
      setComponents(prev => prev.filter(c => c.id !== componentToDelete));
      handleCloseModals();
    } catch (err: any) {
      toast.error('Lỗi khi xóa linh kiện');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    try {
      setActionLoading('export');
      const response = await api.get('/product-components/export', { responseType: 'blob', timeout: 60000 });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `linh-kien-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất file thành công');
    } catch (err) {
      toast.error('Lỗi xuất file Excel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setActionLoading('import');
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/product-components/import', formData, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      toast.success('Import thành công');
      loadComponents();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi import file');
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  // ==========================================
  // 7. RENDERERS
  // ==========================================

  const renderTable = () => {
    if (loading) return <tr><td colSpan={13} className="text-center py-5">Đang tải...</td></tr>;
    if (error) return <tr><td colSpan={13} className="text-center py-5 text-danger">{error}</td></tr>;
    if (currentItems.length === 0) return <tr><td colSpan={13} className="text-center py-5 text-muted">Không có dữ liệu</td></tr>;

    return currentItems.map((item) => (
      <tr key={item.id} className="align-middle hover-bg-light small">
        <td className="ps-3 text-nowrap"><code className="fw-bold text-dark small">{item.product_code || 'N/A'}</code></td>
        <td className="fw-semibold text-primary" style={{ maxWidth: 180 }}><div className="text-truncate" title={item.product_name}>{item.product_name}</div></td>
        <td><div className="border rounded bg-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm" style={{ width: 40, height: 40 }}>{parseProductPhoto(item.product_photo) ? <img src={parseProductPhoto(item.product_photo)!} alt="" style={{ width: 40, height: 40, objectFit: 'cover' }} /> : <FontAwesomeIcon icon={faImage} className="text-muted opacity-50" />}</div></td>
        <td className="text-nowrap"><span className="badge bg-light text-dark border">{item.category || 'Khác'}</span></td>
        <td style={{ maxWidth: 100 }}><div className="text-truncate text-muted" style={{fontSize: '0.8rem'}}>{item.properties ? 'Có thông số' : '-'}</div></td>
        <td className="text-success fw-bold text-end text-nowrap">{item.amount.toLocaleString()} ₫</td>
        <td className="text-info fw-bold text-end text-nowrap">{(item.wholesale_price || 0).toLocaleString()} ₫</td>
        <td style={{ maxWidth: 80 }}><div className="text-truncate text-muted">{item.trademark || '-'}</div></td>
        <td className="text-nowrap text-muted">{item.guarantee || '-'}</td>
        <td className="text-center"><span className={`badge ${item.stock > 0 ? 'bg-success' : 'bg-danger'}`}>{item.stock}</span></td>
        <td style={{ maxWidth: 100 }}><div className="text-truncate text-muted">{item.description || '-'}</div></td>
        <td className="text-center">{item.product_link ? <a href={item.product_link} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faLink} /></a> : '-'}</td>
        <td className="text-center text-nowrap" style={{ width: 120 }}>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-info" onClick={() => handleView(item)}><FontAwesomeIcon icon={faEye} /></button>
            <button className="btn btn-outline-warning" onClick={() => handleEdit(item)}><FontAwesomeIcon icon={faEdit} /></button>
            <button className="btn btn-outline-danger" onClick={() => handleDelete(item.id)}><FontAwesomeIcon icon={faTrash} /></button>
          </div>
        </td>
      </tr>
    ));
  };

  // Render Modals
  const renderModals = () => {
    if (!modalRoot) return null;
    return createPortal(
      <>
        {(showModal || showDeleteModal || showViewModal || showCategoryModal) && <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-primary text-white">
                  <h5 className="modal-title fw-bold"><FontAwesomeIcon icon={isEditMode ? faEdit : faPlus} className="me-2" />{isEditMode ? 'Cập nhật linh kiện' : 'Thêm linh kiện mới'}</h5>
                  <button className="btn-close btn-close-white" onClick={handleCloseModals}></button>
                </div>
                <form onSubmit={handleSaveComponent}>
                  <div className="modal-body p-4">
                    <div className="row g-4">
                      {/* Image Section */}
                      <div className="col-md-3 text-center">
                        <div className="border rounded bg-light mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: 180, height: 180}}>
                          {previewImage ? <img src={previewImage} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : <FontAwesomeIcon icon={faImage} size="4x" className="text-muted opacity-25" />}
                        </div>
                        <label className="btn btn-outline-primary btn-sm w-100 mb-2"><FontAwesomeIcon icon={faUpload} className="me-2" />Chọn ảnh<input type="file" hidden accept="image/*" onChange={handleImageSelect} /></label>
                        <div className="input-group input-group-sm"><span className="input-group-text"><FontAwesomeIcon icon={faLink} /></span><input type="text" className="form-control" placeholder="Link ảnh" value={currentComponent.product_photo || ''} onChange={handlePhotoUrlChange} /></div>
                      </div>
                      {/* Info Section */}
                      <div className="col-md-9">
                         <div className="row g-3">
                            <div className="col-md-4"><label className="small fw-bold">Mã SP</label><input className="form-control" name="product_code" value={currentComponent.product_code} onChange={handleInputChange} placeholder="Tự động" /></div>
                            <div className="col-md-8"><label className="small fw-bold">Tên linh kiện *</label><input className="form-control" name="product_name" value={currentComponent.product_name} onChange={handleInputChange} required /></div>
                            
                            <div className="col-md-4"><label className="small fw-bold">Giá bán lẻ *</label><input type="number" className="form-control" name="amount" value={currentComponent.amount} onChange={handleInputChange} required /></div>
                            <div className="col-md-4"><label className="small fw-bold">Giá bán buôn</label><input type="number" className="form-control" name="wholesale_price" value={currentComponent.wholesale_price} onChange={handleInputChange} /></div>
                            <div className="col-md-4"><label className="small fw-bold">Tồn kho *</label><input type="number" className="form-control" name="stock" value={currentComponent.stock} onChange={handleInputChange} required /></div>

                            <div className="col-md-6">
                                <label className="small fw-bold">Thương hiệu</label>
                                <select className="form-select" name="trademark" value={currentComponent.trademark} onChange={handleInputChange}>
                                    <option value="">-- Chọn --</option>
                                    {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            {/* CATEGORY FIELD (LOAD TỪ CATEGORIES API) */}
                            <div className="col-md-6">
                                <label className="small fw-bold d-flex justify-content-between">
                                    Danh mục
                                    <span className="text-primary cursor-pointer" style={{cursor: 'pointer'}} onClick={() => setShowCategoryModal(true)}>
                                        <FontAwesomeIcon icon={faPlus} className="me-1"/>Thêm mới
                                    </span>
                                </label>
                                <select className="form-select" name="category" value={currentComponent.category} onChange={handleInputChange}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div className="col-md-6"><label className="small fw-bold">Bảo hành</label><input className="form-control" name="guarantee" value={currentComponent.guarantee} onChange={handleInputChange} /></div>
                            <div className="col-md-6"><label className="small fw-bold">Link Web</label><input className="form-control" name="product_link" value={currentComponent.product_link} onChange={handleInputChange} /></div>

                            <div className="col-12">
                                <div className="card bg-light border-0">
                                    <div className="card-header bg-transparent py-1 d-flex justify-content-between"><small className="fw-bold">Thuộc tính</small><button type="button" className="btn btn-sm btn-white border" onClick={addPropertyRow}><FontAwesomeIcon icon={faPlus}/> Thêm dòng</button></div>
                                    <div className="card-body p-2">
                                        {propList.map((p, i) => (
                                            <div className="row g-2 mb-2" key={i}>
                                                <div className="col-5"><input className="form-control form-control-sm" placeholder="Tên" value={p.key} onChange={e => updatePropertyRow(i, 'key', e.target.value)} /></div>
                                                <div className="col-6"><input className="form-control form-control-sm" placeholder="Giá trị" value={p.value} onChange={e => updatePropertyRow(i, 'value', e.target.value)} /></div>
                                                <div className="col-1"><button type="button" className="btn btn-link text-danger" onClick={() => removePropertyRow(i)}><FontAwesomeIcon icon={faMinusCircle}/></button></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="col-12"><label className="small fw-bold">Mô tả</label><textarea className="form-control" rows={3} name="description" value={currentComponent.description} onChange={handleInputChange} /></div>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light"><button type="button" className="btn btn-secondary" onClick={handleCloseModals}>Hủy</button><button type="submit" className="btn btn-primary" disabled={!!actionLoading}>{actionLoading ? 'Đang lưu...' : 'Lưu lại'}</button></div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
            <div className="modal fade show d-block" style={{ zIndex: 1060, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="modal-dialog modal-dialog-centered modal-sm">
                    <div className="modal-content shadow">
                        <div className="modal-header bg-info text-white py-2">
                            <h6 className="modal-title"><FontAwesomeIcon icon={faList} className="me-2"/>Thêm danh mục</h6>
                            <button className="btn-close btn-close-white btn-sm" onClick={() => setShowCategoryModal(false)}></button>
                        </div>
                        <div className="modal-body">
                            <label className="form-label small">Tên danh mục mới</label>
                            <input type="text" className="form-control" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus />
                        </div>
                        <div className="modal-footer py-1">
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowCategoryModal(false)}>Hủy</button>
                            <button className="btn btn-sm btn-primary" onClick={handleAddCategory} disabled={!!actionLoading}>{actionLoading ? <FontAwesomeIcon icon={faSpinner} spin/> : 'Thêm'}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow">
                  <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa</h5><button className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading}></button></div>
                  <div className="modal-body text-center py-4"><FontAwesomeIcon icon={faExclamationTriangle} className="text-warning mb-3" size="3x" /><p className="mb-0">Hành động này không thể hoàn tác.</p></div>
                  <div className="modal-footer justify-content-center"><button className="btn btn-secondary" onClick={handleCloseModals}>Hủy</button><button className="btn btn-danger" onClick={handleConfirmDelete}>{actionLoading ? 'Đang xóa...' : 'Xóa ngay'}</button></div>
                </div>
              </div>
            </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingComponent && (
            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content shadow-lg rounded-3">
                        <div className="modal-header bg-info text-white"><h5 className="modal-title">Chi tiết</h5><button className="btn-close btn-close-white" onClick={handleCloseModals}></button></div>
                        <div className="modal-body p-4">
                             <div className="row">
                                 <div className="col-md-4"><img src={parseProductPhoto(viewingComponent.product_photo) || ''} className="img-fluid border rounded" onError={(e) => e.currentTarget.src='https://via.placeholder.com/300'} /></div>
                                 <div className="col-md-8">
                                     <h4>{viewingComponent.product_name}</h4>
                                     <div className="text-muted mb-3">Mã: {viewingComponent.product_code}</div>
                                     <div className="fw-bold text-success fs-5 mb-3">{viewingComponent.amount.toLocaleString()} ₫</div>
                                     <p>{viewingComponent.description}</p>
                                     <div className="mb-2"><strong>Danh mục:</strong> {viewingComponent.category || 'Khác'}</div>
                                 </div>
                             </div>
                        </div>
                        <div className="modal-footer"><button className="btn btn-secondary" onClick={handleCloseModals}>Đóng</button></div>
                    </div>
                </div>
            </div>
        )}
      </>,
      modalRoot
    );
  };

  // ==========================================
  // 8. RENDER MAIN
  // ==========================================

  return (
    <div className="container-fluid px-4 py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div><h1 className="h3 mb-1 text-dark fw-bold"><FontAwesomeIcon icon={faMicrochip} className="me-2 text-primary" />Quản lý Linh kiện</h1></div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-primary rounded-pill px-4" onClick={loadComponents} disabled={loading}><FontAwesomeIcon icon={faSync} spin={loading} className="me-2"/>Làm mới</button>
          <button className="btn btn-success rounded-pill px-4" onClick={handleAddNew} disabled={loading}><FontAwesomeIcon icon={faPlus} className="me-2"/>Thêm mới</button>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-lg-8"><div className="input-group"><span className="input-group-text bg-white"><FontAwesomeIcon icon={faSearch} /></span><input type="text" className="form-control" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div></div>
            <div className="col-lg-4 d-flex gap-2">
              <button className="btn btn-outline-success w-100 rounded-pill" onClick={handleExport} disabled={!!actionLoading}><FontAwesomeIcon icon={faDownload} className="me-2" />Export</button>
              <label className="btn btn-outline-info w-100 rounded-pill"><FontAwesomeIcon icon={faUpload} className="me-2" />Import<input type="file" hidden accept=".xlsx" onChange={handleImport} disabled={!!actionLoading} /></label>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white py-3"><h5 className="mb-0 fw-bold text-primary">Danh sách ({totalItems})</h5></div>
        <div className="card-body p-0"><div className="table-responsive"><table className="table table-hover table-sm align-middle mb-0"><thead className="text-white small" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}><tr><th className="ps-3">Mã SP</th><th>Tên</th><th>Ảnh</th><th>Danh Mục</th><th>Thông số</th><th className="text-end">Giá lẻ</th><th className="text-end">Giá buôn</th><th>Hãng</th><th>BH</th><th>Kho</th><th>Mô tả</th><th>Web</th><th>Hành động</th></tr></thead><tbody>{renderTable()}</tbody></table></div></div>
        {totalPages > 1 && <div className="card-footer bg-white py-3 d-flex justify-content-end"><div className="d-flex gap-1"><button className="btn btn-sm btn-outline-secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage===1}><FontAwesomeIcon icon={faChevronLeft}/></button><span className="align-self-center mx-2">Trang {currentPage}/{totalPages}</span><button className="btn btn-sm btn-outline-secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage===totalPages}><FontAwesomeIcon icon={faChevronRight}/></button></div></div>}
      </div>

      {renderModals()}
    </div>
  );
};

export default ComponentManagementPage;