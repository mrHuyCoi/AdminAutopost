// src/pages/NewRegistrationsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faExclamationTriangle,
  faSync, faBoxOpen, faClock, faBan,
  faFilter, faTrash, faRobot, faPaperPlane
} from '@fortawesome/free-solid-svg-icons';

// --- INTERFACES ---
interface UserSubscriptionResponse {
  id: string;
  user: { id: string; email: string; full_name: string } | null;
  subscription_plan: { id: string; name: string; price: number } | null;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const NewRegistrationsPage: React.FC = () => {
  // --- STATES ---
  // Dữ liệu gốc từ API
  const [allRegistrations, setAllRegistrations] = useState<UserSubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bộ lọc & Phân trang Client-side
  const [filterPackage, setFilterPackage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'delete'>('approve');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Gọi API lấy toàn bộ danh sách (hoặc trang 1 số lượng lớn)
      // Lưu ý: Không truyền params lọc vào đây để tránh lỗi backend không hỗ trợ
      const response = await api.get('/subscriptions/');
      const data = response.data;

      // Xử lý các dạng trả về khác nhau của API
      let items: UserSubscriptionResponse[] = [];
      if (Array.isArray(data)) {
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      }

      // Sắp xếp: Mới nhất lên đầu (dựa vào start_date)
      items.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

      setAllRegistrations(items);
    } catch (err: any) {
      console.error("Lỗi tải subscriptions:", err);
      const msg = err.response?.data?.detail || 'Không thể tải dữ liệu đăng ký.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. CLIENT-SIDE FILTERING & PAGINATION ---
  
  // Logic Lọc dữ liệu
  const filteredData = useMemo(() => {
    return allRegistrations.filter(item => {
      // Lọc theo trạng thái
      const matchStatus = filterStatus ? item.status === filterStatus : true;
      
      // Lọc theo gói (Tìm chuỗi trong tên gói)
      let matchPackage = true;
      if (filterPackage) {
        const planName = item.subscription_plan?.name?.toLowerCase() || '';
        if (filterPackage === 'Chatbot') {
            matchPackage = planName.includes('chatbot');
        } else if (filterPackage === 'Autopost') {
            matchPackage = planName.includes('autopost') || planName.includes('đăng bài');
        }
      }

      return matchStatus && matchPackage;
    });
  }, [allRegistrations, filterStatus, filterPackage]);

  // Reset về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterPackage]);

  // Logic Phân trang
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // --- 3. MODAL HANDLERS ---
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
  };

  const handleConfirm = async () => {
    if (!selectedId) return;
    setIsProcessing(true);

    try {
      if (modalAction === 'approve') {
        // API: POST /subscriptions/approve/{id}
        await api.post(`/subscriptions/approve/${selectedId}`);
        toast.success('Đã duyệt đăng ký thành công!');
        
        // Cập nhật state local
        setAllRegistrations(prev => prev.map(item => 
            item.id === selectedId ? { ...item, status: 'approved', is_active: true } : item
        ));
      } 
      else if (modalAction === 'reject') {
        // API: PUT /subscriptions/{id} -> payload { status: 'rejected' }
        await api.put(`/subscriptions/${selectedId}`, { status: 'rejected' });
        toast.success('Đã từ chối đăng ký!');

        setAllRegistrations(prev => prev.map(item => 
            item.id === selectedId ? { ...item, status: 'rejected', is_active: false } : item
        ));
      } 
      else if (modalAction === 'delete') {
        // API: DELETE /subscriptions/{id}
        await api.delete(`/subscriptions/${selectedId}`);
        toast.success('Đã xóa đăng ký!');

        setAllRegistrations(prev => prev.filter(item => item.id !== selectedId));
      }
      closeModal();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Thao tác thất bại');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- UI HELPERS ---
  const getPackageBadge = (name: string | undefined) => {
    if (!name) return <span className="badge bg-secondary">Không xác định</span>;
    const lower = name.toLowerCase();
    
    if (lower.includes('chatbot')) {
        return <span className="badge bg-primary px-2 py-1"><FontAwesomeIcon icon={faRobot} className="me-1"/>Chatbot</span>;
    }
    if (lower.includes('autopost') || lower.includes('đăng bài')) {
        return <span className="badge bg-info text-dark px-2 py-1"><FontAwesomeIcon icon={faPaperPlane} className="me-1"/>AutoPost</span>;
    }
    return <span className="badge bg-secondary px-2 py-1">{name}</span>;
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    // Ưu tiên check status trước
    if (status === 'rejected') return <span className="badge bg-danger px-2 py-1">Đã từ chối</span>;
    if (status === 'pending') return <span className="badge bg-warning text-dark px-2 py-1">Chờ duyệt</span>;
    
    // Nếu approved thì check active
    if (status === 'approved') {
        return isActive 
            ? <span className="badge bg-success px-2 py-1">Đang hoạt động</span>
            : <span className="badge bg-secondary px-2 py-1">Hết hạn/Hủy</span>;
    }
    return <span className="badge bg-secondary">N/A</span>;
  };

  // Tính toán Stats
  const stats = {
    total: allRegistrations.length,
    active: allRegistrations.filter(s => s.status === 'approved' && s.is_active).length,
    pending: allRegistrations.filter(s => s.status === 'pending').length,
    rejected: allRegistrations.filter(s => s.status === 'rejected').length,
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
          onClick={fetchData}
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
                <div><h6 className="mb-1 opacity-75">Tổng đăng ký</h6><h3 className="mb-0 fw-bold">{stats.total}</h3></div>
                <FontAwesomeIcon icon={faBoxOpen} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Đang hoạt động</h6><h3 className="mb-0 fw-bold">{stats.active}</h3></div>
                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Chờ duyệt</h6><h3 className="mb-0 fw-bold">{stats.pending}</h3></div>
                <FontAwesomeIcon icon={faClock} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Đã từ chối</h6><h3 className="mb-0 fw-bold">{stats.rejected}</h3></div>
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
            <FontAwesomeIcon icon={faFilter} className="text-primary" />
            Bộ lọc tìm kiếm
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small text-muted fw-medium">Loại gói dịch vụ</label>
              <select
                className="form-select form-select-sm"
                value={filterPackage}
                onChange={(e) => setFilterPackage(e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="Chatbot">Chatbot</option>
                <option value="Autopost">Đăng bài tự động</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small text-muted fw-medium">Trạng thái duyệt</label>
              <select
                className="form-select form-select-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">-- Tất cả --</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt (Hoạt động)</option>
                <option value="rejected">Đã từ chối</option>
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
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5}>
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
                    <td colSpan={5} className="text-center py-5 text-danger">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                      {error}
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <FontAwesomeIcon icon={faBoxOpen} size="3x" className="mb-3 opacity-25" />
                      <p className="mb-1 fw-medium">Không tìm thấy đăng ký nào</p>
                      <small>Thử thay đổi bộ lọc hoặc làm mới dữ liệu</small>
                    </td>
                  </tr>
                ) : (
                    paginatedData.map((sub) => (
                    <tr key={sub.id} className={!sub.is_active ? 'opacity-75' : ''}>
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3"
                            style={{
                              width: '40px', height: '40px',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                              fontSize: '0.9rem',
                            }}
                          >
                            {sub.user?.full_name?.charAt(0).toUpperCase() || <FontAwesomeIcon icon={faUser}/>}
                          </div>
                          <div>
                            <div className="fw-semibold">{sub.user?.full_name || 'Người dùng ẩn'}</div>
                            <div className="small text-muted">{sub.user?.email || 'Không có email'}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getPackageBadge(sub.subscription_plan?.name)}</td>
                      <td>{getStatusBadge(sub.status, sub.is_active)}</td>
                      <td className="small text-muted">
                        <div>Bắt đầu: {new Date(sub.start_date).toLocaleDateString('vi-VN')}</div>
                        {sub.end_date && <div>Kết thúc: {new Date(sub.end_date).toLocaleDateString('vi-VN')}</div>}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm shadow-sm">
                          {sub.status === 'pending' ? (
                            <>
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => openModal('approve', sub.id, sub.user?.full_name || '')}
                                title="Duyệt"
                              >
                                <FontAwesomeIcon icon={faCheckCircle} />
                              </button>
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={() => openModal('reject', sub.id, sub.user?.full_name || '')}
                                title="Từ chối"
                              >
                                <FontAwesomeIcon icon={faTimesCircle} />
                              </button>
                            </>
                          ) : (
                            // Placeholder button để giữ khoảng cách
                            <button className="btn btn-outline-secondary btn-sm" disabled style={{opacity: 0.3}}>
                               <FontAwesomeIcon icon={sub.status === 'approved' ? faCheckCircle : faTimesCircle} />
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => openModal('delete', sub.id, sub.user?.full_name || '')}
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

        {/* PAGINATION */}
        <div className="card-footer bg-white d-flex flex-column flex-sm-row justify-content-between align-items-center py-3 gap-2">
           <div className="small text-muted">
             Hiển thị <strong>{filteredData.length > 0 ? startIndex + 1 : 0}</strong> - <strong>{Math.min(startIndex + itemsPerPage, filteredData.length)}</strong> trong <strong>{filteredData.length}</strong> kết quả
           </div>
           <nav>
             <ul className="pagination pagination-sm mb-0">
               <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                 <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Trước</button>
               </li>
               
               {/* Render Pages */}
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

      {/* Confirmation Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }}>
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
                <button type="button" className="btn-close btn-close-white" onClick={closeModal} disabled={isProcessing} />
              </div>
              <div className="modal-body">
                <div className="alert alert-warning border-0 mb-3">
                  <strong>Cảnh báo:</strong> Hành động này <strong>không thể hoàn tác</strong>.
                </div>
                <p>Bạn có chắc chắn muốn <strong>{modalAction === 'approve' ? 'duyệt' : modalAction === 'reject' ? 'từ chối' : 'xóa'}</strong> đăng ký của:</p>
                <div className="bg-light p-3 rounded d-flex align-items-center">
                  <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold me-3"
                    style={{
                      width: '44px', height: '44px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    }}
                  >
                    {selectedUserName ? selectedUserName.charAt(0).toUpperCase() : <FontAwesomeIcon icon={faUser}/>}
                  </div>
                  <div>
                    <div className="fw-bold">{selectedUserName || 'Người dùng ẩn'}</div>
                    <div className="small text-muted">ID: {selectedId}</div>
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