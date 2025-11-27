// src/components/ServiceTypeSidemenu.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Category, CategoryCreate, CategoryUpdate } from '../types/category';
import { categoryService } from '../services/categoryService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

// Lấy modal root an toàn (tránh lỗi khi chạy SSR hoặc chưa load DOM)
const getModalRoot = () => document.getElementById('modal-root') || document.body;

interface ServiceTypeSidemenuProps {
  onCategorySelect: (categoryName: string | null) => void;
  selectedCategory: string | null;
  onServiceTypesChange?: (serviceTypes: string[]) => void;
}

const ServiceTypeSidemenu: React.FC<ServiceTypeSidemenuProps> = ({ 
  onCategorySelect, 
  selectedCategory,
  onServiceTypesChange
}) => {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<CategoryCreate | CategoryUpdate>({ name: '', parent_id: null });
  
  // State Edit/Delete
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // 1. Load danh sách khi mount
  useEffect(() => {
    loadCategories();
  }, []);

  // 2. Gửi danh sách Parent Categories lên component cha (để fill vào combobox thêm mới)
  useEffect(() => {
    if (onServiceTypesChange && categories.length > 0) {
      const parentCategories = categories
        .filter(category => !category.parent_id) // CHỈ LẤY PARENT CATEGORIES
        .map(category => category.name);
      
      // console.log('📋 Parent categories sent to form:', parentCategories);
      onServiceTypesChange(parentCategories);
    }
  }, [categories, onServiceTypesChange]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh mục');
    } finally {
      setLoading(false);
    }
  };
  
  // === CÁC HÀM XỬ LÝ MODAL (Thêm/Xóa/Sửa) ===
  const handleAddNewClick = () => {
    setCurrentData({ name: '', parent_id: null });
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleEditClick = (category: Category) => {
    setIsEditMode(true);
    setEditId(category.id);
    setCurrentData({ name: category.name, parent_id: category.parent_id });
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => { if (isSaving) return; setShowModal(false); };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentData(prev => ({ ...prev, [name]: value === "" ? null : value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      if (isEditMode && editId) {
        const updated = await categoryService.updateCategory(editId, currentData as CategoryUpdate);
        setCategories(prev => prev.map(c => (c.id === editId ? updated : c)));
      } else {
        const created = await categoryService.createCategory(currentData as CategoryCreate);
        setCategories(prev => [created, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => { setDeleteId(id); setDeleteError(null); setShowDeleteModal(true); };
  const handleCloseDeleteModal = () => { if (isDeleting) return; setShowDeleteModal(false); setDeleteId(null); };
  
  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await categoryService.deleteCategory(deleteId); 
      setCategories(prev => prev.filter(c => c.id !== deleteId));
      handleCloseDeleteModal();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  // === RENDER DANH SÁCH LOẠI ===
  const renderCategoryList = () => {
    if (loading) return <div className="text-center p-3"><span className="spinner-border spinner-border-sm text-primary"></span></div>;
    if (error) return <div className="alert alert-danger small p-2 mx-3">{error}</div>;
    if (categories.length === 0) return <p className="text-muted text-center small p-3">Chưa có loại dịch vụ nào.</p>;
    
    const parentCategories = categories.filter(c => !c.parent_id);
    const childCategories = categories.filter(c => c.parent_id);

    return parentCategories.map(parent => (
      <React.Fragment key={parent.id}>
        <li 
          className={`list-group-item d-flex justify-content-between align-items-center ${selectedCategory === parent.name ? 'active' : ''}`}
          onClick={() => onCategorySelect(parent.name)}
          style={{ cursor: 'pointer' }}
        >
          <span className="fw-bold">{parent.name}</span>
          <div className="btn-group">
            <button className={`btn btn-sm py-0 px-1 ${selectedCategory === parent.name ? 'text-white' : 'btn-outline-secondary'}`} onClick={(e) => { e.stopPropagation(); handleEditClick(parent); }}>
              <FontAwesomeIcon icon={faEdit} style={{ width: '12px' }} />
            </button>
            <button className={`btn btn-sm py-0 px-1 ${selectedCategory === parent.name ? 'text-white' : 'btn-outline-danger'}`} onClick={(e) => { e.stopPropagation(); handleDeleteClick(parent.id); }}>
              <FontAwesomeIcon icon={faTrash} style={{ width: '12px' }} />
            </button>
          </div>
        </li>
        {childCategories
          .filter(child => child.parent_id === parent.id)
          .map(child => (
            <li 
              key={child.id} 
              className={`list-group-item d-flex justify-content-between align-items-center ps-4 ${selectedCategory === child.name ? 'active' : ''}`}
              onClick={() => onCategorySelect(child.name)}
              style={{ cursor: 'pointer' }}
            >
              <span>- {child.name}</span>
              <div className="btn-group">
                <button className={`btn btn-sm py-0 px-1 ${selectedCategory === child.name ? 'text-white' : 'btn-outline-secondary'}`} onClick={(e) => { e.stopPropagation(); handleEditClick(child); }}>
                  <FontAwesomeIcon icon={faEdit} style={{ width: '12px' }} />
                </button>
                <button className={`btn btn-sm py-0 px-1 ${selectedCategory === child.name ? 'text-white' : 'btn-outline-danger'}`} onClick={(e) => { e.stopPropagation(); handleDeleteClick(child.id); }}>
                  <FontAwesomeIcon icon={faTrash} style={{ width: '12px' }} />
                </button>
              </div>
            </li>
          ))}
      </React.Fragment>
    ));
  };

  // === RENDER MODALS (VỚI PORTAL) ===
  const renderModals = () => {
    const modalRoot = getModalRoot();
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}
        
        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 1055 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form id="categoryForm" onSubmit={handleFormSubmit}>
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Loại' : 'Thêm Loại Dịch vụ'}</h5>
                    <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">Tên Loại Dịch vụ *</label>
                      <input type="text" className="form-control" id="name" name="name" value={currentData.name || ''} onChange={handleFormChange} required autoFocus />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="parent_id" className="form-label">Là con của (Tùy chọn)</label>
                      <select className="form-select" id="parent_id" name="parent_id" value={currentData.parent_id || ""} onChange={handleFormChange}>
                        <option value="">-- Không có (Danh mục cha) --</option>
                        {categories.filter(c => !c.parent_id && c.id !== editId).map(parent => (
                            <option key={parent.id} value={parent.id}>{parent.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving} form="categoryForm">
                      {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xóa */}
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 1055 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content shadow">
                <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa</h5><button type="button" className="btn-close btn-close-white" onClick={handleCloseDeleteModal} disabled={isDeleting}></button></div>
                <div className="modal-body">
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <p>Bạn có chắc chắn muốn xóa loại dịch vụ này? <br/><small className="text-muted">(Các dịch vụ con cũng có thể bị ảnh hưởng)</small></p>
                </div>
                <div className="modal-footer bg-light">
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

  // === JSX RETURN (NỘI DUNG CHÍNH CỦA COMPONENT) ===
  return (
    <>
      <div className="col-12 col-lg-3 sidebar-left-container">
        <div className="card shadow-sm service-type-card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h6 className="mb-0 fw-bold text-primary">Phân loại</h6>
            <button className="btn btn-primary btn-sm py-1 px-2 shadow-sm" onClick={handleAddNewClick}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          <ul className="list-group list-group-flush service-type-list" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            {/* Nút "Xem tất cả" */}
            <li 
              className={`list-group-item d-flex justify-content-between align-items-center ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => onCategorySelect(null)}
              style={{ cursor: 'pointer' }}
            >
              <span className="fw-bold">Xem tất cả</span>
            </li>
            {renderCategoryList()}
          </ul>
        </div>
      </div>
      
      {/* Gọi hàm renderModals để hiển thị popup */}
      {renderModals()}
    </>
  );
};

export default ServiceTypeSidemenu;