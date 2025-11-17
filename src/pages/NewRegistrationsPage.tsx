// src/pages/NewRegistrationsPage.tsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faSync, faUser, faBoxOpen, faClock, faBan,
  faFilter,  // ĐÃ THÊM - FIX LỖI BOOT LỌC
  faTrash    // ĐÃ THÊM - FIX LỖI NÚT XÓA
} from '@fortawesome/free-solid-svg-icons';

interface UserSubscriptionResponse {
  id: string;
  user: { id: string; email: string; full_name: string };
  subscription_plan: { id: string; name: string; price: number };
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const NewRegistrationsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<UserSubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  const [filters, setFilters] = useState({
    package_type: '',
    status: '',
    page: 1,
    limit: 10,
  });

  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'delete'>('approve');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // === MAP PACKAGE TYPE ===
  const getPackageTypeParam = (name: string) => {
    if (!name) return '';
    const lower = name.toLowerCase();
    if (lower.includes('chatbot')) return 'Chatbot';
    if (lower.includes('autopost') || lower.includes('đăng bài')) return 'Autopost';
    return '';
  };

  // === FETCH DATA ===
  const fetchData = async (currentFilters: typeof filters) => {
    if (isFetching) return;
    setIsFetching(true);
    setLoading(true);
    setError(null);

    try {
      const params: any = { ...currentFilters };
      if (params.package_type) {
        params.package_type = getPackageTypeParam(params.package_type);
      }

      const response = await api.get('/subscriptions/', { params });
      const data = response.data;

      const items = Array.isArray(data) ? data : data.items || data.data || [];
      const totalCount = data.total ?? data.total_items ?? items.length;

      setRegistrations(items);
      setTotal(totalCount);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Không thể tải dữ liệu.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(filters), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // === FILTER CHANGE ===
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  // === PAGE CHANGE ===
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // === MODAL HANDLERS ===
  const openModal = (action: 'approve' | 'reject' | 'delete', id: string, name: string) => {
    setModalAction(action);
    setSelectedId(id);
    setSelectedUserName(name);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isProcessing) return;
    setShowModal(false);
    setSelectedId(null);
    setSelectedUserName('');
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    setIsProcessing(true);

    try {
      if (modalAction === 'approve') {
        await api.post(`/subscriptions/approve/${selectedId}`);
        toast.success('Đã duyệt thành công!');
      } else if (modalAction === 'reject') {
        await api.put(`/subscriptions/${selectedId}`, { status: 'rejected' });
        toast.success('Đã từ chối!');
      } else if (modalAction === 'delete') {
        await api.delete(`/subscriptions/${selectedId}`);
        toast.success('Đã xóa đăng ký!');
      }
      fetchData(filters);
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Thao tác thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  // === BADGES ===
  const getPackageBadge = (name: string | null | undefined) => {
    if (!name) return 'badge bg-secondary px-2 py-1';
    const lower = name.toLowerCase();
    if (lower.includes('chatbot')) return 'badge bg-primary px-2 py-1';
    if (lower.includes('autopost') || lower.includes('đăng bài')) return 'badge bg-success px-2 py-1';
    return 'badge bg-secondary px-2 py-1';
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <span className="badge bg-danger px-2 py-1">Hết hạn</span>;
    switch (status) {
      case 'pending': return <span className="badge bg-warning text-dark px-2 py-1">Chờ duyệt</span>;
      case 'approved': return <span className="badge bg-success px-2 py-1">Hoạt động</span>;
      case 'rejected': return <span className="badge bg-danger px-2 py-1">Từ chối</span>;
      default: return <span className="badge bg-secondary px-2 py-1">Không xác định</span>;
    }
  };

  // === RENDER TABLE ===
  const renderTable = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={5}>
            <div className="d-flex align-items-center p-3">
              <div className="placeholder-glow w-100">
                <div className="placeholder col-12 h-5 rounded"></div>
              </div>
            </div>
          </td>
        </tr>
      ));
    }

