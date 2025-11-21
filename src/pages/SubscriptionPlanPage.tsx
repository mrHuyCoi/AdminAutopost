// src/pages/SubscriptionPlanPage.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StatCard from '../components/StatCard'; // Lưu ý: Component này chưa được dùng trong code cũ, nhưng tôi giữ nguyên import
import { SubscriptionPlan, SubscriptionPlanCreate, SubscriptionPlanUpdate } from '../types/subscriptionPlan';
import { subscriptionPlanService } from '../services/subscriptionPlanService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit, faTrash, faPlus, faCheckCircle, faTimesCircle,
  faSync, faExclamationTriangle, faBoxOpen
} from '@fortawesome/free-solid-svg-icons';

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

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

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

      const data =
        Array.isArray(plansResponse)
          ? plansResponse
          : Array.isArray(plansResponse?.data)
            ? plansResponse.data
            : [];

      setPlans(data);
      setCurrentPage(1); // Reset về trang 1 khi tải lại dữ liệu

    } catch (err: any) {
      console.error('Error loading plans:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi tải dữ liệu');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC TÍNH TOÁN PHÂN TRANG ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlans = plans.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(plans.length / itemsPerPage)); // Đảm bảo ít nhất là 1 trang

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  // ----------------------------------

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
      
      // Logic cập nhật lại danh sách và trang
      setPlans(prev => {
        const newPlans = prev.filter(p => p.id !== deleteId);
        // Nếu trang hiện tại trống sau khi xóa và không phải trang 1, lùi lại 1 trang
        if (currentPage > 1 && newPlans.length <= (currentPage - 1) * itemsPerPage) {
            setCurrentPage(prevPage => prevPage - 1);
        }
        return newPlans;
      });

      handleCloseDeleteModal();
    } catch (err: any) {
      console.error('Error deleting plan:', err);
      setDeleteError(err.response?.data?.detail || err.message || 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive
      ? <span className="badge bg-success px-2 py-1">Hoạt động</span>
      : <span className="badge bg-secondary px-2 py-1">Vô hiệu</span>;
  };

  const renderPriceBadge = (price: number) => {
    if (price === 0) return <span className="badge bg-info text-dark px-2 py-1">Miễn phí</span>;
    return <strong>{price.toLocaleString('vi-VN')} ₫</strong>;
  };

  const activePlans = plans.filter(p => p.is_active).length;
  const freePlans = plans.filter(p => p.price === 0).length;
  const maxPrice = Math.max(...plans.map(p => p.price), 0);

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-4">

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <h1 className="h3 mb-1 text-dark fw-bold">
              <FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" />
              Quản lý Gói đăng bài
            </h1>
            <p className="text-muted mb-0 small">Tùy chỉnh các gói dịch vụ cho người dùng</p>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm d-flex align-items-center"
              onClick={loadAllData}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
            <button
              className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
              onClick={handleAddNewClick}
            >
              <FontAwesomeIcon icon={faPlus} className="me-1" />
              Thêm gói mới
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3">
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 opacity-75">Tổng số Gói</h6>
                    <h3 className="mb-0 fw-bold">{loading ? '...' : plans.length}</h3>
                  </div>
                  <FontAwesomeIcon icon={faBoxOpen} size="2x" className="opacity-50" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 opacity-75">Gói Hoạt động</h6>
                    <h3 className="mb-0 fw-bold">{loading ? '...' : activePlans}</h3>
                  </div>
                  <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 opacity-75">Gói Miễn phí</h6>
                    <h3 className="mb-0 fw-bold">{loading ? '...' : freePlans}</h3>
                  </div>
                  <i className="fas fa-gift opacity-50" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' }}>
              <div className="card-body text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h6 className="mb-1 opacity-75">Gói đắt nhất</h6>
                    <h3 className="mb-0 fw-bold">{loading ? '...' : `${maxPrice.toLocaleString('vi-VN')} ₫`}</h3>
                  </div>
                  <i className="fas fa-gem opacity-50" style={{ fontSize: '2rem' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card shadow-sm border-0 overflow-hidden">
          <div className="card-header bg-white py-3">
            <h5 className="mb-0 fw-semibold text-dark">Danh sách các Gói đăng bài</h5>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-gradient text-white" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}>
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Tên gói</th>
                    <th>Giá</th>
                    <th>Thời hạn</th>
                    <th>Video/ngày</th>
                    <th>Lưu trữ</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-center" style={{ width: '120px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={7}>
                          <div className="d-flex align-items-center p-3">
                            <div className="placeholder-glow w-100">
                              <div className="placeholder col-12 h-5 rounded"></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="text-center text-danger py-4">{error}</td>
                    </tr>
                  ) : plans.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-5 text-muted">
                        <div>
                          <FontAwesomeIcon icon={faBoxOpen} size="3x" className="mb-3 opacity-25" />
                          <p className="mb-1 fw-medium">Chưa có gói nào</p>
                          <small>Nhấn "Thêm gói mới" để bắt đầu</small>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // SỬ DỤNG currentPlans THAY VÌ plans ĐỂ HIỂN THỊ THEO TRANG
                    currentPlans.map((plan) => (
                      <tr key={plan.id} className={!plan.is_active ? 'opacity-75' : ''}>
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <div className="fw-semibold">{plan.name}</div>
                          {plan.description && <small className="text-muted d-block">{plan.description}</small>}
                        </td>
                        <td>{renderPriceBadge(plan.price)}</td>
                        <td><strong>{plan.duration_days}</strong> ngày</td>
                        <td><strong>{plan.max_videos_per_day}</strong></td>
                        <td><strong>{plan.storage_limit_gb} GB</strong></td>
                        <td className="text-center">{renderStatusBadge(plan.is_active)}</td>
                        <td>
                          <div className="btn-group btn-group-sm shadow-sm">
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleEditClick(plan)}
                              title="Sửa"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeleteClick(plan.id)}
                              title="Xóa"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PHẦN PHÂN TRANG (LUÔN HIỂN THỊ) */}
          <div className="card-footer bg-white d-flex flex-column flex-sm-row justify-content-between align-items-center py-3 gap-2">
             <div className="small text-muted">
                Hiển thị <strong>{plans.length > 0 ? indexOfFirstItem + 1 : 0}</strong> - <strong>{Math.min(indexOfLastItem, plans.length)}</strong> trong số <strong>{plans.length}</strong> gói
             </div>
             <nav>
                <ul className="pagination pagination-sm mb-0">
                   <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Trước</button>
                   </li>
                   
                   {/* Render số trang */}
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                         <button className="page-link" onClick={() => handlePageChange(page)}>{page}</button>
                      </li>
                   ))}

                   <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Sau</button>
                   </li>
                </ul>
             </nav>
          </div>

        </div>
      </div>

      {/* Modals */}
      {modalRoot && createPortal(
        <>
          {(showModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}

          {/* Modal Thêm/Sửa */}
          {showModal && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055 }}>
              <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-primary text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={faBoxOpen} className="me-2" />
                      {isEditMode ? 'Cập nhật Gói' : 'Thêm Gói mới'}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={handleCloseModal}
                      disabled={isSaving}
                    />
                  </div>
                  <form onSubmit={handleFormSubmit}>
                    <div className="modal-body">
                      {modalError && <div className="alert alert-danger mb-3">{modalError}</div>}
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label">Tên gói <span className="text-danger">*</span></label>
                          <input type="text" className="form-control" name="name" value={currentData.name} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Giá (VND) <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="price" value={currentData.price} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Mô tả</label>
                          <textarea className="form-control" name="description" rows={2} value={currentData.description || ''} onChange={handleFormChange} />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Thời hạn (ngày) <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="duration_days" value={currentData.duration_days} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Tài khoản MXH <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="max_social_accounts" value={currentData.max_social_accounts} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Video/ngày <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="max_videos_per_day" value={currentData.max_videos_per_day} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Lên lịch (ngày) <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="max_scheduled_days" value={currentData.max_scheduled_days} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Video lưu trữ <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="max_stored_videos" value={currentData.max_stored_videos} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label">Dung lượng (GB) <span className="text-danger">*</span></label>
                          <input type="number" className="form-control" name="storage_limit_gb" value={currentData.storage_limit_gb} onChange={handleFormChange} required />
                        </div>
                        <div className="col-12 d-flex gap-4 mt-4">
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" id="ai_content_generation" name="ai_content_generation" checked={currentData.ai_content_generation} onChange={handleFormChange} />
                            <label className="form-check-label" htmlFor="ai_content_generation">Tạo nội dung AI</label>
                          </div>
                          <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" id="is_active" name="is_active" checked={currentData.is_active} onChange={handleFormChange} />
                            <label className="form-check-label" htmlFor="is_active">Kích hoạt</label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer bg-light">
                      <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang lưu...
                          </>
                        ) : (
                          'Lưu thay đổi'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal Xóa */}
          {showDeleteModal && deleteId && (
            <div className="modal fade show d-block" tabIndex={-1} style={{ zIndex: 1055 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-danger text-white">
                    <h5 className="modal-title">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      Xác nhận xóa gói
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={handleCloseDeleteModal}
                      disabled={isDeleting}
                    />
                  </div>
                  <div className="modal-body">
                    {deleteError && <div className="alert alert-danger mb-3">{deleteError}</div>}
                    <div className="alert alert-warning">
                      <strong>Cảnh báo:</strong> Hành động này <strong>không thể hoàn tác</strong>.
                    </div>
                    {(() => {
                      const plan = plans.find(p => p.id === deleteId);
                      if (!plan) return null;
                      return (
                        <div className="bg-light p-3 rounded">
                          <div className="fw-bold">{plan.name}</div>
                          <div className="small text-muted">
                            {plan.price === 0 ? 'Miễn phí' : `${plan.price.toLocaleString('vi-VN')} ₫`} • {plan.duration_days} ngày
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="modal-footer bg-light">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>
                      Hủy
                    </button>
                    <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                      {isDeleting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang xóa...
                        </>
                      ) : (
                        'Xác nhận xóa'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>,
        modalRoot
      )}
    </>
  );
};

export default SubscriptionPlanPage;