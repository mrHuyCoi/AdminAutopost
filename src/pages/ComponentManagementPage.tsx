// src/pages/ComponentManagementPage.tsx
import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { Component, ComponentCreate, ComponentUpdate } from '../types/component';
import { componentService } from '../services/componentService';

const initialFormState: ComponentCreate = {
  maSP: 'SP-Mẫu',
  tenSP: '',
  tonKho: 0,
  thuongHieu: 'KHÁC',
  danhMuc: 'Cáp nối',
  thuocTinh: '',
};

const ComponentManagementPage: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // (Thêm State cho Modal/Form)
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [currentData, setCurrentData] = useState<ComponentCreate | ComponentUpdate>(initialFormState);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    const titleElement = document.getElementById('pageTitle');
    if (titleElement) titleElement.innerText = 'Quản lý Linh Kiện';
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await componentService.getAllComponents();
      setComponents(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải linh kiện');
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
  const handleEditClick = (item: Component) => {
    setIsEditMode(true);
    setEditId(item.id);
    setCurrentData({
      maSP: item.maSP,
      tenSP: item.tenSP,
      tonKho: item.tonKho,
      thuongHieu: item.thuongHieu,
      danhMuc: item.danhMuc,
      thuocTinh: item.thuocTinh
    });
    setModalError(null);
    setShowModal(true);
  };
  const handleCloseModal = () => { if (!isSaving) setShowModal(false); };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setCurrentData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setModalError(null);
    try {
      if (isEditMode && editId) {
        const response = await componentService.updateComponent(editId, currentData as ComponentUpdate);
        setComponents(prev => prev.map(c => (c.id === editId ? response.data : c)));
      } else {
        const response = await componentService.createComponent(currentData as ComponentCreate);
        setComponents(prev => [response.data, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa linh kiện này?')) {
      try {
        await componentService.deleteComponent(id);
        setComponents(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Lỗi khi xóa');
      }
    }
  };

  // === HÀM RENDER BẢNG ===
  const renderComponentTable = () => {
    if (loading) return <tr><td colSpan={7} className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></td></tr>;
    if (error) return <tr><td colSpan={7} className="text-center text-danger py-4">{error}</td></tr>;
    if (components.length === 0) return <tr><td colSpan={7} className="text-center py-5 text-muted">Không có linh kiện nào.</td></tr>;

    return components.map((item) => (
      <tr key={item.id}>
        <td data-label="Mã SP" style={{ paddingLeft: '1.5rem' }}>{item.maSP}</td>
        <td data-label="Tên Sản Phẩm" style={{ minWidth: '300px' }}>
          <strong>{item.tenSP}</strong>
        </td>
        <td data-label="Tồn kho">
          <span className={`badge ${item.tonKho > 0 ? 'text-bg-light' : 'text-bg-danger'}`}>{item.tonKho}</span>
        </td>
        <td data-label="Thương hiệu">{item.thuongHieu}</td>
        <td data-label="Danh mục">
          <span className={`badge ${item.danhMuc === 'Cáp nối' ? 'text-bg-danger' : 'text-bg-warning'}`}>
            {item.danhMuc}
          </span>
        </td>
        <td data-label="Thuộc tính" style={{ minWidth: '200px' }}>{item.thuocTinh}</td>
        <td data-label="Hành động">
          <div className="d-flex gap-2">
            <button className="btn btn-action btn-edit" title="Xem"><i className="fa-solid fa-eye"></i></button>
            <button className="btn btn-action btn-edit" onClick={() => handleEditClick(item)} title="Sửa"><i className="fa-solid fa-pen-to-square"></i></button>
            <button className="btn btn-action btn-delete" onClick={() => handleDeleteClick(item.id)} title="Xóa"><i className="fa-solid fa-trash-can"></i></button>
          </div>
        </td>
      </tr>
    ));
  };


  return (
    <>
      <div className="col-12 main-content-right d-flex flex-column gap-3 gap-lg-4">
        
        <div className="row g-3 g-lg-4">
          <div className="col-6 col-lg-3"><StatCard title="Tổng linh kiện" value={loading ? '...' : components.length} colorType="primary" icon="fas fa-microchip"/></div>
          <div className="col-6 col-lg-3"><StatCard title="Tồn kho" value="89" colorType="success" icon="fas fa-boxes-stacked"/></div>
          <div className="col-6 col-lg-3"><StatCard title="Thương hiệu" value="24" colorType="info" icon="fas fa-tags"/></div>
          <div className="col-6 col-lg-3"><StatCard title="Danh mục" value="18" colorType="warning" icon="fas fa-list"/></div>
        </div>

        <div className="table-card">
          <div className="card-header d-flex align-items-center justify-content-between flex-wrap">
            <h3>Danh sách linh kiện</h3>
            <div className="d-flex gap-2 mt-2 mt-md-0">
              <button className="btn btn-primary" onClick={handleAddNewClick}>
                <i className="fa-solid fa-plus me-2"></i>Thêm mới
              </button>
            </div>
          </div>
          
          <div className="card-body p-0">
            <div className="table-responsive services-table">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col" style={{paddingLeft: '1.5rem'}}>Mã SP</th>
                    <th scope="col">Tên Sản Phẩm</th>
                    <th scope="col">Tồn kho</th>
                    <th scope="col">Thương hiệu</th>
                    <th scope="col">Danh mục</th>
                    <th scope="col">Thuộc tính</th>
                    <th scope="col">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {renderComponentTable()}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="card-footer bg-white d-flex flex-wrap flex-md-nowrap justify-content-center justify-content-md-between align-items-center py-3">
            {/* ... (Phân trang) ... */}
          </div>
        </div>
      </div>
      
      {/* === MODAL THÊM MỚI / CHỈNH SỬA === */}
      {showModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <form onSubmit={handleFormSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">{isEditMode ? 'Cập nhật Linh kiện' : 'Thêm Linh kiện mới'}</h5>
                    <button type="button" className="btn-close" onClick={handleCloseModal} disabled={isSaving}></button>
                  </div>
                  <div className="modal-body">
                    {modalError && <div className="alert alert-danger">{modalError}</div>}
                    <div className="row g-3">
                      <div className="col-md-6"><label className="form-label">Mã SP</label><input type="text" name="maSP" value={currentData.maSP || ''} onChange={handleFormChange} className="form-control" /></div>
                      <div className="col-md-6"><label className="form-label">Tên Sản Phẩm (*)</label><input type="text" name="tenSP" value={currentData.tenSP || ''} onChange={handleFormChange} className="form-control" required /></div>
                      <div className="col-md-4"><label className="form-label">Tồn kho</label><input type="number" name="tonKho" value={currentData.tonKho || 0} onChange={handleFormChange} className="form-control" /></div>
                      <div className="col-md-4"><label className="form-label">Thương hiệu</label><input type="text" name="thuongHieu" value={currentData.thuongHieu || ''} onChange={handleFormChange} className="form-control" /></div>
                      <div className="col-md-4"><label className="form-label">Danh mục</label>
                        <select name="danhMuc" value={currentData.danhMuc || ''} onChange={handleFormChange} className="form-select">
                          <option value="Cáp nối">Cáp nối</option>
                          <option value="Cáp test">Cáp test</option>
                        </select>
                      </div>
                      <div className="col-12"><label className="form-label">Thuộc tính</label><input type="text" name="thuocTinh" value={currentData.thuocTinh || ''} onChange={handleFormChange} className="form-control" /></div>
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

export default ComponentManagementPage;