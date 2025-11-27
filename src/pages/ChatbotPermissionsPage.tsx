// src/pages/ChatbotPermissionPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faTimes, faTrash, faSpinner,
    faCrown, faClock, faUsers, faCheckCircle,
    faTimesCircle, faFilter, faSync, faCopy, 
    faExclamationTriangle, faEye, faMoneyBillWave, faCalendarAlt, faListUl
} from '@fortawesome/free-solid-svg-icons';
import apiClient from '../lib/axios';

// --- ĐỊNH NGHĨA API ---
const chatbotApi = {
    getAllSubscriptions: async () => {
        const res = await apiClient.get('/chatbot-subscriptions/admin/subscriptions');
        return res.data;
    },
    approveSubscription: async (id: string, notes: string | null) => {
        return await apiClient.post(`/chatbot-subscriptions/admin/subscriptions/${id}/approve`, {
            status: 'approved',
            notes: notes
        });
    },
    rejectSubscription: async (id: string, reason: string) => {
        return await apiClient.post(`/chatbot-subscriptions/admin/subscriptions/${id}/reject`, {
            status: 'rejected',
            reason: reason
        });
    },
    deleteSubscription: async (id: string) => {
        return await apiClient.delete(`/chatbot-subscriptions/admin/subscriptions/${id}`);
    }
};

const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;

// --- INTERFACES (Cập nhật theo JSON mới) ---
interface ChatbotService {
    id: string;
    name: string;
    description: string;
    base_price: number;
}

interface ChatbotPlan {
    id: string;
    name: string;
    description: string;
    monthly_price: number;
    services: ChatbotService[];
}

interface UserInfo {
    id: string;
    email: string;
    full_name: string;
    is_active: boolean;
}

