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

import {
    chatbotSubscriptionService,
    UserChatbotSubscription
} from '../services/chatbotSubscriptionService';

// Safe get modal root (SSR compatible)
const modalRoot = typeof document !== 'undefined' ? document.getElementById('modal-root') : null;

// Helper: Chuyển lỗi validate thành chuỗi
const getErrorMessage = (err: any): string => {
    const data = err?.response?.data;

    if (Array.isArray(data?.detail)) {
        return data.detail.map((e: any) => e.msg || 'Lỗi không xác định').join(', ');
    }

    if (typeof data?.detail === 'string') return data.detail;
    if (data?.message) return data.message;

    return 'Đã xảy ra lỗi. Vui lòng thử lại.';
};

const ChatbotPermissionPage: React.FC = () => {
    const [subscriptions, setSubscriptions] = useState<UserChatbotSubscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionNotes, setActionNotes] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<UserChatbotSubscription['user'] | null>(null);

    // FIX CHỖ NÀY: Dùng hook hoặc context để lấy ID của Admin hiện tại
    // Vui lòng thay thế chuỗi "FIX_ME_GET_CURRENT_ADMIN_ID" bằng ID thực tế của Admin đang đăng nhập.
    const currentAdminId: string | null = "FIX_ME_GET_CURRENT_ADMIN_ID";

    const loadSubscriptions = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await chatbotSubscriptionService.getAllSubscriptions();

            const list =
                Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data)
                        ? res.data
                        : [];

            setSubscriptions(list);
        } catch (err: any) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        loadSubscriptions();
    }, []);

    const handleActionClick = (
        id: string,
        type: 'approve' | 'reject',
        user: UserChatbotSubscription['user']
    ) => {
        if (!user || !user.email) {
            toast.error('Thông tin người dùng không hợp lệ');
            return;
        }

        setActionId(id);
        setActionType(type);
        setSelectedUser(user);
        setActionNotes('');
        setShowActionModal(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleCloseModals = () => {
        if (actionLoading) return;
        setShowActionModal(false);
        setShowDeleteModal(false);
        setActionId(null);
        setActionType(null);
        setDeleteId(null);
        setActionNotes('');
        setSelectedUser(null);
    };

    const handleConfirmAction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionId || !actionType || !selectedUser) return;
        
        // KIỂM TRA LỖI 422: Đảm bảo có Admin ID
        if (!currentAdminId || currentAdminId === "FIX_ME_GET_CURRENT_ADMIN_ID") {
             toast.error('Lỗi cấu hình: Không xác định được ID Admin hiện tại. Vui lòng kiểm tra lại');
             return;
        }


        const notes = actionNotes.trim();
        if (actionType === 'reject' && !notes) {
            toast.error('Vui lòng nhập lý do từ chối');
            return;
        }

        const loadingKey = `action-${actionId}`;
        setActionLoading(loadingKey);

        try {
            if (actionType === 'approve') {
                // ĐÃ SỬA: Truyền adminId vào hàm approveSubscription
                await chatbotSubscriptionService.approveSubscription(actionId, currentAdminId, notes || null);
                toast.success('Đã phê duyệt thành công');
            } else {
                // ĐÃ SỬA: Truyền adminId vào hàm rejectSubscription
                await chatbotSubscriptionService.rejectSubscription(actionId, currentAdminId, notes);
                toast.success('Đã từ chối đăng ký');
            }
            await loadSubscriptions();
            handleCloseModals();
        } catch (err: any) {
            const errorMessage = getErrorMessage(err);
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteId) return;
        const loadingKey = `delete-${deleteId}`;
        setActionLoading(loadingKey);

        try {
            await chatbotSubscriptionService.deleteSubscription(deleteId);
            toast.success('Đã xóa đăng ký');
            setSubscriptions(prev => prev.filter(s => s.id !== deleteId));
            handleCloseModals();
        } catch (err: any) {
            const errorMessage = getErrorMessage(err);
            toast.error(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredSubscriptions = useMemo(() => {
        if (activeTab === 'all') return subscriptions;
        return subscriptions.filter(s => s.status === activeTab);
    }, [subscriptions, activeTab]);

    const stats = useMemo(() => {
        const total = subscriptions.length;
        const pending = subscriptions.filter(s => s.status === 'pending').length;
        const approved = subscriptions.filter(s => s.status === 'approved').length;
        const rejected = subscriptions.filter(s => s.status === 'rejected').length;
        const active = subscriptions.filter(s => s.is_active).length;
        return { total, pending, approved, rejected, active };
    }, [subscriptions]);

    const renderSubscriptionTable = () => {
        if (loading) {
            return Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                    <td colSpan={7}>
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
                    <td colSpan={7} className="text-center py-5">
                        <div className="alert alert-danger d-inline-block">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                            {error}
                            <button
                                className="btn btn-sm btn-outline-danger ms-3"
                                onClick={loadSubscriptions}
                            >
                                <FontAwesomeIcon icon={faSync} /> Thử lại
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }

        if (filteredSubscriptions.length === 0) {
            return (
                <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                        <FontAwesomeIcon icon={faFilter} size="3x" className="mb-3 opacity-25" />
                        <p className="mb-1 fw-medium">Không có dữ liệu</p>
                        <small>Chưa có đăng ký nào ở trạng thái này</small>
                    </td>
                </tr>
            );
        }

        return filteredSubscriptions.map((sub) => (
            <tr key={sub.id} className={`transition-all ${!sub.is_active ? 'opacity-75' : ''}`}>
                <td className="ps-4 py-3">
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
                    <span className="badge bg-primary px-2 py-1">
                        <FontAwesomeIcon icon={faCrown} className="me-1" />
                        {sub.plan?.name || 'Gói không xác định'}
                    </span>
                </td>
                <td className="fw-semibold text-success">
                    {(sub.total_price || 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="small text-muted">
                    {new Date(sub.start_date).toLocaleDateString('vi-VN')}
                    <br />
                    → {new Date(sub.end_date).toLocaleDateString('vi-VN')}
                </td>
                <td>
                    {sub.status === 'pending' && (
                        <span className="badge bg-warning text-dark px-2 py-1">
                            <FontAwesomeIcon icon={faClock} /> Chờ duyệt
                        </span>
                    )}
                    {sub.status === 'approved' && sub.is_active && (
                        <span className="badge bg-success px-2 py-1">
                            <FontAwesomeIcon icon={faCheck} /> Hoạt động
                        </span>
                    )}
                    {sub.status === 'approved' && !sub.is_active && (
                        <span className="badge bg-secondary px-2 py-1">
                            <FontAwesomeIcon icon={faTimes} /> Hết hạn
                        </span>
                    )}
                    {sub.status === 'rejected' && (
                        <span className="badge bg-danger px-2 py-1">
                            <FontAwesomeIcon icon={faTimes} /> Từ chối
                        </span>
                    )}
                </td>
                <td className="small text-muted">
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                </td>
                <td>
                    <div className="btn-group btn-group-sm shadow-sm">
                        {sub.status === 'pending' && (
                            <>
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleActionClick(sub.id, 'approve', sub.user!)}
                                    title="Phê duyệt"
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === `action-${sub.id}` ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} />}
                                </button>
                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleActionClick(sub.id, 'reject', sub.user!)}
                                    title="Từ chối"
                                    disabled={!!actionLoading}
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </>
                        )}
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteClick(sub.id)}
                            title="Xóa"
                            disabled={!!actionLoading}
                        >
                            {actionLoading === `delete-${sub.id}` ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faTrash} />}
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div className="container-fluid px-4 py-3">
            {/* Header */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
                <div>
                    <h1 className="h3 mb-1 text-dark fw-bold d-flex align-items-center">
                        <FontAwesomeIcon icon={faCrown} className="me-2 text-primary" />
                        Quản lý Quyền Chatbot
                    </h1>
                    <p className="text-muted mb-0 small">Phê duyệt, từ chối và quản lý đăng ký sử dụng chatbot AI</p>
                </div>
                <button
                    className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
                    onClick={loadSubscriptions}
                    disabled={loading}
                >
                    <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
                    {loading ? 'Đang tải...' : 'Làm mới'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100 position-relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <div className="card-body text-white position-relative z-1">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 opacity-75">Tổng đăng ký</h6>
                                    <h3 className="mb-0 fw-bold">{stats.total}</h3>
                                </div>
                                <FontAwesomeIcon icon={faUsers} size="2x" className="opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100"
                        style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <div className="card-body text-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 opacity-75">Chờ duyệt</h6>
                                    <h3 className="mb-0 fw-bold">{stats.pending}</h3>
                                </div>
                                <FontAwesomeIcon icon={faClock} size="2x" className="opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100"
                        style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        <div className="card-body text-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 opacity-75">Đang hoạt động</h6>
                                    <h3 className="mb-0 fw-bold">{stats.active}</h3>
                                </div>
                                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-6 col-lg-3">
                    <div className="card border-0 shadow-sm h-100"
                        style={{ background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)' }}>
                        <div className="card-body text-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="mb-1 opacity-75">Đã từ chối</h6>
                                    <h3 className="mb-0 fw-bold">{stats.rejected}</h3>
                                </div>
                                <FontAwesomeIcon icon={faTimesCircle} size="2x" className="opacity-50" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs + Table */}
            <div className="card shadow-sm border-0 overflow-hidden">
                <div className="card-header bg-white p-3">
                    <ul className="nav nav-tabs card-header-tabs border-0 m-0">
                        {[
                            { key: 'pending', icon: faClock, label: 'Chờ duyệt', count: stats.pending, color: 'warning' },
                            { key: 'approved', icon: faCheck, label: 'Đã duyệt', count: stats.approved },
                            { key: 'rejected', icon: faTimes, label: 'Từ chối', count: stats.rejected, color: 'danger' },
                            { key: 'all', icon: faUsers, label: 'Tất cả', count: stats.total },
                        ].map(tab => (
                            <li key={tab.key} className="nav-item">
                                <button
                                    className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-3 transition-all ${
                                        activeTab === tab.key ? 'active bg-primary text-white' : 'text-muted'
                                        }`}
                                    onClick={() => setActiveTab(tab.key as any)}
                                    style={{ minWidth: '120px' }}
                                >
                                    <FontAwesomeIcon icon={tab.icon} />
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`badge ms-1 ${activeTab === tab.key ? 'bg-white text-primary' : `bg-${tab.color || 'secondary'} text-white`}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-gradient text-white" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}>
                                <tr>
                                    <th className="ps-4">Người dùng</th>
                                    <th>Gói</th>
                                    <th>Giá</th>
                                    <th>Thời hạn</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày tạo</th>
                                    <th className="text-center" style={{ width: '130px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderSubscriptionTable()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* === MODAL PORTAL === */}
            {modalRoot && createPortal(
                <>
                    {/* Backdrop */}
                    {(showActionModal || showDeleteModal) && (
                        <div className="modal-backdrop fade show" style={{ zIndex: 1040 }} />
                    )}

                    {/* Action Modal */}
                    {showActionModal && selectedUser && (
                        <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content shadow-lg">
                                    <form onSubmit={handleConfirmAction}>
                                        <div className={`modal-header ${actionType === 'approve' ? 'bg-success' : 'bg-warning'} text-white`}>
                                            <h5 className="modal-title">
                                                <FontAwesomeIcon icon={actionType === 'approve' ? faCheckCircle : faTimesCircle} className="me-2" />
                                                {actionType === 'approve' ? 'Phê duyệt đăng ký' : 'Từ chối đăng ký'}
                                            </h5>
                                            <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading} />
                                        </div>
                                        <div className="modal-body">
                                            <div className="alert alert-info d-flex justify-content-between align-items-center mb-3">
                                                <div>
                                                    <strong>Người dùng:</strong> {selectedUser.full_name || 'N/A'}
                                                    <span className="text-muted">({selectedUser.email})</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-info"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedUser.email);
                                                        toast.success('Đã sao chép email');
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faCopy} />
                                                </button>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label">
                                                    {actionType === 'reject' ? 'Lý do từ chối *' : 'Ghi chú (tùy chọn)'}
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    rows={4}
                                                    value={actionNotes}
                                                    onChange={(e) => setActionNotes(e.target.value)}
                                                    placeholder={actionType === 'reject' ? 'Bắt buộc nhập lý do...' : 'Ghi chú nội bộ...'}
                                                    required={actionType === 'reject'}
                                                    disabled={!!actionLoading}
                                                />
                                            </div>
                                        </div>
                                        <div className="modal-footer bg-light">
                                            <button type="button" className="btn btn-secondary" onClick={handleCloseModals} disabled={!!actionLoading}>
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-warning'}`}
                                                disabled={!!actionLoading || (actionType === 'reject' && !actionNotes.trim())}
                                            >
                                                {actionLoading ? (
                                                    <>Đang xử lý <FontAwesomeIcon icon={faSpinner} spin className="ms-2" /></>
                                                ) : (
                                                    actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delete Modal */}
                    {showDeleteModal && (
                        <div className="modal fade show d-block" style={{ zIndex: 1050 }} tabIndex={-1}>
                            <div className="modal-dialog modal-dialog-centered">
                                <div className="modal-content shadow-lg">
                                    <div className="modal-header bg-danger text-white">
                                        <h5 className="modal-title">
                                            <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                                            Xác nhận xóa
                                        </h5>
                                        <button type="button" className="btn-close btn-close-white" onClick={handleCloseModals} disabled={!!actionLoading} />
                                    </div>
                                    <div className="modal-body">
                                        <div className="alert alert-warning">
                                            <strong>Cảnh báo:</strong> Hành động này <strong>không thể hoàn tác</strong>.
                                        </div>
                                        <p>Bạn có chắc chắn muốn xóa đăng ký này?</p>
                                    </div>
                                    <div className="modal-footer bg-light">
                                        <button type="button" className="btn btn-secondary" onClick={handleCloseModals} disabled={!!actionLoading}>
                                            Hủy
                                        </button>
                                        <button type="button" className="btn btn-danger" onClick={handleConfirmDelete} disabled={!!actionLoading}>
                                            {actionLoading ? (
                                                <>Đang xóa <FontAwesomeIcon icon={faSpinner} spin className="ms-2" /></>
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
        </div>
    );
};

export default ChatbotPermissionPage;
