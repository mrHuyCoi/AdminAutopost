// src/pages/UserManagementPage.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit, faTrash, faSync,
  faUserShield, faUser, faCheckCircle, faBan, faSearch
} from '@fortawesome/free-solid-svg-icons';

// --- INTERFACES (Đã xóa phone) ---
interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
  created_at: string;
  last_login?: string;
  avatar_url?: string;
}

interface UserUpdatePayload {
  email: string; // Thường dùng để giữ nguyên data cũ nếu cần
  full_name: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
}

const UserManagementPage: React.FC = () => {
  // --- STATES ---
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Modal States
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit Data (Đã xóa phone)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<UserUpdatePayload>({
    email: '', 
    full_name: '', 
    role: 'user', 
    is_active: true
  });

  // --- 1. LOAD DATA ---
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi endpoint: .../api/v1/admin/users
      const response = await api.get('/admin/users'); 
      
      const data = response.data;
      let items: User[] = [];

      if (Array.isArray(data)) items = data;
      else if (data.items && Array.isArray(data.items)) items = data.items;
      else if (data.data && Array.isArray(data.data)) items = data.data;
      else items = Object.values(data).find(Array.isArray) as User[] || [];

      setAllUsers(items);
      
    } catch (error: any) {
      console.error('Lỗi tải users:', error);
      toast.error('Không thể tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // --- 2. STATS & FILTER ---
  const stats = useMemo(() => ({
    total: allUsers.length,
    active: allUsers.filter(u => u.is_active).length,
    inactive: allUsers.filter(u => !u.is_active).length
  }), [allUsers]);

  // Logic tìm kiếm (Đã xóa tìm theo số điện thoại)
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return allUsers;
    const lowerTerm = searchTerm.toLowerCase();
    return allUsers.filter(user => 
      user.email?.toLowerCase().includes(lowerTerm) ||
      user.full_name?.toLowerCase().includes(lowerTerm)
    );
  }, [allUsers, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination Logic
  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));
  
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  // --- 3. ACTIONS ---

  // Cập nhật trạng thái (Toggle Active)
  const handleStatusChange = async (userId: string, currentStatus: boolean) => {
    const userToToggle = allUsers.find(u => u.id === userId);
    if (!userToToggle) return;

    try {
      setActionLoading(`status-${userId}`);
      
      const payload: UserUpdatePayload = {
        email: userToToggle.email,
        full_name: userToToggle.full_name,
        role: userToToggle.role,
        is_active: !currentStatus
      };
      
      // PUT /admin/users/{id}
      await api.put(`/admin/users/${userId}`, payload);
      
      toast.success(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} người dùng`);
      setAllUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Lỗi cập nhật trạng thái');
    } finally {
      setActionLoading(null);
    }
  };

  // Xóa người dùng
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setActionLoading(`delete-${userToDelete}`);
      // DELETE /admin/users/{id}
      await api.delete(`/admin/users/${userToDelete}`);
      
      toast.success('Xóa người dùng thành công');
      setAllUsers(prev => prev.filter(user => user.id !== userToDelete));
      
      if (paginatedUsers.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Lỗi xóa người dùng');
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
      setShowDeleteModal(false);
    }
  };

  // Lưu thông tin chỉnh sửa (Đã xóa phone trong payload)
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
        setActionLoading('update');
        
        // Payload chỉ chứa thông tin backend hỗ trợ
        const payload = {
            full_name: editFormData.full_name,
            role: editFormData.role,
            is_active: editFormData.is_active,
            // Không gửi phone/phone_number nữa
        };

        // PUT /admin/users/{id}
        await api.put(`/admin/users/${editingUser.id}`, payload);
        
        toast.success('Cập nhật thông tin thành công');
        setAllUsers(prev => prev.map(u => 
            u.id === editingUser.id ? { ...u, ...editFormData } : u
        ));
        setShowEditModal(false);
    } catch (error: any) {
        toast.error(error?.response?.data?.detail || 'Lỗi cập nhật thông tin');
    } finally {
        setActionLoading(null);
    }
  };

  // --- UI HELPER FUNCTIONS ---
  const paginate = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    setShowEditModal(true);
  };

  const renderRoleBadge = (role: string) => {
    const config = {
      'admin': { class: 'bg-danger', text: 'Quản trị viên' },
      'moderator': { class: 'bg-warning text-dark', text: 'Điều hành viên' },
      'user': { class: 'bg-info text-dark', text: 'Người dùng' }
    }[role] || { class: 'bg-secondary', text: role };
    return <span className={`badge ${config.class} px-2 py-1`}>{config.text}</span>;
  };

  return (
    <div className="container-fluid px-4 py-3">
      {/* HEADER */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div>
          <h1 className="h3 mb-1 text-dark fw-bold">
            <FontAwesomeIcon icon={faUserShield} className="me-2 text-primary" />
            Quản lý người dùng
          </h1>
          <p className="text-muted mb-0 small">Tổng số: <strong>{totalItems}</strong> tài khoản</p>
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

      {/* STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Tổng số</h6><h3 className="mb-0 fw-bold">{stats.total}</h3></div>
                <FontAwesomeIcon icon={faUser} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Hoạt động</h6><h3 className="mb-0 fw-bold">{stats.active}</h3></div>
                <FontAwesomeIcon icon={faCheckCircle} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <div className="card-body text-white">
              <div className="d-flex justify-content-between align-items-center">
                <div><h6 className="mb-1 opacity-75">Vô hiệu hóa</h6><h3 className="mb-0 fw-bold">{stats.inactive}</h3></div>
                <FontAwesomeIcon icon={faBan} size="2x" className="opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="input-group">
             <span className="input-group-text bg-white border-end-0">
                <FontAwesomeIcon icon={faSearch} className="text-muted" />
             </span>
             <input
               type="text"
               className="form-control border-start-0 ps-0"
               placeholder="Tìm kiếm theo tên hoặc email..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             {searchTerm && (
                <button className="btn btn-outline-secondary border-start-0" onClick={() => setSearchTerm('')}>Xóa</button>
             )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm border-0 overflow-hidden">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="text-center" style={{ width: '50px' }}>#</th>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th className="text-center" style={{ width: '140px' }}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-5">Đang tải dữ liệu...</td></tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-5 text-muted">Không tìm thấy dữ liệu</td></tr>
                ) : (
                  paginatedUsers.map((user, index) => (
                    <tr key={user.id} className={!user.is_active ? 'opacity-75 bg-light' : ''}>
                      <td className="text-center">{(currentPage - 1) * usersPerPage + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                            <div className="bg-gradient text-white d-flex align-items-center justify-content-center rounded-circle me-3 fw-bold" 
                                 style={{width: '40px', height: '40px', background: 'linear-gradient(135deg, #667eea, #764ba2)'}}>
                                {user.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="fw-semibold">{user.full_name}</div>
                                <div className="small text-muted">{user.email}</div>
                            </div>
                        </div>
                      </td>
                      <td>{renderRoleBadge(user.role)}</td>
                      <td>
                        {user.is_active 
                            ? <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">Hoạt động</span>
                            : <span className="badge bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25">Vô hiệu</span>
                        }
                      </td>
                      <td className="small text-muted">{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                         <div className="d-flex justify-content-center gap-2">
                            <button className="btn btn-outline-primary btn-sm" onClick={() => openEditModal(user)} title="Sửa">
                                <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button 
                                className={`btn btn-sm ${user.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                onClick={() => handleStatusChange(user.id, user.is_active)}
                                disabled={actionLoading === `status-${user.id}`}
                                title={user.is_active ? "Vô hiệu hóa" : "Kích hoạt"}
                            >
                                {actionLoading === `status-${user.id}` ? <span className="spinner-border spinner-border-sm" /> : <FontAwesomeIcon icon={user.is_active ? faBan : faCheckCircle} />}
                            </button>
                            <button className="btn btn-outline-danger btn-sm" onClick={() => { setUserToDelete(user.id); setShowDeleteModal(true); }} title="Xóa">
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

          {/* PAGINATION */}
          <div className="card-footer bg-white d-flex flex-column flex-md-row justify-content-between align-items-center py-3">
            <div className="text-muted small mb-2 mb-md-0">
              Hiển thị <strong>{(currentPage - 1) * usersPerPage + 1}</strong> - <strong>{Math.min(currentPage * usersPerPage, totalItems)}</strong> trên <strong>{totalItems}</strong>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage - 1)}>Trước</button>
                </li>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((page, index, array) => {
                     const prev = array[index - 1];
                     const showEllipsis = prev && page - prev > 1;
                     return (
                       <React.Fragment key={page}>
                         {showEllipsis && <li className="page-item disabled"><span className="page-link">...</span></li>}
                         <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                           <button className="page-link" onClick={() => paginate(page)}>{page}</button>
                         </li>
                       </React.Fragment>
                     );
                  })
                }

                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage + 1)}>Sau</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {showDeleteModal && (
         <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered">
               <div className="modal-content shadow-lg border-0">
                  <div className="modal-header bg-danger text-white">
                     <h5 className="modal-title">Xác nhận xóa</h5>
                     <button className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                  </div>
                  <div className="modal-body">
                     <p>Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản này?</p>
                  </div>
                  <div className="modal-footer bg-light">
                     <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy</button>
                     <button className="btn btn-danger" onClick={handleConfirmDelete} disabled={!!actionLoading}>
                        {actionLoading ? 'Đang xóa...' : 'Xóa ngay'}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* EDIT MODAL (ĐÃ XÓA TRƯỜNG PHONE) */}
      {showEditModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title"><FontAwesomeIcon icon={faEdit} className="me-2"/>Chỉnh sửa thông tin</h5>
                <button className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                    <label className="form-label fw-medium">Họ và tên</label>
                    <input type="text" className="form-control" value={editFormData.full_name}
                        onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} />
                </div>
                <div className="mb-3">
                    <label className="form-label fw-medium">Email (Không thể sửa)</label>
                    <input type="email" className="form-control bg-light" value={editFormData.email} disabled />
                </div>
                <div className="mb-3">
                    <label className="form-label fw-medium">Vai trò</label>
                    <select className="form-select" value={editFormData.role}
                        onChange={e => setEditFormData({...editFormData, role: e.target.value as any})}>
                        <option value="user">Người dùng</option>
                        <option value="moderator">Điều hành viên</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                </div>
                <div className="form-check">
                    <input className="form-check-input" type="checkbox" checked={editFormData.is_active}
                        onChange={e => setEditFormData({...editFormData, is_active: e.target.checked})} id="activeCheck" />
                    <label className="form-check-label" htmlFor="activeCheck">Đang hoạt động</label>
                </div>
              </div>
              <div className="modal-footer bg-light">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleUpdateUser} disabled={!!actionLoading}>
                    {actionLoading === 'update' ? 'Đang lưu...' : 'Lưu thay đổi'}
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