import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import api from '../lib/axios';
import { UserSubscription } from '../types/userSubscription';

declare var bootstrap: any;

interface UserSubscriptionResponse {
  id: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  subscription_plan: {
    id: string;
    name: string;
    price: number;
  };
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
  
  const [filters, setFilters] = useState({ 
    package_type: '', 
    status: '', 
    page: 1, 
    limit: 10 
  });

  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  const fetchData = async (currentFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/user-subscriptions', {
        params: currentFilters
      });
      
      setRegistrations(response.data.items || response.data);
      setTotal(response.data.total || response.data.length);
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.response?.data?.detail || err.message || 'Không thể tải dữ liệu đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
  };

  const handleApplyFilters = () => {
    fetchData(filters);
  };
  
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const showToast = (message: string, type: 'success' | 'danger' = 'success') => {
    const id = `toast-${Date.now()}`;
    const toastHTML = `
      <div id="${id}" class="toast align-items-center text-bg-${type} border-0 position-fixed bottom-0 end-0 m-3" style="z-index: 9999;" role="alert">
        <div class="d-flex">
          <div class="toast-body">
            <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastEl = document.getElementById(id);
    if (toastEl && typeof bootstrap !== 'undefined') {
      const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
      bsToast.show();
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đăng ký của ${name}?`)) {
      try {
        await api.delete(`/admin/user-subscriptions/${id}`);
        fetchData(filters);
        showToast('Xóa đăng ký thành công!', 'success');
      } catch (err: any) {
        console.error('Error deleting subscription:', err);
        showToast(err.response?.data?.detail || err.message || 'Xóa thất bại', 'danger');
      }
    }
  };

  const getPackageBadge = (type: string | null | undefined) => {
    if (!type) return 'badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
    
    if (type.includes('Chatbot')) {
      return 'badge bg-primary-subtle text-primary-emphasis border border-primary-subtle';
    }
    if (type.includes('Autopost')) {
      return 'badge bg-success-subtle text-success-emphasis border border-success-subtle';
    }
    return 'badge bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle';
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="badge bg-danger-subtle text-danger">Hết hạn</span>;
    }
    
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning-subtle text-warning">Chờ duyệt</span>;
      case 'approved':
        return <span className="badge bg-success-subtle text-success">Đang hoạt động</span>;
      case 'rejected':
        return <span className="badge bg-danger-subtle text-danger">Từ chối</span>;
      default:
        return <span className="badge bg-secondary-subtle text-secondary">Không xác định</span>;
    }
  };

  const renderSubscriptionTable = () => {
    if (loading) {
      return <tr><td colSpan={5} className="text-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></td></tr>;
    }
    if (error) {
      return <tr><td colSpan={5} className="text-center py-4 text-danger">{error}</td></tr>;
    }
    if (registrations.length === 0) {
      return <tr><td colSpan={5} className="text-center py-5 text-muted"><i className="fa-solid fa-inbox fa-3x mb-3 d-block"></i><p>Không có dữ liệu.</p></td></tr>;
    }

    return registrations.map((sub) => (
      <tr key={sub.id}>
        <td data-label="Người dùng & Gói" className="align-middle" style={{minWidth: '250px', paddingLeft: '1.5rem'}}>
          <div className="d-flex flex-column">
            <strong className="text-nowrap">{sub.user?.full_name || sub.user?.email || 'N/A'}</strong>
            <small className="text-muted text-nowrap">{sub.user?.email || 'N/A'}</small>
          </div>
        </td>
        <td data-label="Loại gói" className="align-middle">
          <span className={getPackageBadge(sub.subscription_plan?.name)}>
            {sub.subscription_plan?.name || 'Gói không xác định'}
          </span>
        </td>
        <td data-label="Trạng thái" className="align-middle">
          {getStatusBadge(sub.status, sub.is_active)}
        </td>
        <td data-label="Thời gian" className="align-middle text-nowrap">
          {new Date(sub.start_date).toLocaleDateString('vi-VN')} - 
          {sub.end_date ? new Date(sub.end_date).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
        </td>
        <td data-label="Hành động" className="align-middle">
          <div className="d-flex gap-2">
            <button className="btn btn-action btn-edit" title="Sửa" disabled>
              <i className="fa-solid fa-pen-to-square"></i>
            </button>
            <button className="btn btn-action btn-delete" title="Xóa" onClick={() => handleDelete(sub.id, sub.user?.full_name || sub.id)}>
              <i className="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    ));
  };
  
  const totalPages = Math.ceil(total / filters.limit);
  const startItem = (filters.page - 1) * filters.limit + 1;
  const endItem = Math.min(filters.page * filters.limit, total);

  return (
    <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
      
      {/* Stats Cards Row */}
      <div className="row g-3 g-lg-4">
        <div className="col-6 col-lg-3">
          <StatCard title="Tổng đăng ký" value={loading ? '...' : total.toString()} colorType="primary" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Đang hoạt động" value={loading ? '...' : registrations.filter(s => s.is_active && s.status === 'approved').length.toString()} colorType="success" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Chờ duyệt" value={loading ? '...' : registrations.filter(s => s.status === 'pending').length.toString()} colorType="warning" />
        </div>
        <div className="col-6 col-lg-3">
          <StatCard title="Đã từ chối" value={loading ? '...' : registrations.filter(s => s.status === 'rejected').length.toString()} colorType="danger" />
        </div>
      </div>

      {/* Bộ lọc (Filters Container) */}
      <div className="table-card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h3 className="d-flex align-items-center gap-2">
            <i className="fa-solid fa-filter"></i>
            Bộ lọc đăng ký
          </h3>
          <button className="btn btn-sm btn-link">
            <i className="fa-solid fa-gear me-2"></i>Tùy chỉnh
          </button>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label htmlFor="package_type" className="form-label small">Loại gói</label>
              <select id="package_type" name="package_type" className="form-select form-select-sm" value={filters.package_type} onChange={handleFilterChange}>
                <option value="">Tất cả</option>
                <option value="Chatbot">Chatbot</option>
                <option value="Autopost">Đăng bài tự động</option>
                <option value="Video">Video</option>
              </select>
            </div>
            <div className="col-md-4">
              <label htmlFor="status" className="form-label small">Trạng thái</label>
              <select id="status" name="status" className="form-select form-select-sm" value={filters.status} onChange={handleFilterChange}>
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <button className="btn btn-sm btn-primary w-100" onClick={handleApplyFilters}>
                <i className="fa-solid fa-check me-2"></i>Áp dụng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="table-card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
          <h3>Danh sách đăng ký mới</h3>
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive services-table">
            <table className="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th scope="col" style={{paddingLeft: '1.5rem'}}>Người dùng & Gói</th>
                  <th scope="col">Loại gói</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col">Thời gian</th>
                  <th scope="col">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {renderSubscriptionTable()}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="card-footer bg-white d-flex flex-wrap flex-md-nowrap justify-content-center justify-content-md-between align-items-center py-3">
          <div className="pagination-info text-muted mb-2 mb-md-0" style={{fontSize: '0.9rem'}}>
            Hiển thị {registrations.length === 0 ? 0 : startItem}-{endItem} của {total} kết quả
          </div>
          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(filters.page - 1); }}>
                  <i className="fas fa-chevron-left"></i>
                </a>
              </li>
              {[...Array(totalPages)].map((_, index) => (
                <li key={index} className={`page-item ${filters.page === index + 1 ? 'active' : ''}`}>
                  <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(index + 1); }}>
                    {index + 1}
                  </a>
                </li>
              ))}
              <li className={`page-item ${filters.page === totalPages || totalPages === 0 ? 'disabled' : ''}`}>
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(filters.page + 1); }}>
                  <i className="fas fa-chevron-right"></i>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default NewRegistrationsPage;