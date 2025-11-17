// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit, faTrash, faEye, faBan,
  faCheckCircle, faSearch, faFilter, faSync,
  faUserShield, faExclamationTriangle, faTimes, faUser
} from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  phone?: string;
  avatar_url?: string;
}

interface UserUpdatePayload {
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  phone?: string | null;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'moderator'>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const usersPerPage = 10;

  const loadUsers = useCallback(async (page: number, search: string, status: string, role: string) => {
    try {
      setLoading(true);
      const params: any = { 
        page, 
        limit: usersPerPage 
      };
      
      if (search.trim()) params.search = search.trim();
      if (status !== 'all') params.is_active = status === 'active';
      if (role !== 'all') params.role = role;

      const response = await api.get('/admin/users', { params });
      const data = response.data;

      let items: User[] = [];
      let total = 0;

      if (Array.isArray(data)) {
        items = data;
        total = data.length;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
        total = data.total || data.items.length;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
        total = data.total || data.data.length;
      } else {
        items = Object.values(data).find(Array.isArray) as User[] || [];
        total = items.length;
      }

      setUsers(items);
      setTotalItems(total);
      setCurrentPage(page);
      
      setSelectedUsers(prev => 
        prev.filter(id => items.some(user => user.id === id))
      );
      
    } catch (error: any) {
      console.error('Lỗi tải users:', error);
      const errorMessage = error?.response?.data?.detail 
        || error?.response?.data?.message 
        || 'Không thể tải dữ liệu người dùng';
      toast.error(errorMessage);
      setUsers([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }, [usersPerPage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers(1, searchTerm, statusFilter, roleFilter);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, roleFilter, loadUsers]);

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    const userToToggle = users.find(u => u.id === userId);
    if (!userToToggle) {
      toast.error('Lỗi: Không tìm thấy người dùng.');
      return;
    }

    try {
      setActionLoading(`status-${userId}`);
      const payload: UserUpdatePayload = {
        email: userToToggle.email,
        full_name: userToToggle.full_name,
        role: userToToggle.role,
        phone: userToToggle.phone || null,
        is_active: !currentStatus
      };
      
      await api.put(`/admin/users/${userId}`, payload);
      toast.success(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`);
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, is_active: !currentStatus }
            : user
        )
      );
    } catch (error: any) {
      console.error('Lỗi cập nhật trạng thái:', error);
      const errorMessage = error?.response?.data?.detail 
        || error?.response?.data?.message 
        || 'Lỗi cập nhật trạng thái người dùng';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setActionLoading(`delete-${userToDelete}`);
      await api.delete(`/admin/users/${userToDelete}`);
      toast.success('Xóa người dùng thành công');
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete));
      setSelectedUsers(prev => prev.filter(id => id !== userToDelete));
      loadUsers(currentPage, searchTerm, statusFilter, roleFilter); 
    } catch (error: any) {
      console.error('Lỗi xóa user:', error);
      const errorData = error?.response?.data;
      const errorMessage = errorData?.detail 
        || errorData?.message 
        || 'Lỗi xóa người dùng';
      
      if (errorMessage.includes('foreign key') || errorMessage.includes('constraint')) {
        toast.error(
          <div className="text-center">
            <div className="mb-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-warning me-2" />
              <strong>Không thể xóa người dùng!</strong>
            </div>
            <div className="mb-2">
              <small>Người dùng này có dữ liệu liên quan trong hệ thống.</small>
            </div>
          </div>,
          { duration: 5000 }
        );
      } else {
        toast.error(`❌ ${errorMessage}`);
        loadUsers(currentPage, searchTerm, statusFilter, roleFilter);
      }
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleBulkAction = async (action: 'active' | 'inactive' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    const actionText = {
      'delete': 'xóa',
      'active': 'kích hoạt', 
      'inactive': 'vô hiệu hóa'
    }[action];

    const confirmMessage = `Bạn có chắc chắn muốn ${actionText} ${selectedUsers.length} người dùng đã chọn?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      setActionLoading('bulk');
      const results = await Promise.allSettled(
        selectedUsers.map(async (userId) => {
          try {
            if (action === 'delete') {
              await api.delete(`/admin/users/${userId}`);
            } else {
              const userToToggle = users.find(u => u.id === userId);
              if (!userToToggle) throw new Error('Không tìm thấy user');
              const payload: UserUpdatePayload = {
                email: userToToggle.email,
                full_name: userToToggle.full_name,
                role: userToToggle.role,
                phone: userToToggle.phone || null,
                is_active: action === 'active'
              };
              await api.put(`/admin/users/${userId}`, payload);
            }
            return { userId, success: true };
          } catch (error: any) {
            const errorData = error?.response?.data;
            const errorMessage = errorData?.detail || errorData?.message || 'Lỗi không xác định';
            return { userId, success: false, error: errorMessage };
          }
        })
      );

      const successfulIds: string[] = [];
      const failedItems: {userId: string, error: string}[] = [];

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          const { userId, success, error } = result.value;
          if (success) {
            successfulIds.push(userId);
          } else {
            failedItems.push({ userId, error: error || 'Lỗi không xác định' });
          }
        }
      });

      if (action === 'delete') {
        setUsers(prevUsers => 
          prevUsers.filter(user => !successfulIds.includes(user.id))
        );
      } else {
        const newStatus = action === 'active';
        setUsers(prevUsers => 
          prevUsers.map(user => 
            successfulIds.includes(user.id) 
              ? { ...user, is_active: newStatus }
              : user
          )
        );
      }

      setSelectedUsers(prev => 
        prev.filter(id => !successfulIds.includes(id))
      );

      if (failedItems.length === 0) {
        toast.success(`Đã ${actionText} thành công ${selectedUsers.length} người dùng`);
      } else {
        let message = `Đã ${actionText} thành công ${successfulIds.length}/${selectedUsers.length} người dùng`;
        if (failedItems.length > 0) {
          message += ` - ${failedItems.length} lỗi`;
          console.warn('Các user xử lý thất bại:', failedItems);
          toast.error(`Có ${failedItems.length} lỗi khi thực hiện hành động`);
        }
        toast.success(message);
      }

      loadUsers(currentPage, searchTerm, statusFilter, roleFilter);

    } catch (error) {
      console.error('Lỗi thực hiện hành động hàng loạt:', error);
      toast.error('Có lỗi xảy ra khi thực hiện hành động hàng loạt');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (users.length === 0) return;
    const allSelectedOnPage = users.every(user => selectedUsers.includes(user.id));
    if (allSelectedOnPage) {
      setSelectedUsers(prev => 
        prev.filter(id => !users.some(user => user.id === id))
      );
    } else {
      const allUserIds = users.map(user => user.id);
      setSelectedUsers(prev => 
        [...new Set([...prev, ...allUserIds])]
      );
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));

  const paginate = (pageNumber: number) => {
    const page = Math.max(1, Math.min(totalPages, pageNumber));
    setCurrentPage(page);
    loadUsers(page, searchTerm, statusFilter, roleFilter);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderStatusBadge = (isActive: boolean) => {
    return isActive
      ? <span className="badge bg-success px-2 py-1">Đang hoạt động</span>
      : <span className="badge bg-secondary px-2 py-1">Đã vô hiệu hóa</span>;
  };

  const renderRoleBadge = (role: string) => {
    const roleConfig = {
      'admin': { class: 'bg-danger', text: 'Quản trị viên' },
      'moderator': { class: 'bg-warning text-dark', text: 'Điều hành viên' },
      'user': { class: 'bg-info text-dark', text: 'Người dùng' }
    };
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    return <span className={`badge ${config.class} px-2 py-1`}>{config.text}</span>;
  };

  const activeCountOnPage = users.filter(user => user.is_active).length;
  const inactiveCountOnPage = users.length - activeCountOnPage;

  const getPageRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="container-fluid px-4 py-3">
      <div className="row">
        <div className="col-12">
          {/* Header */}
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
            <div>
              <h1 className="h3 mb-1 text-dark fw-bold">
                <FontAwesomeIcon icon={faUserShield} className="me-2 text-primary" />
                Quản lý người dùng
              </h1>
              <p className="text-muted mb-0 small">Theo dõi và quản lý toàn bộ người dùng hệ thống</p>
            </div>
            <div className="d-flex gap-2">
              {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
                <button
                  className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                  onClick={handleClearFilters}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Xóa lọc
                </button>
              )}
              <button
                className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
                onClick={() => loadUsers(currentPage, searchTerm, statusFilter, roleFilter)}
                disabled={loading}
              >
                <FontAwesomeIcon
                  icon={faSync}
                  className={`me-1 ${loading ? 'fa-spin' : ''}`}
                />
                {loading ? 'Đang tải...' : 'Làm mới'}
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="card shadow-sm border-0 mb-4 overflow-hidden">
            <div className="card-header bg-white border-0 py-3">
              <h6 className="mb-0 fw-semibold text-dark">
                <FontAwesomeIcon icon={faFilter} className="me-2 text-primary" />
                Bộ lọc & Tìm kiếm
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-lg-4 col-md-6">
                  <label className="form-label small text-muted fw-medium">Tìm kiếm</label>
                  <div className="input-group input-group-merge">
                    <span className="input-group-text bg-white border-end-0">
                      <FontAwesomeIcon icon={faSearch} className="text-muted" />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Tìm email, tên, số điện thoại..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="col-lg-2 col-md-3">
                  <label className="form-label small text-muted fw-medium">Trạng thái</label>
                  <select
                    className="form-select form-select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Vô hiệu</option>
                  </select>
                </div>

                <div className="col-lg-2 col-md-3">
                  <label className="form-label small text-muted fw-medium">Vai trò</label>
                  <select
                    className="form-select form-select-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="user">Người dùng</option>
                    <option value="admin">Quản trị</option>
                    <option value="moderator">Điều hành</option>
                  </select>
                </div>

                <div className="col-lg-4 col-md-12">
                  <label className="form-label small text-muted fw-medium">Hành động hàng loạt</label>
                  <div className="dropdown w-100">
                    <button
                      className="btn btn-outline-dark btn-sm dropdown-toggle w-100 d-flex justify-content-between align-items-center"
                      type="button"
                      data-bs-toggle="dropdown"
                      disabled={selectedUsers.length === 0 || actionLoading === 'bulk'}
                    >
                      <span>
                        {actionLoading === 'bulk' ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Đang xử lý...
                          </>
                        ) : (
                          `Hành động (${selectedUsers.length})`
                        )}
                      </span>
                    </button>
                    <ul className="dropdown-menu w-100 shadow-sm">
                      <li>
                        <button className="dropdown-item d-flex align-items-center" onClick={() => handleBulkAction('active')}>
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                          Kích hoạt
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item d-flex align-items-center" onClick={() => handleBulkAction('inactive')}>
                          <FontAwesomeIcon icon={faBan} className="text-warning me-2" />
                          Vô hiệu hóa
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item text-danger d-flex align-items-center" onClick={() => handleBulkAction('delete')}>
                          <FontAwesomeIcon icon={faTrash} className="me-2" />
                          Xóa
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Tổng người dùng</h6>
                      <h3 className="mb-0 fw-bold">{totalItems.toLocaleString()}</h3>
                    </div>
                    <FontAwesomeIcon icon={faUser} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Đang hoạt động</h6>
                      <h3 className="mb-0 fw-bold">{activeCountOnPage}</h3>
                    </div>
                    <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Đã vô hiệu</h6>
                      <h3 className="mb-0 fw-bold">{inactiveCountOnPage}</h3>
                    </div>
                    <FontAwesomeIcon icon={faBan} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-gradient text-white" style={{ background: 'linear-gradient(90deg, #667eea, #764ba2)' }}>
                    <tr>
                      <th className="text-center" style={{ width: '50px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={users.length > 0 && users.every(u => selectedUsers.includes(u.id))}
                          onChange={toggleSelectAll}
                          disabled={loading}
                        />
                      </th>
                      <th>Người dùng</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Lần đăng nhập</th>
                      <th className="text-center" style={{ width: '130px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
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
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
                            <p className="mb-1 fw-medium">Không tìm thấy người dùng</p>
                            <small>Thử thay đổi từ khóa hoặc bộ lọc</small>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className={`transition-all ${!user.is_active ? 'opacity-75' : ''}`}
                          style={{ transition: 'all 0.2s' }}
                        >
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              disabled={actionLoading !== null}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="position-relative me-3">
                                {user.avatar_url ? (
                                  <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    className="rounded-circle object-fit-cover"
                                    width="44"
                                    height="44"
                                    style={{ border: '2px solid #e9ecef' }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      e.currentTarget.nextElementSibling?.classList.remove('d-none');
                                    }}
                                  />
                                ) : null}
                                <div
                                  className={`bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold ${user.avatar_url ? 'd-none' : ''}`}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                    fontSize: '0.9rem',
                                  }}
                                >
                                  {user.full_name.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div>
                                <div className="fw-semibold">{user.full_name}</div>
                                <div className="small text-muted">{user.email}</div>
                                {user.phone && <div className="small text-muted">{user.phone}</div>}
                              </div>
                            </div>
                          </td>
                          <td>{renderRoleBadge(user.role)}</td>
                          <td>{renderStatusBadge(user.is_active)}</td>
                          <td className="small text-muted">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="small text-muted">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleString('vi-VN')
                              : 'Chưa đăng nhập'}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm shadow-sm">
                              <button
                                className={`btn ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm`}
                                onClick={() => handleStatusChange(user.id, user.is_active)}
                                disabled={actionLoading !== null}
                                title={user.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                {actionLoading === `status-${user.id}` ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <FontAwesomeIcon icon={user.is_active ? faBan : faCheckCircle} />
                                )}
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDeleteUser(user.id)}
                                disabled={actionLoading !== null}
                                title="Xóa"
                              >
                                {actionLoading === `delete-${user.id}` ? (
                                  <span className="spinner-border spinner-border-sm" />
                                ) : (
                                  <FontAwesomeIcon icon={faTrash} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-center py-3 px-4 gap-3">
                  <div className="text-muted small">
                    Hiển thị <strong>{(currentPage - 1) * usersPerPage + 1}</strong> -{' '}
                    <strong>{Math.min(currentPage * usersPerPage, totalItems)}</strong> trong{' '}
                    <strong>{totalItems.toLocaleString()}</strong> người dùng
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1 || loading}>
                          Trước
                        </button>
                      </li>
                      {getPageRange().map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(page)} disabled={loading}>
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                          Sau
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Delete Modal */}
      {showDeleteModal && userToDelete && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 overflow-hidden">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                  Xác nhận xóa người dùng
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={actionLoading !== null}
                />
              </div>
              <div className="modal-body">
                <div className="alert alert-danger border-0 mb-3">
                  <strong>Cảnh báo:</strong> Hành động này <strong>không thể hoàn tác</strong>. Người dùng sẽ bị xóa vĩnh viễn.
                </div>
                {(() => {
                  const user = users.find(u => u.id === userToDelete);
                  if (!user) return null;
                  return (
                    <div className="bg-light p-3 rounded d-flex align-items-center">
                      <div className="me-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="rounded-circle" width="50" height="50" />
                        ) : (
                          <div
                            className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                            style={{
                              width: '50px',
                              height: '50px',
                              background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            }}
                          >
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="fw-bold">{user.full_name}</div>
                        <div className="small text-muted">{user.email}</div>
                        {user.phone && <div className="small text-muted">{user.phone}</div>}
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="modal-footer bg-light">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  disabled={actionLoading !== null}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                  disabled={actionLoading !== null}
                >
                  {actionLoading ? (
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
    </div>
  );
};

export default UserManagementPage;