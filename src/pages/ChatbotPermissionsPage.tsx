
// src/pages/ChatbotPermissionPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheck, faTimes, faTrash, faSpinner,
    faCrown, faClock, faUsers, faCheckCircle,
    faTimesCircle, faFilter, faSync, faCopy, faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import apiClient from '../lib/axios';

// --- ĐỊNH NGHĨA API (ĐÃ FIX LỖI 422) ---
const chatbotApi = {
    getAllSubscriptions: async () => {
        const res = await apiClient.get('/chatbot-subscriptions/admin/subscriptions');
        return res.data;
    },
    approveSubscription: async (id: string, notes: string | null) => {
        // FIX: Thêm trường "status": "approved" theo yêu cầu backend
        return await apiClient.post(`/chatbot-subscriptions/admin/subscriptions/${id}/approve`, {
            status: 'approved',
            notes: notes
        });
    },
    rejectSubscription: async (id: string, reason: string) => {
        // FIX: Thêm trường "status": "rejected" để đồng bộ
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

interface UserChatbotSubscription {
    id: string;
    user: { id: string; email: string; full_name: string } | null;
    plan: { id: string; name: string; price: number } | null;
    status: 'pending' | 'approved' | 'rejected';
    is_active: boolean;
    start_date: string;
    end_date: string;
    total_price: number;
    created_at: string;
}

const ChatbotPermissionPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<UserChatbotSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionNotes, setActionNotes] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // --- LOAD DATA ---
    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const res = await chatbotApi.getAllSubscriptions();
            
            let list = [];
            if (Array.isArray(res)) list = res;
            else if (res?.data && Array.isArray(res.data)) list = res.data;
            else if (res?.items && Array.isArray(res.items)) list = res.items;

            list.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            
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

    const stats = useMemo(() => ({
        total: subscriptions.length,
        pending: subscriptions.filter(s => s.status === 'pending').length,
        approved: subscriptions.filter(s => s.status === 'approved').length,
        rejected: subscriptions.filter(s => s.status === 'rejected').length,
        active: subscriptions.filter(s => s.is_active).length,
    }), [subscriptions]);

    // --- ACTIONS ---
    const handleActionClick = (id: string, type: 'approve' | 'reject', user: any) => {
        setActionId(id);
        setActionType(type);
        setSelectedUser(user);
        setActionNotes('');
        setShowActionModal(true);
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
            console.error(err);
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

    // --- RENDER ---
    const renderTable = () => {
        if (loading) return <tr><td colSpan={7} className="text-center py-5">Đang tải...</td></tr>;
        if (error) return <tr><td colSpan={7} className="text-center py-5 text-danger">{error}</td></tr>;
        if (paginatedSubscriptions.length === 0) return <tr><td colSpan={7} className="text-center py-5 text-muted">Không có dữ liệu</td></tr>;

        return paginatedSubscriptions.map(sub => (
            <tr key={sub.id} className={!sub.is_active ? 'opacity-75' : ''}>
                <td className="ps-4">
                    <div className="fw-bold">{sub.user?.full_name || 'No Name'}</div>
                    <div className="small text-muted">{sub.user?.email}</div>
                </td>
                <td><span className="badge bg-info text-dark">{sub.plan?.name}</span></td>
                <td className="text-success fw-bold">{(sub.total_price || 0).toLocaleString()} ₫</td>
                <td className="small">{new Date(sub.start_date).toLocaleDateString('vi-VN')}</td>
                <td>
                    {sub.status === 'pending' && <span className="badge bg-warning text-dark">Chờ duyệt</span>}
                    {sub.status === 'approved' && <span className="badge bg-success">Đã duyệt</span>}
                    {sub.status === 'rejected' && <span className="badge bg-danger">Từ chối</span>}
                </td>
                <td className="small">{new Date(sub.created_at).toLocaleDateString('vi-VN')}</td>
                <td>
                    <div className="btn-group btn-group-sm">
                        {sub.status === 'pending' && (
                            <>
                                <button className="btn btn-success" onClick={() => handleActionClick(sub.id, 'approve', sub.user)} disabled={!!actionLoading}><FontAwesomeIcon icon={faCheck} /></button>
                                <button className="btn btn-warning" onClick={() => handleActionClick(sub.id, 'reject', sub.user)} disabled={!!actionLoading}><FontAwesomeIcon icon={faTimes} /></button>
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
                <h1 className="h3 mb-0 text-dark fw-bold"><FontAwesomeIcon icon={faCrown} className="me-2 text-primary" />Quản lý Quyền Chatbot</h1>
                <button className="btn btn-primary btn-sm" onClick={loadSubscriptions}><FontAwesomeIcon icon={faSync} /> Làm mới</button>
            </div>

            {/* Stats */}
            <div className="row g-3 mb-4">
               <div className="col-md-3"><div className="card bg-primary text-white p-3"><h3>{stats.total}</h3><small>Tổng đăng ký</small></div></div>
               <div className="col-md-3"><div className="card bg-warning text-dark p-3"><h3>{stats.pending}</h3><small>Chờ duyệt</small></div></div>
               <div className="col-md-3"><div className="card bg-success text-white p-3"><h3>{stats.approved}</h3><small>Đã duyệt</small></div></div>
               <div className="col-md-3"><div className="card bg-danger text-white p-3"><h3>{stats.rejected}</h3><small>Từ chối</small></div></div>
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                {['pending', 'approved', 'rejected', 'all'].map((t: any) => (
                    <li className="nav-item" key={t}>
                        <button className={`nav-link ${activeTab === t ? 'active fw-bold' : ''}`} onClick={() => setActiveTab(t)}>
                            {t === 'all' ? 'Tất cả' : t === 'pending' ? 'Chờ duyệt' : t === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Table */}
            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th className="ps-4">User</th><th>Gói</th><th>Giá</th><th>Ngày bắt đầu</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>{renderTable()}</tbody>
                        </table>
                    </div>
                </div>
                {totalPages > 1 && <div className="card-footer bg-white py-3"><div className="d-flex justify-content-end"><button className="btn btn-sm btn-outline-secondary me-2" disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)}>Trước</button><span className="align-self-center mx-2">Trang {currentPage}/{totalPages}</span><button className="btn btn-sm btn-outline-secondary ms-2" disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)}>Sau</button></div></div>}
            </div>

            {/* Modals */}
            {createPortal(
                <>
                    {(showActionModal || showDeleteModal) && <div className="modal-backdrop fade show"></div>}
                    
                    {/* Action Modal */}
                    {showActionModal && (
                        <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">{actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'}</h5>
                                        <button className="btn-close" onClick={() => setShowActionModal(false)}></button>
                                    </div>
                                    <div className="modal-body">
                                        <p>Xác nhận {actionType === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu của <strong>{selectedUser?.email}</strong>?</p>
                                        <textarea className="form-control" placeholder="Ghi chú (tùy chọn)..." value={actionNotes} onChange={e => setActionNotes(e.target.value)}></textarea>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary" onClick={() => setShowActionModal(false)}>Hủy</button>
                                        <button className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`} onClick={handleConfirmAction} disabled={!!actionLoading}>
                                            {actionLoading ? 'Đang xử lý...' : 'Xác nhận'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Modal */}
                    {showDeleteModal && (
                        <div className="modal fade show d-block" tabIndex={-1} style={{zIndex: 1050}}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content">
                                    <div className="modal-header bg-danger text-white"><h5 className="modal-title">Xác nhận xóa</h5><button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button></div>
                                    <div className="modal-body"><p>Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa?</p></div>
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