import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StatCard from '../components/StatCard';
import { SubscriptionPlan, SubscriptionPlanCreate, SubscriptionPlanUpdate } from '../types/subscriptionPlan';
import { subscriptionPlanService } from '../services/subscriptionPlanService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const initialCreateState: SubscriptionPlanCreate = {
  name: '',
  description: '',
  price: 0,
  duration_days: 30,
  max_videos_per_day: 3,
  max_scheduled_days: 7,
  max_stored_videos: 30,
  storage_limit_gb: 5,
  max_social_accounts: 5,
  ai_content_generation: true,
  is_active: true
};

const modalRoot = document.getElementById('modal-root');

const SubscriptionPlanPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<any>(initialCreateState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    if (titleElement) titleElement.innerText = 'Quản lý Gói đăng bài';
    if (subtitleElement) subtitleElement.innerText = 'Tạo, sửa, xóa các gói dịch vụ';
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const plansResponse = await subscriptionPlanService.getAllPlans();
      setPlans(plansResponse);
    } catch (err: any) {
      console.error('Error loading plans:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi tải dữ liệu');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddNewClick = () => {
    setCurrentData(initialCreateState);
    setIsEditMode(false);
    setEditId(null);
    setModalError(null);
    setShowModal(true);
  };

  const handleEditClick = (plan: SubscriptionPlan) => {
    setIsEditMode(true);
    setEditId(plan.id);
    const updateData: SubscriptionPlanUpdate = {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration_days: plan.duration_days,
      max_videos_per_day: plan.max_videos_per_day,
      max_scheduled_days: plan.max_scheduled_days,
      max_stored_videos: plan.max_stored_videos,
      storage_limit_gb: plan.storage_limit_gb,
      max_social_accounts: plan.max_social_accounts,
      ai_content_generation: plan.ai_content_generation,
      is_active: plan.is_active,
    };
    setCurrentData(updateData);
    setModalError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setShowModal(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;
    const isNumber = [
      'price', 'duration_days', 'max_videos_per_day', 
      'max_scheduled_days', 'max_stored_videos', 
      'storage_limit_gb', 'max_social_accounts'
    ].includes(name);
    setCurrentData(prev => ({
      ...prev,
      [name]: isCheckbox ? checkedValue : (isNumber ? parseInt(value) || 0 : value)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      if (isEditMode && editId) {
        const updatedPlan = await subscriptionPlanService.updatePlan(editId, currentData as SubscriptionPlanUpdate);
        setPlans(prev => prev.map(p => (p.id === editId ? updatedPlan : p)));
      } else {
        const newPlan = await subscriptionPlanService.createPlan(currentData as SubscriptionPlanCreate);
        setPlans(prev => [newPlan, ...prev]);
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Error saving plan:', err);
      setModalError(err.response?.data?.detail || err.message || 'Lỗi không xác định');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await subscriptionPlanService.deletePlan(deleteId); 
      setPlans(prev => prev.filter(p => p.id !== deleteId));
      handleCloseDeleteModal();
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      setDeleteError(err.response?.data?.detail || err.message || 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const renderPlanTable = () => {
    if (loading) return <tr><td colSpan={7} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={7} className="text-center text-danger py-4">{error}</td></tr>;
    if (plans.length === 0) return <tr><td colSpan={7} className="text-center py-5 text-muted">Chưa có gói nào.</td></tr>;
    return plans.map((plan) => (
      <tr key={plan.id}>
        <td data-label="Tên gói" className="align-middle" style={{ paddingLeft: '1.5rem' }}><strong>{plan.name}</strong></td>
        <td data-label="Giá" className="align-middle">{(plan.price || 0).toLocaleString('vi-VN')} ₫</td>
        <td data-label="Thời hạn" className="align-middle">{plan.duration_days} ngày</td>
        <td data-label="Video/ngày" className="align-middle">{plan.max_videos_per_day}</td>
        <td data-label="Lưu trữ (GB)" className="align-middle">{plan.storage_limit_gb} GB</td>
        <td data-label="Kích hoạt" className="align-middle text-center">
          {plan.is_active ? (<FontAwesomeIcon icon={faCheckCircle} className="text-success" title="Hoạt động" />) : (<FontAwesomeIcon icon={faTimesCircle} className="text-muted" title="Không hoạt động" />)}
        </td>
        <td data-label="Thao tác" className="align-middle">
          <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditClick(plan)} title="Sửa"><FontAwesomeIcon icon={faEdit} /></button>
          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteClick(plan.id)} title="Xóa"><FontAwesomeIcon icon={faTrash} /></button>
        </td>
      </tr>
    ));
  };

  const renderModalForm = () => {
    return (
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <label htmlFor="name" className="form-label">Tên gói *</label>
          <input type="text" className="form-control" id="name" name="name" value={currentData.name} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="price" className="form-label">Giá (VND) *</label>
          <input type="number" className="form-control" id="price" name="price" value={currentData.price} onChange={handleFormChange} required />
        </div>
        <div className="col-12">
          <label htmlFor="description" className="form-label">Mô tả</label>
          <textarea className="form-control" id="description" name="description" rows={2} value={currentData.description || ''} onChange={handleFormChange}></textarea>
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="duration_days" className="form-label">Thời hạn (ngày) *</label>
          <input type="number" className="form-control" id="duration_days" name="duration_days" value={currentData.duration_days} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="max_social_accounts" className="form-label">Số tài khoản MXH *</label>
          <input type="number" className="form-control" id="max_social_accounts" name="max_social_accounts" value={currentData.max_social_accounts} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="max_videos_per_day" className="form-label">Video tối đa/ngày *</label>
          <input type="number" className="form-control" id="max_videos_per_day" name="max_videos_per_day" value={currentData.max_videos_per_day} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="max_scheduled_days" className="form-label">Số ngày lên lịch (tối đa) *</label>
          <input type="number" className="form-control" id="max_scheduled_days" name="max_scheduled_days" value={currentData.max_scheduled_days} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="max_stored_videos" className="form-label">Số video lưu trữ (tối đa) *</label>
          <input type="number" className="form-control" id="max_stored_videos" name="max_stored_videos" value={currentData.max_stored_videos} onChange={handleFormChange} required />
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="storage_limit_gb" className="form-label">Dung lượng (GB) *</label>
          <input type="number" className="form-control" id="storage_limit_gb" name="storage_limit_gb" value={currentData.storage_limit_gb} onChange={handleFormChange} required />
        </div>
        <div className="col-12 d-flex gap-4 mt-4">
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" id="ai_content_generation" name="ai_content_generation" checked={currentData.ai_content_generation} onChange={handleFormChange} />
            <label className="form-check-label" htmlFor="ai_content_generation">Cho phép tạo nội dung AI</label>
          </div>
          <div className="form-check form-switch">
            <input className="form-check-input" type="checkbox" role="switch" id="is_active" name="is_active" checked={currentData.is_active} onChange={handleFormChange} />
            <label className="form-check-label" htmlFor="is_active">Kích hoạt gói</label>
          </div>
        </div>
      </div>
    );
  };

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}

        {/* Modal Thêm/Sửa */}
        {showModal && (
          <div 
            className="modal fade show" 
            tabIndex={-1} 
            style={{ display: 'block', zIndex: 9999 }} 
            aria-modal="true" 
            role="dialog"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"> 
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{isEditMode ? 'Cập nhật Gói' : 'Thêm Gói mới'}</h5>
                  <button type="button" className="btn-close" onClick={handleCloseModal} aria-label="Close" disabled={isSaving}></button>
                </div>
                <div className="modal-body">
                  {modalError && (<div className="alert alert-danger" role="alert">{modalError}</div>)}
                  <form id="planForm" onSubmit={handleFormSubmit}>
                    {renderModalForm()}
                  </form>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button>
                  <button type="submit" form="planForm" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xóa */}
        {showDeleteModal && (
          <div 
            className="modal fade show" 
            tabIndex={-1} 
            style={{ display: 'block', zIndex: 9999 }} 
            aria-modal="true" 
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button type="button" className="btn-close" onClick={handleCloseDeleteModal} aria-label="Close" disabled={isDeleting}></button>
                </div>
                <div className="modal-body">
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <p>Bạn có chắc chắn muốn xóa Gói này không?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>Hủy</button>
                  <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
                  </button>
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
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        
        <div className="row g-3 g-lg-4">
          <div className="col-6 col-lg-3"><StatCard title="Tổng số Gói" value={loading ? '...' : plans.length.toString()} colorType="primary" icon="fas fa-box-open" /></div>
          <div className="col-6 col-lg-3"><StatCard title="Gói Hoạt động" value={loading ? '...' : plans.filter(p => p.is_active).length.toString()} colorType="success" icon="fas fa-check-circle" /></div>
          <div className="col-6 col-lg-3"><StatCard title="Gói Free" value={loading ? '...' : plans.filter(p => p.price === 0).length.toString()} colorType="info" icon="fas fa-gift" /></div>
          <div className="col-6 col-lg-3"><StatCard title="Gói đắt nhất" value={loading ? '...' : `${Math.max(...plans.map(p => p.price), 0).toLocaleString('vi-VN')} ₫`} colorType="warning" icon="fas fa-gem" /></div>
        </div>
        <div className="table-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-2 p-3">
            <h5 className="mb-0">Danh sách các Gói đăng bài</h5>
            <button 
              className="btn btn-primary btn-sm d-flex align-items-center gap-2"
              onClick={handleAddNewClick}
            >
              <FontAwesomeIcon icon={faPlus} />
              Thêm gói mới
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="align-middle" style={{ paddingLeft: '1.5rem' }}>Tên gói</th>
                    <th className="align-middle">Giá</th>
                    <th className="align-middle">Thời hạn</th>
                    <th className="align-middle">Video/ngày</th>
                    <th className="align-middle">Lưu trữ (GB)</th>
                    <th className="align-middle text-center">Kích hoạt</th>
                    <th className="align-middle">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderPlanTable()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {renderModals()}
    </>
  );
};

export default SubscriptionPlanPage;