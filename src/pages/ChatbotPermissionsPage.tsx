import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import StatCard from '../components/StatCard';
import { UserChatbotSubscription } from '../types/chatbot';
import { chatbotSubscriptionService } from '../services/chatbotSubscriptionService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrash, faSpinner, faCrown, faClock } from '@fortawesome/free-solid-svg-icons';

const modalRoot = document.getElementById('modal-root');

const ChatbotPermissionPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserChatbotSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    const subtitleElement = document.getElementById('pageSubtitle');
    if (titleElement) titleElement.innerText = 'Phân quyền Chatbot';
    if (subtitleElement) subtitleElement.innerText = 'Phê duyệt, từ chối hoặc thu hồi quyền truy cập chatbot';
    
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await chatbotSubscriptionService.getAllSubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setError(err.response?.data?.detail || err.message || 'Lỗi tải danh sách đăng ký');
    } finally {
      setLoading(false);
    }
  };
  
  const handleActionClick = (id: string, type: 'approve' | 'reject') => {
    setActionId(id);
    setActionType(type);
    setActionNotes('');
    setActionError(null);
    setShowActionModal(true);
  };
  
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleCloseModals = () => {
    if (isSaving || isDeleting) return;
    setShowActionModal(false);
    setShowDeleteModal(false);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionId || !actionType) return;
    
    setIsSaving(true);
    setActionError(null);
    
    try {
      let updatedSub: UserChatbotSubscription;
      if (actionType === 'approve') {
        updatedSub = await chatbotSubscriptionService.approveSubscription(actionId, actionNotes || null);
      } else {
        updatedSub = await chatbotSubscriptionService.rejectSubscription(actionId, actionNotes || null);
      }
      
      setSubscriptions(prev => prev.map(s => (s.id === actionId ? updatedSub : s)));
      handleCloseModals();
      
    } catch (err: any) {
      console.error('Error processing action:', err);
      setActionError(err.response?.data?.detail || err.message || 'Lỗi không xác định');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      await chatbotSubscriptionService.deleteSubscription(deleteId); 
      setSubscriptions(prev => prev.filter(s => s.id !== deleteId));
      handleCloseModals();
    } catch (err: any) {
      console.error('Error deleting subscription:', err);
      setDeleteError(err.response?.data?.detail || err.message || 'Lỗi khi xóa');
    } finally {
      setIsDeleting(false);
    }
  };
  
  const filteredSubscriptions = React.useMemo(() => {
    if (activeTab === 'all') {
      return subscriptions;
    }
    return subscriptions.filter(s => s.status === activeTab);
  }, [subscriptions, activeTab]);

  const renderSubscriptionTable = () => {
    if (loading) return <tr><td colSpan={6} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={6} className="text-center text-danger py-4">{error}</td></tr>;
    if (filteredSubscriptions.length === 0) return <tr><td colSpan={6} className="text-center py-5 text-muted">Không có dữ liệu cho mục này.</td></tr>;

    return filteredSubscriptions.map((sub) => (
      <tr key={sub.id}>
        <td data-label="Người dùng" className="align-middle" style={{ paddingLeft: '1.5rem' }}>
          <strong>{sub.user?.full_name || 'N/A'}</strong>
          <br />
          <small className="text-muted">{sub.user?.email}</small>
        </td>
        <td data-label="Gói" className="align-middle">
          <FontAwesomeIcon icon={faCrown} className="text-warning me-2" />
          {sub.plan.name}
        </td>
        <td data-label="Giá" className="align-middle">
          {(sub.total_price || 0).toLocaleString('vi-VN')} ₫
        </td>
        <td data-label="Thời hạn" className="align-middle">
          {new Date(sub.start_date).toLocaleDateString('vi-VN')} - {new Date(sub.end_date).toLocaleDateString('vi-VN')}
        </td>
        <td data-label="Trạng thái" className="align-middle">
          {sub.status === 'pending' && <span className="badge bg-warning-subtle text-warning">Chờ duyệt</span>}
          {sub.status === 'approved' && <span className="badge bg-success-subtle text-success">Đã duyệt</span>}
          {sub.status === 'rejected' && <span className="badge bg-danger-subtle text-danger">Từ chối</span>}
        </td>
        <td data-label="Thao tác" className="align-middle">
          {sub.status === 'pending' && (
            <>
              <button className="btn btn-sm btn-outline-success me-2" title="Phê duyệt" onClick={() => handleActionClick(sub.id, 'approve')}>
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button className="btn btn-sm btn-outline-warning" title="Từ chối" onClick={() => handleActionClick(sub.id, 'reject')}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </>
          )}
          {sub.status !== 'pending' && (
            <button className="btn btn-sm btn-outline-danger" title="Xóa" onClick={() => handleDeleteClick(sub.id)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
        </td>
      </tr>
    ));
  };

  const renderModals = () => {
    if (!modalRoot) return null;

    return createPortal(
      <>
        {(showActionModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}

        {/* Modal Phê duyệt/Từ chối */}
        {showActionModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleConfirmAction}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {actionType === 'approve' ? 'Phê duyệt Đăng ký' : 'Từ chối Đăng ký'}
                    </h5>
                    <button type="button" className="btn-close" onClick={handleCloseModals} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {actionError && <div className="alert alert-danger">{actionError}</div>}
                    <p>Bạn có chắc chắn muốn {actionType === 'approve' ? 'phê duyệt' : 'từ chối'} lượt đăng ký này?</p>
                    <div className="mb-3">
                      <label htmlFor="notes" className="form-label">Ghi chú (Tùy chọn)</label>
                      <textarea
                        className="form-control"
                        id="notes"
                        rows={3}
                        value={actionNotes}
                        onChange={(e) => setActionNotes(e.target.value)}
                        placeholder={actionType === 'reject' ? 'Lý do từ chối...' : 'Ghi chú nội bộ...'}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModals} disabled={isSaving}>Hủy</button>
                    <button type="submit" className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-warning'}`} disabled={isSaving}>
                      {isSaving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Xác nhận'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Xóa */}
        {showDeleteModal && (
          <div className="modal fade show" style={{ display: 'block', zIndex: 9999 }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header"><h5 className="modal-title">Xác nhận xóa</h5><button type="button" className="btn-close" onClick={handleCloseModals} disabled={isDeleting}></button></div>
                <div className="modal-body">
                  {deleteError && <div className="alert alert-danger">{deleteError}</div>}
                  <p>Bạn có chắc chắn muốn xóa lượt đăng ký này không?</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModals} disabled={isDeleting}>Hủy</button>
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

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        
        {/* Stats Row */}
        <div className="row g-3 g-lg-4">
          <div className="col-6 col-md-3"><StatCard title="Tổng đăng ký" value={loading ? '...' : subscriptions.length.toString()} colorType="primary" icon="fas fa-users" /></div>
          <div className="col-6 col-md-3"><StatCard title="Chờ phê duyệt" value={loading ? '...' : subscriptions.filter(s => s.status === 'pending').length.toString()} colorType="warning" icon="fas fa-clock" /></div>
          <div className="col-6 col-md-3"><StatCard title="Đã kích hoạt" value={loading ? '...' : subscriptions.filter(s => s.status === 'approved' && s.is_active).length.toString()} colorType="success" icon="fas fa-check-circle" /></div>
          <div className="col-6 col-md-3"><StatCard title="Đã từ chối" value={loading ? '...' : subscriptions.filter(s => s.status === 'rejected').length.toString()} colorType="danger" icon="fas fa-times-circle" /></div>
        </div>

        {/* Bảng Dữ liệu */}
        <div className="table-card">
          <div className="card-header p-0">
            {/* Tabs Navigation */}
            <ul className="nav page-tabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pending')} type="button"
                >
                  <FontAwesomeIcon icon={faClock} className="me-2" />
                  Chờ phê duyệt
                  <span className="badge rounded-pill bg-warning ms-2">
                    {loading ? '...' : subscriptions.filter(s => s.status === 'pending').length}
                  </span>
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'approved' ? 'active' : ''}`}
                  onClick={() => setActiveTab('approved')} type="button"
                >
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Đã phê duyệt
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')} type="button"
                >
                  Tất cả
                </button>
              </li>
            </ul>
          </div>
          
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Người dùng</th>
                    <th>Gói</th>
                    <th>Giá</th>
                    <th>Thời hạn</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {renderSubscriptionTable()}
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

export default ChatbotPermissionPage;