interface UserChatbotSubscription {
    id: string;
    user_id: string;
    user: UserInfo;
    plan: ChatbotPlan;
    start_date: string;
    end_date: string;
    months_subscribed: number;
    total_price: number;
    is_active: boolean;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

const ChatbotPermissionPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<UserChatbotSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter & Pagination
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Loading Action State
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal States
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionNotes, setActionNotes] = useState<string>('');
    const [selectedSub, setSelectedSub] = useState<UserChatbotSubscription | null>(null);

    const [showDetailModal, setShowDetailModal] = useState(false); // Modal xem chi tiết

    // --- LOAD DATA ---
    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await chatbotApi.getAllSubscriptions();
            
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res?.data && Array.isArray(res.data)) list = res.data;
            
            // Sort: Pending lên đầu, sau đó đến mới nhất
            list.sort((a: any, b: any) => {
                if (a.status === 'pending' && b.status !== 'pending') return -1;
                if (a.status !== 'pending' && b.status === 'pending') return 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            
            setSubscriptions(list);
        } catch (err: any) {
            console.error("Lỗi tải data:", err);
            setError('Không tải được danh sách. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadSubscriptions(); }, []);
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

    // --- FILTER & PAGINATION ---
    const filteredSubscriptions = useMemo(() => {
        if (activeTab === 'all') return subscriptions;
        return subscriptions.filter(s => s.status === activeTab);
    }, [subscriptions, activeTab]);

    const totalPages = Math.max(1, Math.ceil(filteredSubscriptions.length / itemsPerPage));
    const paginatedSubscriptions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredSubscriptions.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredSubscriptions, currentPage, itemsPerPage]);

    // --- STATS ---
    const stats = useMemo(() => {
        const total = subscriptions.length;
        const pending = subscriptions.filter(s => s.status === 'pending').length;
        const approved = subscriptions.filter(s => s.status === 'approved').length;
        const rejected = subscriptions.filter(s => s.status === 'rejected').length;
        const revenue = subscriptions
            .filter(s => s.status === 'approved')
            .reduce((sum, s) => sum + (s.total_price || 0), 0);
        return { total, pending, approved, rejected, revenue };
    }, [subscriptions]);

    // --- ACTIONS ---
    const handleActionClick = (sub: UserChatbotSubscription, type: 'approve' | 'reject') => {
        setActionId(sub.id);
        setActionType(type);
        setSelectedSub(sub);
        setActionNotes('');
        setShowActionModal(true);
    };

    const handleDetailClick = (sub: UserChatbotSubscription) => {
        setSelectedSub(sub);
        setShowDetailModal(true);
    };

    const handleConfirmAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionId || !actionType) return;
        
        setActionLoading(`action-${actionId}`);
        try {
            if (actionType === 'approve') {
                await chatbotApi.approveSubscription(actionId, actionNotes);
                toast.success('Đã duyệt thành công!');
            } else {
                await chatbotApi.rejectSubscription(actionId, actionNotes);
                toast.success('Đã từ chối!');
            }
            await loadSubscriptions();
            setShowActionModal(false);
        } catch (err: any) {
            const msg = err?.response?.data?.detail 
                ? JSON.stringify(err.response.data.detail) 
                : 'Thao tác thất bại';
            toast.error(msg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        setActionLoading(`delete-${deleteId}`);
        try {
            await chatbotApi.deleteSubscription(deleteId);
            toast.success('Đã xóa!');
            setSubscriptions(prev => prev.filter(s => s.id !== deleteId));
            setShowDeleteModal(false);
        } catch (err: any) {
            toast.error('Xóa thất bại');
        } finally {
            setActionLoading(null);
        }
    };

    // --- FORMAT HELPERS ---
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    const formatDate = (dateStr: string) => dateStr ? new Date(dateStr).toLocaleDateString('vi-VN') : 'N/A';

    // --- RENDER TABLE ---
    const renderTable = () => {
        if (loading) return <tr><td colSpan={8} className="text-center py-5">Đang tải dữ liệu...</td></tr>;
        if (error) return <tr><td colSpan={8} className="text-center py-5 text-danger">{error}</td></tr>;
        if (paginatedSubscriptions.length === 0) return <tr><td colSpan={8} className="text-center py-5 text-muted">Không có dữ liệu</td></tr>;

        return paginatedSubscriptions.map(sub => (
            <tr key={sub.id} className={!sub.is_active && sub.status === 'approved' ? 'opacity-75 bg-light' : ''}>
                <td className="ps-4">
                    <div className="fw-bold">{sub.user?.full_name || 'Khách vãng lai'}</div>
                    <div className="small text-muted">{sub.user?.email}</div>
                </td>
                <td>
                    <div className="fw-semibold text-primary">{sub.plan?.name || 'Gói tùy chỉnh'}</div>
                    <div className="small text-muted">{sub.plan?.services?.length || 0} dịch vụ</div>
                </td>
                <td>
                    <div className="fw-bold text-success">{formatCurrency(sub.total_price)}</div>
                    <div className="small text-muted">{sub.months_subscribed} tháng</div>
                </td>
                <td className="small">
                    <div>{formatDate(sub.start_date)}</div>
                    <div>&rarr; {formatDate(sub.end_date)}</div>
                </td>
                <td>
                    {sub.status === 'pending' && <span className="badge bg-warning text-dark">Chờ duyệt</span>}
                    {sub.status === 'rejected' && <span className="badge bg-danger">Từ chối</span>}
                    {sub.status === 'approved' && (
                        sub.is_active 
                        ? <span className="badge bg-success">Đang hoạt động</span>
                        : <span className="badge bg-secondary">Hết hạn</span>
                    )}
                </td>
                <td className="text-center">
                    <div className="btn-group btn-group-sm">
                        <button className="btn btn-info text-white" onClick={() => handleDetailClick(sub)} title="Chi tiết"><FontAwesomeIcon icon={faEye} /></button>
                        {sub.status === 'pending' && (
                            <>
                                <button className="btn btn-success" onClick={() => handleActionClick(sub, 'approve')} disabled={!!actionLoading}><FontAwesomeIcon icon={faCheck} /></button>
                                <button className="btn btn-warning" onClick={() => handleActionClick(sub, 'reject')} disabled={!!actionLoading}><FontAwesomeIcon icon={faTimes} /></button>
                            </>
                        )}
                        <button className="btn btn-danger" onClick={() => {setDeleteId(sub.id); setShowDeleteModal(true)}} disabled={!!actionLoading}><FontAwesomeIcon icon={faTrash} /></button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="container-fluid px-4 py-3">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-0 text-dark fw-bold"><FontAwesomeIcon icon={faCrown} className="me-2 text-primary" />Quản lý Quyền Chatbot</h1>
                    <p className="text-muted small mb-0">Duyệt đăng ký và quản lý dịch vụ AI</p>
                </div>
                <button className="btn btn-primary btn-sm shadow-sm" onClick={loadSubscriptions}><FontAwesomeIcon icon={faSync} /> Làm mới</button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
               <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #667eea, #764ba2)'}}><div className="card-body text-white"><h3>{stats.total}</h3><small className="opacity-75">Tổng đơn</small></div></div></div>
               <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #f093fb, #f5576c)'}}><div className="card-body text-white"><h3>{stats.pending}</h3><small className="opacity-75">Chờ duyệt</small></div></div></div>
               <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #4facfe, #00f2fe)'}}><div className="card-body text-white"><h3>{stats.approved}</h3><small className="opacity-75">Đã duyệt</small></div></div></div>
               <div className="col-6 col-lg-3"><div className="card border-0 shadow-sm h-100" style={{background: 'linear-gradient(135deg, #43e97b, #38f9d7)'}}><div className="card-body text-dark"><h3>{formatCurrency(stats.revenue)}</h3><small className="opacity-75">Doanh thu dự kiến</small></div></div></div>
            </div>

            {/* Tabs */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white">
                    <ul className="nav nav-tabs card-header-tabs">
                        {['pending', 'approved', 'rejected', 'all'].map((t: any) => (
                            <li className="nav-item" key={t}>
                                <button className={`nav-link ${activeTab === t ? 'active fw-bold text-primary' : 'text-muted'}`} onClick={() => setActiveTab(t)}>
                                    {t === 'all' ? 'Tất cả' : t === 'pending' ? 'Chờ duyệt' : t === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                                    <span className="badge bg-light text-dark ms-2 border">{
                                        t === 'all' ? stats.total : t === 'pending' ? stats.pending : t === 'approved' ? stats.approved : stats.rejected
                                    }</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light text-secondary small text-uppercase">
                                <tr>
                                    <th className="ps-4">Khách hàng</th>
                                    <th>Gói đăng ký</th>
                                    <th>Giá trị</th>
                                    <th>Thời hạn</th>
                                    <th>Trạng thái</th>
                                    <th className="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>{renderTable()}</tbody>
                        </table>
                    </div>
                </div>
                {totalPages > 1 && <div className="card-footer bg-white py-3"><div className="d-flex justify-content-end gap-2"><button className="btn btn-sm btn-outline-secondary" disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)}>Trước</button><span className="align-self-center small">Trang {currentPage}/{totalPages}</span><button className="btn btn-sm btn-outline-secondary" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)}>Sau</button></div></div>}
            </div>

            {/* --- MODALS --- */}
            {createPortal(
                <>
                    {(showActionModal || showDeleteModal || showDetailModal) && <div className="modal-backdrop fade show" style={{zIndex: 1040}}></div>}
                    
                    {/* DETAIL MODAL */}
                    {showDetailModal && selectedSub && (
                        <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
                            <div className="modal-dialog modal-dialog-centered modal-lg">
                                <div className="modal-content shadow-lg">
                                    <div className="modal-header bg-info text-white">
                                        <h5 className="modal-title"><FontAwesomeIcon icon={faListUl} className="me-2"/>Chi tiết đăng ký</h5>
                                        <button className="btn-close btn-close-white" onClick={() => setShowDetailModal(false)}></button>
                                    </div>
                                    <div className="modal-body bg-light">
                                        {/* User & Plan Info */}
                                        <div className="row g-3 mb-4">
                                            <div className="col-md-6">
                                                <div className="card h-100 border-0 shadow-sm">
                                                    <div className="card-body">
                                                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Thông tin khách hàng</h6>
                                                        <div className="mb-2"><strong>Tên:</strong> {selectedSub.user.full_name}</div>
                                                        <div className="mb-2"><strong>Email:</strong> {selectedSub.user.email}</div>
                                                        <div><strong>ID:</strong> <code className="small">{selectedSub.user_id}</code></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card h-100 border-0 shadow-sm">
                                                    <div className="card-body">
                                                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Thông tin gói</h6>
                                                        <div className="mb-2"><strong>Gói:</strong> <span className="text-primary fw-bold">{selectedSub.plan.name}</span></div>
                                                        <div className="mb-2"><strong>Tổng tiền:</strong> <span className="text-success fw-bold">{formatCurrency(selectedSub.total_price)}</span> ({selectedSub.months_subscribed} tháng)</div>
                                                        <div><strong>Ngày tạo:</strong> {formatDate(selectedSub.created_at)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Services List */}
                                        <h6 className="fw-bold mb-3 ms-1">Dịch vụ bao gồm ({selectedSub.plan.services?.length || 0})</h6>
                                        <div className="list-group shadow-sm">
                                            {selectedSub.plan.services?.map((svc) => (
                                                <div key={svc.id} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-dark">{svc.name}</div>
                                                        <div className="small text-muted">{svc.description}</div>
                                                    </div>
                                                    <span className="badge bg-light text-secondary border">
                                                        {formatCurrency(svc.base_price)}
                                                    </span>
                                                </div>
                                            ))}
                                            {(!selectedSub.plan.services || selectedSub.plan.services.length === 0) && (
                                                <div className="p-3 text-center text-muted bg-white border rounded">Không có dịch vụ đi kèm</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setShowDetailModal(false)}>Đóng</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ACTION MODAL */}
                    {showActionModal && selectedSub && (
                        <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className={`modal-header text-white ${actionType === 'approve' ? 'bg-success' : 'bg-warning'}`}>
                                        <h5 className="modal-title">{actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'}</h5>
                                        <button className="btn-close btn-close-white" onClick={() => setShowActionModal(false)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <p>Bạn có chắc chắn muốn <strong>{actionType === 'approve' ? 'duyệt' : 'từ chối'}</strong> đơn hàng này?</p>
                                        <div className="alert alert-light border">
                                            <small>Khách hàng: <strong>{selectedSub.user.email}</strong></small><br/>
                                            <small>Gói: <strong>{selectedSub.plan.name}</strong></small>
                                        </div>
                                        <textarea className="form-control" placeholder={actionType === 'reject' ? "Lý do từ chối (bắt buộc)..." : "Ghi chú (tùy chọn)..."} value={actionNotes} onChange={e => setActionNotes(e.target.value)} rows={3}></textarea>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setShowActionModal(false)}>Hủy</button>
                                        <button className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-warning'}`} onClick={handleConfirmAction} disabled={!!actionLoading || (actionType === 'reject' && !actionNotes.trim())}>
                                            {actionLoading ? <><FontAwesomeIcon icon={faSpinner} spin className="me-2"/>Đang xử lý...</> : 'Xác nhận'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DELETE MODAL */}
                    {showDeleteModal && (
                        <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa</h5><button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button></div>
                                    <div className="modal-body">
                                        <div className="alert alert-warning"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2"/>Hành động này không thể hoàn tác.</div>
                                        <p>Bạn chắc chắn muốn xóa bản ghi đăng ký này?</p>
                                    </div>
                                    <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy</button><button className="btn btn-danger" onClick={handleConfirmDelete} disabled={!!actionLoading}>{actionLoading ? 'Đang xóa...' : 'Xóa ngay'}</button></div>
                                </div>
                            </div>
                        </div>
                    )}
                </>,
                modalRoot!
            )}
        </div>
    );
};

export default ChatbotPermissionPage;