    if (error) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-5 text-danger">
            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
            {error}
          </td>
        </tr>
      );
    }

    if (registrations.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="text-center py-5 text-muted">
            <FontAwesomeIcon icon={faBoxOpen} size="3x" className="mb-3 opacity-25" />
            <p className="mb-1 fw-medium">Không có đăng ký nào</p>
            <small>Chưa có người dùng nào đăng ký gói dịch vụ</small>
          </td>
        </tr>
      );
    }

    return registrations.map((sub) => (
      <tr key={sub.id} className={!sub.is_active ? 'opacity-75' : ''}>
        <td className="ps-4">
          <div className="d-flex align-items-center">
            <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                fontSize: '0.9rem',
              }}
            >
              {sub.user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="fw-semibold">{sub.user?.full_name || 'Chưa có tên'}</div>
              <div className="small text-muted">{sub.user?.email || 'N/A'}</div>
            </div>
          </div>
        </td>
        <td>
          <span className={getPackageBadge(sub.subscription_plan?.name)}>
            {sub.subscription_plan?.name || 'Gói không xác định'}
          </span>
        </td>
        <td>{getStatusBadge(sub.status, sub.is_active)}</td>
        <td className="small text-muted">
          {new Date(sub.start_date).toLocaleDateString('vi-VN')}
          {sub.end_date && (
            <> → {new Date(sub.end_date).toLocaleDateString('vi-VN')}</>
          )}
        </td>
        <td>
          <div className="btn-group btn-group-sm shadow-sm">
            {sub.status === 'pending' ? (
              <>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => openModal('approve', sub.id, sub.user?.full_name || sub.user?.email || '')}
                  title="Duyệt"
                >
                  <FontAwesomeIcon icon={faCheckCircle} />
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => openModal('reject', sub.id, sub.user?.full_name || sub.user?.email || '')}
                  title="Từ chối"
                >
                  <FontAwesomeIcon icon={faTimesCircle} />
                </button>
              </>
            ) : (
              <button className="btn btn-secondary btn-sm" disabled>
                <FontAwesomeIcon icon={faCheckCircle} />
              </button>
            )}
            <button
              className="btn btn-danger btn-sm"
              onClick={() => openModal('delete', sub.id, sub.user?.full_name || sub.user?.email || '')}
              title="Xóa"
            >
              <FontAwesomeIcon icon={faTrash} />  {/* BÂY GIỜ SẼ KHÔNG LỖI */}
            </button>
          </div>
        </td>
      </tr>
    ));
  };

  // === PAGINATION ===
  const totalPages = Math.ceil(total / filters.limit);
  const startItem = total === 0 ? 0 : (filters.page - 1) * filters.limit + 1;
  const endItem = Math.min(filters.page * filters.limit, total);

  const getPageRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, filters.page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="col-12 main-content-right d-flex flex-column gap-4">

      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold">
            <FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary" />
            Đăng ký gói dịch vụ
          </h1>
          <p className="text-muted mb-0 small">Quản lý và duyệt đăng ký của người dùng</p>
        </div>
        <button
          className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
          onClick={() => fetchData(filters)}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="row g-3">
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 opacity-75">Tổng đăng ký</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : total}</h3>
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
                  <h6 className="mb-1 opacity-75">Đang hoạt động</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : registrations.filter(s => s.is_active && s.status === 'approved').length}</h3>
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
                  <h6 className="mb-1 opacity-75">Chờ duyệt</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : registrations.filter(s => s.status === 'pending').length}</h3>
                </div>
                <FontAwesomeIcon icon={faClock} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-1 opacity-75">Đã từ chối</h6>
                  <h3 className="mb-0 fw-bold">{loading ? '...' : registrations.filter(s => s.status === 'rejected').length}</h3>
                </div>
                <FontAwesomeIcon icon={faBan} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h6 className="mb-0 fw-semibold text-dark d-flex align-items-center gap-2">
            <FontAwesomeIcon icon={faFilter} className="text-primary" />  {/* BÂY GIỜ SẼ KHÔNG LỖI */}
            Bộ lọc
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small text-muted fw-medium">Loại gói</label>
              <select
                className="form-select form-select-sm"
                value={filters.package_type}
                onChange={handleFilterChange}
                name="package_type"
              >
                <option value="">Tất cả gói</option>
                <option value="Chatbot">Chatbot</option>
                <option value="Autopost">Đăng bài tự động</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted fw-medium">Trạng thái</label>
              <select
                className="form-select form-select-sm"
                value={filters.status}
                onChange={handleFilterChange}
                name="status"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-header bg-white py-3">
          <h5 className="mb-0 fw-semibold text-dark">Danh sách đăng ký</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-gradient text-white" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}>
                <tr>
                  <th className="ps-4">Người dùng</th>
                  <th>Gói dịch vụ</th>
                  <th>Trạng thái</th>
                  <th>Thời gian</th>
                  <th className="text-center" style={{ width: '140px' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {renderTable()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-center py-3 px-4 gap-3">
            <div className="text-muted small">
              Hiển thị <strong>{startItem}</strong> - <strong>{endItem}</strong> trong <strong>{total}</strong> đăng ký
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page === 1}>
                    Trước
                  </button>
                </li>
                {getPageRange().map(page => (
                  <li key={page} className={`page-item ${filters.page === page ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(page)}>
                      {page}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(filters.page + 1)} disabled={filters.page === totalPages}>
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className={`modal-header ${modalAction === 'delete' ? 'bg-danger' : modalAction === 'approve' ? 'bg-success' : 'bg-warning'} text-white`}>
                <h5 className="modal-title">
                  <FontAwesomeIcon
                    icon={modalAction === 'delete' ? faExclamationTriangle : modalAction === 'approve' ? faCheckCircle : faTimesCircle}
                    className="me-2"
                  />
                  {modalAction === 'approve' ? 'Duyệt đăng ký' : modalAction === 'reject' ? 'Từ chối đăng ký' : 'Xóa đăng ký'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeModal}
                  disabled={isProcessing}
                />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning border-0">
                  <strong>Cảnh báo:</strong> Hành động này <strong>không thể hoàn tác</strong>.
                </div>
                <p>Bạn có chắc chắn muốn <strong>{modalAction === 'approve' ? 'duyệt' : modalAction === 'reject' ? 'từ chối' : 'xóa'}</strong> đăng ký của:</p>
                <div className="bg-light p-3 rounded d-flex align-items-center">
                  <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3"
                    style={{
                      width: '44px',
                      height: '44px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      fontSize: '0.9rem',
                    }}
                  >
                    {selectedUserName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="fw-bold">{selectedUserName}</div>
                    <div className="small text-muted">
                      {registrations.find(r => r.id === selectedId)?.user?.email}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isProcessing}>
                  Hủy
                </button>
                <button
                  type="button"
                  className={`btn ${modalAction === 'delete' ? 'btn-danger' : modalAction === 'approve' ? 'btn-success' : 'btn-warning'}`}
                  onClick={handleConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Đang xử lý...
                    </>
                  ) : (
                    modalAction === 'approve' ? 'Duyệt' : modalAction === 'reject' ? 'Từ chối' : 'Xóa'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewRegistrationsPage;