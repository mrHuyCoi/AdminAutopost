import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { subscriptionService } from '../services/subscriptionService';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faEye, faBan, faCheckCircle, faSearch, faFilter, faSync } from '@fortawesome/free-solid-svg-icons';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  subscription?: any;
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.is_active;
        if (statusFilter === 'inactive') return !user.is_active;
        return true;
      });
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      await userService.updateUser(userId, { 
        is_active: newStatus === 'active' 
      });
      toast.success('Cập nhật trạng thái thành công');
      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      try {
        await userService.deleteUser(userId);
        toast.success('Xóa người dùng thành công');
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Lỗi khi xóa người dùng');
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('Vui lòng chọn ít nhất một người dùng');
      return;
    }

    try {
      if (action === 'delete') {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedUsers.length} người dùng?`)) {
          await Promise.all(selectedUsers.map(id => userService.deleteUser(id)));
          toast.success(`Đã xóa ${selectedUsers.length} người dùng`);
        }
      } else {
        await Promise.all(selectedUsers.map(id => 
          userService.updateUser(id, { 
            is_active: action === 'active' 
          })
        ));
        toast.success(`Đã cập nhật trạng thái cho ${selectedUsers.length} người dùng`);
      }
      setSelectedUsers([]);
      loadUsers();
    } catch (error) {
      console.error('Error in bulk action:', error);
      toast.error('Lỗi khi thực hiện hành động');
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
    setSelectedUsers(
      selectedUsers.length === currentUsers.length
        ? []
        : currentUsers.map(user => user.id)
    );
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const renderStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <span className="badge bg-success">Active</span>
      : <span className="badge bg-secondary">Inactive</span>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-header mb-4">
            <div className="d-flex justify-content-between align-items-center">
              <h1 className="h3 mb-0">Quản lý người dùng</h1>
              <button className="btn btn-primary" onClick={loadUsers}>
                <FontAwesomeIcon icon={faSync} className="me-2" />
                Làm mới
              </button>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="input-group">
                    <span className="input-group-text">
                      <FontAwesomeIcon icon={faSearch} />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm theo email hoặc tên..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="dropdown">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle w-100"
                      type="button"
                      data-bs-toggle="dropdown"
                      disabled={selectedUsers.length === 0}
                    >
                      Hành động ({selectedUsers.length})
                    </button>
                    <ul className="dropdown-menu">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleBulkAction('active')}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} className="text-success me-2" />
                          Kích hoạt
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleBulkAction('inactive')}
                        >
                          <FontAwesomeIcon icon={faBan} className="text-warning me-2" />
                          Vô hiệu hóa
                        </button>
                      </li>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button
                          className="dropdown-item text-danger"
                          onClick={() => handleBulkAction('delete')}
                        >
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

          {/* Users Table */}
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th width="50">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === currentUsers.length && currentUsers.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>ID</th>
                      <th>Tên người dùng</th>
                      <th>Email</th>
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th>Ngày tạo</th>
                      <th>Lần đăng nhập cuối</th>
                      <th width="150">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-4">
                          <div className="text-muted">
                            <FontAwesomeIcon icon={faSearch} size="2x" className="mb-2" />
                            <p>Không tìm thấy người dùng nào</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user.id)}
                              onChange={() => toggleUserSelection(user.id)}
                            />
                          </td>
                          <td>
                            <code>{user.id.substring(0, 8)}...</code>
                          </td>
                          <td>
                            <strong>{user.full_name}</strong>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`badge ${
                              user.role === 'admin' ? 'bg-danger' :
                              user.role === 'moderator' ? 'bg-warning' : 'bg-secondary'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td>
                            {renderStatusBadge(user.is_active)}
                          </td>
                          <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                          <td>
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString('vi-VN')
                              : 'Chưa đăng nhập'
                            }
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                className="btn btn-outline-primary"
                                title="Xem chi tiết"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </button>
                              <button
                                className="btn btn-outline-warning"
                                title="Chỉnh sửa"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                className="btn btn-outline-danger"
                                title="Xóa"
                                onClick={() => handleDeleteUser(user.id)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage - 1)}
                      >
                        Trước
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, index) => (
                      <li
                        key={index}
                        className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(index + 1)}
                        >
                          {index + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => paginate(currentPage + 1)}
                      >
                        Sau
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="row mt-3">
            <div className="col-md-4">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Tổng số người dùng</h5>
                  <h2 className="card-text">{users.length}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Đang hoạt động</h5>
                  <h2 className="card-text">
                    {users.filter(u => u.is_active).length}
                  </h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-warning text-white">
                <div className="card-body">
                  <h5 className="card-title">Đã vô hiệu hóa</h5>
                  <h2 className="card-text">
                    {users.filter(u => !u.is_active).length}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;