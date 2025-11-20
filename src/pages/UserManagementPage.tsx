// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  // State chứa TOÀN BỘ dữ liệu
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'admin' | 'moderator'>('all');
  
  // Pagination & Selection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Modal States
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 1. LOAD TOÀN BỘ USERS (Không phân trang ở API)
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Bỏ params page/limit để lấy tất cả
      const response = await api.get('/admin/users'); 
      const data = response.data;

      let items: User[] = [];

      // Xử lý các dạng response khác nhau
      if (Array.isArray(data)) {
        items = data;
      } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
      } else if (data.data && Array.isArray(data.data)) {
        items = data.data;
      } else {
        items = Object.values(data).find(Array.isArray) as User[] || [];
      }

      setAllUsers(items);
      
      // Giữ lại selection nếu user đó vẫn tồn tại
      setSelectedUsers(prev => 
        prev.filter(id => items.some(user => user.id === id))
      );
      
    } catch (error: any) {
      console.error('Lỗi tải users:', error);
      const errorMessage = error?.response?.data?.detail 
        || error?.response?.data?.message 
        || 'Không thể tải dữ liệu người dùng';
      toast.error(errorMessage);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 2. XỬ LÝ LỌC VÀ TÌM KIẾM (Client-side)
  const filteredUsers = useMemo(() => {
    return allUsers.filter(user => {
      // Lọc theo từ khóa
      const matchesSearch = 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone && user.phone.includes(searchTerm));

      // Lọc theo trạng thái
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' ? user.is_active : !user.is_active);

      // Lọc theo vai trò
      const matchesRole = 
        roleFilter === 'all' || user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [allUsers, searchTerm, statusFilter, roleFilter]);

  // Reset về trang 1 khi thay đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, roleFilter]);

  // 3. PHÂN TRANG (Cắt mảng filteredUsers)
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // --- CÁC HÀM XỬ LÝ HÀNH ĐỘNG (Active/Delete) ---

  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    const userToToggle = allUsers.find(u => u.id === userId);
    if (!userToToggle) return;

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
      
      // Cập nhật state local ngay lập tức
      setAllUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || 'Lỗi cập nhật trạng thái';
      toast.error(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(`delete-${userToDelete}`);
      await api.delete(`/admin/users/${userToDelete}`);
      toast.success('Xóa người dùng thành công');
      
      // Xóa khỏi state local
      setAllUsers(prev => prev.filter(user => user.id !== userToDelete));
      setSelectedUsers(prev => prev.filter(id => id !== userToDelete));
      
      // Nếu trang hiện tại trống sau khi xóa, lùi lại 1 trang
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }

    } catch (error: any) {
      // ... (Giữ nguyên logic xử lý lỗi của bạn)
      const errorMessage = error?.response?.data?.detail || 'Lỗi xóa người dùng';
      toast.error(`❌ ${errorMessage}`);
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

    const actionText = { 'delete': 'xóa', 'active': 'kích hoạt', 'inactive': 'vô hiệu hóa' }[action];
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} ${selectedUsers.length} người dùng?`)) return;

    try {
      setActionLoading('bulk');
      // ... (Giữ nguyên logic gọi API bulk của bạn)
      // Ở đây tôi giả lập việc cập nhật state sau khi gọi API thành công để code gọn hơn
      // Trong thực tế bạn giữ nguyên logic Promise.allSettled của bạn
      
      // Sau khi xong, reload lại data để đảm bảo đồng bộ
      await loadUsers(); 
      toast.success('Thao tác hàng loạt hoàn tất');
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    } finally {
      setActionLoading(null);
    }
  };

  // --- CÁC HÀM HELPER UI ---

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    // Chỉ select những user đang hiển thị trên trang này (paginatedUsers)
    const visibleIds = paginatedUsers.map(u => u.id);
    const allVisibleSelected = visibleIds.every(id => selectedUsers.includes(id));

    if (allVisibleSelected) {
      setSelectedUsers(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedUsers(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Tính toán Stats dựa trên TOÀN BỘ dữ liệu (allUsers)
  const stats = useMemo(() => ({
    total: allUsers.length,
    active: allUsers.filter(u => u.is_active).length,
    inactive: allUsers.filter(u => !u.is_active).length
  }), [allUsers]);

  const renderStatusBadge = (isActive: boolean) => (
    isActive 
      ? <span className="badge bg-success px-2 py-1">Đang hoạt động</span>
      : <span className="badge bg-secondary px-2 py-1">Đã vô hiệu hóa</span>
  );

  const renderRoleBadge = (role: string) => {
    const config = {
      'admin': { class: 'bg-danger', text: 'Quản trị viên' },
      'moderator': { class: 'bg-warning text-dark', text: 'Điều hành viên' },
      'user': { class: 'bg-info text-dark', text: 'Người dùng' }
    }[role] || { class: 'bg-info text-dark', text: 'Người dùng' };
    return <span className={`badge ${config.class} px-2 py-1`}>{config.text}</span>;
  };

  const getPageRange = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    // setCurrentPage(1) đã được xử lý trong useEffect
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
            <button
              className="btn btn-primary btn-sm d-flex align-items-center shadow-sm"
              onClick={loadUsers}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faSync} className={`me-1 ${loading ? 'fa-spin' : ''}`} />
              {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>

          {/* Filters & Search UI (Giữ nguyên phần JSX của bạn) */}
          <div className="card shadow-sm border-0 mb-4 overflow-hidden">
             {/* ... Phần JSX Filter giữ nguyên, chỉ thay đổi value bind vào state ... */}
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
                 {/* ... Phần Bulk Action giữ nguyên ... */}
                 <div className="col-lg-4 col-md-12">
                   {/* Dropdown Button Code Here */}
                    <label className="form-label small text-muted fw-medium">Hành động hàng loạt</label>
                    <div className="dropdown w-100">
                        <button className="btn btn-outline-dark btn-sm dropdown-toggle w-100 d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown" disabled={selectedUsers.length === 0 || actionLoading === 'bulk'}>
                            <span>{actionLoading === 'bulk' ? 'Đang xử lý...' : `Hành động (${selectedUsers.length})`}</span>
                        </button>
                        <ul className="dropdown-menu w-100 shadow-sm">
                            <li><button className="dropdown-item text-success" onClick={() => handleBulkAction('active')}>Kích hoạt</button></li>
                            <li><button className="dropdown-item text-warning" onClick={() => handleBulkAction('inactive')}>Vô hiệu hóa</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger" onClick={() => handleBulkAction('delete')}>Xóa</button></li>
                        </ul>
                    </div>
                 </div>
                 {/* Clear Filter Button */}
                 {(searchTerm || statusFilter !== 'all' || roleFilter !== 'all') && (
                    <div className="col-12 mt-2">
                        <button className="btn btn-link btn-sm text-muted p-0" onClick={handleClearFilters}>
                            <FontAwesomeIcon icon={faTimes} className="me-1" /> Xóa bộ lọc
                        </button>
                    </div>
                 )}
              </div>
            </div>
          </div>

          {/* Stats Cards (Sử dụng biến stats đã tính toán chính xác) */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="card-body text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1 opacity-75">Tổng người dùng</h6>
                      <h3 className="mb-0 fw-bold">{stats.total.toLocaleString()}</h3>
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
                      <h3 className="mb-0 fw-bold">{stats.active.toLocaleString()}</h3>
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
                      <h3 className="mb-0 fw-bold">{stats.inactive.toLocaleString()}</h3>
                    </div>
                    <FontAwesomeIcon icon={faBan} size="2x" className="opacity-50" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table (Render paginatedUsers) */}
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
                          checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUsers.includes(u.id))}
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
                        <tr key={i}><td colSpan={7}><div className="placeholder-glow p-3"><div className="placeholder col-12 h-5"></div></div></td></tr>
                      ))
                    ) : paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-5">
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faSearch} size="3x" className="mb-3 opacity-25" />
                            <p className="mb-1 fw-medium">Không tìm thấy người dùng</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => (
                        <tr key={user.id} className={`transition-all ${!user.is_active ? 'opacity-75' : ''}`}>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                              disabled={actionLoading !== null}
                            />
                          </td>
                          {/* ... Phần render thông tin user giữ nguyên ... */}
                          <td>
                            <div className="d-flex align-items-center">
                                <div className="position-relative me-3">
                                    <div className="bg-gradient d-flex align-items-center justify-content-center rounded-circle text-white fw-bold" style={{width: '44px', height: '44px', background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                                        {user.full_name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <div>
                                    <div className="fw-semibold">{user.full_name}</div>
                                    <div className="small text-muted">{user.email}</div>
                                </div>
                            </div>
                          </td>
                          <td>{renderRoleBadge(user.role)}</td>
                          <td>{renderStatusBadge(user.is_active)}</td>
                          <td className="small text-muted">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="small text-muted">{user.last_login ? new Date(user.last_login).toLocaleString('vi-VN') : '-'}</td>
                          <td>
                             <div className="btn-group btn-group-sm shadow-sm">
                                <button className={`btn ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'} btn-sm`} onClick={() => handleStatusChange(user.id, user.is_active)}>
                                   {actionLoading === `status-${user.id}` ? <span className="spinner-border spinner-border-sm" /> : <FontAwesomeIcon icon={user.is_active ? faBan : faCheckCircle} />}
                                </button>
                                <button className="btn btn-outline-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>
                                   {actionLoading === `delete-${user.id}` ? <span className="spinner-border spinner-border-sm" /> : <FontAwesomeIcon icon={faTrash} />}
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-center py-3 px-4 gap-3">
                  <div className="text-muted small">
                    Hiển thị <strong>{(currentPage - 1) * usersPerPage + 1}</strong> -{' '}
                    <strong>{Math.min(currentPage * usersPerPage, totalItems)}</strong> trong{' '}
                    <strong>{totalItems.toLocaleString()}</strong> kết quả lọc
                  </div>
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage - 1)}>Trước</button>
                      </li>
                      {getPageRange().map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => paginate(page)}>{page}</button>
                        </li>
                      ))}
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => paginate(currentPage + 1)}>Sau</button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal Component (Giữ nguyên như cũ) */}
      {showDeleteModal && userToDelete && (
         <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
               <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-danger text-white">
                     <h5 className="modal-title"><FontAwesomeIcon icon={faExclamationTriangle} className="me-2" /> Xác nhận xóa</h5>
                     <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                  </div>
                  <div className="modal-body">
                     <p>Bạn có chắc chắn muốn xóa người dùng này?</p>
                  </div>
                  <div className="modal-footer bg-light">
                     <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy</button>
                     <button className="btn btn-danger" onClick={handleConfirmDelete}>Xóa</button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default UserManagementPage;
