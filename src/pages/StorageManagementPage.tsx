// src/pages/StorageManagementPage.tsx
import React, { useState, useEffect } from 'react';
import { StorageOption, StorageCreate, StorageUpdate } from '../types/storage';
import { storageService } from '../services/storageService';

const initialFormState: StorageCreate = {
  name: '',
  description: '',
};

const StorageManagementPage: React.FC = () => {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State Modal
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<StorageCreate | StorageUpdate>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) titleElement.innerText = 'Quản lý Dung lượng';
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await storageService.getAllStorageOptions();
      setStorageOptions(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dung lượng');
    } finally {
      setLoading(false);
    }
  };

  // === HÀM XỬ LÝ SỰ KIỆN ===
  const handleAddNewClick = () => {
    setIsEditMode(false);
    setCurrentData(initialFormState);
    setModalError(null);
    setShowModal(true);
  };
  const handleEditClick = (option: StorageOption) => {
    setIsEditMode(true);
    setEditId(option.id);
    setCurrentData({ name: option.name, description: option.description });
    setModalError(null);
    setShowModal(true);
  };
  const handleCloseModal = () => { if (!isSaving) setShowModal(false); };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      if (isEditMode && editId) {
        const response = await storageService.updateStorageOption(editId, currentData as StorageUpdate);
        setStorageOptions(prev => prev.map(s => (s.id === editId ? response.data : s)));
      } else {
        const response = await storageService.createStorageOption(currentData as StorageCreate);
        setStorageOptions(prev => [response.data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa dung lượng này?')) {
      try {
        await storageService.deleteStorageOption(id);
        setStorageOptions(prev => prev.filter(s => s.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Lỗi khi xóa');
      }
    }
  };

  // === HÀM RENDER BẢNG ===
  const renderStorageTable = () => {
    if (loading) return <tr><td colSpan={3} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={3} className="text-center text-danger py-4">{error}</td></tr>;
    if (storageOptions.length === 0) return <tr><td colSpan={3} className="text-center py-5 text-muted">Không có dung lượng nào.</td></tr>;

    return storageOptions.map((option) => (
      <tr key={option.id}>
        <td data-label="Tên dung lượng" style={{ paddingLeft: '1.5rem' }}>
          <strong>{option.name}</strong>
        </td>
        <td data-label="Mô tả" style={{ minWidth: '300px' }}>
          {option.description}
        </td>
        <td data-label="Hành động">
          <div className="d-flex gap-2">
            <button className="btn btn-action btn-edit" onClick={() => handleEditClick(option)} title="Sửa"><i className="fa-solid fa-pen-to-square"></i></button>
            <button className="btn btn-action btn-delete" onClick={() => handleDeleteClick(option.id)} title="Xóa"><i className="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    ));
  };

  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        <div className="table-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
            <h3>Quản lý dung lượng</h3>
            <button className="btn btn-primary" onClick={handleAddNewClick}>
              <i className="fa-solid fa-plus me-2"></i>Thêm dung lượng
            </button>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col" style={{paddingLeft: '1.5rem'}}>Tên dung lượng</th>
                    <th scope="col">Mô tả</th>
                    <th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {renderStorageTable()}
                </tbody>
              </table>
            </div>
          </div>
          {/* ... (Phân trang) ... */}
        </div>
      </div>
      
      {/* === MODAL THÊM MỚI / CHỈNH SỬA === */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Dung lượng' : 'Thêm Dung lượng mới'}</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    <div className="mb-3">
                      <label className="form-label">Tên dung lượng (*)</label>
                      <input type="text" name="name" value={currentData.name} onChange={handleFormChange} className="form-control" required />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Mô tả</label>
                      <input type="text" name="description" value={currentData.description || ''} onChange={handleFormChange} className="form-control" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={isSaving}>Hủy</button>
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? 'Đang lưu...' : 'Lưu'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </>
  );
};

export default StorageManagementPage;