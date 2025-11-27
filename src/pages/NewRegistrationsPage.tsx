
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
interface RegistrationItem {
  id: string;
  type: 'regular' | 'chatbot'; 
  user: { id: string; email: string; full_name: string } | null;
  plan_name: string;
  price: number;
  is_active: boolean;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'approved' | 'rejected';
}

const NewRegistrationsPage: React.FC = () => {
  const [data, setData] = useState<RegistrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<{ regular: string | null; chatbot: string | null }>({ regular: null, chatbot: null });

  // Filter States
  const [filterType, setFilterType] = useState('all'); 
  const [filterStatus, setFilterStatus] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [actionItem, setActionItem] = useState<RegistrationItem | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'delete'>('approve');
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FETCH DATA (GỘP 2 NGUỒN) ---
  const fetchData = async () => {
    setLoading(true);
    setApiError({ regular: null, chatbot: null });
    
    try {
      // 1. Gọi API Gói Thường (Autopost)
      const regularPromise = api.get('/subscriptions/')
        .then(res => ({ success: true, data: res.data }))
        .catch(err => ({ success: false, error: err }));

      // 2. Gọi API Gói Chatbot
      const chatbotPromise = api.get('/chatbot-subscriptions/admin/subscriptions')
        .then(res => ({ success: true, data: res.data }))
        .catch(err => ({ success: false, error: err }));

      const [regResult, chatResult] = await Promise.all([regularPromise, chatbotPromise]);

      let merged: RegistrationItem[] = [];

      // --- XỬ LÝ DỮ LIỆU GÓI THƯỜNG ---
      if (regResult.success) {
        const raw = regResult.data;
        const list = Array.isArray(raw) ? raw : (raw.data || raw.items || []);
        
        const normalized = list.map((item: any) => {
          // Logic suy luận status nếu thiếu
          let derivedStatus = item.status;
          if (!derivedStatus) {
             derivedStatus = item.is_active ? 'approved' : 'pending';
          }

          return {
            id: item.id,
            type: 'regular',
            user: item.user,
            plan_name: item.subscription_plan?.name || 'Gói thường',
            price: item.subscription_plan?.price || 0,
            is_active: item.is_active,
            status: derivedStatus,
            start_date: item.start_date,
            end_date: item.end_date
          };
        });
        merged = [...merged, ...normalized];
      } else {
        console.error("Lỗi API Regular:", regResult.error);
        setApiError(prev => ({ ...prev, regular: 'Lỗi tải Gói thường' }));
      }

      // --- XỬ LÝ DỮ LIỆU GÓI CHATBOT ---
      if (chatResult.success) {
        const raw = chatResult.data;
        const list = Array.isArray(raw) ? raw : (raw.data || raw.items || []);
        
        const normalized = list.map((item: any) => ({
          id: item.id,
          type: 'chatbot',
          user: item.user,
          plan_name: item.plan?.name || 'Gói Chatbot',
          price: item.plan?.price || 0,
          is_active: item.is_active,
          status: item.status || 'pending',
          start_date: item.start_date,
          end_date: item.end_date
        }));
        merged = [...merged, ...normalized];
      } else {
        console.error("Lỗi API Chatbot:", chatResult.error);
        setApiError(prev => ({ ...prev, chatbot: 'Lỗi tải Gói Chatbot' }));
      }

      // Sắp xếp: Mới nhất lên đầu
      merged.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setData(merged);

    } catch (err) {
      toast.error('Lỗi hệ thống khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FILTER & PAGINATION ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [data, filterType, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // --- ACTIONS (ĐÃ FIX LỖI CITE_START) ---
  const handleAction = async () => {
    if (!actionItem) return;
    setIsProcessing(true);
    try {
      const { id, type } = actionItem;
      let url = '';
      let body: any = {};

      if (type === 'regular') {
        // --- API Gói Thường ---
        if (actionType === 'approve') {
            url = `/subscriptions/approve/${id}`;
        }
        else if (actionType === 'reject') {
            url = `/subscriptions/${id}`; 
            body = { status: 'rejected' };
        }
        else if (actionType === 'delete') {
            url = `/subscriptions/${id}`;
        }
      } else {
        // --- API Gói Chatbot ---
        if (actionType === 'approve') {
            url = `/chatbot-subscriptions/admin/subscriptions/${id}/approve`;
            body = { status: 'approved' }; 
        }
        else if (actionType === 'reject') {
            url = `/chatbot-subscriptions/admin/subscriptions/${id}/reject`;
            body = { status: 'rejected', reason: 'Admin rejected' };
        }
        else if (actionType === 'delete') {
            url = `/chatbot-subscriptions/admin/subscriptions/${id}`;
        }
      }

      // Thực thi Request
      if (actionType === 'delete') {
          await api.delete(url);
      } else if (type === 'regular' && actionType === 'approve') {
          await api.post(url); 
      } else if (type === 'regular' && actionType === 'reject') {
          await api.put(url, body); 
      } else {
          // Gói chatbot dùng POST cho cả approve/reject
          await api.post(url, body); 
      }

      toast.success('Thao tác thành công!');
      fetchData(); // Reload dữ liệu
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail 
        ? JSON.stringify(err.response.data.detail) 
        : err.message;
      toast.error('Lỗi: ' + msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (item: RegistrationItem, action: 'approve' | 'reject' | 'delete') => {
    setActionItem(item);
    setActionType(action);
    setShowModal(true);
  };

  // --- UI ---
  const stats = useMemo(() => ({
    total: data.length,
    active: data.filter(i => i.is_active).length,
    pending: data.filter(i => i.status === 'pending').length,
    rejected: data.filter(i => i.status === 'rejected').length
  }), [data]);

  return (
    <div className="col-12 main-content-right d-flex flex-column gap-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
            <h1 className="h3 mb-1 fw-bold"><FontAwesomeIcon icon={faBoxOpen} className="me-2 text-primary"/>Đăng ký & Phê duyệt</h1>
            <small className="text-muted">Quản lý tất cả đăng ký gói Autopost và Chatbot</small>
        </div>
        <button className="btn btn-primary btn-sm" onClick={fetchData}><FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''}/> Làm mới</button>
      </div>

      {/* Error Messages */}
      {(apiError.regular || apiError.chatbot) && (
        <div className="alert alert-warning border-0 shadow-sm">
            <h6 className="fw-bold"><FontAwesomeIcon icon={faExclamationTriangle}/> Cảnh báo hệ thống:</h6>
            <ul className="mb-0">
                {apiError.regular && <li><strong>Gói thường:</strong> {apiError.regular}</li>}
                {apiError.chatbot && <li><strong>Chatbot:</strong> {apiError.chatbot}</li>}
            </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="row g-3">
        <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100 bg-primary text-white"><div className="card-body"><h6>Tổng số</h6><h3>{stats.total}</h3></div></div></div>
        <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100 bg-warning text-dark"><div className="card-body"><h6>Chờ duyệt</h6><h3>{stats.pending}</h3></div></div></div>
        <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100 bg-success text-white"><div className="card-body"><h6>Hoạt động</h6><h3>{stats.active}</h3></div></div></div>
        <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100 bg-danger text-white"><div className="card-body"><h6>Từ chối</h6><h3>{stats.rejected}</h3></div></div></div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm border-0 p-3">
        <div className="row g-3">
            <div className="col-md-4">
                <select className="form-select" value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
                    <option value="all">Tất cả loại gói</option>
                    <option value="regular">AutoPost (Đăng bài)</option>
                    <option value="chatbot">Chatbot AI</option>
                </select>
            </div>
            <div className="col-md-4">
                <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="pending">Chờ duyệt</option>
                    <option value="approved">Đã duyệt</option>
                    <option value="rejected">Đã từ chối</option>
                </select>
            </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                    <tr>
                        <th className="ps-4">User</th><th>Loại</th><th>Gói</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? <tr><td colSpan={6} className="text-center py-4">Đang tải dữ liệu...</td></tr> : 
                     paginatedData.length === 0 ? <tr><td colSpan={6} className="text-center py-4 text-muted">Không có dữ liệu</td></tr> :
                     paginatedData.map(item => (
                        <tr key={item.id + item.type} className={!item.is_active ? 'opacity-75' : ''}>
                            <td className="ps-4">
                                <div className="fw-bold">{item.user?.full_name || 'No Name'}</div>
                                <div className="small text-muted">{item.user?.email}</div>
                            </td>
                            <td>
                                {item.type === 'chatbot' 
                                    ? <span className="badge bg-primary"><FontAwesomeIcon icon={faRobot} className="me-1"/>Chatbot</span>
                                    : <span className="badge bg-info text-dark"><FontAwesomeIcon icon={faPaperPlane} className="me-1"/>AutoPost</span>
                                }
                            </td>
                            <td>{item.plan_name}</td>
                            <td>
                                {item.status === 'pending' && <span className="badge bg-warning text-dark">Chờ duyệt</span>}
                                {item.status === 'approved' && <span className="badge bg-success">Hoạt động</span>}
                                {item.status === 'rejected' && <span className="badge bg-danger">Từ chối</span>}
                            </td>
                            <td className="small">{new Date(item.start_date).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <div className="btn-group btn-group-sm">
                                    {item.status === 'pending' && (
                                        <>
                                            <button className="btn btn-success" onClick={() => openModal(item, 'approve')} title="Duyệt"><FontAwesomeIcon icon={faCheckCircle}/></button>
                                            <button className="btn btn-warning" onClick={() => openModal(item, 'reject')} title="Từ chối"><FontAwesomeIcon icon={faTimesCircle}/></button>
                                        </>
                                    )}
                                    <button className="btn btn-danger" onClick={() => openModal(item, 'delete')} title="Xóa"><FontAwesomeIcon icon={faTrash}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {/* Pagination UI */}
        {totalPages > 1 && (
            <div className="card-footer bg-white d-flex justify-content-end py-3">
                <nav>
                    <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Trước</button>
                        </li>
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
        )}
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060}}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title text-capitalize">{actionType === 'approve' ? 'Duyệt' : actionType === 'reject' ? 'Từ chối' : 'Xóa'} đăng ký</h5>
                        <button className="btn-close" onClick={() => setShowModal(false)}></button>
                    </div>
                    <div className="modal-body">
                        <p>Bạn chắc chắn muốn thực hiện hành động này với <strong>{actionItem?.user?.email}</strong>?</p>
                        <div className="alert alert-light border">
                            <small>Gói: {actionItem?.plan_name} ({actionItem?.type === 'chatbot' ? 'Chatbot' : 'AutoPost'})</small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Hủy</button>
                        <button className={`btn ${actionType === 'delete' ? 'btn-danger' : 'btn-primary'}`} onClick={handleAction} disabled={isProcessing}>
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận'}
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