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
  faLink, faMinusCircle, faSave, faTimes
} from '@fortawesome/free-solid-svg-icons';

import { brandService } from '../services/brandService';
import { Brand } from '../types/brand';
import { serviceService } from '../services/serviceService';
import { Service } from '../types/service';

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

// Interface cho dòng thuộc tính trên giao diện nhập liệu
interface PropRow {
  key: string;
  value: string;
}

// ==========================================
// 2. HELPER FUNCTIONS & CONSTANTS
// ==========================================

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

// Hàm xử lý chuỗi hình ảnh (JSON string hoặc URL string)
const parseProductPhoto = (photo: string | string[] | undefined | null): string | null => {
  if (!photo) return null;
  
  if (Array.isArray(photo)) {
    return photo[0] || null;
  }
  
  if (typeof photo === 'string') {
    const trimmed = photo.trim();
    // Kiểm tra nếu là chuỗi JSON array (VD: "['http...']")
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed[0] || null : parsed;
      } catch (error) {
        // Nếu parse lỗi, trả về chính chuỗi đó (giả sử là link trực tiếp)
        return photo;
      }
    }
    // Nếu là chuỗi thường
    return photo;
  }
  
  return null;
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================

const ComponentManagementPage: React.FC = () => {
  // --- State Quản lý Dữ liệu ---
  const [components, setComponents] = useState<ProductComponent[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // --- State Quản lý UI/Loading ---
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- State Phân trang ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- State Modals ---
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // --- State Form Data ---
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentComponent, setCurrentComponent] = useState<ProductComponentCreate>(initialFormState);
  const [componentToDelete, setComponentToDelete] = useState<string | null>(null);
  const [viewingComponent, setViewingComponent] = useState<ProductComponent | null>(null);

  // --- State Xử lý ảnh & Thuộc tính ---
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [propList, setPropList] = useState<PropRow[]>([]); // List thuộc tính dạng bảng

  // ==========================================
  // 4. API CALLS & DATA LOADING
  // ==========================================

  const loadComponents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Gọi API lấy danh sách linh kiện
      const response = await api.get('/product-components/', { 
        params: { page: 1, limit: 2000 } 
      });
      
      let data = response.data;
      
      // Chuẩn hóa response trả về (xử lý các trường hợp API trả về khác nhau)
      if (data.items && Array.isArray(data.items)) {
        data = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        data = data.data;
      } else if (Array.isArray(data)) {
        data = data;
      } else {
        data = [];
      }

      // Map dữ liệu để xử lý hình ảnh ngay từ đầu
      const processedList = data.map((item: any) => ({
        ...item,
        product_photo: parseProductPhoto(item.product_photo)
      }));

      setComponents(processedList);
    } catch (err: any) {
      console.error('Error loading components:', err);
      const msg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      setError(`Lỗi tải dữ liệu linh kiện: ${msg}`);
      toast.error('Lỗi tải dữ liệu linh kiện');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAuxData = async () => {
    try {
      // Lấy danh sách Thương hiệu và Dịch vụ để điền vào Combobox
      // Lưu ý: Limit 100 để tránh lỗi 422 từ Backend nếu server giới hạn
      const [brandRes, serviceRes] = await Promise.all([
        brandService.getAllBrands(0, 100, ''),
        serviceService.getAllServices(0, 100, '') 
      ]);
      
      setBrands(brandRes.items || brandRes.data || []);
      
      // Lấy raw services để lọc danh mục sau
      const rawServices = serviceRes.data || serviceRes.items || serviceRes.services || [];
      setServices(rawServices);
      
    } catch (e) {
      console.error('Error loading aux data:', e);
      // Không hiển thị lỗi cho user để tránh spam toast, chỉ log console
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    loadComponents();
    loadAuxData();
  }, [loadComponents]);

  // ==========================================
  // 5. DATA PROCESSING (FILTER, SORT, UNIQUE)
  // ==========================================

  // Tạo danh sách danh mục Duy nhất (Unique) từ Services
  const uniqueCategories = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    
    const names = services
        .map(s => s.name ? s.name.toString().trim() : '') // Lấy tên và trim
        .filter(name => name !== ''); // Bỏ tên rỗng
        
    // Dùng Set để lọc trùng và sort A-Z
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, [services]);

  // Lọc danh sách linh kiện theo từ khóa tìm kiếm
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

  // Reset về trang 1 khi search thay đổi
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // Tính toán phân trang
  const totalItems = filteredComponents.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentItems = filteredComponents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ==========================================
  // 6. PROPERTY LIST HANDLERS (XỬ LÝ BẢNG THUỘC TÍNH)
  // ==========================================
  
  const addPropertyRow = () => {
    setPropList([...propList, { key: '', value: '' }]);
  };

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
          // Xử lý trường hợp values là mảng hoặc string
          value: Array.isArray(p.values) ? (p.values[0] || '') : (p.values || '')
        }));
      }
      return [];
    } catch (e) {
      return [];
    }
  };

  // ==========================================
  // 7. FORM HANDLERS (INPUT, IMAGE, MODAL)
  // ==========================================

  const handleAddNew = () => {
    setIsEditMode(false);
    setCurrentId(null);
    setCurrentComponent(initialFormState);
    setPropList([]); // Reset bảng thuộc tính
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
    
    // Load dữ liệu thuộc tính JSON lên bảng nhập liệu
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
    if (actionLoading) return; // Không đóng khi đang xử lý
    setShowModal(false);
    setShowDeleteModal(false);
    setShowViewModal(false);
    setComponentToDelete(null);
    setViewingComponent(null);
    
    // Reset form
    setCurrentComponent(initialFormState);
    setPropList([]);
    setSelectedImageFile(null);
    setPreviewImage(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh (jpg, png, ...)!');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Kích thước ảnh quá lớn (Max 5MB)!');
        return;
      }
      
      setSelectedImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
      // Xóa link text cũ để ưu tiên file mới
      setCurrentComponent(prev => ({ ...prev, product_photo: '' }));
    }
  };

  const handlePhotoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setCurrentComponent(prev => ({ ...prev, product_photo: url }));
    setPreviewImage(url);
    setSelectedImageFile(null); // Nếu nhập link thì bỏ file
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
        // Xử lý số: Nếu rỗng thì set là '' để không bị lỗi uncontrolled input
        setCurrentComponent(prev => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
        setCurrentComponent(prev => ({ ...prev, [name]: value }));
    }
  };

  // ==========================================
  // 8. ACTION HANDLERS (SAVE, DELETE, EXPORT, IMPORT)
  // ==========================================

  const handleSaveComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation cơ bản
    if (!currentComponent.product_name?.trim()) {
      toast.error('Tên linh kiện không được để trống!');
      return;
    }

    setActionLoading('save');

    // --- BƯỚC 1: XỬ LÝ THUỘC TÍNH (ARRAY -> JSON) ---
    let validatedProperties = null;
    const validProps = propList.filter(p => p.key.trim() !== ''); // Lọc dòng trống
    
    if (validProps.length > 0) {
        // Chuyển về format Server: [{"key": "A", "values": ["B"]}]
        const propsForServer = validProps.map(p => ({
            key: p.key.trim(),
            values: [p.value.trim()] 
        }));
        validatedProperties = JSON.stringify(propsForServer);
    }

    // --- BƯỚC 2: XỬ LÝ ẢNH (UPLOAD NẾU CẦN) ---
    let finalPhotoUrl: string | null = currentComponent.product_photo || null;

    try {
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append('file', selectedImageFile);

        try {
          const uploadRes = await api.post('/files/upload-file?type=image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 90000, // 90s timeout cho mạng chậm
          });
          
          finalPhotoUrl = uploadRes.data?.file_url || uploadRes.data?.url || uploadRes.data?.path || null;
          
          if (!finalPhotoUrl) {
             toast.error('Lỗi Upload: Server không trả về link ảnh.');
             setActionLoading(null); return;
          }
          toast.success('Upload ảnh thành công!');
        } catch (uploadErr) {
          console.error("Upload failed", uploadErr);
          toast.error('Upload thất bại. Vui lòng nhập link ảnh thủ công hoặc kiểm tra Server.');
          setActionLoading(null); return;
        }
      }

      // --- BƯỚC 3: GỬI DATA VỀ SERVER ---
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
        properties: validatedProperties, // JSON string
      };

      let response;
      if (isEditMode && currentId) {
        response = await api.put(`/product-components/${currentId}`, payload);
        toast.success('Cập nhật linh kiện thành công!');
      } else {
        response = await api.post('/product-components/', payload);
        toast.success('Thêm mới linh kiện thành công!');
      }

      // --- BƯỚC 4: CẬP NHẬT UI ---
      const newItem = response.data;
      setComponents(prev =>
        isEditMode
          ? prev.map(c => c.id === currentId ? { ...newItem, product_photo: parseProductPhoto(newItem.product_photo) } : c)
          : [{ ...newItem, product_photo: parseProductPhoto(newItem.product_photo) }, ...prev]
      );

      handleCloseModals();
    } catch (err: any) {
      console.error('Save error:', err);
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Lỗi server';
      toast.error(`Lưu thất bại: ${msg}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!componentToDelete) return;
    setActionLoading(`delete-${componentToDelete}`);
    try {
      await api.delete(`/product-components/${componentToDelete}`);
      toast.success('Đã xóa linh kiện thành công');
      setComponents(prev => prev.filter(c => c.id !== componentToDelete));
      handleCloseModals();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.detail || 'Lỗi khi xóa linh kiện');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExport = async () => {
    try {
      setActionLoading('export');
      const response = await api.get('/product-components/export', { 
        responseType: 'blob',
        timeout: 60000 
      });
      
      // Tạo link tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `linh-kien-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Xuất file Excel thành công');
    } catch (err: any) {
      console.error('Export error', err);
      toast.error('Lỗi xuất file Excel');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('Vui lòng chọn file Excel (.xlsx)');
      e.target.value = ''; // Reset input
      return;
    }

    try {
      setActionLoading('import');
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/product-components/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
      });
      
      toast.success('Import dữ liệu thành công');
      loadComponents(); // Load lại dữ liệu mới
    } catch (err: any) {
      console.error('Import error', err);
      toast.error(err.response?.data?.detail || 'Lỗi import file Excel');
    } finally {
      setActionLoading(null);
      e.target.value = '';
    }
  };

  // ==========================================
  // 9. RENDER UI SUB-COMPONENTS
  // ==========================================

  const renderTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={13} className="text-center py-5">
            <div className="d-flex justify-content-center align-items-center flex-column">
                <div className="spinner-border text-primary mb-2" role="status"></div>
                <span className="text-muted">Đang tải dữ liệu...</span>
            </div>
          </td>
        </tr>
      );
    }
    
    if (error) {
      return (
        <tr>
          <td colSpan={13} className="text-center py-5 text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
            <div className="mt-3">
              <button className="btn btn-sm btn-outline-primary" onClick={loadComponents}>
                <FontAwesomeIcon icon={faSync} className="me-1" /> Thử lại
              </button>
            </div>
          </td>
        </tr>
      );
    }
    
    if (currentItems.length === 0) {
      return (
        <tr>
          <td colSpan={13} className="text-center py-5 text-muted">
            <div className="py-4">
                <FontAwesomeIcon icon={faSearch} className="text-muted opacity-25 mb-3" size="3x" />
                <p>{searchTerm ? 'Không tìm thấy linh kiện phù hợp' : 'Chưa có dữ liệu linh kiện'}</p>
            </div>
          </td>
        </tr>
      );
    }

    return currentItems.map((item) => (
      <tr key={item.id} className="align-middle hover-bg-light small">
        <td className="ps-3 text-nowrap">
          <code className="fw-bold text-dark small">{item.product_code || 'N/A'}</code>
        </td>
        <td className="fw-semibold text-primary" style={{ maxWidth: 180 }}>
          <div className="text-truncate" title={item.product_name}>{item.product_name}</div>
        </td>

        {/* Hình ảnh */}
        <td>
          <div className="border rounded bg-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm" style={{ width: 40, height: 40 }}>
            {parseProductPhoto(item.product_photo) ? (
              <img
                src={parseProductPhoto(item.product_photo)!}
                alt={item.product_name}
                style={{ width: 40, height: 40, objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/40?text=Err'; }}
              />
            ) : (
              <FontAwesomeIcon icon={faImage} className="text-muted opacity-50" size="sm" />
            )}
          </div>
        </td>

        <td className="text-nowrap">
          <span className="badge bg-light text-dark border">{item.category || 'Khác'}</span>
        </td>
        
        {/* Thuộc tính (Hiển thị vắn tắt) */}
        <td style={{ maxWidth: 100 }}>
            <div className="text-truncate text-muted" style={{fontSize: '0.8rem'}}>
                {item.properties ? (() => {
                    try {
                        const props = JSON.parse(item.properties);
                        return props.map((p:any) => `${p.key}: ${p.values.join(',')}`).join('; ');
                    } catch { return '-'; }
                })() : '-'}
            </div>
        </td>

        <td className="text-success fw-bold text-end text-nowrap">
          {item.amount.toLocaleString('vi-VN')} ₫
        </td>
        <td className="text-info fw-bold text-end text-nowrap">
          {(item.wholesale_price || 0).toLocaleString('vi-VN')} ₫
        </td>
        
        <td style={{ maxWidth: 80 }}>
          <div className="text-truncate text-muted">{item.trademark || '-'}</div>
        </td>
        <td className="text-nowrap text-muted">{item.guarantee || '-'}</td>
        
        <td className="text-center">
          <span className={`badge ${item.stock > 0 ? 'bg-success' : 'bg-danger'}`}>
            {item.stock}
          </span>
        </td>
        
        <td style={{ maxWidth: 100 }}>
          <div className="text-truncate text-muted" title={item.description || ''}>
            {item.description || '-'}
          </div>
        </td>
        
        <td className="text-center">
          {item.product_link ? (
            <a href={item.product_link} target="_blank" rel="noreferrer" className="text-primary">
              <FontAwesomeIcon icon={faLink} />
            </a>
          ) : <span className="text-muted">-</span>}
        </td>

        <td className="text-center text-nowrap" style={{ width: 120 }}>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-info px-2" onClick={() => handleView(item)} title="Xem">
              <FontAwesomeIcon icon={faEye} size="xs" />
            </button>
            <button className="btn btn-outline-warning px-2" onClick={() => handleEdit(item)} title="Sửa">
              <FontAwesomeIcon icon={faEdit} size="xs" />
            </button>
            <button className="btn btn-outline-danger px-2" onClick={() => handleDelete(item.id)} title="Xóa">
              <FontAwesomeIcon icon={faTrash} size="xs" />
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    // Logic hiển thị pagination rút gọn (1, 2, ..., 10, 11)
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return (
      <div className="d-flex align-items-center gap-1">
        <button 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3" 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        {pages.map((p, i) => (
          <React.Fragment key={i}>
            {p === '...' ? (
              <span className="px-2 text-muted">...</span>
            ) : (
              <button 
                className={`btn btn-sm rounded-pill px-3 ${
                  currentPage === p ? 'btn-primary text-white' : 'btn-outline-secondary'
                }`} 
                onClick={() => handlePageChange(p as number)}
              >
                {p}
              </button>
            )}
          </React.Fragment>
        ))}
        <button 
          className="btn btn-sm btn-outline-secondary rounded-pill px-3" 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    );
  };

  // ==========================================
  // 10. RENDER MODALS
  // ==========================================

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {/* Backdrop */}
        {(showModal || showDeleteModal || showViewModal) && (
          <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
        )}

        {/* --- MODAL ADD / EDIT --- */}
        {showModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
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
                      {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
                      <div className="col-md-3 text-center">
                        <label className="form-label fw-bold d-block">Hình ảnh sản phẩm</label>
                        
                        {/* Preview Ảnh */}
                        <div className="border rounded d-flex align-items-center justify-content-center bg-light mx-auto mb-3 overflow-hidden shadow-sm position-relative" style={{ width: 180, height: 180 }}>
                          {previewImage ? (
                            <img 
                              src={previewImage} 
                              alt="Preview" 
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                              onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/180?text=Error'}
                            />
                          ) : (
                            <div className="text-muted opacity-25">
                                <FontAwesomeIcon icon={faImage} size="4x" />
                                <div className="small mt-2">Chưa có ảnh</div>
                            </div>
                          )}
                        </div>

                        {/* Nút Upload File */}
                        <label className="btn btn-outline-primary btn-sm w-100 cursor-pointer mb-2">
                          <FontAwesomeIcon icon={faUpload} className="me-2" /> 
                          Chọn từ máy tính
                          <input 
                            type="file" 
                            hidden 
                            accept="image/*" 
                            onChange={handleImageSelect} 
                            disabled={!!actionLoading}
                          />
                        </label>

                        <div className="text-center text-muted small my-1">- HOẶC -</div>

                        {/* Input Link Ảnh */}
                        <div className="input-group input-group-sm mb-2">
                          <span className="input-group-text"><FontAwesomeIcon icon={faLink} /></span>
                          <input 
                            type="text" 
                            className="form-control"
                            placeholder="Dán link ảnh (https://...)"
                            value={currentComponent.product_photo || ''}
                            onChange={handlePhotoUrlChange}
                            disabled={!!actionLoading}
                          />
                        </div>
                        
                        <div className="text-muted small fst-italic">
                          {selectedImageFile ? 
                            <span className="text-success fw-bold">Đã chọn file: {selectedImageFile.name}</span> : 
                            ""
                          }
                        </div>
                      </div>

                      {/* CỘT PHẢI: THÔNG TIN */}
                      <div className="col-md-9">
                        <div className="row g-3">
                          {/* Hàng 1: Mã, Tên */}
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Mã sản phẩm</label>
                            <input type="text" className="form-control" name="product_code" value={currentComponent.product_code || ''} onChange={handleInputChange} placeholder="Tự động nếu để trống" disabled={!!actionLoading} />
                          </div>
                          <div className="col-md-8">
                            <label className="form-label fw-bold small">Tên linh kiện <span className="text-danger">*</span></label>
                            <input type="text" className="form-control" name="product_name" value={currentComponent.product_name} onChange={handleInputChange} required disabled={!!actionLoading} />
                          </div>

                          {/* Hàng 2: Giá, Tồn kho */}
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Giá bán lẻ (VNĐ) <span className="text-danger">*</span></label>
                            <input type="number" className="form-control" name="amount" value={currentComponent.amount} onChange={handleInputChange} min="0" step="1000" required disabled={!!actionLoading} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Giá bán buôn (VNĐ)</label>
                            <input type="number" className="form-control" name="wholesale_price" value={currentComponent.wholesale_price || ''} onChange={handleInputChange} min="0" step="1000" disabled={!!actionLoading} />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label fw-bold small">Tồn kho <span className="text-danger">*</span></label>
                            <input type="number" className="form-control" name="stock" value={currentComponent.stock} onChange={handleInputChange} min="0" required disabled={!!actionLoading} />
                          </div>

                          {/* Hàng 3: Thương hiệu, Danh mục */}
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Thương hiệu</label>
                            <select className="form-select" name="trademark" value={currentComponent.trademark || ''} onChange={handleInputChange} disabled={!!actionLoading}>
                              <option value="">-- Chọn thương hiệu --</option>
                              {brands.map(b => (<option key={b.id} value={b.name}>{b.name}</option>))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Danh mục</label>
                            {/* Dùng Unique Categories để lọc trùng */}
                            <select className="form-select" name="category" value={currentComponent.category || ''} onChange={handleInputChange} disabled={!!actionLoading}>
                              <option value="">-- Chọn danh mục --</option>
                              {uniqueCategories.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Hàng 4: Bảo hành, Link */}
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Bảo hành</label>
                            <input type="text" className="form-control" name="guarantee" value={currentComponent.guarantee || ''} onChange={handleInputChange} placeholder="Ví dụ: 12 tháng" disabled={!!actionLoading} />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label fw-bold small">Link Web tham khảo</label>
                            <input type="url" className="form-control" name="product_link" value={currentComponent.product_link || ''} onChange={handleInputChange} placeholder="https://..." disabled={!!actionLoading} />
                          </div>

                          {/* Hàng 5: THUỘC TÍNH KỸ THUẬT (Bảng nhập liệu mới) */}
                          <div className="col-12">
                            <div className="card bg-light border-0">
                                <div className="card-header bg-transparent d-flex justify-content-between align-items-center py-1">
                                    <label className="form-label fw-bold small mb-0 text-primary">Thuộc tính kỹ thuật</label>
                                    <button type="button" className="btn btn-sm btn-white border bg-white text-primary shadow-sm" onClick={addPropertyRow} disabled={!!actionLoading}>
                                        <FontAwesomeIcon icon={faPlus} className="me-1" /> Thêm dòng
                                    </button>
                                </div>
                                <div className="card-body p-2">
                                    {propList.length === 0 && (
                                        <div className="text-center text-muted small fst-italic py-2">
                                            Chưa có thông số nào. Nhấn "Thêm dòng" để bắt đầu (Ví dụ: Màu sắc - Đen).
                                        </div>
                                    )}
                                    {propList.map((prop, idx) => (
                                        <div key={idx} className="row g-2 mb-2 align-items-center">
                                            <div className="col-5">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    placeholder="Tên thông số (VD: Dung lượng)" 
                                                    value={prop.key}
                                                    onChange={(e) => updatePropertyRow(idx, 'key', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-6">
                                                <input 
                                                    type="text" 
                                                    className="form-control form-control-sm" 
                                                    placeholder="Giá trị (VD: 5000mAh)"
                                                    value={prop.value}
                                                    onChange={(e) => updatePropertyRow(idx, 'value', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-1 text-center">
                                                <button type="button" className="btn btn-link text-danger p-0" onClick={() => removePropertyRow(idx)}>
                                                    <FontAwesomeIcon icon={faMinusCircle} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                          </div>

                          {/* Hàng 6: Mô tả */}
                          <div className="col-12">
                            <label className="form-label fw-bold small">Mô tả chi tiết</label>
                            <textarea className="form-control" name="description" rows={3} value={currentComponent.description || ''} onChange={handleInputChange} placeholder="Nhập mô tả chi tiết về linh kiện..." disabled={!!actionLoading} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={!!actionLoading}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" /> Hủy
                    </button>
                    <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={!!actionLoading}>
                      {actionLoading === 'save' ? (
                        <><FontAwesomeIcon icon={faSpinner} spin className="me-2" /> Đang lưu...</>
                      ) : (
                        <><FontAwesomeIcon icon={faSave} className="me-2" /> {isEditMode ? 'Cập nhật' : 'Lưu lại'}</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL DELETE --- */}
        {showDeleteModal && (
          <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading}></button>
                </div>
                <div className="modal-body text-center py-4">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning mb-3" size="3x" />
                  <p className="mb-0">Bạn có chắc chắn muốn xóa linh kiện này không?<br/>Hành động này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer justify-content-center">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals} disabled={!!actionLoading}>Hủy</button>
                  <button className="btn btn-danger rounded-pill px-4" onClick={handleConfirmDelete} disabled={!!actionLoading}>
                    {actionLoading ? <><FontAwesomeIcon icon={faSpinner} spin /> Đang xóa...</> : 'Xóa ngay'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL VIEW DETAIL --- */}
        {showViewModal && viewingComponent && (
          <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content shadow-lg rounded-3">
                <div className="modal-header bg-info text-white">
                  <h5 className="modal-title fw-bold">Chi tiết linh kiện</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals}></button>
                </div>
                <div className="modal-body p-4">
                  <div className="row g-4">
                    <div className="col-md-4 text-center">
                        <div className="border rounded p-2 bg-light">
                            <img 
                                src={parseProductPhoto(viewingComponent.product_photo) || ''} 
                                alt={viewingComponent.product_name} 
                                className="img-fluid" 
                                style={{maxHeight: '300px', objectFit: 'contain'}}
                                onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Image'} 
                            />
                        </div>
                        <div className="mt-3">
                            <span className={`badge ${viewingComponent.stock > 0 ? 'bg-success' : 'bg-danger'} fs-6`}>
                                {viewingComponent.stock > 0 ? `Còn hàng: ${viewingComponent.stock}` : 'Hết hàng'}
                            </span>
                        </div>
                    </div>
                    <div className="col-md-8">
                        <h4 className="text-primary fw-bold">{viewingComponent.product_name}</h4>
                        <div className="text-muted small mb-3">Mã SP: <span className="font-monospace text-dark">{viewingComponent.product_code || 'N/A'}</span></div>
                        
                        <div className="row g-3 mb-3">
                            <div className="col-6">
                                <div className="small text-muted">Giá bán lẻ</div>
                                <div className="fw-bold text-success fs-5">{viewingComponent.amount.toLocaleString()} ₫</div>
                            </div>
                            <div className="col-6">
                                <div className="small text-muted">Giá bán buôn</div>
                                <div className="fw-bold text-info fs-5">{(viewingComponent.wholesale_price || 0).toLocaleString()} ₫</div>
                            </div>
                        </div>

                        <table className="table table-sm table-bordered">
                            <tbody>
                                <tr><th className="bg-light w-25">Thương hiệu</th><td>{viewingComponent.trademark || '-'}</td></tr>
                                <tr><th className="bg-light">Danh mục</th><td>{viewingComponent.category || '-'}</td></tr>
                                <tr><th className="bg-light">Bảo hành</th><td>{viewingComponent.guarantee || '-'}</td></tr>
                                <tr>
                                    <th className="bg-light">Thông số KT</th>
                                    <td>
                                        {viewingComponent.properties ? (
                                            <ul className="mb-0 ps-3 small">
                                                {JSON.parse(viewingComponent.properties).map((p:any, i:number) => (
                                                    <li key={i}><strong>{p.key}:</strong> {p.values.join(', ')}</li>
                                                ))}
                                            </ul>
                                        ) : '-'}
                                    </td>
                                </tr>
                                <tr><th className="bg-light">Link Web</th><td>{viewingComponent.product_link ? <a href={viewingComponent.product_link} target="_blank" rel="noreferrer">Xem liên kết</a> : '-'}</td></tr>
                            </tbody>
                        </table>
                        
                        <div className="bg-light p-3 rounded border small text-muted">
                            <strong>Mô tả: </strong>
                            {viewingComponent.description || 'Chưa có mô tả'}
                        </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button className="btn btn-secondary rounded-pill px-4" onClick={handleCloseModals}>Đóng</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>,
      modalRoot
    );
  };

  // ==========================================
  // 11. RENDER MAIN LAYOUT
  // ==========================================

  return (
    <div className="container-fluid px-4 py-4">
      {/* Title Section */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold">
            <FontAwesomeIcon icon={faMicrochip} className="me-2 text-primary" />
            Quản lý Linh kiện
          </h1>
          <p className="text-muted mb-0 small">Quản lý kho, giá bán và thông tin kỹ thuật linh kiện</p>
        </div>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-outline-primary rounded-pill shadow-sm px-4" 
            onClick={loadComponents} 
            disabled={loading}
          >
            <FontAwesomeIcon icon={faSync} spin={loading} className="me-2" />
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button 
            className="btn btn-success rounded-pill shadow-sm px-4" 
            onClick={handleAddNew} 
            disabled={loading}
          >
            <FontAwesomeIcon icon={faPlus} className="me-2" />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label small text-muted fw-medium">Tìm kiếm linh kiện</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <FontAwesomeIcon icon={faSearch} className="text-muted" />
                </span>
                <input 
                  type="text" 
                  className="form-control border-start-0" 
                  placeholder="Nhập tên, mã sản phẩm, thương hiệu..." 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-success w-100 rounded-pill" 
                  onClick={handleExport}
                  disabled={!!actionLoading || components.length === 0}
                >
                  <FontAwesomeIcon 
                    icon={actionLoading === 'export' ? faSpinner : faDownload} 
                    spin={actionLoading === 'export'}
                    className="me-2" 
                  />
                  Xuất Excel
                </button>
                <label className="btn btn-outline-info w-100 rounded-pill m-0 cursor-pointer">
                  <FontAwesomeIcon 
                    icon={actionLoading === 'import' ? faSpinner : faUpload} 
                    spin={actionLoading === 'import'}
                    className="me-2" 
                  />
                  Import
                  <input 
                    type="file" 
                    hidden 
                    accept=".xlsx" 
                    onChange={handleImport} 
                    disabled={!!actionLoading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="card-header bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-bold text-primary">
              <FontAwesomeIcon icon={faMicrochip} className="me-2" />
              Danh sách ({totalItems})
            </h5>
            <small className="text-muted">
              Trang {currentPage} / {totalPages}
            </small>
          </div>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm align-middle mb-0">
              <thead className="text-white small" style={{ background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' }}>
                <tr>
                  <th className="ps-3 text-nowrap">Mã SP</th>
                  <th className="text-nowrap">Tên Sản Phẩm</th>
                  <th className="text-nowrap text-center">Ảnh</th>
                  <th className="text-nowrap">Danh Mục</th>
                  <th className="text-nowrap">Thông số</th>
                  <th className="text-nowrap text-end">Giá bán lẻ</th>
                  <th className="text-nowrap text-end">Giá Bán Buôn</th>
                  <th className="text-nowrap">Thương Hiệu</th>
                  <th className="text-nowrap">Bảo Hành</th>
                  <th className="text-nowrap text-center">Tồn Kho</th>
                  <th className="text-nowrap">Mô Tả</th>
                  <th className="text-nowrap text-center">Web</th>
                  <th className="text-center text-nowrap" style={{ width: 120 }}>Hành động</th>
                </tr>
              </thead>
              <tbody>{renderTable()}</tbody>
            </table>
          </div>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="card-footer bg-white border-top d-flex justify-content-between align-items-center p-3">
            <small className="text-muted">
              Hiển thị <strong>{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> -{' '}
              <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> trên{' '}
              <strong>{totalItems}</strong> kết quả
            </small>
            {renderPagination()}
          </div>
        )}
      </div>

      {/* Modals */}
      {renderModals()}
    </div>
  );
};

export default ComponentManagementPage;